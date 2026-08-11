import { getRandomGlyph } from './glyphs';
import { rainStore } from '../../state/rainStore';

interface Stream {
  x: number;
  rowPos: number; // Float row position (local to this stream's font size)
  speed: number;  // Rows per frame
  length: number; // Trail length
  fontSize: number; // Stream-specific font size for depth
  chars: string[]; // Characters in the stream
}

export class RainEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private streams: Stream[] = [];
  private glitchTimer = 0;
  private animationFrameId = 0;
  private streamCount = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
  }

  private handleResize = () => {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    // Calculate a dense number of streams based on screen width (increased for higher density)
    this.streamCount = Math.floor(this.canvas.width / 10) + 40; 
    this.initStreams();
  };

  private initStreams = () => {
    this.streams = [];
    for (let i = 0; i < this.streamCount; i++) {
      this.streams.push(this.createStream());
    }
  };

  private createStream = (forcedX?: number): Stream => {
    const length = Math.floor(Math.random() * 15 + 10);
    const chars = [];
    for (let i = 0; i < length; i++) {
      chars.push(getRandomGlyph());
    }
    
    // Vary font size between 18 and 36 for parallax depth
    const fontSize = Math.floor(Math.random() * 18) + 18;
    
    return {
      x: forcedX !== undefined ? forcedX : (Math.random() * this.canvas.width),
      rowPos: (Math.random() * -100) - 10, // Start high above screen
      speed: (Math.random() * 0.15 + 0.1), // Slower, cinematic speed
      length: length,
      fontSize: fontSize,
      chars: chars,
    };
  };

  private triggerBurst = () => {
    for (let i = 0; i < 30; i++) {
      const stream = this.createStream();
      stream.rowPos = Math.random() * -10;
      stream.speed *= 2;
      this.streams.push(stream);
    }
  };

  public start = () => {
    const loop = () => {
      this.update();
      this.draw();
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  };

  public stop = () => {
    cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.handleResize);
  };

  private update = () => {
    if (rainStore.burstTrigger) {
      this.triggerBurst();
      rainStore.burstTrigger = false;
    }

    if (rainStore.colorGlitch) {
      this.glitchTimer = 30; 
      rainStore.colorGlitch = false;
    }

    if (this.glitchTimer > 0) {
      this.glitchTimer--;
    }

    for (let i = 0; i < this.streams.length; i++) {
      const stream = this.streams[i];
      
      stream.rowPos += stream.speed * rainStore.speedMultiplier;

      // Randomly mutate characters
      if (Math.random() < 0.15) {
        const randIdx = Math.floor(Math.random() * stream.chars.length);
        stream.chars[randIdx] = getRandomGlyph();
      }

      // If tail passes bottom, reset
      if ((stream.rowPos - stream.length) * stream.fontSize > this.canvas.height) {
        if (this.streams.length > this.streamCount) {
           this.streams.splice(i, 1);
           i--;
           continue;
        }
        this.streams[i] = this.createStream();
      }
    }
  };

  private draw = () => {
    // Solid black clear to prevent smearing
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';

    let greenColor = '#00FF41';
    let headColor = '#E0FFE0';

    if (this.glitchTimer > 0) {
      greenColor = Math.random() > 0.5 ? '#FF0041' : '#0041FF';
    }

    // Sort streams by font size so smaller (background) streams are drawn first
    const sortedStreams = [...this.streams].sort((a, b) => a.fontSize - b.fontSize);

    for (const stream of sortedStreams) {
       this.ctx.font = `bold ${stream.fontSize}px 'Courier New', monospace`;
       
       const headRow = Math.floor(stream.rowPos);
       const maxRowsOnScreen = Math.ceil(this.canvas.height / stream.fontSize) + 2;

       for (let i = 0; i < stream.length; i++) {
         const row = headRow - i;
         
         // Culling: don't draw if off screen
         const yPos = row * stream.fontSize;
         if (yPos < -stream.fontSize || yPos > this.canvas.height) continue;
         
         const isHead = i === 0;
         const alpha = Math.max(0, 1 - (i / stream.length));
         
         if (isHead) {
             this.ctx.fillStyle = headColor;
             this.ctx.shadowBlur = 10;
             this.ctx.shadowColor = headColor;
         } else {
             let r = 0, g = 255, b = 65;
             if (this.glitchTimer > 0) {
                 if (greenColor === '#FF0041') { r=255; g=0; b=65; }
                 else { r=0; g=65; b=255; }
             }
             
             this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
             this.ctx.shadowBlur = 0;
         }

         if (i >= stream.chars.length) {
            stream.chars.push(getRandomGlyph());
         }

         this.ctx.fillText(stream.chars[i], stream.x, yPos);
       }
    }
    this.ctx.shadowBlur = 0;
  };
}

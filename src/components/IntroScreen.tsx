import { useEffect, useRef, useState } from 'react';
import type { Landmark } from '../lib/gestures/classifier';
import { HandLandmarker } from '@mediapipe/tasks-vision';
import './IntroScreen.css';

type IntroProps = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  landmarksRef: React.MutableRefObject<Landmark[]>;
  isAiReady: boolean;
  aiError: string | null;
  onSelectRed: () => void;
  onSelectBlue: () => void;
};

export const IntroScreen = ({ videoRef, landmarksRef, isAiReady, aiError, onSelectRed, onSelectBlue }: IntroProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const redPillRef = useRef<HTMLDivElement>(null);
  const bluePillRef = useRef<HTMLDivElement>(null);
  const [isShattering, setIsShattering] = useState(false);

  useEffect(() => {
    let animationFrameId: number;
    let selected = false;

    const checkCollision = () => {
      if (selected || !isAiReady) return;
      const landmarks = landmarksRef.current;
      
      drawCameraAndHand(landmarks || []);

      if (!landmarks || landmarks.length === 0) {
        animationFrameId = requestAnimationFrame(checkCollision);
        return;
      }

      // Detect Pinch
      const thumb = landmarks[4];
      const index = landmarks[8];
      
      // Note: hand coordinates are normalized [0,1], but we draw them mirrored
      const pinchPoint = {
        x: (1 - ((thumb.x + index.x) / 2)) * window.innerWidth,
        y: ((thumb.y + index.y) / 2) * window.innerHeight
      };
      
      const distance = Math.hypot(thumb.x - index.x, thumb.y - index.y);
      const isPinching = distance < 0.08; // Roughly close enough to be a pinch

      if (isPinching) {
        if (redPillRef.current) {
          const rect = redPillRef.current.getBoundingClientRect();
          if (pinchPoint.x >= rect.left && pinchPoint.x <= rect.right &&
              pinchPoint.y >= rect.top && pinchPoint.y <= rect.bottom) {
            selected = true;
            setIsShattering(true);
            setTimeout(() => onSelectRed(), 800);
            return;
          }
        }
        if (bluePillRef.current) {
          const rect = bluePillRef.current.getBoundingClientRect();
          if (pinchPoint.x >= rect.left && pinchPoint.x <= rect.right &&
              pinchPoint.y >= rect.top && pinchPoint.y <= rect.bottom) {
            selected = true;
            onSelectBlue();
            return;
          }
        }
      }

      animationFrameId = requestAnimationFrame(checkCollision);
    };

    const drawCameraAndHand = (landmarks: Landmark[]) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx || !videoRef.current || videoRef.current.videoWidth === 0) return;

      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      
      // Draw webcam stretched to cover screen
      const vRatio = canvas.width / videoRef.current.videoWidth;
      const hRatio = canvas.height / videoRef.current.videoHeight;
      const ratio = Math.max(vRatio, hRatio);
      const centerShift_x = (canvas.width - videoRef.current.videoWidth * ratio) / 2;
      const centerShift_y = (canvas.height - videoRef.current.videoHeight * ratio) / 2;
      
      ctx.filter = 'sepia(1) hue-rotate(80deg) saturate(3) brightness(0.25)'; // Matrix filter
      ctx.drawImage(videoRef.current, 0, 0, videoRef.current.videoWidth, videoRef.current.videoHeight,
                    centerShift_x, centerShift_y, videoRef.current.videoWidth * ratio, videoRef.current.videoHeight * ratio);
      ctx.filter = 'none';

      if (landmarks && landmarks.length > 0) {
        ctx.strokeStyle = "#00FF41";
        ctx.lineWidth = 4;
        ctx.shadowColor = '#00FF41';
        ctx.shadowBlur = 10;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        for (const connection of HandLandmarker.HAND_CONNECTIONS) {
          const start = landmarks[connection.start];
          const end = landmarks[connection.end];
          ctx.beginPath();
          ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
          ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
          ctx.stroke();
        }
      }
      
      ctx.restore();
    };

    animationFrameId = requestAnimationFrame(checkCollision);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [videoRef, landmarksRef, isAiReady, onSelectRed, onSelectBlue]);

  return (
    <div className={`intro-container ${isShattering ? 'shatter' : ''}`}>
      <canvas ref={canvasRef} className="fullscreen-canvas" />
      
      {!isAiReady && !aiError && <div className="ai-loading">BOOTING MATRIX...</div>}
      {aiError && <div className="ai-loading error">{aiError}</div>}
      
      {isAiReady && (
        <>
          <div className="title-overlay">
            <h1 className="matrix-title" style={{ marginBottom: '0px' }}>Wake up, Neo...</h1>
            <h1 className="matrix-title">The Matrix has you...</h1>
            <p className="matrix-subtitle">Pinch a pill to make your choice.</p>
          </div>

          <div className="pinch-hint">
            <div className="pinch-hint-text">AWAITING GESTURE: PINCH TO SELECT</div>
            <div className="pinch-emoji-animation">
              <span className="emoji-frame-1">✋</span>
              <span className="emoji-frame-2">🤏</span>
            </div>
          </div>

          <div className="pills-layout">
            <div ref={bluePillRef} className="pill-wrapper left-pill">
              <div className="pill blue-pill"></div>
              <span className="pill-label">Ignorance</span>
            </div>

            <div ref={redPillRef} className="pill-wrapper right-pill">
              <div className="pill red-pill"></div>
              <span className="pill-label">The Truth</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

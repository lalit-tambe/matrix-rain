import { useEffect, useRef, useState } from 'react';
import { HandLandmarker } from '@mediapipe/tasks-vision';
import { GestureClassifier } from '../lib/gestures/classifier';
import { GestureSmoother } from '../lib/gestures/gestureSmoothing';
import { rainStore } from '../state/rainStore';
import type { GestureType } from '../types';
import type { Landmark } from '../lib/gestures/classifier';
import './GesturePanel.css';

type GesturePanelProps = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  landmarksRef: React.MutableRefObject<Landmark[]>;
};

export const GesturePanel = ({ videoRef, landmarksRef }: GesturePanelProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeGesture, setActiveGesture] = useState<GestureType>('NONE');
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    let animationFrameId: number;
    let lastAppliedGesture: GestureType = 'NONE';
    
    const classifier = new GestureClassifier();
    const smoother = new GestureSmoother();

    const applyGestureToRain = (gesture: GestureType) => {
      rainStore.activeGesture = gesture;
      
      // Continuous speed targets
      if (gesture === 'PALM') rainStore.targetSpeedMultiplier = 0.2;
      else if (gesture === 'FIST') rainStore.targetSpeedMultiplier = 0.0;
      else if (gesture === 'SWIPE_UP') rainStore.targetSpeedMultiplier = 2.5;
      else rainStore.targetSpeedMultiplier = 1.0;

      // Edge triggers (only fire once when changing TO this state)
      if (gesture !== lastAppliedGesture) {
        if (gesture === 'PEACE' || gesture === 'SWIPE_UP') rainStore.burstTrigger = true;
        if (gesture === 'PINCH') rainStore.colorGlitch = true;
      }
      
      lastAppliedGesture = gesture;
      setActiveGesture(gesture);
    };

    const drawResults = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx || !videoRef.current) return;

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      const landmarks = landmarksRef.current;

      if (landmarks && landmarks.length > 0) {
        // Run classifier
        const rawGesture = classifier.classify(landmarks);
        const stableGesture = smoother.smooth(rawGesture);
        applyGestureToRain(stableGesture);

        // Draw HUD
        drawConnectors(ctx, landmarks, HandLandmarker.HAND_CONNECTIONS, { color: "#00FF41", lineWidth: 3 });
        drawLandmarks(ctx, landmarks, { color: "#FFFFFF", lineWidth: 1, radius: 4 });
      } else {
        const stableGesture = smoother.smooth('NONE');
        applyGestureToRain(stableGesture);
      }
      
      ctx.restore();

      animationFrameId = requestAnimationFrame(drawResults);
    };

    const drawConnectors = (ctx: CanvasRenderingContext2D, landmarks: any[], connections: any[], style: any) => {
      ctx.strokeStyle = style.color;
      ctx.lineWidth = style.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = '#00FF41';
      ctx.shadowBlur = 8;
      for (const connection of connections) {
        const start = landmarks[connection.start];
        const end = landmarks[connection.end];
        ctx.beginPath();
        ctx.moveTo(start.x * canvasRef.current!.width, start.y * canvasRef.current!.height);
        ctx.lineTo(end.x * canvasRef.current!.width, end.y * canvasRef.current!.height);
        ctx.stroke();
      }
    };

    const drawLandmarks = (ctx: CanvasRenderingContext2D, landmarks: any[], style: any) => {
      ctx.fillStyle = style.color;
      ctx.shadowBlur = 0; 
      for (const landmark of landmarks) {
        ctx.beginPath();
        ctx.arc(landmark.x * canvasRef.current!.width, landmark.y * canvasRef.current!.height, style.radius, 0, 2 * Math.PI);
        ctx.fill();
      }
    };

    // Start drawing loop immediately
    animationFrameId = requestAnimationFrame(drawResults);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [videoRef, landmarksRef]);

  let displayLabel = '[ SYSTEM READY ]';
  if (activeGesture === 'PALM') displayLabel = '[ PALM ] SLOW_MO';
  else if (activeGesture === 'FIST') displayLabel = '[ FIST ] PAUSED';
  else if (activeGesture === 'SWIPE_UP') displayLabel = '[ SWIPE ] OVERRIDE';
  else if (activeGesture === 'PEACE') displayLabel = '[ PEACE ] BURST';
  else if (activeGesture === 'PINCH') displayLabel = '[ PINCH ] GLITCH';

  const labelClass = `gesture-label ${activeGesture !== 'NONE' ? 'active-gesture' : ''}`;

  return (
    <div className={`gesture-panel-wrapper ${isMinimized ? 'minimized' : ''}`}>
      <button 
        className="minimize-btn" 
        onClick={() => setIsMinimized(!isMinimized)} 
        title={isMinimized ? "Restore AI HUD" : "Minimize AI HUD"}
      >
        {isMinimized ? '+' : '−'}
      </button>
      
      <div className="canvas-container" style={{ display: isMinimized ? 'none' : 'block' }}>
        <canvas 
          ref={canvasRef} 
          width={260} 
          height={190} 
          style={{ width: '100%', height: '100%' }} 
        />
      </div>
      
      {!isMinimized && (
        <>
          <div className={labelClass}>
            {displayLabel}
          </div>
          <div className="gesture-legend">
            <div className="legend-title">AVAILABLE COMMANDS:</div>
            <div className="legend-item"><span className="legend-icon">✋</span> PALM: SLOW-MO</div>
            <div className="legend-item"><span className="legend-icon">✊</span> FIST: PAUSE</div>
            <div className="legend-item"><span className="legend-icon">✌️</span> PEACE: BURST</div>
            <div className="legend-item"><span className="legend-icon">🤏</span> PINCH: GLITCH</div>
            <div className="legend-item"><span className="legend-icon">👆</span> SWIPE UP: OVERRIDE</div>
          </div>
        </>
      )}
      
      {isMinimized && (
        <div className="restore-text" onClick={() => setIsMinimized(false)}>
          AI HUD
        </div>
      )}
    </div>
  );
};

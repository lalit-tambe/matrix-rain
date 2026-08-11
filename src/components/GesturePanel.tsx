import { useEffect, useRef, useState } from 'react';
import { initializeHandTracker } from '../lib/gestures/handTracker';
import { HandLandmarker, type HandLandmarkerResult } from '@mediapipe/tasks-vision';
import { GestureClassifier } from '../lib/gestures/classifier';
import { GestureSmoother } from '../lib/gestures/gestureSmoothing';
import { rainStore } from '../state/rainStore';
import type { GestureType } from '../types';

export const GesturePanel = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeGesture, setActiveGesture] = useState<GestureType>('NONE');

  useEffect(() => {
    let animationFrameId: number;
    let lastVideoTime = -1;
    let isActive = true;
    let lastAppliedGesture: GestureType = 'NONE';
    
    const classifier = new GestureClassifier();
    const smoother = new GestureSmoother();

    const applyGestureToRain = (gesture: GestureType) => {
      rainStore.activeGesture = gesture;
      
      // Continuous speed targets
      if (gesture === 'PALM') rainStore.targetSpeedMultiplier = 0.4;
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

    const setup = async () => {
      try {
        const landmarker = await initializeHandTracker();
        if (!isActive) return;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240 } // Keep resolution small for perf
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          
          videoRef.current.onloadeddata = () => {
             if (!isActive) return;
             setIsReady(true);
             detectLoop(landmarker);
          };
        }
      } catch (err) {
        console.error("Failed to initialize webcam or tracker:", err);
        if (isActive) setError("Camera access denied.");
      }
    };

    let lastDetectTime = 0;

    const detectLoop = (landmarker: HandLandmarker) => {
      if (!isActive || !videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      
      const startTimeMs = performance.now();
      
      // Throttle AI detection to ~15 times a second (66ms) to prevent main thread blocking while keeping response fast
      if (startTimeMs - lastDetectTime > 66) {
        lastDetectTime = startTimeMs;
        const results = landmarker.detectForVideo(video, startTimeMs);
        drawResults(results);

        if (results.landmarks && results.landmarks.length > 0) {
          const rawGesture = classifier.classify(results.landmarks[0]);
          const stableGesture = smoother.smooth(rawGesture);
          applyGestureToRain(stableGesture);
        } else {
          const stableGesture = smoother.smooth('NONE');
          applyGestureToRain(stableGesture);
        }
      }
      
      animationFrameId = requestAnimationFrame(() => detectLoop(landmarker));
    };

    const drawResults = (results: HandLandmarkerResult) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx || !videoRef.current) return;

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      if (results.landmarks && results.landmarks.length > 0) {
        for (const landmarks of results.landmarks) {
           drawConnectors(ctx, landmarks, HandLandmarker.HAND_CONNECTIONS, { color: "#00FF00", lineWidth: 2 });
           drawLandmarks(ctx, landmarks, { color: "#FF0000", lineWidth: 1, radius: 3 });
        }
      }
      ctx.restore();
    };

    const drawConnectors = (ctx: CanvasRenderingContext2D, landmarks: any[], connections: any[], style: any) => {
      ctx.strokeStyle = style.color;
      ctx.lineWidth = style.lineWidth;
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
      for (const landmark of landmarks) {
        ctx.beginPath();
        ctx.arc(landmark.x * canvasRef.current!.width, landmark.y * canvasRef.current!.height, style.radius, 0, 2 * Math.PI);
        ctx.fill();
      }
    };

    setup();

    return () => {
      isActive = false;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (videoRef.current && videoRef.current.srcObject) {
         const stream = videoRef.current.srcObject as MediaStream;
         stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  let displayLabel = isReady ? 'TRACKING ACTIVE' : 'LOADING AI MODEL...';
  if (error) displayLabel = error;
  else if (isReady) {
    if (activeGesture === 'PALM') displayLabel = 'PALM - Slowing';
    else if (activeGesture === 'FIST') displayLabel = 'FIST - Paused';
    else if (activeGesture === 'SWIPE_UP') displayLabel = 'SWIPE UP - Burst';
    else if (activeGesture === 'PEACE') displayLabel = 'PEACE - Burst';
    else if (activeGesture === 'PINCH') displayLabel = 'PINCH - Glitch';
    else displayLabel = '---';
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '240px',
      height: '210px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      border: '1px solid #00FF41',
      borderRadius: '8px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 10,
      boxShadow: '0 0 10px rgba(0, 255, 65, 0.2)'
    }}>
      <video ref={videoRef} style={{ display: 'none' }} playsInline />
      <canvas 
        ref={canvasRef} 
        width={240} 
        height={180} 
        style={{ width: '100%', height: '180px', backgroundColor: '#111' }} 
      />
      <div style={{
        height: '30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#00FF41',
        fontFamily: "'Courier New', monospace",
        fontSize: '14px',
        fontWeight: 'bold',
        borderTop: '1px solid #00FF41'
      }}>
        {error ? <span style={{color: 'red'}}>{displayLabel}</span> : displayLabel}
      </div>
    </div>
  );
};

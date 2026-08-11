import { useEffect, useRef } from 'react';
import { RainEngine } from '../lib/rain/RainEngine';

export const RainCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const engine = new RainEngine(canvasRef.current);
    engine.start();
    
    return () => {
      engine.stop();
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ 
        display: 'block', 
        width: '100vw', 
        height: '100vh', 
        backgroundColor: 'black' 
      }} 
    />
  );
};

import type { GestureType } from '../../types';

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

const distance = (p1: Landmark, p2: Landmark) => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

export class GestureClassifier {
  private wristHistory: number[] = [];

  public classify(landmarks: Landmark[]): GestureType {
    if (!landmarks || landmarks.length !== 21) return 'NONE';

    const wrist = landmarks[0];
    this.wristHistory.push(wrist.y);
    // Keep 20 frames of history for swipe detection (approx 330ms at 60fps)
    if (this.wristHistory.length > 20) {
      this.wristHistory.shift();
    }

    // Hand scale reference (wrist to middle finger MCP)
    const handSize = distance(wrist, landmarks[9]);

    // Robust extension check: tip must be further from wrist than PIP joint by a margin
    const isExtended = (tipIdx: number, pipIdx: number) => {
      return distance(wrist, landmarks[tipIdx]) > distance(wrist, landmarks[pipIdx]) + (handSize * 0.1);
    };
    
    const indexExt = isExtended(8, 6);
    const middleExt = isExtended(12, 10);
    const ringExt = isExtended(16, 14);
    const pinkyExt = isExtended(20, 18);

    // Thumb is extended if its tip is further from the pinky base than its IP joint
    const thumbExt = distance(landmarks[4], landmarks[17]) > distance(landmarks[3], landmarks[17]) + (handSize * 0.05);

    // Pinch: Thumb tip and index tip are close
    const pinchDist = distance(landmarks[4], landmarks[8]);
    const isPinch = pinchDist < (handSize * 0.4); 

    // Classification Priority

    // 1. PINCH
    // Needs to not just be a fist. Usually in a pinch, the thumb and index are extended away from the palm.
    // If the index finger is curled all the way into the palm, it's a fist.
    const indexDistanceFromPalm = distance(landmarks[8], landmarks[0]);
    if (isPinch && indexDistanceFromPalm > (handSize * 0.8)) {
      return 'PINCH';
    }

    // 2. FIST
    if (!indexExt && !middleExt && !ringExt && !pinkyExt) {
      return 'FIST';
    }

    // 3. PEACE
    if (indexExt && middleExt && !ringExt && !pinkyExt) {
      return 'PEACE';
    }

    // 4. PALM / SWIPE_UP (Needs mostly open hand)
    if (indexExt && middleExt && ringExt && pinkyExt) {
      if (this.wristHistory.length >= 15) {
        const yStart = this.wristHistory[0];
        const yEnd = this.wristHistory[this.wristHistory.length - 1];
        // Swiping UP means Y decreases. Must move by > 8% of screen height
        if (yStart - yEnd > 0.08) {
          return 'SWIPE_UP';
        }
      }
      return 'PALM';
    }

    return 'NONE';
  }
}

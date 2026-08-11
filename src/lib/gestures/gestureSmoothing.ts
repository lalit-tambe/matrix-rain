import type { GestureType } from '../../types';

export class GestureSmoother {
  private history: GestureType[] = [];
  private historySize = 15; // Increased buffer for stability 

  public smooth(currentGesture: GestureType): GestureType {
    this.history.push(currentGesture);
    if (this.history.length > this.historySize) {
      this.history.shift();
    }

    const counts: Record<string, number> = {};
    for (const g of this.history) {
      counts[g] = (counts[g] || 0) + 1;
    }

    let dominantGesture = 'NONE' as GestureType;
    let maxCount = 0;
    
    for (const [g, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        dominantGesture = g as GestureType;
      }
    }

    if (maxCount >= Math.floor(this.historySize * 0.6)) {
      return dominantGesture;
    }

    return 'NONE';
  }
}

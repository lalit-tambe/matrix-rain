export interface RainState {
  speedMultiplier: number;
  burstTrigger: boolean;
  colorGlitch: boolean;
  activeGesture: string;
}

export const rainStore: RainState = {
  speedMultiplier: 1.0,
  burstTrigger: false,
  colorGlitch: false,
  activeGesture: 'NONE',
};

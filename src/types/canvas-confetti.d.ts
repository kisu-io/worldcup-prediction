declare module "canvas-confetti" {
  interface ConfettiOptions {
    particleCount?: number;
    spread?: number;
    angle?: number;
    origin?: { x?: number; y?: number };
    colors?: string[];
    scalar?: number;
    ticks?: number;
    gravity?: number;
    decay?: number;
    startVelocity?: number;
    shapes?: string[];
    zIndex?: number;
    disableForReducedMotion?: boolean;
  }

  function confetti(options?: ConfettiOptions): Promise<void>;
  function confetti(): Promise<void>;

  namespace confetti {
    function reset(): void;
    function create(canvas: HTMLCanvasElement, options?: { resize?: boolean }): typeof confetti;
  }

  export = confetti;
}

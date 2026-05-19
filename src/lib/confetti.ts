"use client";

import confetti from "canvas-confetti";

export function fireConfettiWin() {
  const colors = ["#ffd700", "#ff6b35", "#00e5ff", "#39ff14", "#ff0055"];
  const end = Date.now() + 3000;

  (function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors,
      scalar: 1.2,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors,
      scalar: 1.2,
    });
    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}

export function fireConfettiBurst() {
  confetti({
    particleCount: 150,
    spread: 100,
    origin: { y: 0.6 },
    colors: ["#ffd700", "#ff6b35", "#39ff14"],
  });
}

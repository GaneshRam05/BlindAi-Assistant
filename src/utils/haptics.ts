export function vibrate(pattern: number | number[]): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (error) {
      console.warn("Vibration blocked by browser:", error);
    }
  }
}

export function vibrateShort(): void {
  vibrate(50);
}

export function vibrateLong(): void {
  vibrate(200);
}

export function vibratePattern(pattern: number[]): void {
  vibrate(pattern);
}

export function vibrateAlert(): void {
  vibrate([100, 50, 100, 50, 100]);
}

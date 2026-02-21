export class CameraService {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;

  async startCamera(videoElement: HTMLVideoElement): Promise<void> {
    try {
      this.videoElement = videoElement;

      // Try back camera first (mobile)
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: 'environment' } },
          audio: false,
        });
      } catch {
        // Fallback to default camera (desktop/laptop)
        this.stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      videoElement.srcObject = this.stream;
      await videoElement.play();
    } catch (error) {
      console.error('Camera error:', error);
      throw new Error(
        'Camera not available or permission denied.'
      );
    }
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }

  captureImage(): string | null {
    if (!this.videoElement || !this.stream) return null;

    const canvas = document.createElement('canvas');
    canvas.width = this.videoElement.videoWidth;
    canvas.height = this.videoElement.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(this.videoElement, 0, 0);

    const base64 = canvas.toDataURL('image/jpeg', 0.8);
    return base64.split(',')[1]; // clean base64 only
  }

  isActive(): boolean {
    return !!this.stream && this.stream.active;
  }
}

export const cameraService = new CameraService();

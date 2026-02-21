export class SpeechService {
  private synthesis: SpeechSynthesis;
  private recognition: any;
  private isListening = false;

  constructor() {
    this.synthesis = window.speechSynthesis;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang = "en-US";
    } else {
      console.error("SpeechRecognition is not supported in this browser");
    }
  }

  speak(text: string, onEnd?: () => void): void {
    if (!text) return;

    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    if (onEnd) utterance.onend = onEnd;

    this.synthesis.speak(utterance);
  }

  stop(): void {
    this.synthesis.cancel();
  }

  async listen(): Promise<string> {
  console.log("Listen function triggered");

  if (!this.recognition) {
    throw new Error("Speech recognition not supported");
  }

  if (this.isListening) {
    return Promise.reject("Already listening");
  }

  await navigator.mediaDevices.getUserMedia({ audio: true });

  return new Promise((resolve, reject) => {
    this.isListening = true;

    this.recognition.onstart = () => {
      console.log("Speech recognition started");
    };

    this.recognition.onresult = (event: any) => {
      console.log("Speech result received");
      const transcript = event.results[0][0].transcript;
      this.isListening = false;
      resolve(transcript);
    };

    this.recognition.onerror = (event: any) => {
      console.warn("Speech recognition error:", event.error);
      this.isListening = false;

      // ✅ HANDLE NO-SPEECH SAFELY
      if (event.error === "no-speech") {
        resolve(""); // return empty string instead of failing
      } else {
        reject(event.error);
      }
    };

    this.recognition.onend = () => {
      console.log("Speech recognition ended");
      this.isListening = false;
    };

    this.recognition.start();
  });
}



  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  isCurrentlyListening(): boolean {
    return this.isListening;
  }
}

export const speechService = new SpeechService();

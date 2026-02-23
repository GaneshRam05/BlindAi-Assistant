import { useEffect, useRef, useState } from 'react';
import { Camera, Book } from 'lucide-react';
import { cameraService } from '../services/cameraService';
import { askAI } from '../services/aiService';
import { speechService } from '../services/speechService';
import { vibrateShort } from '../utils/haptics';

interface ReadingModeProps {
  isActive: boolean;
}

export default function ReadingMode({ isActive }: ReadingModeProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    return () => {
      cameraService.stopCamera();
      speechService.stop();
    };
  }, []);

  const startCamera = async () => {
    try {
      setError('');
      if (videoRef.current) {
        await cameraService.startCamera(videoRef.current);
        setCameraActive(true);
        vibrateShort();
        speechService.speak("Camera ready. Point at text.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Camera failed';
      setError(message);
      speechService.speak(message);
    }
  };

  const readText = async () => {
    if (!cameraActive || isReading) return;

    try {
      setIsReading(true);
      speechService.stop();
      speechService.speak("Reading text.");

      const imageData = cameraService.captureImage();
      if (!imageData) throw new Error("Capture failed");

      const prompt = `
Extract ONLY readable text from this image.

Rules:
• Preserve line breaks
• No explanation
• If no text say: No readable text found
`;

      const response = await askAI(prompt, imageData);

      setText(response);
      speechService.stop();
      speechService.speak(response);
      vibrateShort();

    } catch {
      speechService.speak("Text reading failed.");
    } finally {
      setIsReading(false);
    }
  };

  if (!isActive) return null;

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto">
      <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden mb-6">
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />

        {!cameraActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <Camera className="w-24 h-24 text-gray-600" />
          </div>
        )}

        {isReading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-2xl font-bold">
            Reading...
          </div>
        )}
      </div>

      {error && (
        <div className="w-full bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-4 text-lg">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4 w-full mb-6">
        {!cameraActive ? (
          <button
            onClick={startCamera}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 px-8 rounded-lg text-2xl flex items-center justify-center gap-3"
          >
            <Camera className="w-8 h-8" />
            Start Camera
          </button>
        ) : (
          <button
            onClick={readText}
            disabled={isReading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-6 px-8 rounded-lg text-2xl flex items-center justify-center gap-3"
          >
            <Book className="w-8 h-8" />
            {isReading ? "Reading..." : "Read Text"}
          </button>
        )}
      </div>

      {text && (
        <div className="w-full bg-white border-4 border-gray-300 rounded-lg p-6">
          <h3 className="text-2xl font-bold mb-3 text-gray-900">Detected Text</h3>
          <div className="text-xl whitespace-pre-wrap">{text}</div>
        </div>
      )}
    </div>
  );
}

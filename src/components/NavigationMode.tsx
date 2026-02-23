import { useEffect, useRef, useState } from 'react';
import { Camera, Navigation } from 'lucide-react';
import { cameraService } from '../services/cameraService';
import { askAI } from '../services/aiService';
import { speechService } from '../services/speechService';
import { vibrateAlert, vibrateShort } from '../utils/haptics';

interface NavigationModeProps {
  isActive: boolean;
}

export default function NavigationMode({ isActive }: NavigationModeProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentDescription, setCurrentDescription] = useState('');
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
        speechService.speak("Camera ready. Press Start Navigation.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Camera failed';
      setError(message);
      speechService.speak(message);
    }
  };

  const analyzeEnvironment = async () => {
    if (isAnalyzing) return;

    try {
      setIsAnalyzing(true);
      speechService.stop();
      speechService.speak("Analyzing surroundings.");

      const imageData = cameraService.captureImage();
      if (!imageData) throw new Error("Image capture failed");

      const prompt = `
You are a professional mobility assistant for a blind person.

Speak clearly and briefly.

Rules:
• Maximum 2 sentences
• No lists
• No symbols
• Only navigation guidance
• Mention obstacle distance if visible

Example:
"Clear path ahead. A chair is one meter in front. Move slightly right."
`;

      const response = await askAI(prompt, imageData);

      setCurrentDescription(response);
      speechService.stop();
      speechService.speak(response);

      if (/stop|wall|danger|very close|obstacle/i.test(response)) {
        vibrateAlert();
      }

    } catch {
      speechService.speak("Unable to analyze environment.");
    } finally {
      setIsAnalyzing(false);
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

        {isAnalyzing && (
          <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full font-bold animate-pulse">
            ANALYZING
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
            onClick={analyzeEnvironment}
            disabled={isAnalyzing}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-6 px-8 rounded-lg text-2xl flex items-center justify-center gap-3"
          >
            <Navigation className="w-8 h-8" />
            {isAnalyzing ? "Analyzing..." : "Start Navigation"}
          </button>
        )}
      </div>

      {currentDescription && (
        <div className="w-full bg-white border-4 border-gray-300 rounded-lg p-6">
          <h3 className="text-2xl font-bold mb-3 text-gray-900">Environment</h3>
          <p className="text-xl leading-relaxed text-gray-800">{currentDescription}</p>
        </div>
      )}
    </div>
  );
}

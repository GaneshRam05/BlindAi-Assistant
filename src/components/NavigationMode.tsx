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
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentDescription, setCurrentDescription] = useState('');
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      stopNavigation();
      if (cameraActive) {
        cameraService.stopCamera();
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      setError('');
      if (videoRef.current) {
        await cameraService.startCamera(videoRef.current);
        setCameraActive(true);
        vibrateShort();
        speechService.speak('Camera activated. Press Start Navigation to begin.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start camera';
      setError(message);
      speechService.speak(message);
    }
  };

  const analyzeEnvironment = async () => {
    try {
      const imageData = cameraService.captureImage();
      if (!imageData) {
        throw new Error('Failed to capture image');
      }

      const prompt = `You are assisting a visually impaired person navigate their environment.
      Analyze this image and provide a clear, concise description of:
      1. Any obstacles or objects directly ahead and their approximate distance
      2. People in the vicinity and their direction
      3. Doors, walls, or pathways
      4. Any potential hazards
      Keep the response brief and actionable, focusing on navigation guidance.`;

      const response = await askAI(prompt);

      setCurrentDescription(response);
      speechService.speak(response);

      const hasObstacle = /obstacle|wall|chair|table|person ahead/i.test(response);
      if (hasObstacle) {
        vibrateAlert();
      }
    } catch (err) {
      console.error('Analysis error:', err);
    }
  };

  const startNavigation = () => {
    if (!cameraActive) {
      speechService.speak('Please start the camera first');
      return;
    }

    setIsNavigating(true);
    vibrateShort();
    speechService.speak('Navigation started. I will describe your surroundings.');

    analyzeEnvironment();

    intervalRef.current = window.setInterval(() => {
      analyzeEnvironment();
    }, 5000);
  };

  const stopNavigation = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsNavigating(false);
    speechService.stop();
    vibrateShort();
  };

  if (!isActive) return null;

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto">
      <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden mb-6">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
        {!cameraActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <Camera className="w-24 h-24 text-gray-600" />
          </div>
        )}
        {isNavigating && (
          <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full font-bold animate-pulse">
            NAVIGATING
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 px-8 rounded-lg text-2xl flex items-center justify-center gap-3 transition-colors"
          >
            <Camera className="w-8 h-8" />
            Start Camera
          </button>
        ) : !isNavigating ? (
          <button
            onClick={startNavigation}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6 px-8 rounded-lg text-2xl flex items-center justify-center gap-3 transition-colors"
          >
            <Navigation className="w-8 h-8" />
            Start Navigation
          </button>
        ) : (
          <button
            onClick={stopNavigation}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-6 px-8 rounded-lg text-2xl transition-colors"
          >
            Stop Navigation
          </button>
        )}
      </div>

      {currentDescription && (
        <div className="w-full bg-white border-4 border-gray-300 rounded-lg p-6">
          <h3 className="text-2xl font-bold mb-3 text-gray-900">Current Environment:</h3>
          <p className="text-xl leading-relaxed text-gray-800">{currentDescription}</p>
        </div>
      )}
    </div>
  );
}

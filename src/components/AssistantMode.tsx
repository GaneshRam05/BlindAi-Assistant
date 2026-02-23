import { useEffect, useRef, useState } from 'react';
import { Camera, Mic, MessageSquare } from 'lucide-react';
import { cameraService } from '../services/cameraService';
import { askAI } from '../services/aiService';
import { speechService } from '../services/speechService';
import { vibrateShort } from '../utils/haptics';

interface AssistantModeProps {
  isActive: boolean;
}

export default function AssistantMode({ isActive }: AssistantModeProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ q: string; a: string }>
  >([]);
  const [error, setError] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cameraService.stopCamera();
      speechService.stop();
    };
  }, []);

  // ===============================
  // CAMERA TOGGLE
  // ===============================
  const toggleCamera = async () => {
    try {
      setError('');

      if (cameraActive) {
        cameraService.stopCamera();
        setCameraActive(false);
        speechService.speak('Camera stopped.');
        return;
      }

      if (videoRef.current) {
        await cameraService.startCamera(videoRef.current);
        setCameraActive(true);
        vibrateShort();
        speechService.speak('Camera activated.');
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to access camera';
      setError(message);
      speechService.speak(message);
    }
  };

  // ===============================
  // PROCESS QUESTION
  // ===============================
  const processQuestion = async (questionText: string) => {
    if (!questionText.trim()) return;

    setIsProcessing(true);
    setError('');

    try {
      let response: string;

      const isVisualQuestion =
        cameraActive &&
        /what|color|see|look|show|this|that/i.test(questionText);

      if (isVisualQuestion) {
        const imageData = cameraService.captureImage();

        if (imageData) {
          speechService.speak('Analyzing image...');
          response = await askAI(
            `User question: ${questionText}. (Image captured but vision support not enabled yet.)`
          );
        } else {
          response = await askAI(questionText);
        }
      } else {
        response = await askAI(questionText);
      }

      if (!response || response.trim() === '') {
        response = "I couldn't get a response. Please try again.";
      }

      setAnswer(response);
      speechService.speak(response);

      setConversationHistory((prev) => [
        ...prev,
        { q: questionText, a: response },
      ]);

      vibrateShort();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to process question';
      setError(message);
      speechService.speak(message);
    } finally {
      setIsProcessing(false);
    }
  };

  // ===============================
  // START LISTENING
  // ===============================
  const startListening = async () => {
    try {
      setError('');
      setIsListening(true);
      vibrateShort();

      speechService.stop(); // stop any previous speech
      speechService.speak('Listening...');

      const transcript = await speechService.listen();

      setIsListening(false);

      if (!transcript || transcript.trim() === '') {
        speechService.speak('I did not hear anything. Please try again.');
        return;
      }

      setQuestion(transcript);
      await processQuestion(transcript);
    } catch (err) {
      setIsListening(false);

      const message =
        err instanceof Error ? err.message : 'Speech recognition failed';

      setError(message);
      speechService.speak(message);
    }
  };

  const handleAskQuestion = () => {
    if (!question.trim() || isProcessing) return;
    processQuestion(question.trim());
  };

  if (!isActive) return null;

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto">
      
      {/* CAMERA SECTION */}
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

        {isProcessing && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="text-white text-2xl font-bold">
              Processing...
            </div>
          </div>
        )}
      </div>

      {/* ERROR DISPLAY */}
      {error && (
        <div className="w-full bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-4 text-lg">
          {error}
        </div>
      )}

      {/* CONTROLS */}
      <div className="flex flex-col gap-4 w-full mb-6">
        
        {/* CAMERA BUTTON */}
        <button
          onClick={toggleCamera}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 px-8 rounded-lg text-2xl flex items-center justify-center gap-3 transition-colors"
        >
          <Camera className="w-8 h-8" />
          {cameraActive ? 'Stop Camera' : 'Start Camera (Optional)'}
        </button>

        {/* MIC BUTTON */}
        <button
          onClick={startListening}
          disabled={isListening || isProcessing}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-6 px-8 rounded-lg text-2xl flex items-center justify-center gap-3 transition-colors"
        >
          <Mic className="w-8 h-8" />
          {isListening ? 'Listening...' : 'Ask Question'}
        </button>

        {/* TEXT INPUT */}
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
            placeholder="Or type your question..."
            className="flex-1 px-6 py-4 text-xl text-gray-900 bg-white border-4 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />

          <button
            onClick={handleAskQuestion}
            disabled={!question.trim() || isProcessing}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold px-8 rounded-lg transition-colors"
          >
            <MessageSquare className="w-8 h-8" />
          </button>
        </div>
      </div>

      {/* ANSWER SECTION */}
      {answer && (
        <div className="w-full bg-green-50 border-4 border-green-300 rounded-lg p-6 mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Answer:</h3>
          <p className="text-xl text-gray-900">{answer}</p>
        </div>
      )}

      {/* CONVERSATION HISTORY */}
      {conversationHistory.length > 0 && (
        <div className="w-full bg-white border-4 border-gray-300 rounded-lg p-6">
          <h3 className="text-2xl text-gray-900 font-bold mb-4">
            Conversation History
          </h3>
          <div className="space-y-4">
            {conversationHistory.slice(-3).map((item, index) => (
              <div
                key={index}
                className="text-gray-900 border-l-4 border-blue-500 pl-4"
              >
                <p className="font-semibold">Q: {item.q}</p>
                <p>A: {item.a}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

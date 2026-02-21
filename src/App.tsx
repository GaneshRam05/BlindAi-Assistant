import { useState, useEffect } from 'react';
import { Navigation, MessageSquare, Book } from 'lucide-react';
import NavigationMode from './components/NavigationMode';
import AssistantMode from './components/AssistantMode';
import ReadingMode from './components/ReadingMode';
import { speechService } from './services/speechService';
import { vibrateShort } from './utils/haptics';

type Mode = 'navigation' | 'assistant' | 'reading';

function App() {
  const [currentMode, setCurrentMode] = useState<Mode>('navigation');
  const [tapCount, setTapCount] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);

  useEffect(() => {
    speechService.speak('Welcome to Blind Assistant AI. Navigation mode is active. Double tap for Assistant mode, triple tap for Reading mode.');
  }, []);

  useEffect(() => {
    const handleTap = () => {
      const now = Date.now();
      const timeDiff = now - lastTapTime;

      if (timeDiff < 500) {
        const newTapCount = tapCount + 1;
        setTapCount(newTapCount);

        if (newTapCount === 2) {
          switchMode('assistant');
          setTapCount(0);
        } else if (newTapCount === 3) {
          switchMode('reading');
          setTapCount(0);
        }
      } else {
        setTapCount(1);
      }

      setLastTapTime(now);
    };

    document.addEventListener('click', handleTap);
    return () => document.removeEventListener('click', handleTap);
  }, [tapCount, lastTapTime]);

  const switchMode = (mode: Mode) => {
    if (mode === currentMode) return;

    setCurrentMode(mode);
    vibrateShort();

    const messages = {
      navigation: 'Navigation mode activated',
      assistant: 'Assistant mode activated. Ask me anything.',
      reading: 'Reading mode activated. Point at text to read.',
    };

    speechService.speak(messages[mode]);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <header className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 text-blue-400">
          Blind Assistant AI
        </h1>
        <p className="text-center text-xl text-gray-300 mb-6">
          Powered by Gemini AI
        </p>

        <div className="flex justify-center gap-3 flex-wrap">
          <button
            onClick={() => switchMode('navigation')}
            className={`${
              currentMode === 'navigation'
                ? 'bg-blue-600 border-blue-400'
                : 'bg-gray-700 border-gray-600'
            } border-4 text-white font-bold py-4 px-6 rounded-lg text-lg flex items-center gap-2 transition-colors hover:opacity-90`}
          >
            <Navigation className="w-6 h-6" />
            Navigation
          </button>
          <button
            onClick={() => switchMode('assistant')}
            className={`${
              currentMode === 'assistant'
                ? 'bg-green-600 border-green-400'
                : 'bg-gray-700 border-gray-600'
            } border-4 text-white font-bold py-4 px-6 rounded-lg text-lg flex items-center gap-2 transition-colors hover:opacity-90`}
          >
            <MessageSquare className="w-6 h-6" />
            Assistant
          </button>
          <button
            onClick={() => switchMode('reading')}
            className={`${
              currentMode === 'reading'
                ? 'bg-purple-600 border-purple-400'
                : 'bg-gray-700 border-gray-600'
            } border-4 text-white font-bold py-4 px-6 rounded-lg text-lg flex items-center gap-2 transition-colors hover:opacity-90`}
          >
            <Book className="w-6 h-6" />
            Reading
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4">
        <div className="mb-6 bg-gray-800 border-2 border-gray-700 rounded-lg p-4 text-center">
          <p className="text-xl font-semibold text-blue-300">
            Current Mode: {currentMode.charAt(0).toUpperCase() + currentMode.slice(1)}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Double tap anywhere: Assistant | Triple tap: Reading
          </p>
        </div>

        <NavigationMode isActive={currentMode === 'navigation'} />
        <AssistantMode isActive={currentMode === 'assistant'} />
        <ReadingMode isActive={currentMode === 'reading'} />
      </main>

      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>Designed for accessibility. Large buttons, voice feedback, and haptic cues.</p>
      </footer>
    </div>
  );
}

export default App;

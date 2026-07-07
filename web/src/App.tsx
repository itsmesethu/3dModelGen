import { useState } from 'react';
import Home from './screens/Home';
import Create from './screens/Create';
import CameraCapture from './screens/CameraCapture';
import Processing from './screens/Processing';
import Result from './screens/Result';
import Visualize from './screens/Visualize';

type Screen = 'home' | 'create' | 'camera' | 'processing' | 'result' | 'visualize';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');

  const handleNavigate = (screen: string) => {
    setCurrentScreen(screen as Screen);
    window.scrollTo(0, 0);
  };

  return (
    <div className="bg-slate-900 min-h-screen">
      {currentScreen === 'home' && <Home onNavigate={handleNavigate} />}
      {currentScreen === 'create' && <Create onNavigate={handleNavigate} />}
      {currentScreen === 'camera' && <CameraCapture onNavigate={handleNavigate} />}
      {currentScreen === 'processing' && <Processing onNavigate={handleNavigate} />}
      {currentScreen === 'result' && <Result onNavigate={handleNavigate} />}
      {currentScreen === 'visualize' && <Visualize onNavigate={handleNavigate} />}
    </div>
  );
}

import { RainCanvas } from './components/RainCanvas';
import { GesturePanel } from './components/GesturePanel';
import './App.css';

function App() {
  return (
    <div className="app-container">
      <RainCanvas />
      <GesturePanel />
    </div>
  );
}

export default App;

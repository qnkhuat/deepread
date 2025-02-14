import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Viewer from './pages/Viewer';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Viewer />} />
      </Routes>
    </Router>
  );
}

export default App; 

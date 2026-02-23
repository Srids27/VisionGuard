import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import CRTOverlay from './components/layout/CRTOverlay';
import HomePage from './pages/HomePage';
import HistoryPage from './pages/HistoryPage';

export default function App() {
  return (
    <BrowserRouter>
      <CRTOverlay />
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Routes>
        </main>
        <footer className="border-t border-cyber-gray py-4 text-center">
          <p className="text-[10px] text-gray-600 tracking-widest">
            VISIONGUARD v1.0.0 // DIGITAL IMAGE FORENSICS TOOLKIT
          </p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

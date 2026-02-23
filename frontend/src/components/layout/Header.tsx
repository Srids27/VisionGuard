import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const location = useLocation();

  return (
    <header className="border-b border-cyber-gray bg-cyber-charcoal/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 border-2 border-cyber-green flex items-center justify-center animate-glow-pulse">
            <span className="text-cyber-green font-bold text-sm">V</span>
          </div>
          <h1 className="text-xl font-bold tracking-widest text-cyber-green glow-text">
            VISIONGUARD
          </h1>
        </Link>

        <nav className="flex gap-6 text-sm tracking-wider uppercase">
          <Link
            to="/"
            className={`transition-colors hover:text-cyber-green ${
              location.pathname === '/' ? 'text-cyber-green glow-text' : 'text-gray-500'
            }`}
          >
            [Analyze]
          </Link>
          <Link
            to="/history"
            className={`transition-colors hover:text-cyber-green ${
              location.pathname === '/history'
                ? 'text-cyber-green glow-text'
                : 'text-gray-500'
            }`}
          >
            [History]
          </Link>
        </nav>
      </div>
    </header>
  );
}

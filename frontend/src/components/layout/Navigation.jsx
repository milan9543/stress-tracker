import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function Navigation() {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <nav className="bg-stone-900 text-stone-100 shadow-lg border-b border-stone-800">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="font-bold text-xl text-purple-400">Stress Tracker</div>

          <div className="space-x-4">
            <Link
              to="/"
              className={`transition-colors ${
                location.pathname === '/'
                  ? 'text-purple-400 font-medium'
                  : 'text-stone-300 hover:text-purple-300'
              }`}
            >
              Home
            </Link>
            <Link
              to="/summary"
              className={`transition-colors ${
                location.pathname === '/summary'
                  ? 'text-purple-400 font-medium'
                  : 'text-stone-300 hover:text-purple-300'
              }`}
            >
              Summary
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;

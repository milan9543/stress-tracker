import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import HomePage from './pages/HomePage';
import SummaryPage from './pages/SummaryPage';
import Navigation from './components/layout/Navigation';
import { Toaster } from 'react-hot-toast';

// Wrap the app with AuthProvider and Router
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-stone-950 text-stone-200">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/summary" element={<SummaryPage />} />
          </Routes>
          <Toaster
            position="top-right"
            toastOptions={{
              success: {
                duration: 3000,
                style: {
                  background: '#7e22ce', // purple-700
                  color: '#f5f5f4', // stone-100
                  borderRadius: '0.375rem',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(126, 34, 206, 0.7)',
                },
              },
              error: {
                duration: 4000,
                style: {
                  background: '#57534e', // stone-600
                  color: '#f5f5f4', // stone-100
                  borderRadius: '0.375rem',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                  border: '1px solid #7f1d1d', // red-900
                },
              },
              style: {
                padding: '12px 16px',
              },
            }}
          />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

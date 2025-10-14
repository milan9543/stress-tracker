import { useState, useEffect } from 'react';
import { summaryApi, createWebSocketConnection } from '../utils/api';
import { StressLevelContainer } from '../components/layout/StressLevelContainer';
import QRCode from 'react-qr-code';
import UserStressLevels from '../components/stress/UserStressLevels';

function SummaryPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // Fetch summary data and setup WebSocket connection
  useEffect(() => {
    // Initial data fetch
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const data = await summaryApi.getSummary();
        setSummary(data);
      } catch (error) {
        console.error('Error fetching summary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();

    // Setup WebSocket connection for real-time updates
    const ws = createWebSocketConnection();

    ws.onopen = () => {
      setConnectionStatus('connected');
      console.log('WebSocket connection established for summary page');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);

        // Listen for summary-update or stress-update which should trigger summary refresh
        if (data.type === 'summary-update') {
          console.log('Received real-time summary update:', data.data);
          setSummary(data.data);
        } else if (data.type === 'stress-update') {
          console.log('Received stress update, refreshing summary data');
          // When stress is updated, fetch the latest summary data
          summaryApi.getSummary().then((updatedSummary) => {
            setSummary(updatedSummary);
          });
        } else if (data.type === 'error') {
          console.error('WebSocket server error:', data.message);
        } else if (data.type === 'connected') {
          console.log('WebSocket authenticated connection:', data.message);
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      setConnectionStatus('disconnected');
      console.log('WebSocket connection closed for summary page');
    };

    // Clean up WebSocket connection on unmount
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  return (
    <StressLevelContainer level={summary ? summary.averageStressLevel : 0}>
      {/* Connection status indicator */}
      <div className="fixed top-4 right-4 flex justify-end mb-4 z-20">
        <div
          className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 backdrop-blur-sm shadow-lg transition-all duration-300 ${
            connectionStatus === 'connected'
              ? 'bg-green-900/30 text-green-400 border border-green-700/50'
              : 'bg-stone-900/30 text-stone-400 border border-stone-700/50'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full inline-block ${
              connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' : 'bg-stone-500'
            }`}
          ></span>
          {connectionStatus === 'connected' ? 'Live Updates' : 'Disconnected'}
        </div>
      </div>

      {/* QR Code in bottom right corner */}
      <div className="fixed bottom-4 right-4 flex flex-col items-center z-20 backdrop-blur-sm bg-stone-900/30 p-3 rounded-lg border border-stone-800/40 shadow-lg hover:scale-110 transition-transform">
        <QRCode
          value={window.location.href.replace('/summary', '')}
          size={120}
          bgColor="rgba(28, 25, 23, 0.7)"
          fgColor="rgba(214, 211, 209, 0.9)"
          level="H"
        />
        <p className="text-stone-400 text-[10px] mt-2 text-center">Add your stress level!</p>
      </div>

      {/* User stress levels panel */}
      {summary && summary.users && <UserStressLevels users={summary.users} />}

      {summary && !loading && (
        <div className="flex flex-col items-center">
          <h1
            className={`text-[200px] leading-none ${
              summary.averageStressLevel <= 20
                ? 'text-green-500'
                : summary.averageStressLevel <= 40
                ? 'text-lime-500'
                : summary.averageStressLevel <= 60
                ? 'text-yellow-500'
                : summary.averageStressLevel <= 80
                ? 'text-amber-500'
                : summary.averageStressLevel <= 99
                ? 'text-orange-500'
                : 'text-red-500'
            } opacity-50`}
          >
            {summary.averageStressLevel.toFixed(2)}%
          </h1>
          <p className="text-stone-600 text-xs mt-2 opacity-40 tracking-wide">
            {summary.lastUpdated
              ? new Date(summary.lastUpdated).toLocaleString()
              : 'No update data'}
          </p>
        </div>
      )}
    </StressLevelContainer>
  );
}

export default SummaryPage;

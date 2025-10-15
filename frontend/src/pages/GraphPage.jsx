import { useState, useEffect } from 'react';
import { summaryApi, createWebSocketConnection } from '../utils/api';
import StressChart from '../components/stress/StressChart';

function GraphPage() {
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
      console.log('WebSocket connection established for graph page');
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
      console.log('WebSocket connection closed for graph page');
    };

    // Clean up WebSocket connection on unmount
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 overflow-hidden relative">
      {/* Background Chart - Full screen, slightly see-through */}
      {!loading && summary && (
        <StressChart
          timeBasedAverages={summary?.timeBasedAverages || []}
          compact={true}
          grayScale={true}
          className="w-full h-full background"
        />
      )}

      {/* Connection status indicator */}
      <div className="fixed top-4 right-4 flex justify-end mb-4 z-20">
        <div
          className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 backdrop-blur-md shadow-lg transition-all duration-300 ${
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

      {/* Main chart container */}
      <div className="w-full h-screen flex flex-col justify-center items-center p-4 relative z-10">
        {loading ? (
          <div className="text-stone-400">Loading chart data...</div>
        ) : (
          <div className="w-full h-[90vh] p-6 bg-stone-900/30 rounded-lg border border-stone-800/50 backdrop-blur-md">
            <StressChart timeBasedAverages={summary?.timeBasedAverages || []} />
          </div>
        )}
      </div>
    </div>
  );
}

export default GraphPage;

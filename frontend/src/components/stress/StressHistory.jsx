import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { stressApi } from '../../utils/api';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register required Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function StressHistory() {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [average, setAverage] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    async function fetchStressHistory() {
      setLoading(true);
      setError(null);

      try {
        // Get history data
        const history = await stressApi.getHistory();
        setHistoryData(history.entries);

        // Get average stress level
        const averageData = await stressApi.getAverage();
        setAverage(averageData.average);
      } catch (err) {
        setError(err.message || 'An error occurred');
        console.error('Error fetching stress data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStressHistory();
  }, [user]);

  // Prepare data for Chart.js
  const chartData = {
    labels: historyData.map((entry) => {
      const date = new Date(entry.created_at);
      return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(
        date.getMinutes()
      ).padStart(2, '0')}`;
    }),
    datasets: [
      {
        label: 'Stress Level',
        data: historyData.map((entry) => entry.stress_level),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        pointBackgroundColor: historyData.map((entry) =>
          entry.is_superstress ? 'red' : 'rgba(53, 162, 235, 0.5)'
        ),
        pointRadius: historyData.map((entry) => (entry.is_superstress ? 6 : 3)),
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Your Stress History',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const entry = historyData[context.dataIndex];
            let label = `Stress Level: ${entry.stress_level}`;
            if (entry.is_superstress) {
              label += ' (Superstress)';
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 200,
      },
    },
  };

  if (!user) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Your Stress History</h2>
        {average !== null && (
          <div className="text-gray-700">
            Average: <span className="font-semibold">{average.toFixed(1)}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8">Loading stress data...</div>
      ) : error ? (
        <div className="text-red-500 text-center py-8">{error}</div>
      ) : historyData.length === 0 ? (
        <div className="text-gray-500 text-center py-8">No stress data recorded yet</div>
      ) : (
        <div className="w-full">
          <Line data={chartData} options={chartOptions} />
        </div>
      )}
    </div>
  );
}

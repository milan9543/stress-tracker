import { useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

/**
 * StressChart component - Displays stress data in a line chart
 * @param {Object} props
 * @param {Array} props.timeBasedAverages - Array of time-based stress averages
 * @param {boolean} props.compact - Whether to show a compact version (no labels, simplified)
 * @param {string} props.className - Additional CSS classes for the container
 * @param {boolean} props.grayScale - Whether to use gray colors instead of purple
 */
function StressChart({
  timeBasedAverages = [],
  compact = false,
  className = '',
  grayScale = false,
}) {
  const chartRef = useRef(null);

  if (!timeBasedAverages || timeBasedAverages.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <p className="text-stone-500 text-sm">No data available</p>
      </div>
    );
  }

  // Prepare chart data
  const chartData = {
    labels: timeBasedAverages.map((interval) => interval.timeInterval),
    datasets: [
      {
        fill: true,
        label: 'Average Stress Level',
        data: timeBasedAverages.map((interval) => interval.averageStress),
        borderColor: grayScale ? 'rgba(161, 161, 170, 0.8)' : 'rgba(196, 181, 253, 0.8)',
        backgroundColor: grayScale ? 'rgba(161, 161, 170, 0.2)' : 'rgba(196, 181, 253, 0.2)',
        pointBackgroundColor: compact
          ? 'transparent'
          : grayScale
          ? 'rgba(161, 161, 170, 1)'
          : 'rgba(196, 181, 253, 1)',
        pointBorderColor: compact ? 'transparent' : '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: grayScale ? 'rgba(161, 161, 170, 1)' : 'rgba(196, 181, 253, 1)',
        borderWidth: compact ? 1.5 : 2,
        tension: 0.4,
        pointRadius: compact ? 0 : 3,
      },
    ],
  };

  // Chart options based on compact mode
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: !compact,
        labels: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
      },
      tooltip: {
        enabled: !compact,
        backgroundColor: 'rgba(42, 39, 37, 0.8)',
        titleColor: '#f5f5f4',
        bodyColor: '#f5f5f4',
        borderColor: 'rgba(196, 181, 253, 0.5)',
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          label: function (context) {
            return `Stress Level: ${context.parsed.y.toFixed(2)}%`;
          },
          afterLabel: function (context) {
            const dataIndex = context.dataIndex;
            const entryCount = timeBasedAverages[dataIndex]?.entryCount || 0;
            return `Entries: ${entryCount}`;
          },
        },
      },
      title: {
        display: !compact,
        text: 'Stress Level Trends (15-minute intervals)',
        color: 'rgba(255, 255, 255, 0.9)',
        font: {
          size: 16,
          weight: 'bold',
        },
        padding: {
          top: 10,
          bottom: 30,
        },
      },
    },
    scales: {
      y: {
        display: true, // Always display y-axis
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          display: !compact,
        },
        ticks: {
          display: true, // Always display y-axis ticks
          color: 'rgba(255, 255, 255, 0.7)',
          callback: function (value) {
            return value + '%'; // Add percentage symbol
          },
          font: {
            size: compact ? 8 : 11, // Smaller font for compact mode
          },
          // Show fewer ticks in compact mode
          stepSize: compact ? 25 : 10,
        },
        title: {
          display: !compact,
          text: 'Stress Level %',
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 12,
          },
        },
      },
      x: {
        display: !compact,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          display: !compact,
        },
        ticks: {
          display: !compact,
          color: 'rgba(255, 255, 255, 0.7)',
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
    // Remove all animations for compact mode
    animation: compact
      ? false
      : {
          duration: 1000,
          easing: 'easeOutQuart',
        },
    elements: {
      line: {
        borderWidth: compact ? 1.5 : 2,
      },
      point: {
        radius: compact ? 0 : 3,
        hoverRadius: compact ? 0 : 5,
      },
    },
  };

  // Determine if this is a fullscreen background chart
  const isBackground = className?.includes('background');

  return (
    <div className={`${className} ${isBackground ? 'absolute inset-0 z-0 opacity-15' : ''}`}>
      <Line ref={chartRef} data={chartData} options={chartOptions} />
    </div>
  );
}

export default StressChart;

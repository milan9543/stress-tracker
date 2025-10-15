import React from 'react';

const UserStressLevels = ({ users }) => {
  if (!users || users.length === 0) return null;

  // Function to determine color class based on stress level
  const getColorClass = (level) => {
    if (level <= 20) return 'text-green-500';
    if (level <= 40) return 'text-lime-500';
    if (level <= 60) return 'text-yellow-500';
    if (level <= 80) return 'text-amber-500';
    if (level <= 99) return 'text-orange-500';
    return 'text-red-500';
  };

  // Function to format the timestamp to a more readable format
  const formatTime = (timestamp) => {
    try {
      // Try parsing as ISO string (from lastUpdated in summary.lastUpdated format)
      if (typeof timestamp === 'string') {
        // Handle string timestamp formats
        if (timestamp.includes('T')) {
          // ISO format like "2025-10-14T06:00:58.814Z"
          const date = new Date(timestamp);
          // Add two hours to the time
          date.setHours(date.getHours() + 2);
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (timestamp.includes(' ')) {
          // Format like "2025-10-14 05:59:25"
          const [datePart, timePart] = timestamp.split(' ');
          const [hours, minutes, seconds] = timePart.split(':');
          // Add two hours to the time
          const hoursAdjusted = (parseInt(hours) + 2) % 24;
          return `${hoursAdjusted.toString().padStart(2, '0')}:${minutes}`;
        }
      }

      // If it's already a Date object or can be parsed as one
      const date = new Date(timestamp);
      if (!isNaN(date)) {
        // Add two hours to the time
        date.setHours(date.getHours() + 2);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      return 'Unknown';
    } catch (e) {
      console.error('Error formatting timestamp:', e);
      return 'Unknown';
    }
  };
  return (
    <div className="fixed right-4 top-16 flex flex-col max-w-[240px] overflow-y-auto z-20 backdrop-blur-md bg-stone-900/30 rounded-lg border border-stone-700 shadow-lg">
      <div className="p-4 border-b border-stone-800/40">
        <h3 className="text-stone-300 text-base font-medium">Team Stress Levels</h3>
      </div>
      <div className="flex-1 overflow-y-auto">
        {users.map((user) => (
          <div
            key={user.userId}
            className="p-2 border-b border-stone-800/20 flex items-center justify-between gap-3 hover:bg-stone-800/20 transition-colors"
          >
            <div className="flex flex-col">
              <span
                className="text-stone-300 text-base truncate max-w-[130px]"
                title={user.username}
              >
                {user.username}
              </span>
              <span className="text-stone-500 text-sm">{formatTime(user.lastUpdated)}</span>
            </div>
            <div
              className={`${getColorClass(user.stressLevel)} text-3xl font-medium ${
                user.isSuperstress ? 'animate-pulse' : ''
              }`}
            >
              {user.stressLevel}%{user.isSuperstress && <span className="ml-1">⚠️</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserStressLevels;

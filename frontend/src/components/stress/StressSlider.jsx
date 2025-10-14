import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { stressApi } from '../../utils/api';
import './stress-slider.css';

export default function StressSlider({ onSubmit }) {
  const { user, refreshUser } = useAuth();
  // Default to user's last level (capped at 100) or 50 if not available
  const initialStressLevel =
    user?.lastStressLevel !== undefined ? Math.min(user.lastStressLevel, 100) : 50;
  const [stressLevel, setStressLevel] = useState(initialStressLevel);
  const [cooldown, setCooldown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [thumbSize, setThumbSize] = useState('28px');

  // Handle cooldown time from server
  useEffect(() => {
    if (!user) return;

    console.log('User data in StressSlider:', user);

    // Get the remaining cooldown time from the server response
    const remainingCooldown = user.nextStressUpdateAvailableInSeconds || 0;

    if (remainingCooldown > 0) {
      setCooldown(remainingCooldown);
    } else {
      setCooldown(0);
    }

    console.log('Stress cooldown from server:', remainingCooldown);
  }, [user]);

  // Set initial stress level from user data only when user changes or component mounts
  useEffect(() => {
    if (!user || user.lastStressLevel === undefined) return;

    // Cap the stress level at 100 if it's greater
    const cappedStressLevel = Math.min(user.lastStressLevel, 100);
    setStressLevel(cappedStressLevel);

    if (user.lastStressLevel > 100) {
      console.log('Capping stress level at 100 (original value:', user.lastStressLevel, ')');
    } else {
      console.log('Setting initial stress level from user data:', user.lastStressLevel);
    }
  }, [user]);

  // Handle cooldown timer
  useEffect(() => {
    if (!cooldown) return;

    const timer = setInterval(() => {
      setCooldown((prevCooldown) => {
        if (prevCooldown <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prevCooldown - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  // Handle responsive thumb size
  useEffect(() => {
    const handleResize = () => {
      setThumbSize(window.innerWidth < 768 ? '20px' : '28px');
    };

    // Set initial size
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = async () => {
    if (!user || cooldown > 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await stressApi.recordStress(stressLevel);

      // Refresh user data to get updated cooldown information
      await refreshUser();

      // Call the onSubmit callback with the submitted level
      if (onSubmit) {
        onSubmit(stressLevel);
      }
    } catch (error) {
      console.error('Error submitting stress level:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-stone-900 rounded-xl shadow-lg shadow-stone-950/50 p-4 md:p-6 mb-4 md:mb-6 border border-stone-800/50 text-stone-100 backdrop-blur-sm">
      <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-gradient bg-gradient-to-r from-purple-400 to-violet-300">
        Track Your Stress
      </h2>

      <div className="mb-2 md:mb-8">
        <div className="flex justify-between mb-2 md:mb-3 text-xs md:text-sm font-medium text-stone-300">
          <span>Low Stress (0)</span>
          <span>High Stress (100)</span>
        </div>
        <div className="relative py-2 md:py-3">
          <input
            type="range"
            min="0"
            max="100"
            value={stressLevel}
            onChange={(e) => setStressLevel(parseInt(e.target.value))}
            className="w-full h-6 md:h-8 appearance-none cursor-pointer bg-transparent focus:outline-none"
            disabled={cooldown > 0 || isSubmitting}
            style={{
              /* Custom thumb styling */
              '--thumb-size': thumbSize,
              '--thumb-color':
                cooldown > 0 || isSubmitting ? 'rgb(128, 128, 128)' : 'rgb(168, 85, 247)',
              '--thumb-shadow':
                cooldown > 0 || isSubmitting ? 'none' : '0 0 10px rgba(168, 85, 247, 0.5)',
            }}
          />
          {/* Custom track background with gradient */}
          <div
            className="absolute top-1/2 left-0 w-full h-2 md:h-3 -translate-y-1/2 rounded-full shadow-inner"
            style={{
              background:
                cooldown > 0 || isSubmitting
                  ? 'linear-gradient(to right, rgba(128, 128, 128, 0.5), rgba(160, 160, 160, 0.5))'
                  : 'linear-gradient(to right, rgba(34, 197, 94, 0.9), rgba(234, 179, 8, 0.9), rgba(239, 68, 68, 0.9))',
              zIndex: '-1',
              opacity: cooldown > 0 || isSubmitting ? '0.6' : '1',
            }}
          />
          {/* Progress overlay */}
          <div
            className="absolute top-1/2 left-0 h-2 md:h-3 -translate-y-1/2 rounded-full transition-all duration-150"
            style={{
              width: `${stressLevel}%`,
              background:
                cooldown > 0 || isSubmitting
                  ? 'rgba(200, 200, 200, 0.50)'
                  : 'rgba(255, 255, 255, 0.50)',
              backdropFilter: 'blur(1px)',
              zIndex: '-1',
            }}
          />
        </div>
        {/* Stress level markers */}
        <div className="flex justify-between px-1 text-[10px] md:text-xs text-stone-400">
          <span>0</span>
          <span>25</span>
          <span>50</span>
          <span>75</span>
          <span>100</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between mt-4 md:mt-6">
        <div className="flex flex-col w-full">
          <span className="text-xs md:text-sm text-stone-400 font-medium">Current Level</span>
          <div className="text-2xl md:text-3xl font-bold">
            <span
              className={`${
                cooldown > 0 || isSubmitting
                  ? 'text-gray-500'
                  : 'text-gradient bg-gradient-to-r from-purple-400 to-violet-300'
              }`}
            >
              {stressLevel}
            </span>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={cooldown > 0 || isSubmitting || !user}
          className={`w-full mt-2 md:w-min px-4 md:px-8 py-2 md:py-3 rounded-lg md:rounded-xl text-sm md:text-base font-medium text-stone-50 shadow-lg
            ${
              cooldown > 0 || isSubmitting || !user
                ? 'bg-gradient-to-r from-purple-800/40 to-violet-900/40 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-500 hover:to-violet-600 active:from-purple-700 active:to-violet-800'
            } 
            focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]`}
        >
          {isSubmitting
            ? 'Submitting...'
            : cooldown > 0
            ? `Cooldown: ${Math.floor(cooldown / 60)}:${String(cooldown % 60).padStart(2, '0')}`
            : 'Submit'}
        </button>
      </div>
    </div>
  );
}

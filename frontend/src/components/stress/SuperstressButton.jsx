import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { stressApi } from '../../utils/api';

export default function SuperstressButton({ onSubmit }) {
  const [isAvailable, setIsAvailable] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const { user, refreshUser } = useAuth();

  // Use superstress cooldown time directly from server
  useEffect(() => {
    if (!user) return;

    console.log('User data in SuperstressButton:', user);

    // Get the remaining cooldown time from the server response
    const remainingCooldown = user.nextSuperStressUpdateAvailableInSeconds || 0;

    if (remainingCooldown > 0) {
      setCooldown(remainingCooldown);
      setIsAvailable(false);
    } else {
      setCooldown(0);
      setIsAvailable(true);
    }

    console.log('Superstress cooldown from server:', remainingCooldown);
  }, [user]);

  // Handle cooldown timer for display purposes
  useEffect(() => {
    if (!cooldown) return;

    const timer = setInterval(() => {
      setCooldown((prevCooldown) => {
        if (prevCooldown <= 1) {
          clearInterval(timer);
          setIsAvailable(true);
          return 0;
        }
        return prevCooldown - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSuperstress = async () => {
    if (!user || !isAvailable || isSubmitting) return;

    // Get cooldown duration in hours (rounded)
    const cooldownHours = user?.cooldownDurations?.superstress
      ? Math.round(user.cooldownDurations.superstress / (60 * 60 * 1000))
      : 3;

    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to use SUPERSTRESS? This will set your stress level to maximum (200) and can only be used once every ${cooldownHours} hours.`
    );

    if (!confirmed) {
      // User cancelled the operation
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await stressApi.recordSuperstress();

      // Check if we received a funny message from OpenAI
      if (response && response.funnyMessage) {
        // Import the showPersistentFunnyToast function
        const { showPersistentFunnyToast } = await import('../../utils/notifications');

        // Show persistent toast with funny message
        showPersistentFunnyToast(response.funnyMessage);
      }

      // Refresh user data to get updated cooldown information
      await refreshUser();

      // Call the onSubmit callback
      if (onSubmit) {
        onSubmit();
      }
    } catch (error) {
      console.error('Error submitting superstress:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format the cooldown time for display
  const formatCooldownTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}m ${secs}s`;
    }
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="bg-stone-900 rounded-lg shadow-lg shadow-stone-950/50 p-3 md:p-4 mb-4 md:mb-6 border border-stone-800 text-stone-100">
      <h2 className="text-lg md:text-xl font-semibold mb-2 md:mb-4 text-purple-400">
        Superstress Button
      </h2>

      <p className="text-stone-400 text-[10px] md:text-xs font-thin">
        Use this button once every{' '}
        {user?.cooldownDurations?.superstress
          ? Math.round(user.cooldownDurations.superstress / (60 * 60 * 1000))
          : 3}{' '}
        hours when you're experiencing extreme stress levels.
      </p>

      <button
        onClick={handleSuperstress}
        disabled={!user || !isAvailable || isSubmitting}
        className={`w-full mt-3 md:mb-4 py-3 md:py-4 rounded-md font-bold text-stone-50 text-base md:text-lg shadow-md
          ${
            !user || !isAvailable || isSubmitting
              ? 'bg-stone-700 border border-stone-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-red-900 via-red-800 to-red-900 hover:from-red-800 hover:via-red-700 hover:to-red-800 active:from-red-900 active:to-red-900 animate-pulse border-2 border-red-600 shadow-lg shadow-red-900/30'
          }
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-700 transition-all duration-200`}
      >
        {isSubmitting ? (
          'Submitting...'
        ) : !isAvailable && cooldown > 0 ? (
          `Available in ${formatCooldownTime(cooldown)}`
        ) : !isAvailable ? (
          'Already Used Today'
        ) : (
          <span className="flex items-center justify-center space-x-2">
            <span className="text-xl md:text-2xl">💀</span>
            <span>SUPERSTRESS!</span>
            <span className="text-xl md:text-2xl">💀</span>
          </span>
        )}
      </button>
    </div>
  );
}

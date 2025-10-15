import toast from 'react-hot-toast';

/**
 * Request browser notification permission
 * @returns {Promise<string>} Permission status ('granted', 'denied', or 'default')
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support desktop notifications');
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'error';
    }
  }

  return Notification.permission;
};

/**
 * Send a browser notification
 * @param {string} title - The notification title
 * @param {Object} options - Notification options (body, icon, etc.)
 * @returns {Notification|null} The notification object or null if not supported/permitted
 */
export const sendBrowserNotification = (title, options = {}) => {
  if (!('Notification' in window)) {
    console.log('This browser does not support desktop notifications');
    return null;
  }

  if (Notification.permission === 'granted') {
    const notification = new Notification(title, options);
    return notification;
  }

  return null;
};

/**
 * Display a success toast notification
 * @param {string} message - The message to display
 * @param {Object} options - Optional toast configuration options
 */
export const showSuccess = (message, options = {}) => {
  return toast.success(message, options);
};

/**
 * Display a persistent success toast with a funny message that requires manual dismissal
 * @param {string} message - The message to display
 * @param {string} funnyMessage - The funny message from OpenAI
 * @returns {string} - Toast ID that can be used to dismiss the toast
 */
export const showPersistentFunnyToast = (funnyMessage) => {
  return toast.success(
    <div>
      {funnyMessage && <p className="font-normal text-sm">{funnyMessage}</p>}
      <button
        className="mt-2 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
        onClick={() => toast.dismiss(toast.id)}
      >
        Dismiss
      </button>
    </div>,
    {
      duration: Infinity, // Toast stays until manually dismissed
      style: {
        padding: '16px',
      },
    }
  );
};

/**
 * Display an error toast notification
 * @param {string} message - The message to display
 * @param {Object} options - Optional toast configuration options
 */
export const showError = (message, options = {}) => {
  return toast.error(message, options);
};

/**
 * Display a loading toast notification that can be updated later
 * @param {string} message - The message to display
 * @param {Object} options - Optional toast configuration options
 * @returns {string} - Toast ID that can be used to update or dismiss the toast
 */
export const showLoading = (message, options = {}) => {
  return toast.loading(message, options);
};

/**
 * Display a standard toast notification (neutral)
 * @param {string} message - The message to display
 * @param {Object} options - Optional toast configuration options
 */
export const showInfo = (message, options = {}) => {
  return toast(message, options);
};

/**
 * Dismiss a specific toast by ID
 * @param {string} toastId - The ID of the toast to dismiss
 */
export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

/**
 * Handle API response with appropriate toast notifications
 * @param {Promise} promise - The API promise to handle
 * @param {Object} messages - Custom messages for different states
 * @param {string} messages.loading - Message to show while loading (optional)
 * @param {string} messages.success - Message to show on success
 * @param {string} messages.error - Message to show on error (can be function that receives error)
 * @returns {Promise} - The original promise result
 */
export const handleApiWithToast = async (promise, messages) => {
  const { loading, success, error } = messages;
  let toastId;

  try {
    if (loading) {
      toastId = showLoading(loading);
    }

    const result = await promise;

    if (toastId) {
      toast.dismiss(toastId);
    }

    if (success) {
      showSuccess(success);
    }

    return result;
  } catch (err) {
    if (toastId) {
      toast.dismiss(toastId);
    }

    const errorMessage = typeof error === 'function' ? error(err) : error || 'An error occurred';

    showError(errorMessage);
    throw err;
  }
};

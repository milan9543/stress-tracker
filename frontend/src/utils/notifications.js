import toast from 'react-hot-toast';

/**
 * Display a success toast notification
 * @param {string} message - The message to display
 * @param {Object} options - Optional toast configuration options
 */
export const showSuccess = (message, options = {}) => {
  return toast.success(message, options);
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

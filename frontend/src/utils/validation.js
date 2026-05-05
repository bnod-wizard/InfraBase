/**
 * Utility Functions
 */

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const validatePassword = (password) => {
  return password && password.length >= 6;
};

/**
 * Validate username
 */
export const validateUsername = (username) => {
  return username && username.length >= 3 && username.length <= 20;
};

/**
 * Format error message
 */
export const formatErrorMessage = (error) => {
  if (typeof error === 'string') {
    return error;
  }
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

/**
 * Check if user object is valid
 */
export const isValidUser = (user) => {
  return user && user.id && user.username && user.email;
};

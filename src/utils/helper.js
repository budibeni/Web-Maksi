/**
 * Create a delay for async operations
 * @param {number} ms 
 * @returns {Promise<void>}
 */
export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generate a random string
 * @param {number} length 
 * @returns {string}
 */
export const generateRandomString = (length = 8) => {
  return Math.random().toString(36).substring(2, length + 2);
};

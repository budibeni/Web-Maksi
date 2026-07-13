import dayjs from "../lib/dayjs";

/**
 * Format date to standard Indonesian format (e.g. 17 Agustus 1945)
 * @param {string|Date} date 
 * @param {string} format 
 * @returns {string}
 */
export const formatDate = (date, format = "DD MMMM YYYY") => {
  if (!date) return "-";
  return dayjs(date).format(format);
};

/**
 * Format date with time (e.g. 17 Agustus 1945 10:00)
 * @param {string|Date} date 
 * @returns {string}
 */
export const formatDateTime = (date) => {
  if (!date) return "-";
  return dayjs(date).format("DD MMMM YYYY HH:mm");
};

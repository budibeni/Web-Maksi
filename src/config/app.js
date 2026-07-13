export const APP_NAME = process.env.APP_NAME || "MAKSI";
export const APP_ENV = process.env.APP_ENV || "development";
export const APP_URL = process.env.APP_URL || "http://localhost:3000";

export const isDevelopment = APP_ENV === "development";
export const isProduction = APP_ENV === "production";

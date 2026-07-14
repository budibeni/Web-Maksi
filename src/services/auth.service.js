import axiosInstance from "@/config/axios";

export const login = async (credentials) => {
  const response = await axiosInstance.post("/auth/login", credentials);
  return response.data;
};

export const logout = async () => {
  const response = await axiosInstance.post("/auth/logout");
  return response.data;
};

export const getMe = async () => {
  const response = await axiosInstance.get("/auth/me");
  return response.data;
};

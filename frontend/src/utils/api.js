import axios from "axios";
import { toast } from "react-toastify";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || "";
    const isAuthRequest = requestUrl.includes("/auth/");

    if (isAuthRequest) {
      return Promise.reject(error);
    }

    const message =
      error.response?.data?.message || error.message || "Something went wrong";

    toast.error(message);

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      const isAdminRoute = window.location.pathname.startsWith("/admin");
      window.location.href = isAdminRoute ? "/admin-login" : "/login";
    }

    return Promise.reject(error);
  },
);

export async function submitComplaint(formData) {
  const response = await api.post("/complaints", formData);
  return response.data.data;
}

export default api;

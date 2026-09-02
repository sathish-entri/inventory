import axios from "axios";

let apiBaseUrl = import.meta.env.VITE_API_URL;

if (!apiBaseUrl || apiBaseUrl === "" || apiBaseUrl === "undefined" || !apiBaseUrl.startsWith("http")) {
  apiBaseUrl = "https://inventory-e32g.onrender.com/api/v1";
} else {
  if (apiBaseUrl.endsWith("/")) {
    apiBaseUrl = apiBaseUrl.slice(0, -1);
  }
  if (!apiBaseUrl.includes("/api/v1")) {
    apiBaseUrl = `${apiBaseUrl}/api/v1`;
  }
}

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes("/auth/")) {
      try {
        const { data } = await api.post("/auth/refresh", {});
        localStorage.setItem("accessToken", data.accessToken);
        error.config.headers.Authorization = `Bearer ${data.accessToken}`;
        return api.request(error.config);
      } catch {
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;

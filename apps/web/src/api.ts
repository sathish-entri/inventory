import axios, { type InternalAxiosRequestConfig } from "axios";

let apiBaseUrl = import.meta.env.VITE_API_URL;

if (!apiBaseUrl || apiBaseUrl === "" || apiBaseUrl === "undefined") {
  // In development, default to local Vite proxy; in production, fallback to production URL
  apiBaseUrl = import.meta.env.DEV ? "/api/v1" : "https://inventory-e32g.onrender.com/api/v1";
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

let refreshPromise: Promise<string> | null = null;

api.interceptors.response.use(
  (r) => r,
  async (error: any) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (error.response?.status === 401 && originalRequest && !originalRequest.url?.includes("/auth/") && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = api
            .post("/auth/refresh", {})
            .then(({ data }: { data: any }) => {
              localStorage.setItem("accessToken", data.accessToken);
              return data.accessToken as string;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }
        const newAccessToken = await refreshPromise;
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return api.request(originalRequest);
      } catch (refreshErr) {
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(error);
  },
);

export { api };
export default api;

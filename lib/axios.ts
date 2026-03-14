import axios from "axios";

const api = axios.create({ baseURL: "/api" });

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Call logout endpoint to clear the cookie
      try {
        await axios.post("/api/auth/logout");
      } catch {
        // Ignore logout errors
      }
      // Redirect to login page
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

import axios from "axios";

let axiosAuthInitialized = false;

if (typeof window !== "undefined" && !axiosAuthInitialized) {
  axiosAuthInitialized = true;

  axios.interceptors.request.use(
    (config) => {
      try {
        const token = window.localStorage.getItem("authToken");
        if (token) {
          config.headers = config.headers ?? {};
          if (!config.headers["Authorization"]) {
            config.headers["Authorization"] = `Bearer ${token}`;
          }
        }
      } catch {
        // Ignore storage errors and proceed without auth header
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
}

export {};


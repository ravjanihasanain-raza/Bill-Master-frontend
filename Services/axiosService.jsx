import axios from "axios";


const BASE_URL = "https://localhost:7116/api/"; // change your base URL

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Function to attach auth token
const getAuthHeader = (isAuth) => {
  if (isAuth) {
    const token = localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
    };
  }
};

/* ================= GET ================= */
export const getRequest = async (endpoint, payload = {}, isAuth = false) => {
  try {
    const response = await api.get(endpoint, {
      params: payload,
      headers: {
        ...getAuthHeader(isAuth),
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/* ================= POST ================= */
export const postRequest = async (endpoint, payload = {}, isAuth = false) => {
  try {
    const response = await api.post(endpoint, payload, {
      headers: {
        ...getAuthHeader(isAuth),
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/* ================= PUT ================= */
export const putRequest = async (endpoint, payload = {}, isAuth = false) => {
  try {
    const response = await api.put(endpoint, payload, {
      headers: {
        ...getAuthHeader(isAuth),
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/* ================= PATCH ================= */
export const patchRequest = async (endpoint, payload = {}, isAuth = false) => {
  try {
    const response = await api.patch(endpoint, payload, {
      headers: {
        ...getAuthHeader(isAuth),
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/* ================= DELETE ================= */
export const deleteRequest = async (endpoint, payload = {}, isAuth = false) => {
  try {
    const response = await api.delete(endpoint, {
      data: payload,
      headers: {
        ...getAuthHeader(isAuth),
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

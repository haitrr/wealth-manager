import axios from 'axios';

const API_URL = 'http://localhost:5024';

axios.interceptors.response.use(response => {
  return response;
}, error => {
 if (error.response.status === 401) {
  //place your reentry code
  if(window.location.pathname !== '/login') {
    window.location.href = '/login';
    return
  }
 }
 return error;
});

export const login = async (username: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/authentication`, {
      username,
      password,
    }, { withCredentials: true });

    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error('Login failed');
    }
  } catch (error) {
    throw error;
  }
};

export const getAuthUser = async () => {
  try {
    const response = await axios.get(`${API_URL}/user/me`, { withCredentials: true });

    if (response.status === 200) {
      return response.data;
    }
    else {
      throw new Error('Failed to get auth user');
    }
  } catch (error) {
    throw error;
  }
};

export const logout = async () => {
  try {
    const response = await axios.post(`${API_URL}/authentication/logout`, {}, { withCredentials: true });

    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error('Logout failed');
    }
  } catch (error) {
    throw error;
  }
};

export const getTransactions = async () => {
  try {
    const response = await axios.get(`${API_URL}/transactions`, { withCredentials: true });

    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error('Failed to get transactions');
    }
  } catch (error) {
    throw error;
  }
};

export const getTransactionCategories = async () => {
  try {
    const response = await axios.get(`${API_URL}/transaction-categories`, { withCredentials: true });

    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error('Failed to get transactions');
    }
  } catch (error) {
    throw error;
  }
};
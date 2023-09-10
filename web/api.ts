import axios from 'axios';

const API_URL = 'http://localhost:5024';

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

import axios from 'axios';

const API_URL = 'http://localhost:5024';

export const login = async (username: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/authentication`, {
      username,
      password,
    });

    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error('Login failed');
    }
  } catch (error) {
    throw error;
  }
};

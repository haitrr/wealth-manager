// API utility functions for the wealth manager application
import { Category, Account } from "@prisma/client";

class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`,
      response.status
    );
  }
  return response.json();
};

export const api = {
  // Categories API
  categories: {
    getAll: async (): Promise<Category[]> => {
      try {
        const response = await fetch('/api/categories');
        const data = await handleApiResponse(response);
        return data.categories;
      } catch (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }
    }
  },

  // Accounts API
  accounts: {
    getAll: async (): Promise<Account[]> => {
      try {
        const response = await fetch('/api/accounts');
        const data = await handleApiResponse(response);
        return data.accounts;
      } catch (error) {
        console.error('Error fetching accounts:', error);
        throw error;
      }
    }
  }
};

export { ApiError };

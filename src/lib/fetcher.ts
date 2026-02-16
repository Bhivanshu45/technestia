import axios from 'axios';

export const fetcher = async (url: string) => {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error: any) {
    // Attach extra info to the error object for SWR error handling
    const err = new Error('An error occurred while fetching the data.');
    (err as any).info = error.response?.data;
    (err as any).status = error.response?.status;
    throw err;
  }
};

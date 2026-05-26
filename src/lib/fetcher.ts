import axiosInstance from "@/lib/axios";

export const fetcher = async (url: string) => {
  try {
    const response = await axiosInstance.get(url);
    return response.data;
  } catch (error: any) {
    const apiMessage = error.response?.data?.message;
    const err = new Error(
      apiMessage || error.message || "An error occurred while fetching the data."
    );
    (err as any).info = error.response?.data;
    (err as any).status = error.response?.status;
    throw err;
  }
};
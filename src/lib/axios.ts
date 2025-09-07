import axios from "axios";

// You can customize the baseURL if needed
const instance = axios.create({
	baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || undefined,
	withCredentials: true, // if you need cookies for auth
});

export default instance;

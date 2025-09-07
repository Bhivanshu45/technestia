// Standard fetcher for SWR
import axios from "@/lib/axios";

// Axios-based fetcher for SWR
const fetcher = (url: string) =>
	axios.get(url).then((res) => res.data);

export { fetcher };

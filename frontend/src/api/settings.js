import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;

const BASE = `${API_URL}/settings`;

export const fetchSettings = () => axios.get(BASE);
export const updateSettings = (data) => axios.put(BASE, data);

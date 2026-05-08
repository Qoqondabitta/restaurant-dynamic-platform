import axios from 'axios';

const BASE = `${API_URL}/settings`;

export const fetchSettings = () => axios.get(BASE);
export const updateSettings = (data) => axios.put(BASE, data);

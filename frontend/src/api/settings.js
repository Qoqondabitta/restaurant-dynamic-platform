import axios from 'axios';

const BASE = 'https://restaurant-dynamic-platform.onrender.com/settings';

export const fetchSettings = () => axios.get(BASE);
export const updateSettings = (data) => axios.put(BASE, data);

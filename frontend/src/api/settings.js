import axios from 'axios';

const BASE = 'http://localhost:5000/settings';

export const fetchSettings = () => axios.get(BASE);
export const updateSettings = (data) => axios.put(BASE, data);

import axios from 'axios';
import.meta.env.VITE_API_URL

const BASE = `${API_URL}/categories`;

export const fetchCategories = () => axios.get(BASE);
export const createCategory = (data) => axios.post(BASE, data);
export const updateCategory = (id, data) => axios.put(`${BASE}/${id}`, data);
export const deleteCategory = (id) => axios.delete(`${BASE}/${id}`);

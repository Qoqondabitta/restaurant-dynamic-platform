import axios from 'axios';

const BASE = 'https://restaurant-dynamic-platform.onrender.com/categories';

export const fetchCategories = () => axios.get(BASE);
export const createCategory = (data) => axios.post(BASE, data);
export const updateCategory = (id, data) => axios.put(`${BASE}/${id}`, data);
export const deleteCategory = (id) => axios.delete(`${BASE}/${id}`);

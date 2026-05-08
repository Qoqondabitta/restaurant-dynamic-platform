import axios from 'axios';

const BASE = 'https://restaurant-dynamic-platform.onrender.com/discounts';

export const fetchDiscounts = () => axios.get(BASE);

export const addDiscount = (data) => axios.post(BASE, data);

export const updateDiscount = (id, data) => axios.put(`${BASE}/${id}`, data);

export const deleteDiscount = (id) => axios.delete(`${BASE}/${id}`);

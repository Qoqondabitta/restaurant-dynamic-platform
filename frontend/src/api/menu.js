import axios from 'axios';

const BASE = 'http://localhost:5000/menu';

export const fetchMenu = () => axios.get(BASE);

export const addMenuItem = (formData) =>
  axios.post(BASE, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const updateMenuItem = (id, formData) =>
  axios.put(`${BASE}/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const deleteMenuItem = (id) => axios.delete(`${BASE}/${id}`);

// Resolve image src: local /uploads/* is proxied; external URLs pass through
export const resolveImage = (image) => {
  if (!image) return 'https://placehold.co/600x400/141414/c9a84c?text=No+Image';
  return image; // both /uploads/... (proxied) and https://... work
};

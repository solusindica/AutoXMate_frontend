// src/services/templateService.ts

 import axios from '../api/axios'
import { Template } from '../types';

export const getAllTemplates = async (): Promise<Template[]> => {
  const response = await axios.get('/templates/meta');
  return response.data.data || []; // ✅ fix: only return the array
};

export const createTemplateInMeta = async (template: any): Promise<any> => {
  const response = await axios.post('/templates/create-meta', template);
  return response.data;
};




// export const uploadImageToMeta = async (file: File): Promise<string> => {
//   const formData = new FormData();
//   formData.append('file', file);

//   const res = await axios.post('/media/upload', formData);  // ✅ local backend route
//   return res.data.media_id;  // ✅ assuming backend responds with { media_id: 'xyz' }
// };;

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const uploadImageToMeta = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await axios.post(`${API_BASE}/media/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return res.data.media_id;
};

  
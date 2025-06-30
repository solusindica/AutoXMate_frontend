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




export const uploadImageToMeta = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await axios.post('/media/upload', formData);  // ✅ local backend route
  return res.data.media_id;  // ✅ assuming backend responds with { media_id: 'xyz' }
};;

  
import axios from '../api/axios';

export const uploadImageToMeta = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post('https://autoxmate-backend.onrender.com/media/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data.id; // this is media_id (header_handle)
};
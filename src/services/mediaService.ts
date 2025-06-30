import axios from '../api/axios';

export const uploadImageToMeta = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post('/upload-media', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data.id; // this is media_id (header_handle)
};
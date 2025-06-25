import axios from 'axios';

export default axios.create({
  baseURL: 'https://autoxmate-backend.onrender.com', 
  headers: {
    'Content-Type': 'application/json',
  },
});
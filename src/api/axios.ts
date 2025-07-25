
import axios, { AxiosRequestConfig } from 'axios';

// const instance = axios.create({
//   baseURL: 'https://autoxmate-backend.onrender.com',
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// export default instance;


const instance = axios.create({
  baseURL: 'https://autoxmate-backend-khzt.onrender.com',  // Changed to localhost
  headers: {
    'Content-Type': 'application/json',
  },
});
export default instance;

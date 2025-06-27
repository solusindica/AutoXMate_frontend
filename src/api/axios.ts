// import axios from '../api/axios';

// export default axios.create({
//   baseURL: 'http://localhost:8000', 
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });


import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://autoxmate-backend.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default instance;
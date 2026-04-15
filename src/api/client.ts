import axios from 'axios';
import { API_URL } from '../constants';

const client = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.message ??
      (err.code === 'ECONNABORTED' ? 'La requête a expiré.' : 'Erreur réseau.');
    return Promise.reject(new Error(message));
  }
);

export default client;

import axios, { AxiosError } from 'axios';

export const client = axios.create({
  baseURL: '/api',
});

client.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<any>) => {
    const resMessage = error.response?.data?.message;
    if (typeof resMessage === 'string') {
      error.message = resMessage;
    }
    return Promise.reject(error);
  }
);

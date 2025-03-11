import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import axios from 'axios';
import './assets/styles.css';


const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000',
});

axios.defaults.baseURL = process.env.VUE_APP_API_URL;

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const app = createApp(App);

app.config.globalProperties.$axios = axiosInstance;

app.use(router).mount('#app');
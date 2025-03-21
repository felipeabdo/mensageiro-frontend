import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import axios from 'axios';
import './assets/styles.css';

// Configuração global do Axios
axios.defaults.baseURL = 'http://127.0.0.1:3000';

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const app = createApp(App);

// Adiciona o Axios globalmente
app.config.globalProperties.$axios = axios;

app.use(router).mount('#app');
import { createRouter, createWebHistory } from 'vue-router';
import Login from '@/components/Login.vue';
import Messages from '@/components/Messages.vue';
import Chat from '@/components/Chat.vue';

const routes = [
  { path: '/', component: Login },
  { path: '/messages', component: Messages },
  { path: '/chat/:userId', component: Chat }, 
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
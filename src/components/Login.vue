<template>
  <div>
    <input v-model="userId" placeholder="User ID" />
    <button @click="login">Login</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      userId: '',
    };
  },
  methods: {
    async login() {
      try {
        const response = await this.$axios.post('/api/v1/login', { user_id: this.userId });
        localStorage.setItem('token', response.data.token);
        this.$router.push('/messages');
      } catch (error) {
        console.error('Erro ao fazer login:', error);
      }
    },
  },
};
</script>
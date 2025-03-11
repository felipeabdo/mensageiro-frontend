<template>
  <div>
    <h2>Messages</h2>
    <div v-if="currentUser">
      Logado como: <strong>{{ currentUser.name }}</strong>
    </div>
    <button @click="logout">Logout</button>

    <div class="user-list">
      <select v-model="selectedUserId" @change="checkConversation">
        <option value="">Selecione um usuário</option>
        <option v-for="user in users" :key="user.id" :value="user.id">{{ user.name }}</option>
      </select>
      <button @click="goToChat" :disabled="!selectedUserId || isLoading">
        {{ buttonText }}
      </button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      users: [],
      currentUser: null,
      selectedUserId: null,
      hasConversation: false,
      isLoading: false,
    };
  },
  computed: {
    buttonText() {
      if (this.isLoading) {
        return "Carregando...";
      } else if (!this.selectedUserId) {
        return "Escolha um usuário";
      } else if (this.hasConversation) {
        return "Continuar Bate-Papo";
      } else {
        return "Iniciar Bate-Papo";
      }
    },
  },
  async created() {
    await this.loadCurrentUser();
    await this.loadUsers();
  },
  methods: {
    async loadUsers() {
      try {
        const token = localStorage.getItem('token');
        const response = await this.$axios.get('/api/v1/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        this.users = response.data;
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
      }
    },
    async loadCurrentUser() {
      try {
        const token = localStorage.getItem('token');
        const response = await this.$axios.get('/api/v1/current_user', {
          headers: { Authorization: `Bearer ${token}` },
        });
        this.currentUser = response.data;
      } catch (error) {
        console.error('Erro ao carregar usuário atual:', error);
      }
    },
    async checkConversation() {
      if (this.selectedUserId) {
        this.isLoading = true;
        try {
          const token = localStorage.getItem('token');
          const response = await this.$axios.get('/api/v1/messages', {
            headers: { Authorization: `Bearer ${token}` },
            params: { user_id: this.selectedUserId },
          });
          this.hasConversation = response.data.length > 0;
        } catch (error) {
          console.error('Erro ao verificar conversas:', error);
        } finally {
          this.isLoading = false;
        }
      } else {
        this.hasConversation = false;
      }
    },
    async logout() {
      try {
        localStorage.removeItem('token');
        this.$router.push('/');
      } catch (error) {
        console.error('Erro ao fazer logout:', error);
      }
    },
    async goToChat() {
      if (this.selectedUserId) {
        this.$router.push(`/chat/${this.selectedUserId}`);
      } else {
        alert("Selecione um usuário para iniciar o bate-papo.");
      }
    },
  },
};
</script>

<style scoped>
.user-list {
  margin-top: 20px;
  display: flex;
  gap: 10px;
  align-items: center;
}

select {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

button {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

button:hover {
  background-color: #0056b3;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>
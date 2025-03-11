<template>
  <div>
    <h2>Bate-Papo com {{ otherUser?.name }}</h2>
    <button @click="goBack">Voltar</button>
    <button @click="toggleConversationTooltip">Apagar Conversa</button>

    <div class="messages-container">
      <div
        v-for="message in messages"
        :key="message.id"
        class="message-wrapper"
        :class="{
          'wrapper-right': message.sender_id === currentUser?.id,
          'wrapper-left': message.sender_id !== currentUser?.id
        }"
        @mouseover="hoveredMessageId = message.id"
        @mouseleave="hoveredMessageId = null"
      >
        <div class="message-container">
          <div 
            class="action-icon"
            :class="{
              'visible': hoveredMessageId === message.id && showDeleteTooltip !== message.id,
              'left': message.sender_id === currentUser?.id,
              'right': message.sender_id !== currentUser?.id
            }"
            @click.stop="showDeleteOptions(message.id)"
          >
            <div class="dots-container">
              <span class="dot"></span>
              <span class="dot"></span>
              <span class="dot"></span>
            </div>
          </div>

          <div 
            class="message-content"
            :class="{
              'message-right': message.sender_id === currentUser?.id,
              'message-left': message.sender_id !== currentUser?.id,
              'deleted-message': showDeletedMessage(message)
            }"
          >
            <strong>{{ message.sender?.name }}:</strong>
            <p v-if="message.deleted_for_all">Mensagem apagada</p>
            <p v-else-if="isDeletedForCurrentUser(message)">
              {{ getDeletedMessageText(message) }}
            </p>
            <p v-else>{{ message.content }}</p>
          </div>
        </div>

        <div 
          v-if="showDeleteTooltip === message.id"
          class="delete-tooltip"
          :class="{
            'tooltip-right': message.sender_id === currentUser?.id,
            'tooltip-left': message.sender_id !== currentUser?.id
          }"
        >
          <template v-if="isMessageDeleted(message)">
            <button @click="restoreMessage(message.id)">↩️ Restaurar</button>
            <!-- Mostrar "Apagar Definitivo" apenas se for o remetente -->
            <button 
              v-if="message.sender_id === currentUser?.id"
              @click="deleteMessage(message.id, 'permanent')"
            >
              🗑️ Apagar Definitivo
            </button>
          </template>
          
          <template v-else>
            <template v-if="message.sender_id === currentUser?.id">
              <button @click="deleteMessage(message.id, 'all')">🌍 Apagar para Todos</button>
              <button @click="deleteMessage(message.id, 'me')">👤 Apagar para Mim</button>
            </template>
            <button v-else @click="deleteMessage(message.id, 'me')">👤 Apagar para Mim</button>
          </template>
        </div>
      </div>
    </div>

    <div class="message-input">
      <input
        v-model="newMessage"
        placeholder="Digite uma mensagem"
        @keypress.enter="sendMessage"
      />
      <button @click="sendMessage">Enviar</button>
    </div>

    <div 
      v-if="showDeleteConversationTooltip" 
      class="conversation-tooltip"
      @click.stop
    >
      <button @click.stop="handleConversationDelete('all')">Apagar para todos</button>
      <button @click.stop="handleConversationDelete('me')">Apagar para mim</button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      messages: [],
      newMessage: '',
      currentUser: null,
      otherUser: null,
      showDeleteTooltip: null,
      showDeleteConversationTooltip: false,
      hoveredMessageId: null,
    };
  },
  computed: {
      sortedMessages() {
        return [...this.messages].sort((a, b) => 
          new Date(a.created_at) - new Date(b.created_at)
        );
      }
    },
    async created() {
      await this.loadCurrentUser();
      await this.loadOtherUser();
      await this.loadMessages();
    },
  methods: {
    isMessageDeleted(message) {
      return message.deleted_for_all || 
        (message.sender_id === this.currentUser?.id && message.deleted_for_sender) ||
        (message.receiver_id === this.currentUser?.id && message.deleted_for_receiver);
    },

    showDeleteOptions(messageId) {
      this.showDeleteTooltip = this.showDeleteTooltip === messageId ? null : messageId;
    },

    showDeletedMessage(message) {
      return message.deleted_for_all || 
        (message.sender_id === this.currentUser?.id && message.deleted_for_sender) ||
        (message.receiver_id === this.currentUser?.id && message.deleted_for_receiver);
    },

    isDeletedForCurrentUser(message) {
      return (message.sender_id === this.currentUser?.id && message.deleted_for_sender) ||
             (message.receiver_id === this.currentUser?.id && message.deleted_for_receiver);
    },

    getDeletedMessageText(message) {
      if (message.deleted_for_all) return "Mensagem apagada";
      if (message.sender_id === this.currentUser?.id) return "Mensagem apagada só para você";
      return "Mensagem removida";
    },

    async loadCurrentUser() {
      console.log('[FRONT] Carregando usuário atual...');
      try {
        const token = localStorage.getItem('token');
        const response = await this.$axios.get('/api/v1/current_user', {
          headers: { Authorization: `Bearer ${token}` },
        });
        this.currentUser = response.data;
        console.log('[FRONT] Usuário atual carregado:', this.currentUser);
      } catch (error) {
        console.error('[FRONT] Erro ao carregar usuário:', error);
      }
    },

    async loadOtherUser() {
      console.log('[FRONT] Carregando outro usuário...');
      try {
        const userId = this.$route.params.userId;
        const token = localStorage.getItem('token');
        const response = await this.$axios.get(`/api/v1/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        this.otherUser = response.data;
        console.log('[FRONT] Outro usuário carregado:', this.otherUser);
      } catch (error) {
        console.error('[FRONT] Erro ao carregar contato:', error);
      }
    },

    async loadMessages() {
      console.log('[FRONT] Iniciando carregamento de mensagens...');
      try {
        const params = {
          user_id: this.otherUser?.id,
          _: Date.now()
        };
        
        console.log('[FRONT] Parâmetros da requisição:', params);
        const token = localStorage.getItem('token');
        const response = await this.$axios.get('/api/v1/messages', {
          headers: { Authorization: `Bearer ${token}` },
          params
        });

        console.log('[FRONT] Resposta da API:', {
          status: response.status,
          headers: response.headers,
          data: response.data
        });

        this.messages = response.data;
        console.log('[FRONT] Mensagens atualizadas:', this.messages.length);
        
        this.messages.forEach((msg, index) => {
          console.log(`[FRONT] Mensagem ${index + 1}:`, {
            id: msg.id,
            content: msg.content,
            sender: msg.sender?.id,
            receiver: msg.receiver?.id,
            deleted_for_all: msg.deleted_for_all,
            deleted_for_sender: msg.deleted_for_sender,
            deleted_for_receiver: msg.deleted_for_receiver
          });
        });
      } catch (error) {
        console.error('[FRONT] Erro ao carregar mensagens:', {
          message: error.message,
          response: error.response?.data,
          stack: error.stack
        });
        this.messages = [];
      }
    },

    async sendMessage() {
      console.log('[FRONT] Iniciando envio de mensagem...');
      try {
        if (!this.newMessage.trim() || !this.otherUser) {
          console.warn('[FRONT] Mensagem vazia ou usuário não definido');
          return;
        }

        const payload = {
          message: {
            content: this.newMessage,
            receiver_id: this.otherUser.id
          }
        };
        console.log('[FRONT] Payload de envio:', payload);

        const token = localStorage.getItem('token');
        const response = await this.$axios.post('/api/v1/messages', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('[FRONT] Resposta do envio:', response.data);
        this.newMessage = '';
        await this.loadMessages();
      } catch (error) {
        console.error('[FRONT] Erro no envio:', {
          message: error.message,
          response: error.response?.data,
          stack: error.stack
        });
      }
    },

    async deleteMessage(messageId, deleteFor) {
      try {
        const token = localStorage.getItem('token');
        
        await this.$axios.delete(`/api/v1/messages/${messageId}`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { delete_for: deleteFor }
        });
        
        if (deleteFor === 'permanent') {
          this.messages = this.messages.filter(msg => msg.id !== messageId);
        } else {
          await this.loadMessages();
        }
        
        this.showDeleteTooltip = null;
      } catch (error) {
        console.error('Erro ao apagar:', {
          message: error.message,
          response: error.response?.data
        });
      }
    },

    async restoreMessage(messageId) {
      try {
        const token = localStorage.getItem('token');
        await this.$axios.post(`/api/v1/messages/${messageId}/restore`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.showDeleteTooltip = null;
        await this.loadMessages();
      } catch (error) {
        console.error('Erro ao restaurar:', error);
      }
    },

    toggleConversationTooltip(event) {
      console.log('[FRONT] Alternando tooltip de conversa');
      event.stopPropagation();
      this.showDeleteConversationTooltip = !this.showDeleteConversationTooltip;
    },

    async handleConversationDelete(deleteFor) {
      console.log('[FRONT] Excluindo conversa:', deleteFor);
      try {
        const token = localStorage.getItem('token');
        const response = await this.$axios.delete(`/api/v1/conversations/${this.otherUser.id}`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { delete_for: deleteFor }
        });
        
        console.log('[FRONT] Resposta da exclusão da conversa:', response.data);
        await this.loadMessages();
        this.showDeleteConversationTooltip = false;
        this.$router.push('/messages');
      } catch (error) {
        console.error('[FRONT] Erro ao excluir conversa:', error);
      }
    },

    goBack() {
      console.log('[FRONT] Voltando para mensagens');
      this.$router.push('/messages');
    },

    handleClickOutside(event) {
      const isTooltip = event.target.closest('.conversation-tooltip, .delete-tooltip');
      if (!isTooltip) {
        this.showDeleteTooltip = null;
        this.showDeleteConversationTooltip = false;
      }
    },

    handleEscapeKey(event) {
      if (event.key === 'Escape') {
        this.showDeleteTooltip = null;
        this.showDeleteConversationTooltip = false;
      }
    }
  },
  mounted() {
    document.addEventListener('click', this.handleClickOutside);
    document.addEventListener('keydown', this.handleEscapeKey);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
    document.removeEventListener('keydown', this.handleEscapeKey);
  },
};
</script>

<style scoped>
.messages-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 20px;
}

.message-wrapper {
  position: relative;
  min-height: 40px;
  width: 100%;
}

.wrapper-right {
  display: flex;
  justify-content: flex-end;
}

.wrapper-left {
  display: flex;
  justify-content: flex-start;
}

.message-container {
  position: relative;
  display: flex;
  align-items: center;
  max-width: 80%;
  padding: 5px 0;
}

.action-icon {
  position: absolute;
  cursor: pointer;
  width: 30px;
  height: 30px;
  background-color: #e0e0e0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 2;
  top: 50%;
  transform: translateY(-50%);
}

.action-icon.visible {
  opacity: 1;
}

.action-icon.left {
  left: -40px;
}

.action-icon.right {
  right: -40px;
}

.message-container:hover .action-icon {
  opacity: 1;
}

.message-content {
  padding: 15px 15px 0px 15px;
  border-radius: 15px;
  position: relative;
  z-index: 1;
  max-width: 100%;
  word-break: break-word;
}

.message-right {
  background-color: #42d129;
  color: #ffffff;
}

.message-left {
  background-color: #007BFF;
  color: #ffffff;
}

.dots-container {
  display: flex;
  gap: 3px;
}

.dot {
  width: 4px;
  height: 4px;
  background-color: #333;
  border-radius: 50%;
}

.deleted-message {
  background-color: #f1f1f1 !important;
  color: black !important;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 15px;
  border: 1px dashed #ccc !important;
  position: relative;
  z-index: 1;
}

.message-input {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  align-items: baseline;
}

input {
  flex: 1;
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
  margin-right: 10px;
}

button:hover {
  background-color: #0056b3;
}

.delete-tooltip {
  position: absolute;
  z-index: 3;
  top: 100%;
  background: white;
  border: 1px solid #ccc;
  padding: 5px;
  border-radius: 4px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.delete-tooltip button {
  padding: 8px 12px;
  margin: 2px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  transition: all 0.2s;
  color: black;
}

.delete-tooltip button:hover {
  background: #e9ecef;
  transform: translateY(-1px);
}

.delete-tooltip button:active {
  transform: translateY(0);
}

.tooltip-right {
  right: 0;
}

.tooltip-left {
  left: 0;
}

.conversation-tooltip {
  position: absolute;
  top: 106px;
  left: 380px;
  transform: translate(-50%, -50%) scale(1.5);
  border: 1px solid #ccc;
  padding: 4px;
  border-radius: 4px;
  z-index: 99999;
  display: flex;
  gap: 5px;
}

.conversation-tooltip button {
  padding: 3px 4px;
  background-color: #f8f8f8;
  border: 1px solid #ddd;
  border-radius: 3px;
  cursor: pointer;
  font-size: 7px;
  color: black;
  margin-right: 0;
}

.conversation-tooltip button:hover {
  background-color: #eee;
}
</style>
import { create } from 'zustand';
import { useDiscordStore } from './useDiscordStore';
import { ServerToClientMessage, User } from '../../../shared/types';

interface WebSocketState {
  socket: WebSocket | null;
  spectators: User[];
  connectSocket: () => void;
}

export const useWebSocketStore = create<WebSocketState>((set) => ({
  socket: null,
  spectators: [],

  connectSocket: () => {
    const { auth } = useDiscordStore.getState();
    if (!auth) {
      console.warn('WebSocket tried to connect before auth was ready');
      return;
    }

    const socket = new WebSocket('/.proxy/api/ws');

    socket.onopen = () => {
      console.log('✅ WebSocket connected');
      socket.send(
        JSON.stringify({
          type: 'join',
          user: {
            id: auth.user.id,
            username: auth.user.username,
            avatar: auth.user.avatar,
          },
        }),
      );
    };

    socket.onmessage = (e) => {
      const msg: ServerToClientMessage = JSON.parse(e.data);
      console.log('📃 WebSocket message:', msg);

      if (msg.type === 'spectators') {
        set({ spectators: msg.users });
      }
    };

    socket.onclose = () => {
      console.log('❌ WebSocket disconnected');
      set({ socket: null });
    };

    socket.onerror = (err) => {
      console.error('⚠️ WebSocket error', err);
    };

    set({ socket });
  },
}));

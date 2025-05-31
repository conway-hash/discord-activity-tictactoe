import { create } from 'zustand';
import { useDiscordStore } from './useDiscordStore';
import {
  ServerToClientMessage,
  User,
  ClientToServerMessage,
  GameState,
} from '../../../shared/types';

interface WebSocketState {
  socket: WebSocket | null;
  spectators: User[];
  playerOne: User | null;
  playerTwo: User | null;
  board: string[];
  gameState: GameState;

  connectSocket: () => void;
  requestPlayerUpdate: () => void;
  requestBoardUpdate: (idx: number) => void;
}

export const useWebSocketStore = create<WebSocketState>((set) => ({
  socket: null,
  spectators: [],
  playerOne: null,
  playerTwo: null,
  gameState: 'waiting',
  board: ['', '', '', '', '', '', '', '', ''],

  connectSocket: () => {
    const { auth } = useDiscordStore.getState();
    if (!auth) {
      console.warn('WebSocket tried to connect before auth was ready');
      return;
    }

    const socket = new WebSocket('/.proxy/api/ws');

    socket.onopen = () => {
      console.log('✅ WebSocket connected');

      const message: ClientToServerMessage = {
        type: 'requestConnect',
        user: {
          id: auth.user.id,
          username: auth.user.username,
          avatar: auth.user.avatar || undefined,
          isSpectator: true,
        },
      };
      socket.send(JSON.stringify(message));
    };

    socket.onmessage = (e) => {
      const msg: ServerToClientMessage = JSON.parse(e.data);
      console.log('📃 WebSocket message:', msg);

      if (msg.type === 'responseState') {
        const spectatorsOnly = msg.users.filter((user) => user.isSpectator === true);
        set({ spectators: spectatorsOnly });
        set({ playerOne: msg.playerOne, playerTwo: msg.playerTwo });
        set({ board: msg.board });
        set({ gameState: msg.gameState });
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

  requestPlayerUpdate: () => {
    const { socket } = useWebSocketStore.getState();

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket is not connected, cannot requestPlayerUpdate');
      return;
    }
    const message: ClientToServerMessage = { type: 'requestPlayerUpdate' };
    socket.send(JSON.stringify(message));
  },

  requestBoardUpdate: (idx) => {
    const { socket } = useWebSocketStore.getState();

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket is not connected, cannot requestBoardUpdate');
      return;
    }
    const message: ClientToServerMessage = { type: 'requestBoardUpdate', index: idx };
    socket.send(JSON.stringify(message));
  },
}));

import { create } from 'zustand';
import { DiscordSDK } from '@discord/embedded-app-sdk';
import { AuthenticateResponse } from '../../../shared/types';

interface DiscordState {
  discordSdk: DiscordSDK | null;
  auth: AuthenticateResponse | null;
  initDiscord: () => Promise<void>;
}

export const useDiscordStore = create<DiscordState>((set) => ({
  discordSdk: null,
  auth: null,

  initDiscord: async () => {
    const discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);
    await discordSdk.ready();

    const { code } = await discordSdk.commands.authorize({
      client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
      response_type: 'code',
      state: '',
      prompt: 'none',
      scope: ['identify', 'guilds', 'applications.commands'],
    });

    const tokenRes = await fetch('/.proxy/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    const { access_token } = await tokenRes.json();
    const auth = await discordSdk.commands.authenticate({ access_token });

    if (!auth) throw new Error('Failed to authenticate with Discord');

    set({ discordSdk, auth });
  },
}));

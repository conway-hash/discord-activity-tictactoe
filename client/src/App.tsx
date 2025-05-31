import { useEffect } from 'react';
import { useDiscordStore } from './store/useDiscordStore';
import { useWebSocketStore } from './store/useWebSocketStore';
import Landing from './Landing';

function App() {
  const initDiscord = useDiscordStore((s) => s.initDiscord);
  const connectSocket = useWebSocketStore((s) => s.connectSocket);

  useEffect(() => {
    (async () => {
      await initDiscord();
      connectSocket();
    })();
  }, []);

  return <Landing />;
}

export default App;

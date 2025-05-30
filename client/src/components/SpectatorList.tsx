import { useWebSocketStore } from '../store/useWebSocketStore';

const SpectatorList = () => {
  const spectators = useWebSocketStore((state) => state.spectators);

  return (
    <div>
      {spectators.map((user, idx) => (
        <div key={idx}>
          <img
            src={
              user.avatar
                ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp?size=128`
                : 'https://cdn.discordapp.com/embed/avatars/0.png'
            }
            alt={`${user.username}'s avatar`}
            style={{ width: '32px', height: '32px', borderRadius: '50%' }}
          />
          {user.username}
        </div>
      ))}
    </div>
  );
};

export default SpectatorList;

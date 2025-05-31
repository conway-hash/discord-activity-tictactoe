import { useWebSocketStore } from '../store/useWebSocketStore';

const SpectatorList = () => {
  const spectators = useWebSocketStore((state) => state.spectators);

  return (
    <div className="flex flex-col items-center justify-center bg-yellow p-1 gap-1 rounded-md flex-shrink-0">
      <div className="flex items-center justify-center p-1 flex-shrink-0 text-2xl">👀</div>
      {spectators.length > 0 && (
        <div className="flex flex-col items-center justify-center gap-1 p-1 bg-black rounded-md flex-shrink-0">
          {spectators.map((user, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <img
                className="w-8 h-8 rounded-full"
                src={
                  user.avatar
                    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp?size=128`
                    : 'https://cdn.discordapp.com/embed/avatars/0.png'
                }
                alt={`${user.username}'s avatar`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SpectatorList;

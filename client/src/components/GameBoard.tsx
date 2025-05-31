import { useDiscordStore } from '../store/useDiscordStore';
import { useWebSocketStore } from '../store/useWebSocketStore';
import Button from './Button';

function GameBoard() {
  const { auth } = useDiscordStore.getState();

  const playerOne = useWebSocketStore((state) => state.playerOne);
  const playerTwo = useWebSocketStore((state) => state.playerTwo);
  const board = useWebSocketStore((state) => state.board);
  const gameState = useWebSocketStore((state) => state.gameState);

  const requestPlayerUpdate = useWebSocketStore((s) => s.requestPlayerUpdate);
  const requestBoardUpdate = useWebSocketStore((s) => s.requestBoardUpdate);

  const renderGameState = () => {
    if (gameState === 'waiting') return 'Game State: Waiting for players';
    if (gameState === 'playing') return 'Game State: In Progress';
    if (gameState === 'draw') return 'Game State: Finished - Draw';
    if (gameState === 'finished') {
      const totalMoves = board.filter((c) => c !== '').length;
      const winner = totalMoves % 2 === 1 ? playerOne?.username : playerTwo?.username;
      return `Game State: Finished - Winner: ${winner ?? 'Unknown'}`;
    }

    return `Game State: ${gameState}`;
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-1">
        <div className="flex flex-col gap-1">
          <Button
            disabled={
              !!playerOne &&
              !!playerTwo &&
              auth?.user.id !== playerOne.id &&
              auth?.user.id !== playerTwo.id
            }
            content={
              auth?.user.id === playerOne?.id || auth?.user.id === playerTwo?.id
                ? 'Leave Game'
                : 'Join Game'
            }
            onClick={requestPlayerUpdate}
          />
          <div className="grid grid-cols-3 grid-rows-3 gap-1 p-1 bg-yellow rounded-md">
            {board.map((cell, idx) => (
              <div
                key={idx}
                onClick={() => {
                  if (
                    cell === '' &&
                    ((auth?.user.id === playerOne?.id &&
                      board.filter((c) => c !== '').length % 2 === 0) ||
                      (auth?.user.id === playerTwo?.id &&
                        board.filter((c) => c !== '').length % 2 === 1)) &&
                    gameState === 'playing'
                  ) {
                    requestBoardUpdate(idx);
                  }
                }}
                className="w-20 h-20 flex justify-center items-center bg-black rounded-md font-extrabold text-6xl text-yellow"
              >
                {cell}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1 text-black">
          <div className="flex items-center justify-center gap-1 p-1 bg-yellow rounded-md flex-1 w-40">
            <div className="flex flex-col items-center justify-between w-full">
              <img
                className="w-16 h-16 rounded-full"
                src={
                  playerOne && playerOne.avatar
                    ? `https://cdn.discordapp.com/avatars/${playerOne.id}/${playerOne.avatar}.webp?size=128`
                    : 'https://cdn.discordapp.com/embed/avatars/0.png'
                }
                alt={`${playerOne?.username || 'Unknown'}'s avatar`}
              />
              <span>{`${playerOne?.username || 'Player One'}`}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1 p-1 bg-yellow rounded-md flex-1 w-40">
            <div className="flex flex-col items-center justify-between w-full">
              <img
                className="w-16 h-16 rounded-full"
                src={
                  playerTwo && playerTwo.avatar
                    ? `https://cdn.discordapp.com/avatars/${playerTwo.id}/${playerTwo.avatar}.webp?size=128`
                    : 'https://cdn.discordapp.com/embed/avatars/0.png'
                }
                alt={`${playerTwo?.username || 'Unknown'}'s avatar`}
              />
              <span>{`${playerTwo?.username || 'Player Two'}`}</span>
            </div>
          </div>
        </div>
      </div>
      <Button disabled={true} content={renderGameState()} onClick={requestPlayerUpdate} />
    </div>
  );
}

export default GameBoard;

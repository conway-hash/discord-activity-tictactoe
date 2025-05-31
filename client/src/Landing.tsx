import SpectatorList from './components/SpectatorList';
import GameBoard from './components/GameBoard';
import Button from './components/Button';
import { useDiscordStore } from './store/useDiscordStore';

function Landing() {
  const auth = useDiscordStore((s) => s.auth);

  return (
    <div className="font-inter bg-black text-white min-h-dvh min-w-dvw flex justify-center items-center p-2">
      {auth ? (
        <>
          <div className="flex flex-col gap-2">
            <Button content="⚙️" />
            <SpectatorList />
          </div>

          <div className="flex flex-col w-full gap-4">
            <h1 className="flex justify-center items-center font-bold text-6xl">Tic-Tac-Toe</h1>
            <div className="flex flex-1 justify-center items-center">
              <GameBoard />
            </div>
          </div>
        </>
      ) : (
        <div>LOADING...</div>
      )}
    </div>
  );
}

export default Landing;

import { useState, type SetStateAction } from 'react';
import './App.css'

import { Board } from './components/Game/Board';
import type { StagedTile } from './components/Game/Game';
import { InputPanel } from './components/Game/InputPanel';
import type { Letter } from './types/game';
import { RightPanel } from './components/Game/RightPanel';
import type { User } from './types/room';

const App = () => {
  const [stagedTiles, setStagedTiles] = useState<StagedTile[]>([]);
  const [hand, setHand] = useState<Letter[]>(['A', 'B', 'C', 'Q', 'D', 'E', 'Z']);
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);

  const removeStagedTile = (row: number, col: number) => {
    setStagedTiles(prev => prev.filter(t => !(t.row === row && t.col === col)));
  };

  const addStagedTile = (row: number, col: number) => {
    if (!selectedLetter) return;
    setStagedTiles(prev => [...prev, { row, col, letter: selectedLetter }]);
    setHand(prev => {
      const idx = prev.indexOf(selectedLetter);
      if (idx === -1) return prev;
      return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
    });
    setSelectedLetter(null);
  };

  return (
    <div className="main h-dvh w-dvw flex justify-center bg-[#16161E] 0 overflow-y-scroll">
      <div className="flex items-center justify-center lg:justify-normal lg:mt-3 border-box flex-col min-w-full min-h-full">
        <div className="flex lg:flex-row flex-col w-full md:max-w-3xl lg:max-w-4xl md:self-center lg:self-center self-end lg:h-auto h-full">
          <div className="bg-[#3C3C4B] rounded-sm w-full p-3 lg:flex-1 flex gap-4 lg:justify-center  items-center lg:items-start">
            <RightPanel
              className={''}
              user={{ id: "asdfga", name: "test" } as User}
              opponent={{ id: "asdfga", name: "test" } as User}
              myTurn={false}
            />
          </div>
          <div id="board" className="w-full lg:h-full lg:mt-0 md:mt-0">
            <Board
              className={''}
              stagedTiles={stagedTiles}
              setStagedTiles={setStagedTiles}
            />
            <div id="input" className="bg-[#2C2C38] w-full p-1 lg:flex-6 lg:mt-0 mt-auto border-box ">
              <div className="bg-red-500  flex border-box *:bg-yellow-500 justify-between items-center text-center  ">
                <InputPanel
                  hand={hand}
                  removeStagedTile={removeStagedTile}
                  setHand={setHand}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
import { useState } from "react";
import type { User } from "../types/room";
import { Board } from "./Game/Board";
import { Game, type StagedTile } from "./Game/Game";
import { InputPanel } from "./Game/InputPanel";
import { RightPanel } from "./Game/RightPanel";
import type { Letter } from "../types/game";

export function TestGame() {
    const [hand, setHand] = useState<Letter[]>(['A', 'B', 'C', 'Q', 'D', 'E', 'Z']);
    const [stagedTiles, setStagedTiles] = useState<StagedTile[]>([]);

    const [myTurn] = useState(true);
    //Staged tiles are the temporary tiles placed on the board by the client.
    const removeStagedTile = (row: number, col: number) => {
        setStagedTiles(prev =>
            prev.filter(t => !(t.row === row && t.col === col))
        );
    };
    const addStagedTile = (row: number, col: number) => {

    }

    const makeMove = () => {

        //Shouldn't be called if it isn't the players turn

        //Check staged tiles. 
        //Client-side validation
        //1) Is it adjacent to another word, or is it adjacent to the star (first word)
        //2) Is it a valid word (use a trie)

        //Left -> Right
        //Up -> Down
    }
    return (
        <div className="main h-dvh w-dvw flex justify-center bg-[#16161E] 0 overflow-y-scroll">


            <div className="flex items-center justify-center lg:justify-normal  lg:mt-3 border-box flex-col min-w-full min-h-full">
                <div className="flex lg:flex-row flex-col w-full md:max-w-3xl lg:max-w-[66rem] md:self-center lg:self-center self-end lg:h-auto h-full">
                    <div className="bg-[#3C3C4B]  rounded-sm w-full p-3 lg:flex-1 flex gap-4 lg:justify-center  items-center lg:items-start lg:min-w-sm lg:overflow-scroll ">
                        <RightPanel
                            className={''}
                            user={{ id: "asdfga", name: "test" } as User}
                            opponent={{ id: "asdfga", name: "test" } as User}
                            myTurn={myTurn || false}
                        />
                    </div>
                    <div id="board" className="w-full lg:h-full lg:mt-0 md:mt-0 lg:flex-3 aspect-square">
                        <Board
                            className={''}
                            stagedTiles={stagedTiles}
                            setStagedTiles={setStagedTiles}
                        />
                        <div id="input" className="bg-[#2C2C38] w-full p-1 lg:flex-6 lg:mt-0 mt-auto border-box ">
                            <div className=" flex border-box justify-between items-center text-center  ">
                                <InputPanel
                                    hand={hand}
                                    removeStagedTile={removeStagedTile}
                                    setHand={setHand}
                                    onSubmit={makeMove}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
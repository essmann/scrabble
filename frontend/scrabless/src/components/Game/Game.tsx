import { useState } from "react";
import { Board } from "./Board";
import { InputPanel } from "./InputPanel";
import { RightPanel } from "./RightPanel";
import type { User } from "../../hooks/useUser";
import { useOpponent } from "./getOpponent";
import { useGame } from "../../context/GameContext";
import type { BoardTile, ScrabbleCharacter } from "./types";

interface GameProps {
    hand: ScrabbleCharacter[];
    turn: string;
    board: BoardTile[][];
    user: User;
    roomId: string;
    sendWsMessage: (msg: object) => void
}

export function Game({ hand, turn, board, user, sendWsMessage, roomId }: GameProps) {
    const myTurn = user.id === turn;
    const { stagedTiles, setStagedTiles } = useGame();

    const [moveLoading, setMoveLoading] = useState(false); 6
    const removeStagedTile = (row: number, col: number) => {
        setStagedTiles(prev =>
            prev.filter(t => !(t.row === row && t.col === col))
        );
    };

    const makeMove = () => {
        //Shouldn't be called if it isn't the players turn
        //Check staged tiles. 
        //Client-side validation
        //1) Is it adjacent to another word, or is it adjacent to the star (first word)
        //2) Is it a valid word (use a trie)
        //Left -> Right
        //Up -> Down

        const payload = stagedTiles;
        const message = { type: "move", roomId: roomId, userId: user.id, message: payload };
        sendWsMessage(message);

    };

    return (
        <div className="main h-dvh w-dvw flex justify-center bg-[#16161E] 0 overflow-y-scroll">
            <div className="flex items-center justify-center lg:justify-normal lg:mt-3 border-box flex-col min-w-full min-h-full">
                <div className="flex lg:flex-row flex-col w-full md:max-w-3xl lg:max-w-[66rem] md:self-center lg:self-center self-end lg:h-auto h-full">
                    <div className="bg-[#3C3C4B] rounded-sm w-full p-3 lg:flex-1 flex gap-4 lg:justify-center items-center lg:items-start lg:min-w-sm lg:overflow-scroll">
                        <RightPanel
                            className={''}
                            user={{ id: "asdfga", name: "test" } as User}
                            opponent={{ id: "asdfga", name: "test" } as User}
                            myTurn={myTurn || false}
                        />
                    </div>
                    <div id="board" className="w-full lg:h-full lg:mt-0 md:mt-0 lg:flex-3 aspect-square">
                        <Board className={''} />
                        <div id="input" className="bg-[#2C2C38] w-full p-1 rounded-md lg:flex-6 lg:mt-0 mt-auto border-box">
                            <div className="flex border-box justify-between items-center text-center">
                                <InputPanel
                                    removeStagedTile={removeStagedTile}
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
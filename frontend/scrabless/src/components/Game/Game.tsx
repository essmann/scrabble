import { useState } from "react";
import type { GameState } from "../../types/game";
import { Board } from "./Board";
import { InputPanel } from "./InputPanel";
import { RightPanel } from "./RightPanel";
import type { User } from "../../hooks/useUser";
import { useOpponent } from "./getOpponent";
import type { LetterWithScore } from "../../context/GameContext";
import { useGame } from "../../context/GameContext";

export interface StagedTile {
    letter: LetterWithScore;
    row: number;
    col: number;
}

export const DRAG_TYPE = {
    FROM_BOARD: "FROM_BOARD",
    FROM_HAND: "FROM_HAND",
} as const;

export type DragType = typeof DRAG_TYPE[keyof typeof DRAG_TYPE];

export function Game({ gameState, user }: { gameState: GameState; user: User }) {
    const [myTurn] = useState(user.id == gameState.turn);
    const { setStagedTiles } = useGame();
    let opponent = useOpponent(gameState, user);

    const removeStagedTile = (row: number, col: number) => {
        setStagedTiles(prev =>
            prev.filter(t => !(t.row === row && t.col === col))
        );
    };

    console.log("Current opponent state:", opponent);

    return (
        <div className="main h-dvh w-dvw flex justify-center bg-[#16161E] 0 overflow-y-scroll">
            <div className="flex items-center justify-center lg:justify-normal lg:mt-3 border-box flex-col min-w-full min-h-full">
                <div className="flex lg:flex-row flex-col w-full md:max-w-3xl lg:max-w-6xl md:self-center lg:self-center self-end lg:h-auto h-full">
                    <div className="bg-[#3C3C4B] rounded-sm w-full p-3 lg:flex-1 flex gap-4 lg:justify-center items-center lg:items-start lg:min-w-sm lg:overflow-scroll">
                        <RightPanel
                            className={''}
                            user={user || { id: "asdfga", name: "test" } as User}
                            opponent={opponent || { id: "asdfga", name: "test" } as User}
                            myTurn={myTurn || false}
                        />
                    </div>
                    <div id="board" className="w-full lg:h-full lg:mt-0 md:mt-0 lg:flex-3">
                        <Board className={''} />
                        <div id="input" className="bg-[#2C2C38] w-full p-1 lg:flex-6 lg:mt-0 mt-auto border-box">
                            <div className="bg-red-500 flex border-box *:bg-yellow-500 justify-between items-center text-center">
                                <InputPanel
                                    removeStagedTile={removeStagedTile}
                                    onSubmit={() => ""}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
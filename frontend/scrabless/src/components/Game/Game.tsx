import { useEffect, useState } from "react";
import type { GameState, Letter } from "../../types/game";
import { Board } from "./Board";
import { InputPanel } from "./InputPanel";
import { RightPanel } from "./RightPanel";
import type { User } from "../../hooks/useUser";
import { useOpponent } from "./getOpponent";
interface BoardPosition {
    row: number;
    col: number;
}
export interface StagedTile {
    letter: Letter;
    row: number;
    col: number;
}


//DRAGGING types
export const DRAG_TYPE = {
    FROM_BOARD: "FROM_BOARD",
    FROM_HAND: "FROM_HAND",
} as const;

export type DragType =
    typeof DRAG_TYPE[keyof typeof DRAG_TYPE];

export function Game({ gameState, user }: { gameState: GameState; user: User }) {
    const [myTurn] = useState(user.id == gameState.turn);
    const [stagedTiles, setStagedTiles] = useState<StagedTile[]>([]);
    const [hand, setHand] = useState<Letter[]>(['A', 'B', 'C', 'Q', 'D', 'E', 'Z']);
    let opponent = useOpponent(gameState, user);

    //Staged tiles are the temporary tiles placed on the board by the client.
    const removeStagedTile = (row: number, col: number) => {
        setStagedTiles(prev =>
            prev.filter(t => !(t.row === row && t.col === col))
        );
    };
    const addStagedTile = (row: number, col: number) => {

    }

    //Hand

    console.log("Current opponent state:", opponent);

    return (
        <>
            <div className="max-w-full max-h-full">
                <Board
                    stagedTiles={stagedTiles}
                    setStagedTiles={setStagedTiles}
                    className="bg-amber-50 flex aspect-square max-w-3xl w-full" />
                <InputPanel removeStagedTile={removeStagedTile} hand={hand} setHand={setHand} />
            </div>
            <RightPanel
                user={user}
                opponent={opponent}
                myTurn={myTurn}
                className="bg-[#22222B] lg:max-w-md lg:w-[50%] w-full lg:max-3xl max-w-3xl lg:self-stretch max-h-full"
            />
        </>
    );
}

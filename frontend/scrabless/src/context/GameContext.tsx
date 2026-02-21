import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import type { Letter } from "../types/game";
import type { StagedTile } from "../components/Game/Game";
import type { ClickedTileDirection, TilePosition } from "../components/Game/types";

export type ClickedTileState = {
    row: number;
    col: number;
    direction: ClickedTileDirection | null;
} | null;

type GameContextType = {
    hand: Letter[];
    setHand: React.Dispatch<React.SetStateAction<Letter[]>>;
    stagedTiles: StagedTile[];
    setStagedTiles: React.Dispatch<React.SetStateAction<StagedTile[]>>;
    myTurn: boolean;
    clickedTile: ClickedTileState;
    setClickedTile: (pos: TilePosition | null, skipDirectionUpdate?: boolean) => void;
    removeFromHand: (letter: Letter) => void;
    addToHand: (letter: Letter) => void;
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
    const [hand, setHand] = useState<Letter[]>(['A', 'B', 'C', 'Q', 'D', 'E', 'Z']);
    const [stagedTiles, setStagedTiles] = useState<StagedTile[]>([]);
    const [myTurn] = useState(true);
    const [clickedTile, setClickedTileState] = useState<ClickedTileState>(null);

    const removeFromHand = (letter: Letter) => {
        setHand(prev => {
            let found = false;
            return prev.filter(l => {
                if (!found && l === letter) {
                    found = true;
                    return false;
                }
                return true;
            });
        });
    };

    const addToHand = (letter: Letter) => {
        setHand(prev => [...prev, letter]);
    };

    const setClickedTile = (pos: TilePosition | null, skipDirectionUpdate = false) => {
        if (pos === null) {
            setClickedTileState(null);
            return;
        }

        if (skipDirectionUpdate) {
            // Arrow key navigation — keep existing direction
            setClickedTileState(prev => ({
                row: pos.row,
                col: pos.col,
                direction: prev?.direction ?? null,
            }));
            return;
        }

        // Click — update direction based on previous state
        setClickedTileState(prev => {
            const sameTile = prev?.row === pos.row && prev?.col === pos.col;

            if (!sameTile) {
                return { row: pos.row, col: pos.col, direction: "RIGHT" };
            }

            // Toggle direction on same tile
            const nextDirection: ClickedTileDirection | null =
                prev?.direction === "RIGHT" ? "DOWN"
                    : prev?.direction === "DOWN" ? null
                        : "RIGHT";

            return { row: pos.row, col: pos.col, direction: nextDirection };
        });
    };

    return (
        <GameContext.Provider
            value={{
                hand,
                setHand,
                stagedTiles,
                setStagedTiles,
                myTurn,
                clickedTile,
                setClickedTile,
                removeFromHand,
                addToHand,
            }}
        >
            {children}
        </GameContext.Provider>
    );
};

export const useGame = (): GameContextType => {
    const context = useContext(GameContext);
    if (!context) throw new Error("useGame must be used within a GameProvider");
    return context;
};
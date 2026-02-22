import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Letter } from "../types/game";

import type { ClickedTileDirection, StagedTile, TilePosition } from "../components/Game/types";
import { generateTiles } from "../test/testTiles";

export type ClickedTileState = {
    row: number;
    col: number;
    direction: ClickedTileDirection | null;
} | null;

export interface LetterWithScore {
    letter: Letter;
    score: number;
}

type GameContextType = {
    hand: LetterWithScore[];
    setHand: React.Dispatch<React.SetStateAction<LetterWithScore[]>>;
    stagedTiles: StagedTile[];
    setStagedTiles: React.Dispatch<React.SetStateAction<StagedTile[]>>;
    myTurn: boolean;
    clickedTile: ClickedTileState;
    setClickedTile: (pos: TilePosition | null, skipDirectionUpdate?: boolean) => void;
    removeFromHand: (letter: Letter) => void;
    addToHand: (letterWithScore: LetterWithScore) => void;
    stagedIsValidWord: boolean;
    // board: LetterWithScore[][];
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
    const [hand, setHand] = useState<LetterWithScore[]>([
        { letter: 'A', score: 1 },
        { letter: 'B', score: 3 },
        { letter: 'C', score: 3 },
        { letter: 'Q', score: 10 },
        { letter: 'D', score: 2 },
        { letter: 'E', score: 1 },
        { letter: 'Z', score: 10 },
    ]);
    const [stagedTiles, setStagedTiles] = useState<StagedTile[]>([]);
    const [myTurn] = useState(true);
    const [clickedTile, setClickedTileState] = useState<ClickedTileState>(null);
    const [stagedIsValidWord, setStagedIsValidWord] = useState(false);
    const [board, setBoard] = useState(generateTiles());

    const words = ["AB", "DEZ", "QA"];
    //Word validation
    useEffect(() => {
        if (stagedTiles.length === 0) {
            setStagedIsValidWord(false);
            return;
        }

        // Determine direction by checking if rows differ
        const isVertical = stagedTiles.some(t => t.row !== stagedTiles[0].row);

        const sorted = [...stagedTiles].sort((a, b) =>
            isVertical ? a.row - b.row : a.col - b.col
        );

        const word = sorted.map(t => t.letter.letter).join("");

        setStagedIsValidWord(words.includes(word));
    }, [stagedTiles]);


    const validateWord = () => {

    }
    const removeFromHand = (letter: Letter) => {
        setHand(prev => {
            let found = false;
            return prev.filter(l => {
                if (!found && l.letter === letter) {
                    found = true;
                    return false;
                }
                return true;
            });
        });
    };

    const addToHand = (letterWithScore: LetterWithScore) => {
        setHand(prev => [...prev, letterWithScore]);
    };

    const setClickedTile = (pos: TilePosition | null, skipDirectionUpdate = false) => {
        if (pos === null) {
            setClickedTileState(null);
            return;
        }

        if (skipDirectionUpdate) {
            setClickedTileState(prev => ({
                row: pos.row,
                col: pos.col,
                direction: prev?.direction ?? null,
            }));
            return;
        }

        setClickedTileState(prev => {
            const sameTile = prev?.row === pos.row && prev?.col === pos.col;
            if (!sameTile) {
                return { row: pos.row, col: pos.col, direction: "RIGHT" };
            }

            const nextDirection: ClickedTileDirection | null =
                prev?.direction === "RIGHT" ? "DOWN" :
                    prev?.direction === "DOWN" ? null :
                        "RIGHT";

            return { row: pos.row, col: pos.col, direction: nextDirection };
        });
    };

    return (
        <GameContext.Provider value={{ hand, setHand, stagedTiles, setStagedTiles, stagedIsValidWord, myTurn, clickedTile, setClickedTile, removeFromHand, addToHand }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = (): GameContextType => {
    const context = useContext(GameContext);
    if (!context) throw new Error("useGame must be used within a GameProvider");
    return context;
};
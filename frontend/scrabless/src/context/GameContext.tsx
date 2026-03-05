import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { BoardTile, ClickedTileDirection, ScrabbleCharacter, StagedTile, TilePosition } from "../components/Game/types";
import { createEmptyBoard } from "../test/testTiles";
import type { GameState, PlayerState } from "../types/game";
import { useUser } from "../hooks/useUser";
import { getDirection } from "../components/Game/utils";
import { getScrabbleTrie } from "../components/Game/trie";
export type ClickedTileState = {
    row: number;
    col: number;
    direction: ClickedTileDirection | null;
} | null;

export const LETTER_SCORES: Record<ScrabbleCharacter, number> = {
    A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4,
    I: 1, J: 8, K: 5, L: 1, M: 3, N: 1, O: 1, P: 3,
    Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8,
    Y: 4, Z: 10, _: 0,
};

type GameContextType = {
    hand: ScrabbleCharacter[];
    setHand: React.Dispatch<React.SetStateAction<ScrabbleCharacter[]>>;
    stagedTiles: StagedTile[];
    setStagedTiles: React.Dispatch<React.SetStateAction<StagedTile[]>>;
    myTurn: boolean;
    turn: string;
    setTurn: React.Dispatch<React.SetStateAction<string>>;
    clickedTile: ClickedTileState;
    setClickedTile: (pos: TilePosition | null, skipDirectionUpdate?: boolean) => void;
    removeFromHand: (letter: ScrabbleCharacter) => void;
    addToHand: (letter: ScrabbleCharacter) => void;
    stagedIsValidWord: boolean;
    setStagedIsValidWord: React.Dispatch<React.SetStateAction<boolean>>;
    board: BoardTile[][];
    setBoard: React.Dispatch<React.SetStateAction<BoardTile[][]>>;
    gameState: GameState;
    setGameState: React.Dispatch<React.SetStateAction<GameState>>;
    player: PlayerState | null;
    opponent: PlayerState | null;
    scoredWord: BoardTile[][] | null;
    setScoredWord: React.Dispatch<React.SetStateAction<BoardTile[][] | null>>;
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
    const trie = getScrabbleTrie();
    const user = useUser();
    const [gameState, setGameState] = useState<GameState>({} as GameState);
    const [hand, setHand] = useState<ScrabbleCharacter[]>(['A', 'B', 'C', 'Q', 'D', 'E', 'Z']);
    const [stagedTiles, setStagedTiles] = useState<StagedTile[]>([]);
    const [myTurn] = useState(true);
    const [turn, setTurn] = useState("");
    const [clickedTile, setClickedTileState] = useState<ClickedTileState>(null);
    const [stagedIsValidWord, setStagedIsValidWord] = useState(false);
    const [board, setBoard] = useState<BoardTile[][]>(createEmptyBoard());
    const [scoredWord, setScoredWord] = useState<BoardTile[][] | null>(null);

    // const words = ["AB", "DEZ", "QA"];

    const players = gameState.players ?? {};
    const player = user ? (players[user.id] ?? null) : null;
    const opponentId = user ? Object.keys(players).find(id => id !== user.id) : undefined;
    const opponent = opponentId ? (players[opponentId] ?? null) : null;


    useEffect(() => {
        if (!stagedTiles.length) {
            setStagedIsValidWord(false);
            return;
        }
        const direction = getDirection(stagedTiles);
        if (!direction && stagedTiles.length > 1) {
            console.log("[ValidWord] No valid direction, multiple axes");
            setStagedIsValidWord(false);
            return;
        }
        const isVertical = direction === "vertical";
        [...stagedTiles].sort((a, b) =>
            isVertical ? a.row - b.row : a.col - b.col
        );
        // const mainWord = sortedTiles
        //     .map(t => t.letter.toLowerCase())
        //     .join("");

        const wordsToCheck = [
            ...(scoredWord ?? [])
        ];

        console.log("[ValidWord] Cross words:", (scoredWord ?? []).map(w =>
            w.map(t => t.letter!.toLowerCase()).join("")
        ));

        const allValid = wordsToCheck.every(item => {
            let word: string;
            if (typeof item === "string") {
                word = item;
            } else {
                word = item.map(t => t.letter!.toLowerCase()).join("");
            }
            const valid = word.length > 1 && trie.search(word);
            console.log(`[ValidWord] "${word}" → ${valid ? "✓" : "✗"}`);
            return valid;
        });

        console.log("[ValidWord] All valid:", allValid);
        setStagedIsValidWord(allValid);
    }, [stagedTiles, scoredWord, trie]);

    const removeFromHand = (letter: ScrabbleCharacter) => {
        setHand(prev => {
            let found = false;
            return prev.filter(l => {
                if (!found && l === letter) { found = true; return false; }
                return true;
            });
        });
    };

    const addToHand = (letter: ScrabbleCharacter) => {
        setHand(prev => [...prev, letter]);
    };

    const setClickedTile = (pos: TilePosition | null, skipDirectionUpdate = false) => {
        if (pos === null) { setClickedTileState(null); return; }

        if (skipDirectionUpdate) {
            setClickedTileState(prev => ({ row: pos.row, col: pos.col, direction: prev?.direction ?? null }));
            return;
        }

        setClickedTileState(prev => {
            const sameTile = prev?.row === pos.row && prev?.col === pos.col;
            if (!sameTile) return { row: pos.row, col: pos.col, direction: "RIGHT" };

            const nextDirection: ClickedTileDirection | null =
                prev?.direction === "RIGHT" ? "DOWN" :
                    prev?.direction === "DOWN" ? null : "RIGHT";

            return { row: pos.row, col: pos.col, direction: nextDirection };
        });
    };

    return (
        <GameContext.Provider value={{
            gameState, setGameState, board, setBoard, hand, setHand,
            turn, setTurn, stagedTiles, setStagedTiles,
            stagedIsValidWord, setStagedIsValidWord, myTurn, clickedTile, setClickedTile,
            removeFromHand, addToHand, player, opponent, scoredWord, setScoredWord
        }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = (): GameContextType => {
    const context = useContext(GameContext);
    if (!context) throw new Error("useGame must be used within a GameProvider");
    return context;
};
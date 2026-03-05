import { createContext, useContext, useEffect, useState, type ReactNode, useCallback, useMemo } from "react";
import type { BoardTile, ClickedTileDirection, ScrabbleCharacter, StagedTile, TilePosition } from "../components/Game/types";
import { createEmptyBoard } from "../test/testTiles";
import type { GameState, PlayerState } from "../types/game";
import { useUser } from "../hooks/useUser";
import { wsManager } from "../api/WebSocketManager";
import { useWordValidation } from "../hooks/useWordValidation";
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
    sendWsMessage: (msg: object) => void;
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
    const user = useUser();
    const [gameState, setGameState] = useState<GameState>({} as GameState);
    const [hand, setHand] = useState<ScrabbleCharacter[]>(['A', 'B', 'C', 'Q', 'D', 'E', 'Z']);
    const [stagedTiles, setStagedTiles] = useState<StagedTile[]>([]);
    const [turn, setTurn] = useState("");
    const myTurn = user?.id ? turn === user.id : false;
    const [clickedTile, setClickedTileState] = useState<ClickedTileState>(null);
    const [board, setBoard] = useState<BoardTile[][]>(createEmptyBoard());
    const [scoredWord, setScoredWord] = useState<BoardTile[][] | null>(null);
    const [stagedIsValidWord, setStagedIsValidWord] = useState(false);

    // Compute board tiles with letters (memoized to avoid recomputation)
    const boardTilesWithLetters = useMemo(() => {
        const boardTiles: StagedTile[] = [];
        board.forEach((row, rIdx) =>
            row.forEach((tile, cIdx) => {
                if (tile.letter) boardTiles.push({ row: rIdx, col: cIdx, letter: tile.letter });
            })
        );
        return boardTiles;
    }, [board]);

    // Sync board and turn from gameState when it arrives from server
    useEffect(() => {
        if (!gameState || !user?.id) return;
        if (!gameState.turn || !gameState.players) return;

        console.log("[GameContext] Syncing gameState:", gameState);

        if (gameState.turn) {
            console.log("[GameContext] Setting turn to:", gameState.turn);
            setTurn(gameState.turn);
        }

        if (gameState.players[user.id]?.hand && Array.isArray(gameState.players[user.id].hand)) {
            const playerHand = gameState.players[user.id].hand as ScrabbleCharacter[];
            console.log("[GameContext] Setting hand to:", playerHand);
            setHand(playerHand);
        }

        if (gameState.board) {
            let boardData: any[][] | null = null;

            // Handle direct array format
            if (Array.isArray(gameState.board)) {
                const boardArray = gameState.board as any[];
                if (boardArray.length > 0 && Array.isArray(boardArray[0])) {
                    boardData = boardArray;
                }
            }
            // Handle nested object format (e.g., { board: [...] })
            else if (typeof gameState.board === 'object' && 'board' in gameState.board) {
                const nestedBoard = (gameState.board as any).board;
                if (Array.isArray(nestedBoard) && nestedBoard.length > 0) {
                    boardData = nestedBoard;
                }
            }

            if (boardData) {
                const boardToSet = convertBoardTiles(boardData);
                console.log("[GameContext] Setting board, size:", boardToSet.length);
                setBoard(boardToSet);
            }
        }
    }, [gameState, user?.id]);

    const players = gameState.players ?? {};
    const player = user ? (players[user.id] ?? null) : null;
    const opponentId = user ? Object.keys(players).find(id => id !== user.id) : undefined;
    const opponent = opponentId ? (players[opponentId] ?? null) : null;

    // Validate staged word using custom hook
    const isValidWord = useWordValidation(stagedTiles, boardTilesWithLetters, scoredWord);
    useEffect(() => {
        setStagedIsValidWord(isValidWord);
    }, [isValidWord]);
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

    const sendWsMessage = useCallback((msg: object) => {
        console.log("[GameContext] Sending message:", msg);
        wsManager.sendMessage(msg);
    }, []);

    // Convert WSTile (from server) to BoardTile (frontend format)
    const convertBoardTiles = (wsTiles: any[][]): BoardTile[][] => {
        return wsTiles.map((row, rowIdx) =>
            row.map((tile, colIdx) => ({
                letter: tile?.letter || null,
                bonus: tile?.bonus || null,
                row: rowIdx,
                col: colIdx,
            }))
        );
    };

    return (
        <GameContext.Provider value={{
            gameState, setGameState, board, setBoard, hand, setHand,
            turn, setTurn, stagedTiles, setStagedTiles,
            stagedIsValidWord, setStagedIsValidWord, myTurn, clickedTile, setClickedTile,
            removeFromHand, addToHand, player, opponent, scoredWord, setScoredWord, sendWsMessage
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
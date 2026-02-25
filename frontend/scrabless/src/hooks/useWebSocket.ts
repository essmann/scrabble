import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { wsManager } from "../api/WebSocketManager";
import type { WebsocketMessage } from "../types/websocket";
import type { GameState, WSTile } from "../types/game";
import { useAuth } from "../context/authContext";
import type { BoardTile, ScrabbleCharacter } from "../components/Game/types";

interface GameStateResponse {
    type: string;
    gameState: GameState;
}

export function useWebSocket(
    roomId?: string,
    setHand?: Dispatch<SetStateAction<ScrabbleCharacter[]>>,
    setBoard?: Dispatch<SetStateAction<BoardTile[][]>>,
    setTurn?: Dispatch<SetStateAction<string>>
): [WebsocketMessage, (msg: object) => void, string, ScrabbleCharacter[], BoardTile[][]] {
    const user = useAuth().user;
    const userId = user.id;
    const [wsMessage, setWsMessage] = useState<WebsocketMessage>({} as WebsocketMessage);
    const [turn, setLocalTurn] = useState<string>("");
    const [hand, setLocalHand] = useState<ScrabbleCharacter[]>([]);
    const [board, setLocalBoard] = useState<BoardTile[][]>([]);

    const sendMessage = (message: object) => {
        console.log("[WebSocket] Sending message:", message);
        wsManager.sendMessage(message);
    };

    useEffect(() => {
        console.log("[WebSocket] Setting up subscription for room:", roomId);

        const unsubscribe = wsManager.subscribe((message: WebsocketMessage) => {
            console.log("[WebSocket] Message received:", message);

            if (message.type === "game_state") {
                const gameMsg = message as GameStateResponse;
                const newTurn = gameMsg.gameState.turn;
                const newHand = gameMsg.gameState.players[userId].hand as ScrabbleCharacter[];
                const newBoard = gameMsg.gameState.board as unknown as BoardTile[][];

                console.log("[WebSocket] Game state received:");
                console.log("[WebSocket]   turn:", newTurn);
                console.log("[WebSocket]   hand:", newHand);
                console.log("[WebSocket]   board (first row):", newBoard?.[0]);
                console.log("[WebSocket]   setHand provided:", !!setHand);
                console.log("[WebSocket]   setBoard provided:", !!setBoard);
                console.log("[WebSocket]   setTurn provided:", !!setTurn);

                setLocalTurn(newTurn);
                setLocalHand(newHand);
                setLocalBoard(newBoard);

                setTurn?.(newTurn);
                setHand?.(newHand);
                setBoard?.(newBoard);

                console.log("[WebSocket] State setters called");
            } else {
                console.log("[WebSocket] Unhandled message type:", message.type);
            }

            setWsMessage(message);
        });

        wsManager.connect()
            .then(() => {
                console.log("[WebSocket] Connected, requesting game state for room:", roomId);
                wsManager.sendMessage({ type: "request_game_state", roomId });
            })
            .catch((err) => {
                console.error("[WebSocket] Connection failed:", err);
            });

        return () => {
            console.log("[WebSocket] Cleaning up subscription for room:", roomId);
            unsubscribe();
        };
    }, [roomId]);

    return [wsMessage, sendMessage, turn, hand, board];
}
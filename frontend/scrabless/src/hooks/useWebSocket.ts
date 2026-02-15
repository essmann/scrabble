import { useEffect, useState } from "react";
import { wsManager } from "../api/WebSocketManager";
import type { WebsocketMessage } from "../types/websocket";
import type { GameState } from "../types/game";

interface GameStateResponse {
    type: string;
    gameState: GameState;
}
export function useWebSocket(roomId?: string): [WebsocketMessage, GameState | null] {
    const [wsMessage, setWsMessage] = useState<WebsocketMessage>({} as WebsocketMessage);
    const [gameState, setGameState] = useState<GameState | null>(null);

    useEffect(() => {
        console.log("Setting up WebSocket subscription");

        // Subscribe to messages
        const unsubscribe = wsManager.subscribe((message: WebsocketMessage) => {
            console.log("Message received in hook:", message);

            if (message.type === "game_state") {
                const gameMsg = message as GameStateResponse;
                setGameState(gameMsg.gameState); // <-- only store the actual game state
            }

            setWsMessage(message);
        });

        // Connect and send initial message
        wsManager.connect()
            .then(() => {
                console.log("WebSocket connected, sending request");
                wsManager.sendMessage({ type: "request_game_state", roomId: roomId });
            })
            .catch((err) => {
                console.error("WebSocket connection failed:", err);
            });

        // Cleanup on unmount
        return () => {
            console.log("Cleaning up WebSocket subscription");
            unsubscribe();
        };
    }, [roomId]); // Added roomId to dependency array

    return [wsMessage, gameState];
}
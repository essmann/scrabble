import { useEffect, useState } from "react";
import { wsManager } from "../api/WebSocketManager";
import type { WebsocketMessage } from "../types/websocket";

export function useWebSocket(roomId?: string): [WebsocketMessage, string] {
    const [wsMessage, setWsMessage] = useState<WebsocketMessage>({} as WebsocketMessage);
    const [gameState, setGameState] = useState<string>("");
    useEffect(() => {
        console.log("Setting up WebSocket subscription");

        // Subscribe to messages
        const unsubscribe = wsManager.subscribe((message: WebsocketMessage) => {
            console.log("Message received in hook:", message);
            if (message.type && message.type == "game_update") {
                setGameState(JSON.stringify(message));
            }
            setWsMessage(message as WebsocketMessage); // Convert to string for display
        });

        // Connect and send initial message
        wsManager.connect()
            .then(() => {
                console.log("WebSocket connected, sending request");
                wsManager.sendMessage({ type: "request_game_update", roomId: roomId });
            })
            .catch((err) => {
                console.error("WebSocket connection failed:", err);
            });

        // Cleanup on unmount
        return () => {
            console.log("Cleaning up WebSocket subscription");
            unsubscribe();
        };
    }, []);

    // Return the latest message so the component can use it
    return [wsMessage as WebsocketMessage, gameState];
}

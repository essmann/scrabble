import { useEffect, useState } from "react";
import { wsManager } from "../api/WebSocketManager";


export function useWebSocket(roomId?: string) {
    const [wsMessage, setWsMessage] = useState<string>("");
    const [gameState, setGameState] = useState<string>("");
    useEffect(() => {
        console.log("Setting up WebSocket subscription");

        // Subscribe to messages
        const unsubscribe = wsManager.subscribe((message: any) => {
            console.log("Message received in hook:", message);
            if (message.type && message.type == "game_update") {
                setGameState(JSON.stringify(message));
            }
            setWsMessage(JSON.stringify(message)); // Convert to string for display
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
    return [wsMessage, gameState];
}

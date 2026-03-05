import { useEffect } from "react";
import { wsManager } from "../api/WebSocketManager";
import type { GameState } from "../types/game";
import type { GameUpdateMessage } from "../types/websocket";
import { useAuth } from "../context/authContext";

/**
 * Connects to WebSocket and syncs game state changes.
 * Single responsibility: Listen to game_state messages and update GameContext.
 */
export function useGameSync(
    roomId: string | undefined,
    onGameStateUpdate: (gameState: GameState) => void
) {
    const { user } = useAuth();

    useEffect(() => {
        if (!user.id || !roomId) return;

        // Connect and setup listener
        wsManager.connect()
            .then(() => {
                console.log("[GameSync] Connected, requesting game state for room:", roomId);
                wsManager.sendMessage({ type: "request_game_state", roomId });
            })
            .catch((err) => {
                console.error("[GameSync] Connection failed:", err);
            });

        // Subscribe to game state updates only
        const unsubscribe = wsManager.subscribe((message) => {
            console.log("[GameSync] Message received:", message.type);
            // Handle both old "game_state" and new "game_update" message types
            if (message.type === "game_update") {
                const gameMsg = message as GameUpdateMessage;
                console.log("[GameSync] Game state received:", gameMsg.filteredGameState);
                onGameStateUpdate(gameMsg.filteredGameState);
            } else if (message.type === "game_state") {
                // Fallback for old message type if server still sends it
                const gameMsg = message as any;
                console.log("[GameSync] Game state received (legacy):", gameMsg.gameState);
                onGameStateUpdate(gameMsg.gameState);
            }
        });

        return () => {
            console.log("[GameSync] Cleaning up subscription for room:", roomId);
            unsubscribe();
        };
    }, [roomId, user.id, onGameStateUpdate]);
}

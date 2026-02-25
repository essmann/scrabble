import type { Letter } from "../gameManager.js";
import { gameManager, roomManager } from "../main.js";
import type { Room } from "../roomManager.js";
import type { SocketMessage } from "../types/SocketMessage.js";
import { WebSocketManager, type AuthenticatedWebSocket } from "./websocketManager.js";

interface MoveMessage extends RoomSocketMessage {
    userId: string;
    roomId: string;
    message: { letter: Letter; row: number; col: number }[];
}
export interface RoomSocketMessage extends SocketMessage {
    roomId: string; // required
}
export class WSMessageHandler {
    static async handle(ws: AuthenticatedWebSocket, msg: SocketMessage) {
        switch (msg.type) {
            case "request_game_state":
            case "move":
                if (!msg.roomId) {
                    ws.send(JSON.stringify({ type: "error", message: "roomId is required" }));
                    return;
                }
                break;
        }

        switch (msg.type) {
            case "request_game_state":
                this.sendGameState(ws, msg as RoomSocketMessage);
                break;
            case "move":
                const moveMsg = msg as MoveMessage;
                try {
                    gameManager.makeMove(moveMsg.roomId, moveMsg.userId, moveMsg.message);
                    this.broadcastFilteredGameState(moveMsg.roomId);
                } catch (e) {
                    console.error("[WS] Move failed:", e);
                    ws.send(JSON.stringify({ type: "move_error", message: (e as Error).message }));
                }
                break;
            default:
                console.warn("[WS] Unknown message type:", msg.type);
                break;
        }
    }

    private static sendGameState(ws: AuthenticatedWebSocket, msg: SocketMessage) {
        const roomId = msg.roomId as string;
        if (!roomId) { console.log("[WS] Room ID doesn't exist"); return; }

        const room = roomManager.getRoom(roomId);
        if (!room) { console.log("[WS] Room doesn't exist"); return; }
        if (room.state !== "active") { console.log("[WS] Room is not active"); return; }

        const isParticipant = room.owner.id === ws.userId || room.guest?.id === ws.userId;
        if (!isParticipant) { console.log("[WS] User is not a participant"); return; }

        const gameState = gameManager.getFilteredGameState(roomId, ws.userId as string);
        if (!gameState) { console.log("[WS] Game state doesn't exist"); return; }

        ws.send(JSON.stringify({ type: "game_state", gameState }));
    }

    private static broadcastFilteredGameState(roomId: string) {
        const room = roomManager.getRoom(roomId);
        if (!room) { console.log("[WS] Room doesn't exist for broadcast"); return; }

        const participants = [
            { id: room.owner.id },
            ...(room.guest ? [{ id: room.guest.id }] : []),
        ];

        for (const { id } of participants) {
            const gameState = gameManager.getFilteredGameState(roomId, id);
            const client = WebSocketManager.getClient(id);
            if (!gameState || !client) {
                console.warn(`[WS] Skipping broadcast for ${id} — client or state missing`);
                continue;
            }
            client.send(JSON.stringify({ type: "game_state", gameState }));
        }
    }
}
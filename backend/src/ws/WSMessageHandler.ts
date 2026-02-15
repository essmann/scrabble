import { gameManager, roomManager } from "../main.js";
import type { Room } from "../roomManager.js";
import type { SocketMessage } from "../types/SocketMessage.js";
import type { AuthenticatedWebSocket } from "./websocketManager.js";

export class WSMessageHandler {
    static async handle(ws: AuthenticatedWebSocket, msg: SocketMessage) {
        switch (msg.type) {
            case "request_game_state":
                this.sendGameState(ws, msg);
                break;

            default:
                console.warn('Unknown message type', msg.type);
                break;
        }
    }



    private static sendGameState(ws: AuthenticatedWebSocket, msg: any) {
        const roomId = msg.roomId as string;

        if (!roomId) {
            console.log("[WS] Room ID doesn't exist");
            return;
        }

        const room: Room | undefined = roomManager.getRoom(roomId);

        if (!room) {
            console.log("[WS] Room doesn't exist");
            return;
        }

        // Check if room is active and user is a participant
        const isOwner = room.owner.id === ws.userId;
        const isGuest = room.guest?.id === ws.userId;

        if (room.state !== 'active') {
            console.log("[WS] Room is not active");
            return;
        }

        if (!isOwner && !isGuest) {
            console.log("[WS] User is not a participant in this room");
            return;
        }

        const gameState = gameManager.getGame(roomId);

        if (!gameState) {
            console.log("[WS] Game state doesn't exist");
            return;
        }

        // Send the entire game state
        ws.send(JSON.stringify({
            type: 'game_state',
            gameState: gameState
        }));
    }
}
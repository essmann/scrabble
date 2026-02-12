import { gameManager, roomManager } from "../main.js";
import type { Room } from "../roomManager.js";
import type { SocketMessage } from "../types/SocketMessage.js";
import type { AuthenticatedWebSocket } from "./websocketManager.js";

export class WSMessageHandler {

    static async handle(ws: AuthenticatedWebSocket, msg: SocketMessage) {

        switch (msg.type) {
            case "request_game_update":
                this.handleGameUpdate(ws, msg);
                break;
            case "send_message":
                break;
            default:
                console.warn('Unknown message type', msg.type);
                break;
        }
    }

    private static handleSendMessage(ws: AuthenticatedWebSocket, msg: any) {

    }
    private static handleGameUpdate(ws: AuthenticatedWebSocket, msg: any) {
        let room: Room | undefined = roomManager.getRoom(msg.roomId as string);
        if (!room) {
            console.log("[WS] Room doesn't exist");

        }
        if (msg.roomId && room?.state === 'active' && room?.ownerId == ws.userId || room?.guestId == ws.userId) {
            let gameState = gameManager.getGame(msg.roomId as string);
            let playerState = gameState?.players[ws.userId as string];
            if (gameState) {
                ws.send(JSON.stringify({ type: 'game_update', playerState }));
            }
        }
        else if (!msg.roomId) {
            console.log("[WS] Room ID doesn't exist");
        }

    }
}
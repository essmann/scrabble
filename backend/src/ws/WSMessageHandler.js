import { gameManager, roomManager } from "../main.js";
import { WebSocketManager } from "./websocketManager.js";
export class WSMessageHandler {
    static async handle(ws, msg) {
        switch (msg.type) {
            case "request_game_state":
            case "move":
                if (!msg.roomId) {
                    ws.send(JSON.stringify({ type: "error", message: "roomId is required" }));
                    return;
                }
                break;
            case "RESIGN":
                if (!msg.roomId) {
                    ws.send(JSON.stringify({ type: "error", message: "roomId is required" }));
                    return;
                }
        }
        switch (msg.type) {
            case "request_game_state":
                this.sendGameState(ws, msg);
                break;
            case "move":
                const moveMsg = msg;
                try {
                    gameManager.makeMove(moveMsg.roomId, moveMsg.userId, moveMsg.message);
                    this.broadcastFilteredGameState(moveMsg.roomId);
                }
                catch (e) {
                    console.error("[WS] Move failed:", e);
                    ws.send(JSON.stringify({ type: "move_error", message: e.message }));
                }
                break;
            case "RESIGN":
                const resignmsg = msg;
                if (resignmsg.userId !== ws.userId)
                    return;
                try {
                    if (!resignmsg.roomId)
                        break;
                    if (!resignmsg.userId)
                        break;
                    const winnerUserId = roomManager.getOpponent(resignmsg.userId, resignmsg.roomId);
                    if (!winnerUserId)
                        break;
                    gameManager.endGame(winnerUserId, resignmsg.roomId, "RESIGN");
                    this.broadcastFilteredGameState(resignmsg.roomId);
                }
                catch (error) {
                }
                break;
            default:
                console.warn("[WS] Unknown message type:", msg.type);
                break;
        }
    }
    static sendGameState(ws, msg) {
        const roomId = msg.roomId;
        if (!roomId) {
            console.log("[WS] Room ID doesn't exist");
            return;
        }
        const room = roomManager.getRoom(roomId);
        if (!room) {
            console.log("[WS] Room doesn't exist");
            return;
        }
        if (room.state !== "active") {
            console.log("[WS] Room is not active");
            return;
        }
        const isParticipant = room.owner.id === ws.userId || room.guest?.id === ws.userId;
        if (!isParticipant) {
            console.log("[WS] User is not a participant");
            return;
        }
        const gameState = gameManager.getFilteredGameState(roomId, ws.userId);
        if (!gameState) {
            console.log("[WS] Game state doesn't exist");
            return;
        }
        ws.send(JSON.stringify({ type: "game_state", gameState }));
    }
    static broadcastFilteredGameState(roomId) {
        const room = roomManager.getRoom(roomId);
        if (!room) {
            console.log("[WS] Room doesn't exist for broadcast");
            return;
        }
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
//# sourceMappingURL=WSMessageHandler.js.map
import { roomManager } from "../main.js";
export class WebSocketManager {
    static addClient(userId, ws) {
        // Disconnect existing connection for this user
        const existingWs = this.clients.get(userId);
        if (existingWs && existingWs.readyState === WebSocket.OPEN) {
            existingWs.close(1000, "New connection established");
        }
        this.clients.set(userId, ws);
        console.log(`[WS] User ${userId} connected`);
    }
    static removeClient(userId) {
        this.clients.delete(userId);
        console.log(`[WS] User ${userId} disconnected`);
    }
    static getClient(userId) {
        return this.clients.get(userId);
    }
    static sendToUser(userId, message) {
        const ws = this.clients.get(userId);
        console.log(`[WS] Attempting to send to ${userId}:`, {
            hasClient: !!ws,
            isOpen: ws?.readyState === WebSocket.OPEN,
            message: message
        });
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
            console.log(`[WS] ✅ Message sent to ${userId}`);
            return true;
        }
        console.log(`[WS] ❌ Failed to send to ${userId}`);
        return false;
    }
    static broadcastToRoom(roomId, message, excludeUserId) {
        console.log(`Attempting to broadcast to room: ${roomId}. Message: ${message}`);
        const room = roomManager.getRoom(roomId);
        if (!room)
            return;
        const userIds = [room.owner.id, room.guest?.id].filter(id => id && id !== excludeUserId);
        for (const userId of userIds) {
            this.sendToUser(userId, message);
        }
    }
}
WebSocketManager.clients = new Map();
//# sourceMappingURL=websocketManager.js.map
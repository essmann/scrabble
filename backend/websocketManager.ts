import { roomManager } from "./main.js";
export interface AuthenticatedWebSocket extends WebSocket {
    on(arg0: string, arg1: (rawMessage: any) => void): unknown;
    userId?: string;
    roomId?: string;
}
export class WebSocketManager {
    private clients = new Map<string, AuthenticatedWebSocket>();

    addClient(userId: string, ws: AuthenticatedWebSocket): void {
        // Disconnect existing connection for this user
        const existingWs = this.clients.get(userId);
        if (existingWs && existingWs.readyState === WebSocket.OPEN) {
            existingWs.close(1000, "New connection established");
        }

        this.clients.set(userId, ws);
        console.log(`[WS] User ${userId} connected`);
    }

    removeClient(userId: string): void {
        this.clients.delete(userId);
        console.log(`[WS] User ${userId} disconnected`);
    }

    getClient(userId: string): AuthenticatedWebSocket | undefined {
        return this.clients.get(userId);
    }

    sendToUser(userId: string, message: any): boolean {
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
    broadcastToRoom(roomId: string, message: any, excludeUserId?: string): void {
        const room = roomManager.getRoom(roomId);
        if (!room) return;

        const userIds = [room.ownerId, room.guestId].filter(id => id && id !== excludeUserId);

        for (const userId of userIds) {
            this.sendToUser(userId as string, message);
        }
    }
}

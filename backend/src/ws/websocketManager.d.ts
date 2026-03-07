export interface AuthenticatedWebSocket extends WebSocket {
    on(arg0: string, arg1: (rawMessage: any) => void): unknown;
    userId?: string;
    roomId?: string;
}
export declare class WebSocketManager {
    private static clients;
    static addClient(userId: string, ws: AuthenticatedWebSocket): void;
    static removeClient(userId: string): void;
    static getClient(userId: string): AuthenticatedWebSocket | undefined;
    static sendToUser(userId: string, message: any): boolean;
    static broadcastToRoom(roomId: string, message: any, excludeUserId?: string): void;
}
//# sourceMappingURL=websocketManager.d.ts.map
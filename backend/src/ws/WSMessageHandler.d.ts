import type { SocketMessage } from "../types/SocketMessage.js";
import { type AuthenticatedWebSocket } from "./websocketManager.js";
export interface RoomSocketMessage extends SocketMessage {
    roomId: string;
}
export declare class WSMessageHandler {
    static handle(ws: AuthenticatedWebSocket, msg: SocketMessage): Promise<void>;
    private static sendGameState;
    private static broadcastFilteredGameState;
}
//# sourceMappingURL=WSMessageHandler.d.ts.map
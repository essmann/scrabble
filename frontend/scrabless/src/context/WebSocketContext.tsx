import { createContext, useContext, type ReactNode, useEffect, useState } from "react";
import { wsManager } from "../api/WebSocketManager";
import type { WebsocketMessage } from "../types/websocket";

interface SocketContextType {
    sendMessage: (msg: object) => void;
    lastMessage: WebsocketMessage | null;
}

const SocketContext = createContext<SocketContextType | null>(null);

export function useSocket() {
    const ctx = useContext(SocketContext);
    if (!ctx) throw new Error("useSocket must be used inside WebSocketProvider");
    return ctx;
}

interface Props {
    children: ReactNode;
    roomId: string;
}

export function WebSocketProvider({ children, roomId }: Props) {
    const [lastMessage, setLastMessage] = useState<WebsocketMessage | null>(null);

    const sendMessage = (msg: object) => wsManager.sendMessage(msg);

    useEffect(() => {
        wsManager.connect();

        const unsubscribe = wsManager.subscribe((msg: WebsocketMessage) => {
            setLastMessage(msg); // store the last message in context
        });

        // request initial state
        sendMessage({ type: "request_game_state", roomId });

        return () => unsubscribe();
    }, [roomId]);

    return (
        <SocketContext.Provider value={{ sendMessage, lastMessage }}>
            {children}
        </SocketContext.Provider>
    );
}

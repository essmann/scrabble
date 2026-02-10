// WebSocketManager.ts
type MessageCallback = (data: any) => void;

class WebSocketManager {
    private static instance: WebSocketManager;
    private socket: WebSocket | null = null;
    private listeners: Set<MessageCallback> = new Set();
    private _url: string = import.meta.env.VITE_WS_URL || "ws://localhost:3000";
    private constructor() { }

    static getInstance(): WebSocketManager {
        if (!WebSocketManager.instance) {
            WebSocketManager.instance = new WebSocketManager();
        }
        return WebSocketManager.instance;
    }

    connect(url: string = this._url) {
        if (this.socket?.readyState === WebSocket.OPEN) return;

        this.socket = new WebSocket(url);

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.listeners.forEach((callback) => callback(data));
        };

        this.socket.onclose = () => {
            console.log("Socket closed. Reconnecting...");
            setTimeout(() => this.connect(url), 3000); // Basic retry logic
        };
    }

    subscribe(callback: MessageCallback) {
        this.listeners.add(callback);
        // Return an unsubscribe function for easy cleanup in useEffect
        return () => this.listeners.delete(callback);
    }

    sendMessage(message: any) {
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        }
    }
}

export const wsManager = WebSocketManager.getInstance();


//Singleton pattern, only a single instance of this class at any given time.

//We need a custom hook that will let our component subscribe, and also unsubscribe on unmount,
//that way we dont leak anything.


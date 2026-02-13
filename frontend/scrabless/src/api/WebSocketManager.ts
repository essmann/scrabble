import type { WebsocketMessage } from "../types/websocket";

// WebSocketManager.ts
type MessageCallback = (data: WebsocketMessage) => void;

class WebSocketManager {
    private static instance: WebSocketManager;
    private socket: WebSocket | null = null;
    private listeners: Set<MessageCallback> = new Set();
    private _url: string = import.meta.env.VITE_WS_URL || "ws://localhost:3000";
    private connectionPromise: Promise<void> | null = null;
    private isConnecting: boolean = false;

    private constructor() { }

    static getInstance(): WebSocketManager {
        if (!WebSocketManager.instance) {
            WebSocketManager.instance = new WebSocketManager();
        }
        return WebSocketManager.instance;
    }

    connect(url: string = this._url): Promise<void> {
        console.log("Attempting to connect to WebSocket...");

        // Return existing promise if already connecting
        if (this.connectionPromise && this.isConnecting) {
            return this.connectionPromise;
        }

        // Already connected
        if (this.socket?.readyState === WebSocket.OPEN) {
            console.log("Already connected");
            return Promise.resolve();
        }

        this.isConnecting = true;

        this.connectionPromise = new Promise((resolve, reject) => {
            this.socket = new WebSocket(url);

            this.socket.onopen = () => {
                console.log("✅ WebSocket connected successfully");
                this.isConnecting = false;
                resolve();
            };

            this.socket.onerror = (error) => {
                console.error("❌ WebSocket error:", error);
                this.isConnecting = false;
                reject(error);
            };

            this.socket.onmessage = (event) => {
                console.log("📨 Received message:", event.data);
                try {
                    const data = JSON.parse(event.data);
                    this.listeners.forEach((callback) => callback(data));
                } catch (err) {
                    console.error("Failed to parse message:", err);
                }
            };

            this.socket.onclose = () => {
                console.log("Socket closed. Reconnecting...");
                this.isConnecting = false;
                this.connectionPromise = null;
                setTimeout(() => this.connect(url), 3000);
            };
        });

        return this.connectionPromise;
    }

    subscribe(callback: MessageCallback) {
        this.listeners.add(callback);
        console.log(`Subscriber added. Total listeners: ${this.listeners.size}`);
        // Return an unsubscribe function
        return () => {
            this.listeners.delete(callback);
            console.log(`Subscriber removed. Total listeners: ${this.listeners.size}`);
        };
    }

    async sendMessage(message: any) {
        console.log("Attempting to send message:", message);

        // Wait for connection if not open
        if (this.socket?.readyState !== WebSocket.OPEN) {
            console.log("Socket not open, waiting for connection...");
            await this.connect();
        }

        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
            console.log("✅ Message sent successfully");
        } else {
            console.error("❌ Socket still not open after connection attempt");
        }
    }

    isConnected(): boolean {
        return this.socket?.readyState === WebSocket.OPEN;
    }
}

export const wsManager = WebSocketManager.getInstance();
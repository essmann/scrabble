import type { RoomType } from "../types/roomTypes";

export class apiManager {
    public static expressUrl = import.meta.env.VITE_EXPRESS_URL || "http://localhost:3000";
    public static wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:8080";

    private static postOptions = {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        }
    } as RequestInit;

    private static getOptions = {
        credentials: "include"
    } as RequestInit;

    public static async createRoom(type: RoomType) {
        try {
            switch (type) {
                case "friend": {
                    const res = await fetch(this.expressUrl + "/create-room", this.postOptions);
                    if (!res.ok) {
                        throw new Error(`Failed to create room: ${res.status}`); // FIX: backticks, not Error`...`
                    }
                    const data = await res.json();
                    return { roomId: data.roomId };
                }
                case "search":
                    return { error: "Search rooms not implemented yet" };
                default:
                    return { error: "Invalid room type" };
            }
        } catch (error) {
            console.error("Error creating room:", error);
            return { error: error instanceof Error ? error.message : "Unknown error" };
        }
    }

    static async getUserId(): Promise<string> {
        let response = await fetch(this.expressUrl + "/user", this.getOptions);
        if (!response.ok) {
            throw new Error('Failed to fetch /user info');
        }
        const data = await response.json();
        console.log(data);
        return data.userId;
    }

    static async connectToRoom(type: RoomType, roomId: string) {
        try {
            switch (type) {
                case "friend": {
                    let response = await fetch(
                        `${this.expressUrl}/friend-room?roomId=${roomId}`,
                        this.getOptions
                    );
                    if (!response.ok) {
                        const errBody = await response.json();

                        const message =
                            typeof errBody === "string"
                                ? errBody
                                : errBody?.error || errBody?.message || JSON.stringify(errBody);

                        throw new Error(`Failed to join room ${roomId}: ${message}`);
                    }
                    const data = await response.json();
                    console.log(data);
                    return data; // FIX: return full data object, not just userId
                }
                case "search":
                    throw new Error("Search rooms not implemented yet");
                default:
                    throw new Error("Invalid room type");
            }
        } catch (error) {
            console.error("Error connecting to room:", error);
            throw error; // Re-throw so caller can handle
        }
    }
}
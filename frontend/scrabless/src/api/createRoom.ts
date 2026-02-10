import { type RoomType } from "../types/roomTypes";

const express_url = "http://localhost:3000/createFriendRoom";

export async function createRoom(type: RoomType): Promise<{ roomId?: string; error?: string }> {
    const options = {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        }
    } as RequestInit;

    try {
        switch (type) {
            case "friend": {
                const res = await fetch(express_url, options);

                if (!res.ok) {
                    throw new Error(`Failed to create room: ${res.status}`);
                }

                const data = await res.json();
                return { roomId: data.roomId };
            }
            case "search":
                // TODO: implement search room creation
                return { error: "Search rooms not implemented yet" };
            default:
                return { error: "Invalid room type" };
        }
    } catch (error) {
        console.error("Error creating room:", error);
        return { error: error instanceof Error ? error.message : "Unknown error" };
    }
}
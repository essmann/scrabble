import { WebSocketManager } from "./ws/websocketManager.js";

export interface Room {
    id: string;
    owner: User;
    guest?: User;
    state: "waiting" | "active";
    createdAt: number;
}

export interface User {
    id: string;
    name: string;
}

export class RoomManager {
    private rooms = new Map<string, Room>(); // roomId -> Room
    private userToRoom = new Map<string, string>(); // userId -> roomId

    createRoom(owner: User): string {
        // Clean up any existing room for this user
        this.removeUserRooms(owner.id);

        const roomId = crypto.randomUUID();
        const room: Room = {
            id: roomId,
            owner,
            state: "waiting",
            createdAt: Date.now()
        };

        this.rooms.set(roomId, room);
        this.userToRoom.set(owner.id, roomId);

        console.log(`[ROOM] Created room ${roomId} for user ${owner.id} (${owner.name})`);
        return roomId;
    }

    getRoom(roomId: string): Room | undefined {
        return this.rooms.get(roomId);
    }

    joinRoom(roomId: string, guest: User): boolean {
        const room = this.rooms.get(roomId);

        if (!room) {
            console.log(`[ROOM] Room ${roomId} does not exist`);
            return false;
        }

        if (room.state !== "waiting") {
            console.log(`[ROOM] Room ${roomId} is not in waiting state`);
            return false;
        }

        if (room.owner.id === guest.id) {
            console.log(`[ROOM] User ${guest.id} (${guest.name}) is the owner, cannot join as guest`);
            return false;
        }

        room.guest = guest;
        room.state = "active";
        this.userToRoom.set(guest.id, roomId);

        console.log(`[ROOM] User ${guest.id} (${guest.name}) joined room ${roomId}`);
        return true;
    }

    removeUserRooms(userId: string): void {
        const roomId = this.userToRoom.get(userId);

        if (roomId) {
            const room = this.rooms.get(roomId);

            if (room) {
                // Clean up all participants
                this.userToRoom.delete(room.owner.id);
                if (room.guest) {
                    this.userToRoom.delete(room.guest.id);
                }
                this.rooms.delete(roomId);
                console.log(`[ROOM] Removed room ${roomId}`);
            }
        }
    }

    cleanup(): void {
        const now = Date.now();
        const maxAge = 30 * 60 * 1000; // 30 minutes

        for (const [roomId, room] of this.rooms) {
            if (room.state === "waiting" && now - room.createdAt > maxAge) {
                this.removeUserRooms(room.owner.id);
            }
        }
    }
}
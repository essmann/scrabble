export interface Room {
    id: string;
    ownerId: string;
    guestId?: string;
    state: "waiting" | "active";
    createdAt: number;
}
export class RoomManager {
    private rooms = new Map<string, Room>(); //RoomId, Room
    private userToRoom = new Map<string, string>(); // userId -> roomId


    createRoom(ownerId: string): string {
        // Clean up any existing room for this user
        this.removeUserRooms(ownerId);

        const roomId = crypto.randomUUID();
        const room: Room = {
            id: roomId,
            ownerId,
            state: "waiting",
            createdAt: Date.now()
        };

        this.rooms.set(roomId, room);
        this.userToRoom.set(ownerId, roomId);

        console.log(`[ROOM] Created room ${roomId} for user ${ownerId}`);
        return roomId;
    }

    getRoom(roomId: string): Room | undefined {
        return this.rooms.get(roomId);
    }

    joinRoom(roomId: string, guestId: string): boolean {
        const room = this.rooms.get(roomId);

        if (!room) {
            console.log(`[ROOM] Room ${roomId} does not exist`);
            return false;
        }

        if (room.state !== "waiting") {
            console.log(`[ROOM] Room ${roomId} is not in waiting state`);
            return false;
        }

        if (room.ownerId === guestId) {
            console.log(`[ROOM] User ${guestId} is the owner, cannot join as guest`);
            return false;
        }

        room.guestId = guestId;
        room.state = "active";
        this.userToRoom.set(guestId, roomId);

        console.log(`[ROOM] User ${guestId} joined room ${roomId}`);
        return true;
    }

    removeUserRooms(userId: string): void {
        const roomId = this.userToRoom.get(userId);
        if (roomId) {
            const room = this.rooms.get(roomId);
            if (room) {
                // Clean up all participants
                this.userToRoom.delete(room.ownerId);
                if (room.guestId) {
                    this.userToRoom.delete(room.guestId);
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
                this.removeUserRooms(room.ownerId);
            }
        }
    }
}

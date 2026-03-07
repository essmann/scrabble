import { RoomRole, RoomState, RoomUser } from "../Error/error.js";
// ============================================================================
// POST /create-room
// ============================================================================


export interface CreateRoomResponse {
    roomId: string;
    message: string;
}

// ============================================================================
// GET /friend-room
// ============================================================================

export interface FriendRoomResponse {
    role: RoomRole;
    state: RoomState;
    message: string;
    owner: RoomUser;
    guest: RoomUser | null;
}
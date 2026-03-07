// types/api.ts

// ============================================================================
// SHARED
// ============================================================================

export type RoomState = 'waiting' | 'active';
export type RoomRole = 'owner' | 'guest';

export interface RoomUser {
    id: string;
    name: string;
}


export interface ApiError {
    error: ApiErrorBody;
}
interface ApiErrorBody {
    code: string;
    message: string;
}

export const formatError = (code: string, message: string, meta?: Record<string, unknown>) => {

    return {
        error: {
            code: code,
            message: message,
            meta: meta
        }
    }
}
// ============================================================================
// ERROR RESPONSES
// ============================================================================

// Specific errors just narrow the code and meta
export interface AlreadyInRoomError {
    error: {
        code: 'already_in_room';
        message: string;
        meta: { role: RoomRole; roomId: string; state: RoomState };
    }
}

export interface UnauthorizedError {
    error: {
        code: "unauthorized";
        message: string;

    }
}
export interface GenericError {
    error: string;
}

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

// ============================================================================
// GET /user
// ============================================================================

export interface GetUserResponse {
    id: string;
    name: string;
}
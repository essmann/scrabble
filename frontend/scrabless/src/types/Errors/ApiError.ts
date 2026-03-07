import type { Room } from "../room";

//Typed errors from the server come in this format.
interface ApiError {
    error: {
        code: string;
        message: string;
        meta?: Record<string, unknown>;
    }
}


export interface AlreadyInRoomError {
    code: 'already_in_room';
    message: string;
    meta: { role: string; roomId: string; state: Room };
}
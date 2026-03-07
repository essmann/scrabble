import { Room } from "../../roomManager.js";

export interface CurrentRoomSuccess {
    roomId: string;
    room: Room;
}

export interface CurrentRoomEmpty {
    message: "user is not in a room";
}

export interface CurrentRoomError {
    error: string;
}
export type CurrentRoomResponse = CurrentRoomSuccess | CurrentRoomEmpty | CurrentRoomError;

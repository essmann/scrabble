import type { ScrabbleCharacter } from "../components/Game/types";
import type { Room, User } from "./room";
export type Letter =
    | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J'
    | 'K' | 'L' | 'M' | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T'
    | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z'
    | '_'; // blank tile
interface BoardState {
    board: WSTile[][];

}
export type GameEndType = "OUT_OF_TIME" | "RESIGN" | "LONG_DISCONNECT";

// type TileType = "DW" | "TW" | "TL" | "DL"
// interface Tile {
//     letter: Letter | null;
//     type: TileType;

// }
export interface GameState {
    room: Room;
    players: {
        [userId: string]: PlayerState;
    }
    letters: Letter[],
    turn: string; //userId
    board: BoardState | [];
    lastWord?: { words: WSTile[][], score: number };
    result?: {
        winnerId: string;
        reason: GameEndType;
    }
}

export interface PlayerState {
    userId: string;
    name: string;
    hand: Letter[] | [];
    score: number;
    time: number;

}

export interface WSTile {
    letter: ScrabbleCharacter;
    row: number;
    col: number;
}
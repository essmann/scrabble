import type { Room } from "./room";
export type Letter =
    | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J'
    | 'K' | 'L' | 'M' | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T'
    | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z'
    | '_'; // blank tile
interface BoardState {
    board: Tile[][];

}
type TileType = "DW" | "TW" | "TL" | "DL"
interface Tile {
    letter: Letter | null;
    type: TileType;

}
export interface GameState {
    room: Room;
    players: {
        [userId: string]: PlayerState;
    }
    letters: Letter[],
    turn: string; //userId
    board: BoardState | [];

}

export interface PlayerState {
    userId: string;
    name: string;
    hand: Letter[] | [];
    score: number;

}
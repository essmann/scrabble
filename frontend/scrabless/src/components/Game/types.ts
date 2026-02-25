
//For dragging

//Generic Tile Data. This is for placeable tiles, tiles that are placed, etc.




export interface TilePosition {
    row: number;
    col: number;
}


//=========TYPES========
export type ClickedTileDirection = "DOWN" | "RIGHT";
export type TileBonus = "DW" | "TW" | "TL" | "DL" | "STAR"
export type ScrabbleCharacter =
    | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J'
    | 'K' | 'L' | 'M' | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T'
    | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z'
    | '_'; // blank tile
export const DRAG_TYPE = {
    FROM_BOARD: "FROM_BOARD",
    FROM_HAND: "FROM_HAND",
} as const;

export type DragType = typeof DRAG_TYPE[keyof typeof DRAG_TYPE];


// export interface LetterWithScore {
//     letter: ScrabbleCharacter;
//     score: number;
// }
//=======BOARD========
export interface BoardTile {
    letter: ScrabbleCharacter | null;
    bonus: string | null;
}

export interface StagedTile {
    letter: ScrabbleCharacter
    row: number;
    col: number;
}
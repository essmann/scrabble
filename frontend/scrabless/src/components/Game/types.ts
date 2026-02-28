
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
    row: number;
    col: number;
}

export interface StagedTile {
    letter: ScrabbleCharacter
    row: number;
    col: number;
}

const SCRABBLE_SCORES: Record<string, number> = {
    A: 1, E: 1, I: 1, O: 1, U: 1, L: 1, N: 1, S: 1, T: 1, R: 1,
    D: 2, G: 2,
    B: 3, C: 3, M: 3, P: 3,
    F: 4, H: 4, V: 4, W: 4, Y: 4,
    K: 5,
    J: 8, X: 8,
    Q: 10, Z: 10, _: 1
};

export const getLetterScore = (letter: string): number =>
    SCRABBLE_SCORES[letter.toUpperCase()] ?? 0;
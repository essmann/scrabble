import { getLetterScore, type BoardTile, type StagedTile } from "./types";

export class Direction {
    public static up = "UP"
    public static side = "SIDE"
}


// function validateWords(crossWords: BoardTile[][], trie: any) {

// }
export function getDirection(move: StagedTile[]): Direction | null {
    if (move.length === 0) return null;

    const initialCol = move[0]!.col;
    const initialRow = move[0]!.row;
    let up = false;
    let side = false;

    for (const tile of move) {
        if (tile.row !== initialRow) up = true;
        if (tile.col !== initialCol) side = true;

        // If both directions are different, it’s invalid/mixed
        if (up && side) return null;
    }

    if (up) return Direction.up;
    if (side) return Direction.side;
    return null;
}

export function findVertical(board: BoardTile[][], row: number, col: number): BoardTile[][] | null {
    let r = row;
    let word: BoardTile[] = [];

    // Move up to find start
    while (r >= 0 && board[r]?.[col]?.letter) {
        r--;
    }

    r++; // move back to first valid tile

    // Collect downward
    while (r < 15) {
        const tile = board[r]?.[col];

        if (!tile?.letter) break;

        word.push(tile);
        r++;
    }

    console.log(`vertical: ${word}`);

    return word.length > 1 ? [word] : [];
}
export function findHorizontal(board: BoardTile[][], row: number, col: number): BoardTile[][] | null {
    let c = col;
    let word: BoardTile[] = [];
    // Move up to find start
    while (c >= 0 && board[row]?.[c]?.letter) {
        c--;
    }

    c++; // move back to first valid tile

    // Collect downward
    while (c < 15) {
        const tile = board[row]?.[c];

        if (!tile?.letter) break;

        word.push(tile);
        c++;
    }

    console.log(`horizontal: ${word}`);
    return word.length > 1 ? [word] : [];
}

function mergeBoard(board: BoardTile[][], staged: StagedTile[]): BoardTile[][] {
    // Deep clone to avoid mutating state
    const merged = board.map(row => row.map(tile => ({ ...tile })));
    for (const s of staged) {
        merged[s.row][s.col] = { ...merged[s.row][s.col], letter: s.letter };
    }
    return merged;
}

export type ComputeScoreResult = { score: number, crossWords: BoardTile[][] } | null

export function computeScore(move: StagedTile[], board: BoardTile[][]): ComputeScoreResult {
    const crossWords: BoardTile[][] = [];
    const direction = getDirection(move);
    const mergedBoard = mergeBoard(board, move);
    if (direction === Direction.up) {
        const verticalWord = findVertical(mergedBoard, move[0]!.row, move[0]!.col);
        verticalWord && crossWords.push(...verticalWord);
        for (const tile of move) {
            const horizontal = findHorizontal(mergedBoard, tile.row, tile.col);
            horizontal && crossWords.push(...horizontal);
        }
    } else if (direction === Direction.side) {
        const horizontalWord = findHorizontal(mergedBoard, move[0]!.row, move[0]!.col);
        horizontalWord && crossWords.push(...horizontalWord);
        for (const tile of move) {
            const vertical = findVertical(mergedBoard, tile.row, tile.col);
            vertical && crossWords.push(...vertical);
        }
    } else {
        for (const tile of move) {
            const horizontal = findHorizontal(mergedBoard, tile.row, tile.col);
            const vertical = findVertical(mergedBoard, tile.row, tile.col);
            horizontal && crossWords.push(...horizontal);
            vertical && crossWords.push(...vertical);
        }
    }
    if (crossWords.length == 0) return null;
    let score = 0;
    const scoredTiles = new Set<string>();
    for (const words of crossWords) {
        for (const letter of words) {
            const key = `${letter.row},${letter.col}`;
            if (scoredTiles.has(key)) continue;
            scoredTiles.add(key);
            score += getLetterScore(letter.letter!);
        }
    }
    //compute the bonuses
    for (const word of move) {
        let { row, col } = word;
        let bonus = board[row][col].bonus;
        let letterScore = getLetterScore(word.letter);
        console.log(word);
        console.log(bonus);
        if (bonus == "TL") {
            score -= letterScore;
            score += letterScore * 3;
        }
        else if (bonus == "DL") {
            let letterScore = getLetterScore(word.letter);
            score -= letterScore;
            score += letterScore * 2;
        }
        else if (bonus == "TW") {
            score *= 3;
        }
        else if (bonus == 'DW') {
            score *= 2;
        }
        console.log(crossWords);
    }
    return { score: score, crossWords: crossWords }
}
import type { BoardTile, StagedTile } from "./types";

interface TileStateProps {
    row: number;
    col: number;
    letter: string | null;
    bonus: string | null;
    staged?: StagedTile | null;
    isScored?: boolean;
    isPartOfLastWord?: boolean;
    isFirstOfLastWord?: boolean;
}

/**
 * Generate Tailwind CSS classes for a tile based on its state.
 * Handles: bonus squares, staged tiles, scored tiles, letter display.
 */
export function getTileClassName(props: TileStateProps): string {
    const { row, col, letter, bonus, staged, isScored, isPartOfLastWord, isFirstOfLastWord } = props;

    const baseClasses = "w-8 h-8 flex items-center justify-center border border-gray-300 text-xs font-bold cursor-pointer relative";

    // Letter on board
    if (letter) {
        return `${baseClasses} bg-white text-black`;
    }

    // Staged tile
    if (staged) {
        return `${baseClasses} bg-blue-300 text-black animate-pulse`;
    }

    // Scored word highlighting
    if (isScored) {
        if (isPartOfLastWord) {
            const highlight = isFirstOfLastWord ? "bg-yellow-300" : "bg-yellow-200";
            return `${baseClasses} ${highlight} text-black`;
        }
    }

    // Bonus squares (empty)
    if (bonus === "TRIPLE_WORD_SCORE") {
        return `${baseClasses} bg-red-500 text-white text-[10px] font-bold`;
    }
    if (bonus === "DOUBLE_WORD_SCORE") {
        return `${baseClasses} bg-pink-500 text-white text-[10px] font-bold`;
    }
    if (bonus === "TRIPLE_LETTER_SCORE") {
        return `${baseClasses} bg-blue-800 text-white text-[10px] font-bold`;
    }
    if (bonus === "DOUBLE_LETTER_SCORE") {
        return `${baseClasses} bg-cyan-500 text-white text-[10px] font-bold`;
    }

    // Start square
    if (row === 7 && col === 7) {
        return `${baseClasses} bg-orange-200`;
    }

    // Empty
    return `${baseClasses} bg-green-100`;
}

/**
 * Check if a tile is part of the last scored word.
 * scoredWord is an array of array of tiles (each inner array is one word)
 */
export function isPartOfScoredWord(
    row: number,
    col: number,
    scoredWord: BoardTile[][] | null
): boolean {
    if (!scoredWord) return false;
    return scoredWord.some((word) =>
        word.some((tile) => tile.row === row && tile.col === col)
    );
}

/**
 * Check if tile is the first of the last word (for coloring).
 */
export function isFirstTileOfLastWord(
    row: number,
    col: number,
    scoredWord: BoardTile[][] | null
): boolean {
    if (!scoredWord?.length) return false;
    const firstWord = scoredWord[0];
    if (!firstWord.length) return false;
    const first = firstWord[0];
    return first.row === row && first.col === col;
}

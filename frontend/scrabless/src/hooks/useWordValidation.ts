import { useMemo } from "react";
import type { BoardTile, StagedTile } from "../components/Game/types";
import { getDirection } from "../components/Game/utils";
import { getScrabbleTrie } from "../components/Game/trie";

/**
 * Validates if staged tiles form a valid word on the Scrabble board.
 * Checks: direction, connectivity, and dictionary lookup.
 */
export function useWordValidation(
    stagedTiles: StagedTile[],
    boardTilesWithLetters: StagedTile[],
    scoredWord: BoardTile[][] | null
): boolean {
    const trie = getScrabbleTrie();

    return useMemo(() => {
        if (!stagedTiles.length) return false;

        const direction = getDirection(stagedTiles);
        if (!direction && stagedTiles.length > 1) return false;

        // Check if tiles touch the board
        if (boardTilesWithLetters.length > 0) {
            const touchesBoard = stagedTiles.some((tile) =>
                boardTilesWithLetters.some((boardTile) => isTouching(tile, boardTile))
            );
            if (!touchesBoard) return false;

            // Check if all tiles are connected
            const allConnected = stagedTiles.every((tile) =>
                boardTilesWithLetters.some((boardTile) => isTouching(tile, boardTile)) ||
                stagedTiles.some((other) => other !== tile && isTouching(tile, other))
            );
            if (!allConnected) return false;
        }

        // Validate all words in scored words
        const wordsToCheck = [...(scoredWord ?? [])];
        const allValid = wordsToCheck.length > 0 && wordsToCheck.every((item) => {
            const word = Array.isArray(item)
                ? item.map((t) => t.letter!.toLowerCase()).join("")
                : String(item).toLowerCase();
            return word.length > 1 && trie.search(word);
        });

        return allValid;
    }, [stagedTiles, boardTilesWithLetters, scoredWord, trie]);
}

/**
 * Check if two tiles are orthogonally adjacent (within 1 square).
 */
function isTouching(tileA: StagedTile, tileB: StagedTile): boolean {
    const dr = Math.abs(tileA.row - tileB.row);
    const dc = Math.abs(tileA.col - tileB.col);
    return dr <= 1 && dc <= 1 && !(dr === 0 && dc === 0);
}

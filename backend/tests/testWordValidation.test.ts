import { describe, it, expect, beforeEach } from 'vitest';
import { GameManager, MoveTile, Letter, findVertical, findHorizontal } from "../src/gameManager.ts";
import { Room } from '../src/roomManager.ts';

describe('Scrabble GameManager', () => {
    let gm: GameManager;
    let room: Room;

    beforeEach(() => {
        gm = new GameManager();
        room = {
            id: 'room1',
            owner: { id: 'p1', name: 'Alice' },
            guest: { id: 'p2', name: 'Bob' },
        } as Room;
        gm.createGame(room);
    });

    it('should setup a board with several connected words', () => {
        const game = gm.getGame(room.id)!;

        // ───────────────────────────────────────────────
        // Original words
        // ───────────────────────────────────────────────
        // CAT horizontal (row 7, cols 7–9)
        const tiles: MoveTile[] = [
            // CAT
            { letter: 'C', row: 7, col: 7 },
            { letter: 'A', row: 7, col: 8 },
            { letter: 'T', row: 7, col: 9 },

            // ANT downward from A
            { letter: 'N', row: 8, col: 8 },
            { letter: 'T', row: 9, col: 8 },

            // ───────────────────────────────────────────────
            // Additional connected words
            // ───────────────────────────────────────────────

            // CAN vertical upward from C (C-A-N going up)
            { letter: 'N', row: 6, col: 7 },
            { letter: 'A', row: 5, col: 7 },

            // BAT horizontal crossing the T of CAT
            { letter: 'B', row: 7, col: 6 },
            // A already exists → { letter: 'A', row: 7, col: 7 } ← shared
            // T already exists → { letter: 'T', row: 7, col: 8 } ← shared

            // TANT vertical downward (extends ANT → TANT)
            { letter: 'A', row: 10, col: 8 },

            // RAT horizontal crossing the bottom T
            { letter: 'R', row: 9, col: 7 },
            // A already exists → { letter: 'A', row: 9, col: 8 } ← shared
            { letter: 'T', row: 9, col: 9 },
        ];

        // Place all tiles
        tiles.forEach((tile) => {
            game.board[tile.row][tile.col].letter = tile.letter;
        });

        // ───────────────────────────────────────────────
        // Quick visual checks
        // ───────────────────────────────────────────────
        expect(game.board[7][7].letter).toBe('C');
        expect(game.board[7][8].letter).toBe('A');
        expect(game.board[7][9].letter).toBe('T');
        expect(game.board[8][8].letter).toBe('N');
        expect(game.board[9][8].letter).toBe('T');
        expect(game.board[6][7].letter).toBe('N');
        expect(game.board[5][7].letter).toBe('A');
        expect(game.board[7][6].letter).toBe('B');
        expect(game.board[10][8].letter).toBe('A');
        expect(game.board[9][7].letter).toBe('R');
        expect(game.board[9][9].letter).toBe('T');

        // Optional: print the relevant region for debugging
        console.log("Board snippet around center (rows 5–10, cols 5–10):");
        const rows = [5, 6, 7, 8, 9, 10];
        const cols = [5, 6, 7, 8, 9, 10];
        const snippet = rows.map(r =>
            cols.map(c => game.board[r][c]?.letter ?? '_').join(' ')
        );
        console.log(snippet.join('\n'));

        // Try finding some words from different starting points
        console.log("Horizontal at row 7, col 6 → should find BAT");
        console.log(findHorizontal(game.board, 7, 6));

        console.log("Vertical at row 5, col 7 → should find CAN");
        console.log(findVertical(game.board, 5, 7));

        console.log("Vertical at row 7, col 8 → should find ANT or longer");
        console.log(findVertical(game.board, 7, 8));
    });
});
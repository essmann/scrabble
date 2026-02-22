interface Letter {
    letter: string | null,
    bonus: string | null;
}

interface LetterWithScore {
    letter: Letter;
    score: number;
}

const LETTER_SCORES: Record<string, number> = {
    A: 1, E: 1, I: 1, O: 1, U: 1, L: 1, N: 1, S: 1, T: 1, R: 1,
    D: 2, G: 2,
    B: 3, C: 3, M: 3, P: 3,
    F: 4, H: 4, V: 4, W: 4, Y: 4,
    K: 5,
    J: 8, X: 8,
    Q: 10, Z: 10,
};

function toLetterWithScore(tile: Letter): LetterWithScore {
    return {
        letter: tile,
        score: tile.letter ? (LETTER_SCORES[tile.letter] ?? 0) : 0,
    };
}

export function generateTiles(): LetterWithScore[][] {
    let tiles: Letter[][] = Array(15).fill(null).map(() =>
        Array(15).fill(null).map(() => ({ letter: null, bonus: null }))
    );

    tiles[7][7] = { letter: 'H', bonus: null };
    tiles[7][8] = { letter: 'E', bonus: null };
    tiles[7][9] = { letter: 'L', bonus: null };
    tiles[7][10] = { letter: 'L', bonus: null };
    tiles[7][11] = { letter: 'O', bonus: null };

    tiles[5][7] = { letter: 'C', bonus: null };
    tiles[6][7] = { letter: 'A', bonus: null };
    tiles[8][7] = { letter: 'I', bonus: null };

    tiles[9][9] = { letter: 'W', bonus: null };
    tiles[9][10] = { letter: 'O', bonus: null };
    tiles[9][11] = { letter: 'R', bonus: null };
    tiles[9][12] = { letter: 'D', bonus: null };

    // Triple Word Score
    tiles[0][0] = { letter: null, bonus: 'TW' };
    tiles[0][7] = { letter: null, bonus: 'TW' };
    tiles[0][14] = { letter: null, bonus: 'TW' };
    tiles[7][0] = { letter: null, bonus: 'TW' };
    tiles[7][14] = { letter: null, bonus: 'TW' };
    tiles[14][0] = { letter: null, bonus: 'TW' };
    tiles[14][7] = { letter: null, bonus: 'TW' };
    tiles[14][14] = { letter: null, bonus: 'TW' };

    // Double Word Score
    tiles[1][1] = { letter: null, bonus: 'DW' };
    tiles[2][2] = { letter: null, bonus: 'DW' };
    tiles[3][3] = { letter: null, bonus: 'DW' };
    tiles[4][4] = { letter: null, bonus: 'DW' };
    tiles[10][10] = { letter: null, bonus: 'DW' };
    tiles[11][11] = { letter: null, bonus: 'DW' };
    tiles[12][12] = { letter: null, bonus: 'DW' };
    tiles[13][13] = { letter: null, bonus: 'DW' };
    tiles[1][13] = { letter: null, bonus: 'DW' };
    tiles[2][12] = { letter: null, bonus: 'DW' };
    tiles[3][11] = { letter: null, bonus: 'DW' };
    tiles[4][10] = { letter: null, bonus: 'DW' };
    tiles[10][4] = { letter: null, bonus: 'DW' };
    tiles[11][3] = { letter: null, bonus: 'DW' };
    tiles[12][2] = { letter: null, bonus: 'DW' };
    tiles[13][1] = { letter: null, bonus: 'DW' };

    // Triple Letter Score
    tiles[1][5] = { letter: null, bonus: 'TL' };
    tiles[1][9] = { letter: null, bonus: 'TL' };
    tiles[5][1] = { letter: null, bonus: 'TL' };
    tiles[5][5] = { letter: null, bonus: 'TL' };
    tiles[5][9] = { letter: null, bonus: 'TL' };
    tiles[5][13] = { letter: null, bonus: 'TL' };
    tiles[9][1] = { letter: null, bonus: 'TL' };
    tiles[9][5] = { letter: null, bonus: 'TL' };
    tiles[9][13] = { letter: null, bonus: 'TL' };
    tiles[13][5] = { letter: null, bonus: 'TL' };
    tiles[13][9] = { letter: null, bonus: 'TL' };

    // Double Letter Score
    tiles[0][3] = { letter: null, bonus: 'DL' };
    tiles[0][11] = { letter: null, bonus: 'DL' };
    tiles[2][6] = { letter: null, bonus: 'DL' };
    tiles[2][8] = { letter: null, bonus: 'DL' };
    tiles[3][0] = { letter: null, bonus: 'DL' };
    tiles[3][7] = { letter: null, bonus: 'DL' };
    tiles[3][14] = { letter: null, bonus: 'DL' };
    tiles[6][2] = { letter: null, bonus: 'DL' };
    tiles[6][6] = { letter: null, bonus: 'DL' };
    tiles[6][8] = { letter: null, bonus: 'DL' };
    tiles[6][12] = { letter: null, bonus: 'DL' };
    tiles[7][3] = { letter: null, bonus: 'DL' };
    tiles[7][11] = { letter: null, bonus: 'DL' };
    tiles[8][2] = { letter: null, bonus: 'DL' };
    tiles[8][6] = { letter: null, bonus: 'DL' };
    tiles[8][8] = { letter: null, bonus: 'DL' };
    tiles[8][12] = { letter: null, bonus: 'DL' };
    tiles[11][0] = { letter: null, bonus: 'DL' };
    tiles[11][7] = { letter: null, bonus: 'DL' };
    tiles[11][14] = { letter: null, bonus: 'DL' };
    tiles[12][6] = { letter: null, bonus: 'DL' };
    tiles[12][8] = { letter: null, bonus: 'DL' };
    tiles[14][3] = { letter: null, bonus: 'DL' };
    tiles[14][11] = { letter: null, bonus: 'DL' };

    // Center star
    tiles[7][7] = { letter: 'H', bonus: 'STAR' };

    return tiles.map(row => row.map(toLetterWithScore));
}
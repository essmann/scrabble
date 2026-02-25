import { logger } from "./logger.js";
import type { Room } from "./roomManager.js";

export type Letter =
    | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J'
    | 'K' | 'L' | 'M' | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T'
    | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z'
    | '_';

type TileType = "DW" | "TW" | "TL" | "DL" | "STAR";

export interface Tile {
    letter: Letter | null;
    bonus?: TileType | null;
    row: number;
    col: number;
}

export interface MoveTile {
    letter: Letter;
    row: number;
    col: number;
}

export interface PlayerState {
    userId: string;
    name: string;
    hand: Letter[];
    score: number;
}

export interface GameState {
    room: Room;
    players: {
        [userId: string]: PlayerState;
    }
    letters: Letter[];
    turn: string;
    board: Tile[][];
}

const BONUS_MAP: Record<string, TileType> = {
    "0,0": "TW", "0,7": "TW", "0,14": "TW",
    "7,0": "TW", "7,14": "TW",
    "14,0": "TW", "14,7": "TW", "14,14": "TW",
    "1,1": "DW", "2,2": "DW", "3,3": "DW", "4,4": "DW",
    "1,13": "DW", "2,12": "DW", "3,11": "DW", "4,10": "DW",
    "13,1": "DW", "12,2": "DW", "11,3": "DW", "10,4": "DW",
    "13,13": "DW", "12,12": "DW", "11,11": "DW", "10,10": "DW",
    "7,7": "STAR",
    "1,5": "TL", "1,9": "TL",
    "5,1": "TL", "5,5": "TL", "5,9": "TL", "5,13": "TL",
    "9,1": "TL", "9,5": "TL", "9,9": "TL", "9,13": "TL",
    "13,5": "TL", "13,9": "TL",
    "0,3": "DL", "0,11": "DL",
    "2,6": "DL", "2,8": "DL",
    "3,0": "DL", "3,7": "DL", "3,14": "DL",
    "6,2": "DL", "6,6": "DL", "6,8": "DL", "6,12": "DL",
    "7,3": "DL", "7,11": "DL",
    "8,2": "DL", "8,6": "DL", "8,8": "DL", "8,12": "DL",
    "11,0": "DL", "11,7": "DL", "11,14": "DL",
    "12,6": "DL", "12,8": "DL",
    "14,3": "DL", "14,11": "DL",
};

function createEmptyBoard(): Tile[][] {
    return Array.from({ length: 15 }, (_, row) =>
        Array.from({ length: 15 }, (_, col) => ({
            letter: null,
            bonus: BONUS_MAP[`${row},${col}`] ?? null,
            row: row,
            col: col
        }))
    );
}

const scrabbleLetters: Record<string, { number: number; value: number }> = {
    'E': { number: 12, value: 1 },
    'A': { number: 9, value: 1 },
    'I': { number: 9, value: 1 },
    'O': { number: 8, value: 1 },
    'N': { number: 6, value: 1 },
    'R': { number: 6, value: 1 },
    'T': { number: 6, value: 1 },
    'L': { number: 4, value: 1 },
    'S': { number: 4, value: 1 },
    'U': { number: 4, value: 1 },
    'D': { number: 4, value: 2 },
    'G': { number: 3, value: 2 },
    'B': { number: 2, value: 3 },
    'C': { number: 2, value: 3 },
    'M': { number: 2, value: 3 },
    'P': { number: 2, value: 3 },
    'F': { number: 2, value: 4 },
    'H': { number: 2, value: 4 },
    'V': { number: 2, value: 4 },
    'W': { number: 2, value: 4 },
    'Y': { number: 2, value: 4 },
    'K': { number: 1, value: 5 },
    'J': { number: 1, value: 8 },
    'X': { number: 1, value: 8 },
    'Q': { number: 1, value: 10 },
    'Z': { number: 1, value: 10 },
    '_': { number: 2, value: 0 },
};
function getBonusValue(row: number, col: number): number {
    const key = `${row},${col}`;
    const tile = BONUS_MAP[key];

    switch (tile) {
        case "TW": return 3;     // Triple Word
        case "DW":
        case "STAR": return 2;   // Double Word (center counts as DW)
        case "TL": return 3;     // Triple Letter
        case "DL": return 2;     // Double Letter
        default: return 1;       // Normal tile
    }
}
const computeLetterScore = (letter: Letter): number => {
    return scrabbleLetters[letter.toUpperCase()]!.value;
}


function generateLetterArray(): Letter[] {
    const arr: Letter[] = [];
    for (const [key, value] of Object.entries(scrabbleLetters)) {
        const letter = key as Letter;
        for (let i = 0; i < value.number; i++) {
            arr.push(letter);
        }
    }
    return arr;
}
export function addLettersToHand(hand: Letter[], letterBag: Letter[]): Letter[] {
    const maxLettersInHand = 7;
    let tilesToAdd = maxLettersInHand - hand.length;
    tilesToAdd = Math.min(tilesToAdd, letterBag.length);

    const newLetters = letterBag.splice(0, tilesToAdd);

    hand.push(...newLetters);



    return hand;
}

export function removeLettersFromHand(lettersToRemove: Letter[], hand: Letter[]): Letter[] {
    console.log(`hand state: ${hand}. to remove: ${lettersToRemove}`);

    lettersToRemove.forEach(letter => {

        let foundIndex = hand.findIndex((char) => char == letter);
        console.log(`letter to remove: ${letter}. foundIndex : ${foundIndex}`);
        if (foundIndex !== -1) {
            hand.splice(foundIndex, 1);
        }

    });

    return hand;
}


type roomId = string;
enum Direction {
    "UP",
    "SIDE"
}


function getDirection(move: MoveTile[]): Direction | null {
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

    if (up) return Direction.UP;
    if (side) return Direction.SIDE;
    return null;
}


//Our letter will always be the last letter of the word.
export function findVertical(board: Tile[][], row: number, col: number): Tile[][] | null {
    let r = row;
    let word: Tile[] = [];

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

    return word.length > 1 ? [word] : [];
}

export function findHorizontal(board: Tile[][], row: number, col: number): Tile[][] | null {
    let c = col;
    let word: Tile[] = [];
    debugger;
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

    return word.length > 1 ? [word] : [];
}

function findCrossWords(move: MoveTile[], board: Tile[][]) {
    let SCRABBLE_HEIGHT = 14;
    let SCRABBLE_WIDTH = 14;
    let words = [];


    move.forEach(tile => {
        const { row, col } = tile;
        const side = [];
        const up = [];

        let r = row;
        while (r >= 0 && board[r]![col]?.letter) {
            up.push(board[r]![col]); // add to front
            r--;
        }

    });

    //Check horizontally
};


export class GameManager {
    private letters: Letter[] = generateLetterArray();
    private games = new Map<roomId, GameState>();

    createGame(room: Room): GameState {
        let _letters = this.shuffleArray(this.letters);

        let owner: PlayerState = {
            userId: room.owner.id,
            name: room.owner.name,
            hand: addLettersToHand([], _letters),
            score: 0,
        };

        let guest: PlayerState = {
            userId: room.guest!.id,
            name: room.guest!.name,
            hand: addLettersToHand([], _letters),
            score: 0,
        };

        const turn = Math.random() < 0.5 ? owner.userId : guest.userId;

        const newGameState: GameState = {
            room,
            players: {
                [room.owner.id]: owner,
                [room.guest!.id]: guest,
            },
            letters: _letters,
            turn,
            board: createEmptyBoard(),
        };

        this.games.set(room.id, newGameState);
        return newGameState;
    }

    deleteGame(roomId: roomId) {
        this.games.delete(roomId);
    }

    getGame(roomId: roomId) {
        return this.games.get(roomId);
    }


    computeScore(move: MoveTile[], board: Tile[][]) {
        const crossWords: Tile[][] = [];
        const direction = getDirection(move);

        if (!move.length) return crossWords;

        // Compute main word in move's direction only once
        if (direction === Direction.UP) {
            const verticalWord = findVertical(board, move[0]!.row, move[0]!.col);
            verticalWord && crossWords.push(...verticalWord);

            // Compute horizontal crosswords for each tile
            for (const tile of move) {
                const horizontal = findHorizontal(board, tile.row, tile.col);
                horizontal && crossWords.push(...horizontal);
            }
        } else if (direction === Direction.SIDE) {
            const horizontalWord = findHorizontal(board, move[0]!.row, move[0]!.col);
            horizontalWord && crossWords.push(...horizontalWord);

            // Compute vertical crosswords for each tile
            for (const tile of move) {
                const vertical = findVertical(board, tile.row, tile.col);
                vertical && crossWords.push(...vertical);
            }
        } else {
            // Mixed or single-tile move: compute both directions for each tile
            for (const tile of move) {
                const horizontal = findHorizontal(board, tile.row, tile.col);
                const vertical = findVertical(board, tile.row, tile.col);
                horizontal && crossWords.push(...horizontal);
                vertical && crossWords.push(...vertical);
            }
        }

        return crossWords;
    }

    makeMove(roomId: roomId, userId: string, move: MoveTile[]) {
        const game = this.getGame(roomId);
        if (!game) {
            logger.logError('GAME_STATE', 'Game not found', { roomId, userId, move });
            return;
        }
        const currentTurnId = game.turn;
        if (!game.players[currentTurnId]) {
            logger.logError('GAME_STATE', 'Player whose current turn it is, does not exist.', { roomId, userId, move });
            return;

        }

        // Log move attempt
        logger.logGameMove({
            roomId,
            playerId: userId,
            move: move.map(t => `${t.letter}@${t.row},${t.col}`).join(','),
            additionalInfo: { type: 'ATTEMPT' }
        });

        // Check turn
        if (userId !== currentTurnId) {
            logger.logGameMove({
                roomId,
                playerId: userId,
                move: move.map(t => `${t.letter}@${t.row},${t.col}`).join(','),
                additionalInfo: { type: 'ILLEGAL', reason: 'Not your turn' }
            });
            return;
        }

        const board = game.board;

        try {
            move.forEach(tile => {
                const { row, col } = tile;
                const serverTile = board[row]?.[col];
                if (!serverTile) throw new Error("Tile out of bounds");
                if (serverTile.letter !== null) throw new Error("Tile already occupied");

                board[row]![col] = tile;
            });
        } catch (err: any) {
            logger.logGameMove({
                roomId,
                playerId: userId,
                move: move.map(t => `${t.letter}@${t.row},${t.col}`).join(','),
                additionalInfo: { type: 'ILLEGAL', reason: err.message }
            });
            return;
        }

        // Update hand for current player
        const oldHand = game.players[currentTurnId]?.hand as Letter[];
        const lettersToRemove = move?.map((tile) => tile.letter);
        //Remove letters from hand, then repopulate with new letters
        const filteredHand = removeLettersFromHand(lettersToRemove, oldHand);

        // game.players[currentTurnId].hand  = filteredHand;
        // removeLettersFromHand(lettersToRemove, game.players[])
        const updatedHand = addLettersToHand(filteredHand, game.letters);


        // Switch turn
        const otherTurnId = game.room.guest?.id === currentTurnId ? game.room.owner.id : game.room.guest?.id;
        if (!otherTurnId) {
            logger.logError('GAME_STATE', 'Next player not found', { roomId, currentTurnId });
            return;
        }
        // game.players[]
        //Updating state
        // let score = 0;
        // move.map((letter) => score += computeScore(letter.letter));
        // game.players[currentTurnId].score += score;
        game.players[currentTurnId].hand = updatedHand;
        game.turn = otherTurnId;

        let arr = this.computeScore(move, game.board);

        let arr2: any = [];
        arr.map((tile) => {
            tile.map((t) => arr2.push(t.letter));
            arr2.push(" ");
        })

        // Log successful move
        logger.logGameMove({
            roomId,
            playerId: currentTurnId,
            move: move.map(t => `${t.letter}@${t.row},${t.col}`).join(','),
            additionalInfo: {
                type: 'SUCCESS',
                nextTurn: otherTurnId,
                // score: score,
                oldHand: oldHand,
                letterCount: game.letters.length,
                newHand: game.players[currentTurnId]?.hand

            }
        });

        logger.logGameMove({
            roomId,
            playerId: currentTurnId,
            move: move.map(t => `${t.letter}@${t.row},${t.col}`).join(','),
            additionalInfo: {
                type: 'TREE',

                words: arr2
            }
        });
    }

    /**
     * Helper to calculate a simple turn number based on moves made
     */






    shuffleArray(array: Letter[]): Letter[] {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = arr[i]!;
            arr[i] = arr[j]!;
            arr[j] = temp;
        }
        return arr;
    }
    getFilteredGameState(roomId: roomId, userId: string): GameState | undefined {
        const game = this.getGame(roomId);
        if (!game) return undefined;

        const filteredPlayers = Object.fromEntries(
            Object.entries(game.players).map(([id, player]) => [
                id,
                id === userId ? player : { ...player, hand: [] }
            ])
        );

        return {
            ...game,
            players: filteredPlayers,
        };
    }
}
import type { Room } from "./roomManager.js";

export type Letter =
    | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J'
    | 'K' | 'L' | 'M' | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T'
    | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z'
    | '_';

type TileType = "DW" | "TW" | "TL" | "DL" | "STAR";

interface Tile {
    letter: Letter | null;
    bonus?: TileType | null;
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

type roomId = string;

export class GameManager {
    private letters: Letter[] = generateLetterArray();
    private games = new Map<roomId, GameState>();

    createGame(room: Room): GameState {
        let _letters = this.shuffleArray(this.letters);

        let owner: PlayerState = {
            userId: room.owner.id,
            name: room.owner.name,
            hand: [],
            score: 0,
        };
        this.addLettersToHand(owner, _letters);

        let guest: PlayerState = {
            userId: room.guest!.id,
            name: room.guest!.name,
            hand: [],
            score: 0,
        };
        this.addLettersToHand(guest, _letters);

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

    makeMove(roomId: roomId, userId: string, move: Tile[]) {
        const game = this.getGame(roomId);
        if (!game) return;
        if (userId !== game.turn) {
            console.log("[ILLEGAL MOVE] -- not the player's turn.");
            return;
        }
        let board = game.board;


        move.forEach(tile => {
            const { row, col } = tile;
            let serverTile = board[row]![col];
            if (!serverTile) { throw new Error("Row or column out of bounds for the move.") };

            if (serverTile.letter !== null) { throw new Error("Tile already at position.") };
            board[row]![col] = tile;
        });
        //Assuming it's legal and everything is fine, let's update the state entirely.
        game.board = board;
        const currentTurnId = game.turn;
        let otherTurnId = game.room.guest?.id == currentTurnId ? game.room.owner.id : game.room.guest?.id;
        if (!otherTurnId) return;
        if (game.players[currentTurnId] == undefined || game.players[otherTurnId] == undefined) return;

        const updatedLetters = this.addLettersToHand(game.players[currentTurnId], game.letters);
        game.letters = updatedLetters;
        game.turn = otherTurnId as string;

    }

    addLettersToHand(player: PlayerState, letters: Letter[]): Letter[] {
        const maxLettersInHand = 7;
        debugger;
        let tilesToAdd = maxLettersInHand - player.hand.length;
        tilesToAdd = Math.min(tilesToAdd, letters.length);

        const newLetters = letters.splice(0, tilesToAdd);
        player.hand.push(...newLetters)
        return letters;
    }

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
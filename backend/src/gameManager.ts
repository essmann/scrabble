import type { Room } from "./roomManager.js";
type Letter =
    | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J'
    | 'K' | 'L' | 'M' | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T'
    | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z'
    | '_'; // blank tile

interface GameStartMessage {
    type: "game_start",
    playerState: PlayerState,
}
export interface PlayerState {
    userId: string;
    name: string;
    hand: Letter[] | [];
    score: number;

}
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


type roomId = string;
export class GameManager {
    private letters: Letter[] = generateLetterArray() as Letter[];

    private games = new Map<roomId, GameState>();
    //Room ID -> GameState

    createGame(room: Room): GameState {
        let _letters = this.shuffleArray(this.letters);

        let owner: PlayerState = {
            userId: room.owner.id,
            name: room.owner.name,
            hand: [],
            score: 0,
        };

        this.addLettersToHand(owner, _letters); //Removes letters from the pouch

        let guest: PlayerState = {
            userId: room.guest!.id,
            name: room.guest!.name,
            hand: [],
            score: 0,
        }
        this.addLettersToHand(guest, _letters); //Removes letters from the pouch

        let turn = Math.random() < 0.5 ? owner.userId : guest.userId;

        let newGameState: GameState = {
            room: room,
            players: {
                [room.owner.id]: owner,
                [room.guest!.id]: guest
            },
            letters: _letters,
            turn: turn,
            board: []
        }
        this.games.set(room.id, newGameState);
        return newGameState;

    }


    deleteGame(roomId: roomId) {
        this.games.delete(roomId);

    }

    getGame(roomId: roomId) {
        return this.games.get(roomId);
    }







    //Utility methods
    addLettersToHand(player: PlayerState, letters: Letter[]): Letter[] {
        let _hand = player.hand;
        const maxLettersInHand = 7;
        let tilesToAdd = maxLettersInHand - _hand.length;

        while (tilesToAdd > letters.length) {
            tilesToAdd--;
        }
        let newHand = letters.splice(0, tilesToAdd);
        player.hand = newHand;
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

}

let scrabbleLetters = {
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
    '_': { number: 2, value: 0 } // blank tiles
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
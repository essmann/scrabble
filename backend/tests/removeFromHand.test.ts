import { Letter, PlayerState, removeLettersFromHand } from "../src/gameManager";
import { describe, it, expect } from 'vitest';

describe('removeLettersFromHand', () => {

    function logState(player: PlayerState, lettersToRemove: Letter[]) {
        console.log('---');
        console.log('Player:', player.name, `(ID: ${player.userId})`);
        console.log('Hand before:', [...player.hand]);
        console.log('Letters to remove:', lettersToRemove);
    }

    it('removes letters correctly', () => {
        const player: PlayerState = {
            userId: '1',
            name: 'Alice',
            hand: ['A', 'B', 'A', 'C', 'E', 'F', 'A'],
            score: 0
        };
        const lettersToRemove: Letter[] = ['A', 'B', 'A'];

        logState(player, lettersToRemove);
        debugger;
        removeLettersFromHand(lettersToRemove, player);

        console.log('Hand after:', player.hand);
        expect(player.hand).toEqual(['C', 'E', 'F', 'A']);
    });

    it('removes letters that are not in hand safely', () => {
        const player: PlayerState = {
            userId: '2',
            name: 'Bob',
            hand: ['D', 'E', 'F'],
            score: 0
        };
        const lettersToRemove: Letter[] = ['A', 'B'];

        logState(player, lettersToRemove);

        removeLettersFromHand(lettersToRemove, player);

        console.log('Hand after:', player.hand);
        expect(player.hand).toEqual(['D', 'E', 'F']); // unchanged
    });

    it('removes all letters if needed', () => {
        const player: PlayerState = {
            userId: '3',
            name: 'Carol',
            hand: ['A', 'A', 'B'],
            score: 0
        };
        const lettersToRemove: Letter[] = ['A', 'A', 'B'];

        logState(player, lettersToRemove);

        removeLettersFromHand(lettersToRemove, player);

        console.log('Hand after:', player.hand);
        expect(player.hand).toEqual([]);
    });

    it('does not remove more occurrences than exist', () => {
        const player: PlayerState = {
            userId: '4',
            name: 'Dave',
            hand: ['A', 'A', 'B'],
            score: 0
        };
        const lettersToRemove: Letter[] = ['A', 'A', 'A'];

        logState(player, lettersToRemove);

        removeLettersFromHand(lettersToRemove, player);

        console.log('Hand after:', player.hand);
        expect(player.hand).toEqual(['B']);
    });

});

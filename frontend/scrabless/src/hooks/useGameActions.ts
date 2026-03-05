import { useRef, useEffect } from "react";
import successSound from "../assets/sounds/successNoise.mp3";
import type { BoardTile, ScrabbleCharacter } from "../components/Game/types";

/**
 * Parameters for the `useGameActions` hook.
 */
interface Params {
    /** The list of tiles the current player has staged on the board but not yet committed. */
    stagedTiles: any[];
    /** The unique identifier of the current user. */
    userId: string;
    /** The identifier of the game room this player belongs to. */
    roomId: string;
    /** Callback to dispatch a WebSocket message to the game server. */
    sendWsMessage: (msg: object) => void;

    validWord: boolean;
}

/**
 * `useGameActions` — Encapsulates all player game actions for a Scrabble session.
 *
 * Provides handlers for the three core in-game actions a player can take:
 * submitting a move, skipping their turn, or resigning from the game.
 * Also manages a success sound effect that plays on a valid move submission.
 *
 * @param params - See {@link Params}.
 * @returns An object containing `makeMove`, `skipTurn`, and `resign` action handlers.
 *
 * @example
 * ```tsx
 * const { makeMove, skipTurn, resign } = useGameActions({
 *   stagedTiles,
 *   userId: currentUser.id,
 *   roomId: room.id,
 *   sendWsMessage,
 * });
 *
 * return (
 *   <>
 *     <button onClick={makeMove}>Submit Move</button>
 *     <button onClick={skipTurn}>Skip</button>
 *     <button onClick={resign}>Resign</button>
 *   </>
 * );
 * ```
 */
export function useGameActions({
    stagedTiles,
    userId,
    roomId,
    sendWsMessage,
    validWord
}: Params) {
    const successAudioRef = useRef<HTMLAudioElement | null>(null);

    // Pre-load the success audio once on mount so it's ready to play without delay.
    useEffect(() => {
        successAudioRef.current = new Audio(successSound);
    }, []);

    /**
     * Plays the success sound effect.
     * Resets playback to the beginning each time so rapid re-triggers work correctly.
     * Silently no-ops if the audio element hasn't been initialized yet.
     */
    const playSuccess = () => {
        if (!successAudioRef.current) return;

        successAudioRef.current.pause();
        successAudioRef.current.currentTime = 0;
        successAudioRef.current.play();
    };

    /**
     * Submits the player's currently staged tiles as their move.
     *
     * Sends a `"move"` WebSocket message containing the staged tiles to the server,
     * then plays the success sound effect. The server is responsible for validating
     * the move and advancing the game state.
     *
     * Should only be called when `stagedTiles` is non-empty and it is the player's turn.
     */
    const makeMove = () => {
        if (!validWord || stagedTiles.length === 0) {
            console.log(stagedTiles);
            console.log("Move is invalid. Not submitting.");
            return;
        }
        const message = {
            type: "move",
            roomId,
            userId,
            message: stagedTiles,
        };

        sendWsMessage(message);
        playSuccess();
    };

    /**
     * Resigns the current player from the game.
     *
     * Sends a `"RESIGN"` WebSocket message to the server. The server should
     * handle ending the game or transferring control to remaining players.
     *
     * This action is typically irreversible.
     */
    const resign = () => {
        sendWsMessage({
            type: "RESIGN",
            userId,
            roomId,
        });
    };

    /**
     * Skips the current player's turn without placing any tiles.
     *
     * Sends a `"SKIP_TURN"` WebSocket message to the server, which should
     * advance the turn to the next player. Consecutive skips by all players
     * may trigger end-of-game logic depending on server rules.
     */
    const skipTurn = () => {
        sendWsMessage({
            type: "SKIP_TURN",
            userId,
            roomId,
        });
    };

    return {
        makeMove,
        resign,
        skipTurn,
    };
}
import { useEffect, useRef } from "react";
import type { WSTile } from "../types/game";
import type { StagedTile, ScrabbleCharacter } from "../components/Game/types";

interface UseBoardKeyboardProps {
    clickedTile: { row: number; col: number; direction: "RIGHT" | "DOWN" | null } | null;
    setClickedTile: (pos: { row: number; col: number }, keepDirection?: boolean) => void;
    stagedTiles: StagedTile[];
    setStagedTiles: React.Dispatch<React.SetStateAction<StagedTile[]>>;
    hand: ScrabbleCharacter[];
    addToHand: (letter: ScrabbleCharacter) => void;
    removeFromHand: (letter: ScrabbleCharacter) => void;
    board: { letter: string | null; bonus: string | null }[][];
    onSubmit: () => void;
    playClick: () => void;
}

function isEmptyTile(
    row: number,
    col: number,
    board: UseBoardKeyboardProps["board"],
    stagedTiles: StagedTile[]
): boolean {
    const tile = board[row]?.[col];
    if (!tile || tile.letter) return false;
    if (stagedTiles.some((t) => t.row === row && t.col === col)) return false;
    return true;
}

export function useBoardKeyboard({
    clickedTile,
    setClickedTile,
    stagedTiles,
    setStagedTiles,
    hand,
    addToHand,
    removeFromHand,
    board,
    onSubmit,
    playClick,
}: UseBoardKeyboardProps) {
    // Stable refs so the event listener always sees current values
    // without needing to be re-registered on every state change
    const stateRef = useRef({
        clickedTile,
        stagedTiles,
        hand,
    });

    useEffect(() => {
        stateRef.current = { clickedTile, stagedTiles, hand };
    });

    useEffect(() => {
        if (clickedTile == null) return;

        const handleKeyDown = (ev: KeyboardEvent) => {
            const { clickedTile, stagedTiles, hand } = stateRef.current;
            if (!clickedTile) return;

            // Arrow key navigation
            if (["ArrowUp", "ArrowDown", "ArrowRight", "ArrowLeft"].includes(ev.key)) {
                ev.preventDefault();
                const newPos = { row: clickedTile.row, col: clickedTile.col };
                switch (ev.key) {
                    case "ArrowLeft": newPos.col--; break;
                    case "ArrowRight": newPos.col++; break;
                    case "ArrowUp": newPos.row--; break;
                    case "ArrowDown": newPos.row++; break;
                }
                // Clamp to board bounds
                newPos.row = Math.max(0, Math.min(14, newPos.row));
                newPos.col = Math.max(0, Math.min(14, newPos.col));
                setClickedTile(newPos, true);
                return;
            }

            // Backspace: remove staged tile at cursor and move back
            if (ev.key === "Backspace") {
                const stagedTileAtPos = stagedTiles.find(
                    (t) => t.row === clickedTile.row && t.col === clickedTile.col
                );
                if (!stagedTileAtPos) return;

                addToHand(stagedTileAtPos.letter);
                setStagedTiles((prev) =>
                    prev.filter(
                        (t) => !(t.row === clickedTile.row && t.col === clickedTile.col)
                    )
                );

                const prevPosition =
                    clickedTile.direction === "RIGHT" || clickedTile.direction == null
                        ? { row: clickedTile.row, col: clickedTile.col - 1 }
                        : { row: clickedTile.row - 1, col: clickedTile.col };

                setClickedTile(prevPosition, true);
                playClick();
                return;
            }

            // Enter: submit if staged tiles exist
            if (ev.key === "Enter") {
                if (stagedTiles.length === 0) return;
                onSubmit();
                playClick();
                return;
            }

            // Escape: deselect tile
            if (ev.key === "Escape") {
                setClickedTile({ row: -1, col: -1 });
                return;
            }

            // Letter placement
            const letter = ev.key.toUpperCase() as ScrabbleCharacter;
            if (!/^[A-Z]$/.test(letter)) return;

            const letterInHand = hand.find((h) => h === letter);
            if (!letterInHand) return;
            if (!isEmptyTile(clickedTile.row, clickedTile.col, board, stagedTiles)) return;

            const newTile: StagedTile = {
                letter,
                row: clickedTile.row,
                col: clickedTile.col,
            };

            const nextPosition =
                clickedTile.direction === "RIGHT" || clickedTile.direction == null
                    ? { row: clickedTile.row, col: clickedTile.col + 1 }
                    : { row: clickedTile.row + 1, col: clickedTile.col };

            setStagedTiles((prev) => [...prev, newTile]);
            removeFromHand(letter);
            setClickedTile(nextPosition, true);
            playClick();
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);

        // Only re-register when clickedTile changes (null ↔ non-null),
        // not on every keystroke — state is read via stateRef
    }, [clickedTile == null]);
}
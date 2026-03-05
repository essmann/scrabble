import { useEffect, useRef } from "react";
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
    // Keep a ref to all mutable values so the listener never goes stale
    const stateRef = useRef({
        clickedTile,
        stagedTiles,
        hand,
        board,
        setClickedTile,
        setStagedTiles,
        addToHand,
        removeFromHand,
        onSubmit,
        playClick,
    });

    // Sync ref on every render — zero re-registration cost
    useEffect(() => {
        stateRef.current = {
            clickedTile,
            stagedTiles,
            hand,
            board,
            setClickedTile,
            setStagedTiles,
            addToHand,
            removeFromHand,
            onSubmit,
            playClick,
        };
    });

    useEffect(() => {
        const handleKeyDown = (ev: KeyboardEvent) => {
            const {
                clickedTile,
                stagedTiles,
                hand,
                board,
                setClickedTile,
                setStagedTiles,
                addToHand,
                removeFromHand,
                onSubmit,
                playClick,
            } = stateRef.current;

            if (!clickedTile) return;

            // Arrow key navigation
            if (["ArrowUp", "ArrowDown", "ArrowRight", "ArrowLeft"].includes(ev.key)) {
                ev.preventDefault();
                if (ev.ctrlKey) {
                    // Ctrl+Arrow: change typing direction without moving the cursor
                    const newDirection: "RIGHT" | "DOWN" =
                        ev.key === "ArrowUp" || ev.key === "ArrowDown" ? "DOWN" : "RIGHT";
                    // Temporarily force direction by moving 0 steps in the new axis,
                    // relying on setClickedTile to adopt the implicit direction from context —
                    // but since your setter infers direction from click, the cleanest fix is
                    // to smuggle it via a zero-step move in that axis:
                    const nudge =
                        newDirection === "DOWN"
                            ? { row: clickedTile.row + 0, col: clickedTile.col }
                            : { row: clickedTile.row, col: clickedTile.col + 0 };
                    setClickedTile(nudge, false); // false = don't keepDirection → resets it
                    return;
                }
                const newPos = { row: clickedTile.row, col: clickedTile.col };
                switch (ev.key) {
                    case "ArrowLeft": newPos.col--; break;
                    case "ArrowRight": newPos.col++; break;
                    case "ArrowUp": newPos.row--; break;
                    case "ArrowDown": newPos.row++; break;
                }
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

                // If nothing staged here, step back without removing anything
                const prevPosition =
                    clickedTile.direction === "DOWN"
                        ? { row: clickedTile.row - 1, col: clickedTile.col }
                        : { row: clickedTile.row, col: clickedTile.col - 1 };

                if (stagedTileAtPos) {
                    addToHand(stagedTileAtPos.letter);
                    setStagedTiles((prev) =>
                        prev.filter(
                            (t) => !(t.row === clickedTile.row && t.col === clickedTile.col)
                        )
                    );
                    playClick();
                }

                setClickedTile(prevPosition, true);
                return;
            }

            // Enter: submit if staged tiles exist
            if (ev.key === "Enter") {
                if (stagedTiles.length === 0) return;
                onSubmit();
                playClick();
                return;
            }

            // Escape: clear selection
            if (ev.key === "Escape") {
                setClickedTile({ row: -1, col: -1 });
                return;
            }

            // Letter placement
            const letter = ev.key.toUpperCase() as ScrabbleCharacter;
            if (!/^[A-Z]$/.test(letter)) return;
            if (!hand.find((h) => h === letter)) return;
            if (!isEmptyTile(clickedTile.row, clickedTile.col, board, stagedTiles)) return;

            const newTile: StagedTile = { letter, row: clickedTile.row, col: clickedTile.col };

            const nextPosition =
                clickedTile.direction === "DOWN"
                    ? { row: clickedTile.row + 1, col: clickedTile.col }
                    : { row: clickedTile.row, col: clickedTile.col + 1 };

            setStagedTiles((prev) => [...prev, newTile]);
            removeFromHand(letter);
            setClickedTile(nextPosition, true);
            playClick();
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);

        // Register once, forever — stateRef keeps everything fresh
    }, []);
}
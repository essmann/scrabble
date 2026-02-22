import { generateTiles } from "../../test/testTiles";
import { useEffect, useState } from "react";
import type { Letter } from "../../types/game";
import { DRAG_TYPE, type StagedTile } from "./Game";
import { useGame } from "../../context/GameContext";
import type { ClickedTileDirection } from "./types";

interface TilePosition {
    row: number;
    col: number;
}

interface BoardProps {
    className: string;
}

export function Board({ className }: BoardProps) {
    const [tiles] = useState(generateTiles());
    const { stagedTiles, setStagedTiles, clickedTile, setClickedTile, hand, addToHand, removeFromHand, stagedIsValidWord } = useGame();

    const isEmptyTile = (row: number, col: number) => {
        const tile = tiles[row][col];
        if (tile.letter) return false;

        const isStaged = stagedTiles.some(
            (t) => t.row === row && t.col === col
        );
        if (isStaged) return false;

        return true;
    };

    useEffect(() => {
        if (clickedTile == null) return;

        const handleKeyDown = (ev: KeyboardEvent) => {
            if (ev.key === "ArrowUp" || ev.key === "ArrowDown" || ev.key === "ArrowRight" || ev.key === "ArrowLeft") {
                let newPos = { row: clickedTile.row, col: clickedTile.col };
                switch (ev.key) {
                    case "ArrowLeft": newPos.col--; break;
                    case "ArrowRight": newPos.col++; break;
                    case "ArrowUp": newPos.row--; break;
                    case "ArrowDown": newPos.row++; break;
                }
                setClickedTile(newPos, true);
                return;
            }

            if (ev.key === 'Backspace') {
                const lastTile = stagedTiles[stagedTiles.length - 1];
                if (!lastTile) return;

                addToHand(lastTile.letter);
                setStagedTiles((prev) => prev.slice(0, -1));

                const prevPosition = clickedTile.direction === "RIGHT" || clickedTile.direction == null
                    ? { row: clickedTile.row, col: clickedTile.col - 1 }
                    : { row: clickedTile.row - 1, col: clickedTile.col };

                setClickedTile(prevPosition, true);
                return;
            }

            const letter = ev.key.toUpperCase() as Letter;
            const letterInHand = hand.find(h => h.letter === letter);
            if (!letterInHand) return;

            const newTile = { letter: letterInHand, row: clickedTile.row, col: clickedTile.col };

            const nextPosition = clickedTile.direction === "RIGHT" || clickedTile.direction == null
                ? { row: clickedTile.row, col: clickedTile.col + 1 }
                : { row: clickedTile.row + 1, col: clickedTile.col };

            setStagedTiles((prev) => [...prev, newTile]);
            removeFromHand(letter);
            setClickedTile(nextPosition, true);
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [clickedTile, stagedTiles, hand]);

    const onTilePlace = (tileToPlace: StagedTile, sourceTile?: TilePosition): boolean => {
        if (sourceTile) {
            if (!isEmptyTile(tileToPlace.row, tileToPlace.col)) return false;

            setStagedTiles((prev) => {
                const stagedMinusSource = prev.filter(
                    (p) => !(p.row === sourceTile.row && p.col === sourceTile.col)
                );
                return [...stagedMinusSource, tileToPlace];
            });

            return true;
        }

        if (isEmptyTile(tileToPlace.row, tileToPlace.col)) {
            setStagedTiles((prev) => [...prev, tileToPlace]);
            return true;
        }

        return false;
    };

    return (
        <div
            id="board"
            className={`${className} w-full lg:h-full lg:mt-0 md:mt-0`}
        >
            <div className="grid grid-cols-15 h-full">
                {tiles.map((row, rowIndex) =>
                    row.map((letter, colIndex) => {
                        const staged = stagedTiles.find(
                            (tile) => tile.row === rowIndex && tile.col === colIndex
                        );

                        return (
                            <Tile
                                key={`${rowIndex}-${colIndex}`}
                                letter={staged ? staged.letter.letter : letter.letter}
                                type={letter.bonus}
                                row={rowIndex}
                                col={colIndex}
                                staged={!!staged}
                                stagedTile={staged}
                                score={staged ? staged.letter.score : 0}
                                onTilePlace={onTilePlace}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
}

function Tile({
    letter,
    type,
    row,
    col,
    staged,
    stagedTile,
    onTilePlace,
    score,
}: {
    letter: string | null;
    type: string | null;
    row: number;
    col: number;
    staged: boolean;
    stagedTile?: StagedTile;
    score: number;
    onTilePlace: (tileToPlace: StagedTile, sourceTile?: { row: number; col: number }) => boolean;
}) {
    const { clickedTile, setClickedTile, stagedIsValidWord } = useGame();

    const isClicked = clickedTile?.row === row && clickedTile?.col === col;

    let bg = "bg-gray-300";

    if (staged) {
        bg = "bg-yellow-[#f0b860]";
    } else {
        switch (type) {
            case "DW": bg = "bg-[#e4a2a3]"; break;
            case "TW": bg = "bg-[#bf4e4e]"; break;
            case "TL": bg = "bg-[#0c679c]"; break;
            case "DL": bg = "bg-[#68a2c3]"; break;
            default: bg = "bg-[#c4c4d1] border rounded-sm";
        }
    }

    function onDragOver(event: React.DragEvent) {
        event.preventDefault();
        event.dataTransfer.dropEffect = letter ? "none" : "move";
    }

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();

        const fromBoard = e.dataTransfer.getData(DRAG_TYPE.FROM_BOARD);
        const fromHand = e.dataTransfer.getData(DRAG_TYPE.FROM_HAND);

        if (!fromHand && !fromBoard) return;

        if (fromBoard) {
            const sourceTile = JSON.parse(fromBoard);
            onTilePlace(
                { letter: sourceTile.letter, row, col },
                { row: sourceTile.row, col: sourceTile.col }
            );
            return;
        }

        const letterWithScore = JSON.parse(fromHand);
        if (!isValidLetter(letterWithScore.letter)) return;
        onTilePlace({ letter: letterWithScore, row, col });
    };

    const onDragStart = (event: React.DragEvent) => {
        if (!stagedTile || !staged) return;
        event.dataTransfer.setData(DRAG_TYPE.FROM_BOARD, JSON.stringify(stagedTile));
    };

    return (
        <div
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragStart={onDragStart}
            draggable={staged}
            onClick={() => setClickedTile({ row, col })}
            className={`
                ${bg}
                aspect-square flex items-center justify-center
                border w-full h-full box-border
                text-[70%] select-none relative
                font-extrabold text-white
                lg:rounded-[0.6rem]
                ${staged ? "font-bold hover:bg-yellow-400 border-[#c89e33] lg:border-2" : "border-black"}
                ${staged && "lrounded-md border lg:rounded-md bg-[#edc27d] lg:-border-2 lg:rounded-[0.4rem] lg:text-2xl lg:text-black text-black"}
                ${staged && stagedIsValidWord && "border-green-300"}
                ${staged && !stagedIsValidWord && "border-red-500 "}
            `}
        >
            <div>
                {letter || (type && type !== "STAR" ? type : "")}
            </div>
            <div className="absolute left-[15%] bottom-[7%] text-[70%]">
                {letter !== null && score}
            </div>
            {isClicked && <ArrowOverlay clickDirection={clickedTile.direction} />}
        </div>
    );
}

function isValidLetter(value: string): value is Letter {
    return /^[A-Z_]$/.test(value);
}

function ArrowOverlay({ clickDirection }: { clickDirection: ClickedTileDirection | null }) {
    if (clickDirection == null) return null;

    return (
        <div className="absolute h-full w-full flex items-center justify-center bg-[#333333] rounded-md opacity-90">
            {clickDirection === "DOWN" ? (
                <svg className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19V5m0 14-4-4m4 4 4-4" />
                </svg>
            ) : (
                <svg className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 12H5m14 0-4 4m4-4-4-4" />
                </svg>
            )}
        </div>
    );
}
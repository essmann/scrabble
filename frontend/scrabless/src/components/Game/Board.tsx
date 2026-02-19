import { generateTiles } from "../../test/testTiles";
import { useState } from "react";
import type { Letter } from "../../types/game";
import { DRAG_TYPE, type StagedTile } from "./Game";

interface TilePosition {
    row: number;
    col: number;
}

interface BoardProps {
    className: string;
    stagedTiles: StagedTile[];
    setStagedTiles: React.Dispatch<React.SetStateAction<StagedTile[]>>;
}

export function Board({ className, stagedTiles, setStagedTiles }: BoardProps) {
    const [tiles] = useState(generateTiles());

    const isEmptyTile = (row: number, col: number) => {
        const tile = tiles[row][col];
        if (tile.letter) return false;

        const isStaged = stagedTiles.some(
            (t) => t.row === row && t.col === col
        );
        if (isStaged) return false;

        return true;
    };

    const onTilePlace = (
        tileToPlace: StagedTile,
        sourceTile?: TilePosition
    ): boolean => {

        // REPOSITION
        if (sourceTile) {
            if (!isEmptyTile(tileToPlace.row, tileToPlace.col)) {
                return false;
            }

            setStagedTiles((prev) => {
                const stagedMinusSource = prev.filter(
                    (p) =>
                        !(
                            p.row === sourceTile.row &&
                            p.col === sourceTile.col
                        )
                );

                return [...stagedMinusSource, tileToPlace];
            });

            return true;
        }

        // NEW TILE FROM HAND
        if (isEmptyTile(tileToPlace.row, tileToPlace.col)) {
            setStagedTiles((prev) => [...prev, tileToPlace]);
            return true;
        }

        return false;
    };

    return (
        <>
            <div
                id="board"
                className={`${className} w-full lg:h-full lg:mt-0 md:mt-0`}
            >
                <div className="grid grid-cols-15 h-full">
                    {tiles.map((row, rowIndex) =>
                        row.map((letter, colIndex) => {
                            const staged = stagedTiles.find(
                                (tile) =>
                                    tile.row === rowIndex &&
                                    tile.col === colIndex
                            );

                            return (
                                <Tile
                                    key={`${rowIndex}-${colIndex}`}
                                    letter={
                                        staged
                                            ? staged.letter
                                            : letter.letter
                                    }
                                    type={letter.bonus}
                                    row={rowIndex}
                                    col={colIndex}
                                    staged={!!staged}
                                    score={0}
                                    onTilePlace={onTilePlace}
                                />
                            );
                        })
                    )}
                </div>
            </div>


        </>
    );
}

function Tile({
    letter,
    type,
    row,
    col,
    staged,
    onTilePlace,
    score,
}: {
    letter: string | null;
    type: string | null;
    row: number;
    col: number;
    staged: boolean;
    score: number;
    onTilePlace: (
        tileToPlace: StagedTile,
        sourceTile?: { row: number; col: number }
    ) => boolean;
}) {

    let bg = "bg-gray-300";

    if (staged) {
        bg = "bg-yellow-500";
    } else {
        switch (type) {
            case "DW":
                bg = "bg-pink-300";
                break;
            case "TW":
                bg = "bg-red-600";
                break;
            case "TL":
                bg = "bg-blue-700";
                break;
            case "DL":
                bg = "bg-blue-300";
                break;
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

        const tileData = fromHand || fromBoard;
        if (!tileData) return;

        if (fromBoard) {
            const sourceTile = JSON.parse(fromBoard);
            onTilePlace(
                { letter: sourceTile.letter, row, col },
                { row: sourceTile.row, col: sourceTile.col }
            );
            return;
        }

        if (!isValidLetter(fromHand)) return;

        onTilePlace({ letter: fromHand, row, col });
    };

    const onDragStart = (event: React.DragEvent) => {
        if (!letter || !staged) return;

        event.dataTransfer.setData(
            DRAG_TYPE.FROM_BOARD,
            JSON.stringify({ letter, row, col })
        );
    };

    return (
        <div
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragStart={onDragStart}
            draggable={staged}
            className={`
                ${bg}
                aspect-square flex items-center justify-center
                border border-black w-full h-full box-border
                text-[70%] select-none relative
                ${staged ? "font-bold hover:bg-yellow-400" : ""}
            `}
        >
            <div>
                {letter || (type && type !== "STAR" ? type : "")}
            </div>

            <div className="absolute left-[15%] bottom-[7%] text-[70%]">
                {letter !== null && score}
            </div>
        </div>
    );
}

function isValidLetter(value: string): value is Letter {
    return /^[A-Z_]$/.test(value);
}
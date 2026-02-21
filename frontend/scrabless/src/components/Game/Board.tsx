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
    const { stagedTiles, setStagedTiles, clickedTile, setClickedTile, clickedTileDirection, hand, removeFromHand } = useGame();

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
            console.log(ev.key);
            if (ev.key == 'Backspace') {

            }
            const letter = ev.key.toUpperCase() as Letter;
            if (!hand.includes(letter)) return;

            const newTile = { letter: letter, row: clickedTile.row, col: clickedTile.col };

            console.log(newTile);
            let updatedClickedTilePosition =
                clickedTileDirection == "RIGHT" || clickedTileDirection == null ?
                    { row: clickedTile.row, col: clickedTile.col + 1, updateTileDirection: false }
                    :
                    { row: clickedTile.row + 1, col: clickedTile.col, updateTileDirection: false }
            console.log(`[KEYBOARD] current tile direction: ${clickedTileDirection}`);
            console.log(`[KEYBOARD] ${JSON.stringify(updatedClickedTilePosition)} `)
            //Place a tile at the position of the selectedTile.
            setStagedTiles((prev) => [...prev, newTile])
            removeFromHand(letter);

            setClickedTile(updatedClickedTilePosition);

        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [clickedTile, clickedTileDirection]);

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
    const { clickedTile, setClickedTile, clickedTileDirection, setClickedTileDirection } = useGame();
    const [clicked, setClicked] = useState(false);
    let bg = "bg-gray-300";

    if (staged) {
        bg = "bg-yellow-[#f0b860]";
    } else {
        switch (type) {
            case "DW":
                bg = "bg-[#e4a2a3]";
                break;
            case "TW":
                bg = "bg-[#bf4e4e]";
                break;
            case "TL":
                bg = "bg-[#0c679c]";
                break;
            case "DL":
                bg = "bg-[#68a2c3]";
                break;
            default:
                bg = "bg-[#c4c4d1] border rounded-sm";
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
            onClick={() => {
                let _clickedTile = { row: row, col: col } as TilePosition;

                setClickedTile(_clickedTile);

            }}
            className={`
                ${bg}
                aspect-square flex items-center justify-center
                border  w-full h-full box-border
                text-[70%] select-none relative
                font-extrabold
                text-white
                lg:rounded-[0.6rem]
                ${staged ? "font-bold hover:bg-yellow-400 border-[#c89e33] lg:border-2 " : "border-black"}
                ${staged && " lrounded-md border  lg:rounded-md bg-[#edc27d]  lg:-border-2 lg:rounded-[0.4rem] lg:text-2xl lg:text-black text-black  "}

            `}
        >
            <div>
                {letter || (type && type !== "STAR" ? type : "")}
            </div>

            <div className="absolute left-[15%] bottom-[7%] text-[70%]">
                {letter !== null && score}
            </div>
            {clickedTile?.row == row && clickedTile?.col == col && <ArrowOverlay clickDirection={clickedTileDirection} />}

        </div>
    );
}

function isValidLetter(value: string): value is Letter {
    return /^[A-Z_]$/.test(value);
}

function ArrowOverlay({ clickDirection }: { clickDirection: ClickedTileDirection | null }) {
    if (clickDirection == null) return;
    return (

        <div id="arrow_overlay" className="absolute  h-full w-full flex items-center justify-center  bg-[#333333] rounded-md opacity-90">

            {/* Arrow Down */}
            {clickDirection == "DOWN" ? (<svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19V5m0 14-4-4m4 4 4-4" />
            </svg>) :
                <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 12H5m14 0-4 4m4-4-4-4" />
                </svg>}


        </div>
    )
}
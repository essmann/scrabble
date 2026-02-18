import { generateTiles } from "../../test/testTiles"
import { useEffect, useRef, useState } from "react";
import type { Letter } from "../../types/game";
import { DRAG_TYPE, type StagedTile } from "./Game";



interface TilePosition {
    row: number;
    col: number;
}
interface BoardProps {
    className: string;
    stagedTiles: StagedTile[];
    setStagedTiles: React.Dispatch<React.SetStateAction<StagedTile[]>>
}
export function Board({ className, stagedTiles, setStagedTiles }: BoardProps) {
    const [tiles, setTiles] = useState(generateTiles());
    console.log("stagedtiles");
    console.log(stagedTiles);

    const tilesCopy = tiles;


    const onTilePlace = (
        tileToPlace: StagedTile,
        sourceTile?: TilePosition
    ): boolean => {

        console.log("[MOVE] ---- onTilePlace called ----");
        console.log("[MOVE] Tile to place:", tileToPlace);
        console.log("[MOVE] Source tile:", sourceTile);

        // 🟢 REPOSITION LOGIC
        if (sourceTile) {

            // Check if destination is empty
            if (!isEmptyTile(tileToPlace.row, tileToPlace.col)) {
                console.log("[MOVE] Destination not empty. Reposition failed.");
                return false;
            }

            setStagedTiles((prev) => {
                console.log("[MOVE] Previous staged tiles:", prev);

                // Remove the source tile (exact match only)
                const stagedMinusSource = prev.filter(
                    (p) => !(p.row === sourceTile.row && p.col === sourceTile.col)
                );

                console.log("[MOVE] After removing source:", stagedMinusSource);
                console.log("[MOVE] Adding destination tile:", tileToPlace);

                const updated = [...stagedMinusSource, tileToPlace];

                console.log("[MOVE] Updated staged tiles:", updated);

                return updated;
            });

            console.log("[MOVE] Reposition successful.");
            return true;
        }

        // 🟢 NEW TILE FROM HAND
        if (isEmptyTile(tileToPlace.row, tileToPlace.col)) {

            setStagedTiles((prev) => {
                console.log("[MOVE] Staging new tile. Previous:", prev);

                const updated = [...prev, tileToPlace];

                console.log("[MOVE] Updated staged tiles:", updated);

                return updated;
            });

            console.log("[MOVE] New tile staged successfully.");
            return true;
        }

        console.log("[MOVE] Tile placement failed — destination occupied.");
        return false;
    };

    // const onTileRemove = (tile: StagedTile) : boolean => {
    // }
    const isEmptyTile = (row: number, col: number) => {
        const tile = tiles[row][col];
        if (tile.letter) return false;  // committed letter in tiles state

        const isStaged = stagedTiles.some(t => t.row === row && t.col === col);
        if (isStaged) return false;     // staged letter not yet in tiles state

        return true;
    }

    return (
        <div className={className}>
            {tiles.map((row, rowIndex) => {
                return <div id="row" className="w-full">

                    {
                        row.map((letter, colIndex) => {
                            const staged = stagedTiles.find((tile) => tile.col == colIndex && tile.row == rowIndex)
                            return <div id="col" data-row={rowIndex} data-col={colIndex} className=""
                            >
                                <Tile

                                    letter={staged ? staged.letter : letter.letter}
                                    type={letter.bonus}
                                    row={rowIndex}
                                    col={colIndex}
                                    staged={staged ? true : false}
                                    onTilePlace={onTilePlace} />
                            </div>
                        })
                    }
                </div>

            })}
        </div>
    )
}

function Tile({ letter, type, row, col, staged, onTilePlace }: {
    letter: string | null,
    type: string | null,
    row: number,
    col: number,
    staged: boolean,
    onTilePlace: (tileToPlace: StagedTile, sourceTile?: TilePosition) => boolean
}) {
    let styling = "";
    function onDragOver(event: React.DragEvent) {
        event.preventDefault();
        event.dataTransfer.dropEffect = letter ? "none" : "move";

    }
    //Called when a draggable element is dropped onto the board.
    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        console.log("[MOVE] drop called");


        //Moving already existing piece from the board to another position:

        const repositionData = e.dataTransfer.getData(DRAG_TYPE.FROM_BOARD);

        if (repositionData) {
            const sourceTile = JSON.parse(repositionData);
            console.log("[MOVE]", sourceTile, { letter: letter, row: row, col: col });

            let success = onTilePlace(
                { letter: sourceTile.letter, row, col },  // new position
                { row: sourceTile.row, col: sourceTile.col } // original position
            );

            if (success) {
                console.log("[MOVE] Repositioned letter successfully");
            }
            else {
                console.log("[MOVE] Couldn't reposition staged letter");
            }
        }
        const data = e.dataTransfer.getData(DRAG_TYPE.FROM_HAND);
        if (!data) return;

        if (!isValidLetter(data)) {
            console.log("[MOVE] Invalid letter:", data);
            return;
        }

        let stagedLetter = { letter: data, row, col }; // TypeScript now knows data is Letter
        let success = onTilePlace(stagedLetter);
        if (success) {
            console.log("[MOVE] Successfully staged letter");
        }
        else {
            console.log("[MOVE] Couldn't stage letter.");
        }
    }


    switch (type) {
        case "DW":
            styling = "bg-[#e4a2a3]";
            break;
        case "TW":
            styling = "bg-[#bf4e4e]";
            break;
        case "TL":
            styling = "bg-[#0c679c]";
            break;
        case "DL":
            styling = "bg-[#68a2c3]";
            break;
        default:
            styling = "bg-[#c4c4d1] border rounded-sm";
    }


    //For staged tiles

    const onDragStart = (event: React.DragEvent) => {
        if (!letter || !staged) return;
        event.dataTransfer.setData(DRAG_TYPE.FROM_BOARD, JSON.stringify({ letter, row, col }));
        console.log("[MOVE] Dragging a staged tile");
        console.log("[MOVE]", JSON.stringify({ letter, row, col }));

    }
    const onDrag = (event: React.DragEvent) => { }
    const onDragEnd = (event: React.DragEvent) => { }

    return (
        <div onDragOver={onDragOver}
            onDrop={onDrop}
            onDragStart={onDragStart}
            draggable={staged}
            className={`${styling} letter select-none hover:cursor-pointer hover:bg-gray-400 aspect-square min-w-full min-h-full flex justify-center items-center text-white border-black border rounded-sm `}>
            {letter || (type && type !== 'STAR' ? type : '')}
        </div>
    );
}
function isValidLetter(value: string): value is Letter {
    return /^[A-Z_]$/.test(value);  // ← add _ for blank tiles
}
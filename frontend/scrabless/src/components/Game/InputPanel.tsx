import { useState } from "react";
import type { Letter } from "../../types/game";
import { DRAG_TYPE } from "./Game";

interface Props {
    hand: Letter[];
    removeStagedTile: (row: number, col: number) => void;
    setHand: (value: React.SetStateAction<Letter[]>) => void;
}

export function InputPanel({ hand, removeStagedTile, setHand }: Props) {
    const removeLetterFromHand = (letter: Letter) => {
        setHand(prev => {
            let found = false;
            return prev.filter(l => {
                if (!found && l === letter) {
                    found = true;
                    return false;
                }
                return true;
            });
        });
    };

    const onDragOver = (event: React.DragEvent) => {
        // Allow dropping if the dragged tile is from the board
        event.preventDefault();
        event.dataTransfer.dropEffect = "none";
        const data = event.dataTransfer.getData(DRAG_TYPE.FROM_BOARD);
        if (data) event.dataTransfer.dropEffect = "move";
    };

    const onDrop = (event: React.DragEvent) => {
        // Handle dropping a tile from the board back to the hand
        event.preventDefault();
        const data = event.dataTransfer.getData(DRAG_TYPE.FROM_BOARD);
        if (!data) return;

        const sourceTile = JSON.parse(data);
        removeStagedTile(sourceTile.row, sourceTile.col);
        setHand(prev => [...prev, sourceTile.letter]);
    };

    return (
        <div className="w-full">
            <div
                className="flex  w-full bg-[#2C2C38]  rounded-sm "
                onDragOver={onDragOver}
                onDrop={onDrop}
            >
                <div className="flex  bg-[#333333] w-full justify-around">
                    {hand.map((letter, i) => (
                        <Tile key={i} letter={letter} removeFromHand={removeLetterFromHand} />
                    ))}
                </div>
            </div>
        </div>
    );
}

interface TileProps {
    letter: Letter;
    removeFromHand: (letter: Letter) => void;
}

function Tile({ letter, removeFromHand }: TileProps) {
    const [isDragged, setIsDragged] = useState(false);

    return (
        <div
            draggable
            onDragStart={e => {
                e.dataTransfer.setData(DRAG_TYPE.FROM_HAND, letter);
                setIsDragged(true);
            }}
            onDragEnd={e => {
                if (e.dataTransfer.dropEffect !== "none") removeFromHand(letter);
                setIsDragged(false);
            }}
            className={`
               aspect-square lg:w-12 sm:w-10 w-[10%]
                rounded-md border border-[#F1C554]
                border-1
                lg:text-2xl
                text-[#22222B]
                font-black
                hover:cursor-grab transition-all
                ${isDragged ? "invisible opacity-40 bg-green-400" : "bg-yellow-200"}
            `}
        >
            {letter}
        </div>
    );
}



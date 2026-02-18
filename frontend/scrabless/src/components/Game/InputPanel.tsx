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
        <div>
            <div
                className="max-w-3xl w-full bg-[#2C2C38] mt-2 rounded-sm p-2"
                onDragOver={onDragOver}
                onDrop={onDrop}
            >
                <div className="flex p-2 justify-center bg-[#333333]">
                    {hand.map((letter, i) => (
                        <Tile key={i} letter={letter} removeFromHand={removeLetterFromHand} />
                    ))}
                </div>
            </div>
            <Buttons myTurn={false} />
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
                select-none p-3 mx-6 w-16 aspect-square
                rounded-md border border-black
                shrink-0
                hover:cursor-grab transition-all
                ${isDragged ? "invisible opacity-40 bg-green-400" : "bg-yellow-200"}
            `}
        >
            {letter}
        </div>
    );
}


function Buttons({ myTurn }: { myTurn: boolean }) {

    return (
        <div className="flex justify-between *:p-5  *:rounded-sm  *:flex-1 gap-10 *:bg-[#5A5A70] *:mt-5 *:text-white *:font-bold">
            <button>Resign</button>
            <button>Skip</button>
            <button>Submit</button>
            <button>Swap</button>


        </div>

    )
}
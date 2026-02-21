import { useState } from "react";
import type { Letter } from "../../types/game";
import { DRAG_TYPE, type StagedTile } from "./Game";

import shuffleIcon from "../../assets/arrows-shuffle.svg";
import { useGame } from "../../context/GameContext";
interface Props {
    removeStagedTile: (row: number, col: number) => void;
    onSubmit: () => void;
}

export function InputPanel({ removeStagedTile, onSubmit }: Props) {
    const { hand, setHand } = useGame();
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
        <div className="w-full flex flex-col lg:gap-1  ">
            <div
                className="flex  w-full bg-[#33333]  rounded-sm "
                onDragOver={onDragOver}
                onDrop={onDrop}
            >
                <button className="bg-[#33333]">
                    <ShuffleIcon />
                </button>
                <div className="flex  bg-[#3e3e47] w-full lg:mt-1 rounded-md lg:justify-center justify-around lg:gap-3">
                    {hand.map((letter, i) => (
                        <Tile key={i} letter={letter} removeFromHand={removeLetterFromHand} />
                    ))}
                </div>
                <button>
                    <WithdrawIcon />
                </button>

            </div>
            <Buttons onSubmit={onSubmit} />
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
                rounded-md border border-[#c89e33]
                border-1
                lg:border-2
                lg:rounded-[0.4rem]
                lg:text-2xl
                text-[#22222B]
                font-black
                hover:cursor-grab transition-all
                ${isDragged ? "invisible opacity-40 bg-green-400" : "bg-[#edc27d]"}
            `}
        >
            {letter}
        </div>
    );
}

function Buttons({ onSubmit }: { onSubmit: () => void }) {

    return (
        <div id="btns" className=" lg:*:p-3 flex justify-center lg:gap-5  gap-2 mt-2 lg:mt-2 bg-[#2C2C38]  ">
            <button className="bg-[#333333] rounded-md text-white font-bold border-black border-1 flex-1  ">Resign</button>
            <button className="bg-[#333333] rounded-md text-white font-bold border-black border-1  flex-1">Skip</button>
            <button className=" bg-[#333333] rounded-md  text-white font-bold border-black border-1 flex-1"> Swap</button>
            <button className=" bg-[#4DD9E8] rounded-md text-white font-bold border-black border-1 flex-1 " onClick={onSubmit}>Submit</button>

        </div>
    )
}


function ShuffleIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6 lg:w-12 lg:h-8 text-white"
        >
            <path d="M18 4l3 3l-3 3" />
            <path d="M18 20l3 -3l-3 -3" />
            <path d="M3 7h3a5 5 0 0 1 5 5a5 5 0 0 0 5 5h5" />
            <path d="M21 7h-5a4.978 4.978 0 0 0 -3 1m-4 8a4.984 4 0 0 1 -3 1h-3" />
        </svg>
    )
}

function WithdrawIcon() {
    return (

        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6 lg:w-12 lg:h-8 text-white"
        >
            <path stroke="none" fill="none" d="M0 0h24v24H0z" />
            <path d="M17 20v-11.5a4.5 4.5 0 1 0 -9 0v8.5" />
            <path d="M11 14l-3 3l-3 -3" />
        </svg>

    )
}
import { useRef, useState } from "react";
import type { Letter } from "../../types/game";
import type { StagedTile } from "./Game";

interface Props {
    hand?: Letter[]
    onReturnToHand: (row: number, col: number) => void;
}
export function InputPanel({ hand, onReturnToHand }: Props) {


    let [_hand, setHand] = useState<Letter[]>(['A', 'B', 'C', 'Q', 'D', 'E', 'Z']);

    const removeLetterFromHand = (letter: Letter) => {
        let newArr = [];
        let found = false;
        for (let i = 0; i < _hand.length; i++) {
            let el = _hand[i];
            if (el !== letter || found) {
                newArr.push(el);
            }
            if (el == letter) {
                found = true;
            }
        }
        console.log(newArr);
        setHand(newArr as Letter[]);

    }
    const onDragOver = (event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "none";
        console.log("Dragging overt");

        console.log(event.dataTransfer.getData("reposition"));

        const data = event.dataTransfer.getData("reposition");

        if (data) {
            event.dataTransfer.dropEffect = "move";

        }




    }

    const onDrop = (event: React.DragEvent) => {
        event.preventDefault();
        const repositionData = event.dataTransfer.getData("reposition");
        console.log("Source tile placed back in hand.")

        if (repositionData) {
            const sourceTile = JSON.parse(repositionData);
            onReturnToHand(sourceTile.row, sourceTile.col);
        }
    }
    return (<div className="w-3xl bg-[#2C2C38] mt-2 rounded-sm p-2"

        onDragOver={onDragOver}
        onDrop={onDrop}
    >

        <div className="bg-[#2C2C38]">

            <div className="flex   p-2 w-full justify-center bg-[#333333] " id="inputBtns">
                {_hand.map((letter) =>
                    <Tile
                        letter={letter}
                        removeFromHand={removeLetterFromHand}
                    />)}
            </div>
        </div>
        <div></div>


    </div>)
}

interface TileProps {
    letter: Letter;
    removeFromHand: (letter: Letter) => void;
}
function Tile({ letter, removeFromHand }: TileProps) {
    const [isDragged, setIsDragged] = useState(false);
    const tileRef = useRef<HTMLDivElement>(null);
    const onDragStart = (event: React.DragEvent) => {
        event.dataTransfer.setData("hand_to_board", letter);
        setIsDragged(true);
    }


    const onDragEnd = (event: React.DragEvent) => {
        var tile = tileRef.current;
        if (!tile) return;
        if (event.dataTransfer.dropEffect == "none") {
            console.log("drop failed");
            tile.style.visibility = "visible";
        }
        else {
            console.log("drop succeeded, effect: ", event.dataTransfer.dropEffect);
            removeFromHand(letter);
        }
        setIsDragged(false);

    }
    const onDrag = (event: React.DragEvent) => {

        var tile = tileRef.current;
        if (!tile) return;
        tile.style.visibility = "hidden";

    }
    return <div draggable={true}
        onDragStart={onDragStart}
        onDrag={onDrag}
        onDragEnd={onDragEnd}
        ref={tileRef}
        className={`   select-none p-3 ml-6 mr-6 ${isDragged ? "bg-red-500" : "bg-yellow-200"} aspect-square w-18 flex-shrink-0 flex-grow-0 rounded-md border-black border-1 hover:cursor-grab`}>{letter}</div>;
}



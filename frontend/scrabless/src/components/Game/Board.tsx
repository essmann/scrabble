import { generateTiles } from "../../test/testTiles"
import { useEffect, useState } from "react";
export function Board({ className }: any) {

    const tiles = generateTiles();

    return (
        <div className={className}>
            {tiles.map((row, rowIndex) => {
                return <div id="row" className="w-full">

                    {
                        row.map((letter) => {
                            return <div id="col" className="">
                                <Tile letter={letter.letter} type={letter.bonus} />
                            </div>
                        })
                    }
                </div>

            })}
        </div>
    )
}

function Tile({ letter, type }: { letter: string | null, type: string | null }) {
    let styling = "";

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

    return (
        <div className={`${styling} aspect-square min-w-full min-h-full flex justify-center items-center text-white border-black border rounded-sm `}>
            {letter || (type && type !== 'STAR' ? type : '')}
        </div>
    );
}

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
            styling = "bg-red-500";
            break;
        case "TW":
            styling = "bg-blue-500";
            break;
        case "TL":
            styling = "bg-green-500";
            break;
        case "DL":
            styling = "bg-purple-500";
            break;
        default:
            styling = "bg-yellow-100 border border-yellow-300";
    }

    return (
        <div className={`${styling} aspect-square min-w-full min-h-full flex justify-center items-center`}>
            {letter || (type && type !== 'STAR' ? type : '')}
        </div>
    );
}

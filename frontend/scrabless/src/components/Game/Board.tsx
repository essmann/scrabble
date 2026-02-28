import { useEffect, useRef, useState } from "react";
import { useGame } from "../../context/GameContext";
import { LETTER_SCORES } from "../../context/GameContext";
import type { ScrabbleCharacter } from "./types";
import { DRAG_TYPE, getLetterScore, type ClickedTileDirection, type StagedTile } from "./types";
import clickSound from "../../assets/sounds/matthewvakaliuk73627-mouse-click-290204.mp3";
import { computeScore } from "./utils";

interface TilePosition {
    row: number;
    col: number;
}

interface BoardProps {
    className: string;
}

export function Board({ className }: BoardProps) {
    const { board, stagedTiles, setStagedTiles, clickedTile, setClickedTile, hand, addToHand, removeFromHand, stagedIsValidWord } = useGame();

    const [lastScore, setLastScore] = useState<number | null>(null);
    const [lastWord, setLastWord] = useState(null);
    const clickAudioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const score = computeScore(stagedTiles, board);
        console.log(score);
    }, [stagedTiles])

    useEffect(() => {
        clickAudioRef.current = new Audio(clickSound);
    }, []);

    const playClick = () => {
        if (!clickAudioRef.current) return;

        clickAudioRef.current.pause();        // stop if playing
        clickAudioRef.current.currentTime = 0; // rewind
        clickAudioRef.current.play();
    };
    const isEmptyTile = (row: number, col: number) => {
        const tile = board[row][col];
        if (tile.letter) return false;
        if (stagedTiles.some((t) => t.row === row && t.col === col)) return false;
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
                playClick();

                return;
            }

            const letter = ev.key.toUpperCase() as ScrabbleCharacter;
            const letterInHand = hand.find(h => h === letter);
            if (!letterInHand) return;
            if (!isEmptyTile(clickedTile.row, clickedTile.col)) return;

            const newTile: StagedTile = { letter, row: clickedTile.row, col: clickedTile.col };

            const nextPosition = clickedTile.direction === "RIGHT" || clickedTile.direction == null
                ? { row: clickedTile.row, col: clickedTile.col + 1 }
                : { row: clickedTile.row + 1, col: clickedTile.col };

            setStagedTiles((prev) => [...prev, newTile]);
            removeFromHand(letter);
            setClickedTile(nextPosition, true);
            playClick();

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
            playClick();
            return true;
        }

        if (isEmptyTile(tileToPlace.row, tileToPlace.col)) {
            setStagedTiles((prev) => [...prev, tileToPlace]);
            playClick();

            return true;
        }

        return false;
    };

    return (

        <>
            <div id="board" className={`${className} w-full lg:h-full lg:mt-0 md:mt-0`}>
                <div className="grid grid-cols-15 h-full">
                    {board.map((row, rowIndex) =>
                        row.map((tile, colIndex) => {
                            const staged = stagedTiles.find(
                                (s) => s.row === rowIndex && s.col === colIndex
                            );

                            return (
                                <Tile
                                    key={`${rowIndex}-${colIndex}`}
                                    letter={staged ? staged.letter : tile.letter ?? null}
                                    type={tile.bonus}
                                    row={rowIndex}
                                    col={colIndex}
                                    staged={!!staged}
                                    stagedTile={staged}
                                    onTilePlace={onTilePlace}
                                    lastScore={lastScore}
                                />
                            );
                        })
                    )}
                </div>
            </div>
            {/* <ScoreOverlay score={lastScore} /> */}
        </>
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
    lastScore
}: {
    letter: ScrabbleCharacter | null;
    type: string | null;
    row: number;
    col: number;
    staged: boolean;
    stagedTile?: StagedTile;
    onTilePlace: (tileToPlace: StagedTile, sourceTile?: TilePosition) => boolean;
    lastScore: number | null
}) {
    const { clickedTile, setClickedTile, stagedIsValidWord } = useGame();
    const score = letter ? LETTER_SCORES[letter] : null;
    const isClicked = clickedTile?.row === row && clickedTile?.col === col;

    let bg = "bg-gray-300";
    if (staged) {
        bg = "bg-[#f0b860]";
    } else {
        switch (type) {
            case "DW": bg = "bg-[#e4a2a3]"; break;
            case "TW": bg = "bg-[#bf4e4e]"; break;
            case "TL": bg = "bg-[#0c679c]"; break;
            case "DL": bg = "bg-[#68a2c3]"; break;
            default: bg = "bg-[#c4c4d1] border rounded-sm";
        }
    }

    const onDragOver = (event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = letter ? "none" : "move";
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();

        const fromBoard = e.dataTransfer.getData(DRAG_TYPE.FROM_BOARD);
        const fromHand = e.dataTransfer.getData(DRAG_TYPE.FROM_HAND);

        if (!fromHand && !fromBoard) return;

        if (fromBoard) {
            const sourceTile = JSON.parse(fromBoard) as StagedTile;
            onTilePlace(
                { letter: sourceTile.letter, row, col },
                { row: sourceTile.row, col: sourceTile.col }
            );

            return;
        }

        const droppedLetter = JSON.parse(fromHand) as ScrabbleCharacter;
        if (!isValidLetter(droppedLetter)) return;
        onTilePlace({ letter: droppedLetter, row, col });

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
                font-extrabold 
                lg:rounded-[0.6rem]
                ${staged || (letter && !staged) ? "text-black lg:text-2xl" : "text-white"}
                ${staged ? "font-bold hover:bg-yellow-400 border-[#c89e33] lg:border-2" : "border-black"}
                ${staged && "rounded-md border lg:rounded-md bg-[#edc27d] lg:border-2 lg:rounded-[0.4rem] lg:text-2xl lg:text-black text-black"}
                ${staged && stagedIsValidWord && "border-green-300"}
                ${staged && !stagedIsValidWord && "border-red-500"}
                ${!staged && letter && "bg-[#edc27d] border-orange-300 lg:border-2"}
            `}
        >
            <div>{letter || (type ? type : "")}</div>
            <div className="absolute left-[15%] bottom-[7%] text-[70%]">
                {score != null && score}
            </div>
            {isClicked && <ArrowOverlay clickDirection={clickedTile.direction} />}
        </div>
    );
}

function isValidLetter(value: string): value is ScrabbleCharacter {
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

function ScoreOverlay({ score }: { score: number | null }) {
    if (!score) return null;

    return (
        <div className="absolute">
            <div>{score}</div>
        </div>
    );
}

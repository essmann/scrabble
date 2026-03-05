import { useEffect, useRef, useState } from "react";
import { useGame } from "../../context/GameContext";
import { LETTER_SCORES } from "../../context/GameContext";
import type { ScrabbleCharacter } from "./types";
import { DRAG_TYPE, type ClickedTileDirection, type StagedTile } from "./types";
import clickSound from "../../assets/sounds/matthewvakaliuk73627-mouse-click-290204.mp3";
import { computeScore } from "./utils";
import type { WSTile } from "../../types/game";
import { useBoardKeyboard } from "../../hooks/useBoardKeyboard";

interface TilePosition {
    row: number;
    col: number;
}

interface BoardProps {
    className: string;
    onSubmit: () => void;
}

function isPartOfLastMove(row: number, col: number, lastMove: WSTile[][] | null | undefined): boolean {
    if (!lastMove) return false;
    for (const item of lastMove) {
        if (Array.isArray(item)) {
            if (item.some(tile => tile?.row === row && tile?.col === col)) return true;
        } else if ((item as any)?.row === row && (item as any)?.col === col) {
            return true;
        }
    }
    return false;
}

function getFirstTile(lastMove: WSTile[][] | null | undefined): { row: number; col: number } | null {
    if (!lastMove || lastMove.length === 0) return null;
    const firstItem = lastMove[0];
    if (Array.isArray(firstItem) && firstItem.length > 0) {
        return { row: firstItem[0]?.row, col: firstItem[0]?.col };
    } else if ((firstItem as any)?.row !== undefined) {
        return { row: (firstItem as any).row, col: (firstItem as any).col };
    }
    return null;
}

export function Board({ className, onSubmit }: BoardProps) {
    const {
        board,
        stagedTiles, setStagedTiles,
        clickedTile, setClickedTile,
        hand, addToHand, removeFromHand,
        gameState,
        scoredWord, setScoredWord,
    } = useGame();

    const [lastScore, setLastScore] = useState<number | null>(null);
    const [lastSubmittedMove, setLastSubmittedMove] = useState<WSTile[][] | null>(null);
    const clickAudioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        clickAudioRef.current = new Audio(clickSound);
    }, []);

    const playClick = () => {
        if (!clickAudioRef.current) return;
        clickAudioRef.current.pause();
        clickAudioRef.current.currentTime = 0;
        clickAudioRef.current.play();
    };

    useEffect(() => {
        if (gameState?.lastWord) {
            setLastSubmittedMove(gameState.lastWord.words);
            setLastScore(gameState.lastWord.score);
        }
    }, [gameState]);

    useEffect(() => {
        const result = computeScore(stagedTiles, board);
        setScoredWord(result ? result.crossWords : null);
    }, [stagedTiles]);

    const isEmptyTile = (row: number, col: number) => {
        const tile = board[row][col];
        if (tile.letter) return false;
        if (stagedTiles.some((t) => t.row === row && t.col === col)) return false;
        return true;
    };

    // All keyboard logic lives here now
    useBoardKeyboard({
        clickedTile,
        setClickedTile,
        stagedTiles,
        setStagedTiles,
        hand,
        addToHand,
        removeFromHand,
        board,
        onSubmit,
        playClick,
    });

    const onTilePlace = (tileToPlace: StagedTile, sourceTile?: TilePosition): boolean => {
        if (sourceTile) {
            if (!isEmptyTile(tileToPlace.row, tileToPlace.col)) return false;
            setStagedTiles((prev) => [
                ...prev.filter((p) => !(p.row === sourceTile.row && p.col === sourceTile.col)),
                tileToPlace,
            ]);
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
        <div id="board" className={`${className} w-full lg:h-full lg:mt-0 md:mt-0`}>
            <div className="grid grid-cols-15 h-full">
                {board.map((row, rowIndex) =>
                    row.map((tile, colIndex) => {
                        const staged = stagedTiles.find(
                            (s) => s.row === rowIndex && s.col === colIndex
                        );
                        const isScoredTile = scoredWord?.some(word =>
                            word.some(t => t.row === rowIndex && t.col === colIndex)
                        ) ?? false;
                        const isPartOfLastWord = isPartOfLastMove(rowIndex, colIndex, lastSubmittedMove);
                        const firstTile = getFirstTile(lastSubmittedMove);
                        const isFirstOfLastWord = firstTile?.row === rowIndex && firstTile?.col === colIndex;

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
                                isScored={isScoredTile}
                                isPartOfLastWord={isPartOfLastWord}
                                isFirstOfLastWord={isFirstOfLastWord}
                            />
                        );
                    })
                )}
            </div>
        </div>
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
    lastScore,
    isScored,
    isPartOfLastWord,
    isFirstOfLastWord,
}: {
    letter: ScrabbleCharacter | null;
    type: string | null;
    row: number;
    col: number;
    staged: boolean;
    stagedTile?: StagedTile;
    onTilePlace: (tileToPlace: StagedTile, sourceTile?: TilePosition) => boolean;
    lastScore: number | null;
    isScored: boolean;
    isPartOfLastWord: boolean;
    isFirstOfLastWord: boolean;
}) {
    const { clickedTile, setClickedTile, stagedIsValidWord, stagedTiles } = useGame();
    const score = letter ? LETTER_SCORES[letter] : null;
    const isClicked = clickedTile?.row === row && clickedTile?.col === col;

    let bgColor = "bg-gray-300";
    if (staged) {
        bgColor = "bg-[#f0b860]";
    } else {
        switch (type) {
            case "DW": bgColor = "bg-[#e4a2a3]"; break;
            case "TW": bgColor = "bg-[#bf4e4e]"; break;
            case "TL": bgColor = "bg-[#0c679c]"; break;
            case "DL": bgColor = "bg-[#68a2c3]"; break;
            default: bgColor = "bg-[#c4c4d1] border rounded-sm";
        }
    }

    const borderClass = (() => {
        if (staged && stagedIsValidWord) return "border-2 border-green-300 lg:border-2";
        if (staged) return "border-2 border-[#c89e33] lg:border-2";
        if (isPartOfLastWord && stagedTiles.length === 0) return "border-2 border-blue-500 lg:border-2";
        if (isScored && letter) return "border-2 border-green-300 lg:border-2";
        if (letter && !isScored) return "border-2 border-orange-300 lg:border-2";
        return "border-black";
    })();

    if (staged && stagedIsValidWord) bgColor = "bg-[#edc27d]";
    else if (staged) bgColor = "bg-[#edc27d]";
    else if (isPartOfLastWord && stagedTiles.length === 0) bgColor = "bg-[#edc27d]";
    else if (isScored && letter) bgColor = "bg-[#f0b860]";
    else if (letter && !isScored) bgColor = "bg-[#edc27d]";

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
            onTilePlace({ letter: sourceTile.letter, row, col }, { row: sourceTile.row, col: sourceTile.col });
            return;
        }

        const droppedLetter = JSON.parse(fromHand) as ScrabbleCharacter;
        if (isValidLetter(droppedLetter)) onTilePlace({ letter: droppedLetter, row, col });
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
                ${bgColor} ${borderClass}
                aspect-square flex items-center justify-center
                border w-full h-full box-border
                text-[70%] select-none relative
                font-extrabold lg:rounded-[0.6rem]
                ${!stagedIsValidWord && isScored && "border-red-500"}
                ${staged || letter ? "text-black lg:text-2xl" : "text-white"}
                ${staged ? "hover:bg-yellow-400 font-bold rounded-md lg:rounded-[0.4rem]" : ""}
            `}
        >
            <div>{letter || (type ? type : "")}</div>
            <div className="absolute left-[15%] bottom-[7%] text-[70%]">
                {score != null && score}
            </div>
            {isPartOfLastWord && stagedTiles.length === 0 && (
                <ScoreOverlay score={isFirstOfLastWord ? lastScore : null} color="bg-blue-500" />
            )}
            {isScored && stagedTiles.length > 0 && (
                <ScoreOverlay score={null} color={stagedIsValidWord ? "bg-green-600" : "bg-red-500"} />
            )}
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

function ScoreOverlay({ score, color }: { score: number | null; color: string }) {
    if (!score) return null;
    return (
        <div className="absolute inset-0 z-10 flex right-15 bottom-15 items-center justify-center pointer-events-none">
            <div className={`${color} rounded-xl px-1 text-white text-xs font-bold`}>
                {score}
            </div>
        </div>
    );
}
import { useEffect, useRef, useState } from "react";
import { useGame } from "../../context/GameContext";

export function RightPanel({ className, myTurn }: { className: string, myTurn: boolean }) {
    const { player, opponent } = useGame();
    const [playerTime, setPlayerTime] = useState<number>(0);
    const [opponentTime, setOpponentTime] = useState<number>(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!player || !opponent) return;
        setPlayerTime(player.time);
        setOpponentTime(opponent.time);
    }, [player?.time, opponent?.time]);

    useEffect(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            if (myTurn) {
                setPlayerTime(t => t - 1);
            } else {
                setOpponentTime(t => t - 1);
            }
        }, 1000);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [myTurn]);

    if (!player || !opponent) return null;

    return (
        <div className={className + " flex gap-2 w-full"}>
            <PlayerPanel time={playerTime} name={player.name} isActive={myTurn} score={player.score} />
            <PlayerPanel time={opponentTime} name={opponent.name} isActive={!myTurn} score={opponent.score} />
        </div>
    );
}

function PlayerPanel({ name, className, time, isActive, score }: {
    name: string,
    className?: string,
    time: number,
    isActive: boolean,
    score: number
}) {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    const timestamp = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    const isLow = time < 30;

    return (
        <div className={`
            relative flex-1 rounded-lg overflow-hidden lg:p-2
            bg-[#2e2e3e] border
            transition-all duration-300
            ${isActive ? "border-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.3)]" : "border-[#3a3a4e]"}
        `}>
            {/* Active indicator bar */}
            <div className={`h-0.5 w-full transition-all duration-300 ${isActive ? "bg-yellow-400" : "bg-transparent"}`} />

            <div className="p-2 flex flex-col gap-1">
                {/* Name row */}
                <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? "bg-yellow-400 animate-pulse" : "bg-gray-600"}`} />
                    <span className="text-white text-xs font-semibold truncate">{name}</span>
                </div>

                {/* Score + Timer row */}
                <div className="flex items-center justify-between">
                    <span className="text-white font-bold text-sm">{score}</span>
                    <span className={`font-mono text-xs font-medium tabular-nums ${isLow ? "text-red-400" : "text-gray-300"}`}>
                        {timestamp}
                    </span>
                </div>
            </div>
        </div>
    );
}
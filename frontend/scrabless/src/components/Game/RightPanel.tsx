import { useEffect, useRef, useState } from "react";
import { useGame } from "../../context/GameContext";

export function RightPanel({ className, myTurn }: { className: string, myTurn: boolean }) {
    const { player, opponent } = useGame();
    const [playerTime, setPlayerTime] = useState<number>(0);
    const [opponentTime, setOpponentTime] = useState<number>(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);



    useEffect(() => {
        if (!player || !opponent) return; // don't start until ready
        setPlayerTime(player.time);
        setOpponentTime(opponent.time);
    }, [player?.time, opponent?.time])

    useEffect(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);

        intervalRef.current = setInterval(() => {
            if (myTurn) {
                setPlayerTime(t => (t !== null ? t - 1 : t));
            } else {
                setOpponentTime(t => (t !== null ? t - 1 : t));
            }
        }, 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [myTurn]);


    if (!player || !opponent) return null;
    return (
        <div className={className + "justify-between w-full lg:justify-normal lg:w-full"}>
            <div className="flex gap-1">
                <PlayerPanel time={playerTime} name={player.name} className={`${myTurn ? "border-yellow-500" : "border-grey"}`} />
                <PlayerPanel time={opponentTime} name={opponent.name} className={`${!myTurn ? "border-white" : "border-grey"}`} />
            </div>
        </div>
    );
}

function PlayerPanel({ name, className, time }: { name: string, className: string, time: number }) {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    const timestamp = `${minutes}:${seconds.toString().padStart(2, "0")}`;

    return (
        <div className={"flex bg-[#464657] w-full border-2 rounded-md " + className}>
            <div className="flex flex-col w-full">
                <div className="text-white font-semibold justify-center lg:m-2">{name}</div>
                <div className="flex lg:gap-3 justify-between w-full border-t-gray-500 border-1">
                    <div className="text-gray-400 lg:m-2 lg:text-xl text-white">0</div>
                    <div className="text-gray-400 lg:m-2 text-white">{timestamp}</div>
                </div>
            </div>
        </div>
    );
}
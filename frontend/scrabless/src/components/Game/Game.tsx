import { useEffect, useRef } from "react";
import { Board } from "./Board";
import { InputPanel } from "./InputPanel";
import { RightPanel } from "./RightPanel";
import type { User } from "../../hooks/useUser";
import { useGame } from "../../context/GameContext";
import successSound from "../../assets/sounds/successNoise.mp3";
import { useGameActions } from "../../hooks/useGameActions";

interface GameProps {
    user: User;
    roomId: string;
}

export function Game({ user, roomId }: GameProps) {
    const userId = user.id;
    const { turn, board, stagedTiles, setStagedTiles, sendWsMessage, stagedIsValidWord } = useGame();
    const { makeMove, resign, skipTurn } = useGameActions({ stagedTiles, userId, roomId, sendWsMessage, validWord: stagedIsValidWord });
    console.log("[Game] Rendered with turn:", turn, "myId:", user.id, "isMyTurn:", user.id === turn);
    const myTurn = user.id === turn;
    const successAudioRef = useRef<HTMLAudioElement | null>(null);
    useEffect(() => {
        successAudioRef.current = new Audio(successSound);

    }, []);
    // Clear staged tiles when board or turn changes (move submitted)
    useEffect(() => {
        setStagedTiles([]);
    }, [board, turn, setStagedTiles])

    // const [moveLoading, setMoveLoading] = useState(false); 6
    const removeStagedTile = (row: number, col: number) => {
        setStagedTiles(prev =>
            prev.filter(t => !(t.row === row && t.col === col))
        );
    };

    // const makeMove = () => {
    //     //Shouldn't be called if it isn't the players turn
    //     //Check staged tiles. 
    //     //Client-side validation
    //     //1) Is it adjacent to another word, or is it adjacent to the star (first word)
    //     //2) Is it a valid word (use a trie)
    //     //Left -> Right
    //     //Up -> Down

    //     const payload = stagedTiles;
    //     let message = { type: "move", roomId: roomId, userId: user.id, message: payload };

    //     sendMessage(message);
    //     playSuccess();

    // };
    // const resign = () => {
    //     const message = { type: "RESIGN", userId: user.id, roomId: roomId };

    //     sendMessage(message);
    // }
    // const skipTurn = () => {
    //     const message = { type: "SKIP_TURN", userId: user.id, roomId: roomId };
    //     sendMessage(message);
    // }

    return (
        <div className="main h-dvh w-dvw flex justify-center bg-[#16161E] 0 overflow-y-scroll">
            <div className="flex items-center justify-center lg:justify-normal lg:mt-3 border-box flex-col min-w-full min-h-full">
                <div className="flex lg:flex-row flex-col w-full md:max-w-3xl lg:max-w-264 md:self-center lg:self-center self-end lg:h-auto h-full">
                    <div className="bg-[#3C3C4B] rounded-sm w-full p-3 lg:flex-1 flex gap-4 lg:justify-center items-center lg:items-start lg:min-w-sm lg:overflow-scroll">
                        <RightPanel
                            className={''}
                            myTurn={myTurn || false}
                        />
                    </div>
                    <div id="board" className="w-full lg:h-full lg:mt-0 md:mt-0 lg:flex-3 aspect-square">
                        <Board className={''} onSubmit={makeMove} />
                        <div id="input" className="bg-[#2C2C38] w-full p-1 rounded-md lg:flex-6 lg:mt-0 mt-auto border-box">
                            <div className="flex border-box justify-between items-center text-center">
                                <InputPanel
                                    removeStagedTile={removeStagedTile}
                                    onSubmit={makeMove}
                                    resign={resign}
                                    skipTurn={skipTurn}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
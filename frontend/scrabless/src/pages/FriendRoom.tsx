import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiManager } from '../api/apiManager';
import { useGameSync } from '../hooks/useGameSync';
import { Game } from '../components/Game/Game';
import { useAuth } from '../context/authContext';
import { useGame } from '../context/GameContext';
import type { GameEndType, GameState, PlayerState } from '../types/game';
import type { User } from '../types/room';
import { getOpponent } from '../components/Game/utils';
interface RoomData {
    owner: { id: string; name: string };
    guest?: { id: string; name: string }; // optional at first
    state: 'waiting' | 'active';
    message: string;
}




export function FriendRoom() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [roomData, setRoomData] = useState<RoomData | null>(null);
    const { gameState, setGameState } = useGame();
    let auth = useAuth();
    const joinedRoomsRef = useRef(new Set<string>());
    const roomId = searchParams.get('roomId');

    // Setup WebSocket sync for this room
    useGameSync(roomId ?? undefined, setGameState);

    useEffect(() => {
        if (!roomId) {
            navigate('/');
            return;
        }

        if (joinedRoomsRef.current.has(roomId)) return;

        joinedRoomsRef.current.add(roomId);

        const joinRoom = async () => {
            try {
                console.log("JOIN ROOM CALLED");
                setLoading(true);
                setError(null);

                const data = await apiManager.connectToRoom("friend", roomId);
                setRoomData(data);

            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to join room");
            } finally {
                setLoading(false);
            }
        };

        joinRoom();

    }, [roomId, navigate]);

    useEffect(() => {
        // Update room state when game starts (turn changes from undefined to a userId)
        if (gameState?.turn) {
            setRoomData((prev) => {
                return prev ? { ...prev, state: "active" } : prev;
            })
        }
    }, [gameState?.turn])




    if (loading) {
        return (
            <div className='bg-linear-to-br from-[#1a1a2e] to-[#0f0f1e] w-full h-screen flex justify-center items-center'>
                <div className='text-white text-xl'>Loading room...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className='bg-linear-to-br from-[#1a1a2e] to-[#0f0f1e] w-full h-screen flex justify-center items-center'>
                <div className='flex flex-col gap-4 items-center'>
                    <div className='text-red-400 text-xl'>❌ Error</div>
                    <div className='text-white/70'>{error}</div>
                    <button
                        onClick={() => navigate('/')}
                        className='mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors'
                    >
                        ← Go Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            {roomData?.state === "active" ?
                <div className='flex w-full h-full relative'>
                    {auth.user && (
                        <Game user={auth.user} roomId={roomId as string} />
                    )}
                    {gameState?.result && <GameEndPanel gameState={gameState} currentUser={auth.user as User} getOpponent={() => getOpponent(gameState, auth.user.id)} onHome={() => navigate("/")} />}
                </div>
                :
                <div className='flex max-h-full w-full justify-center'>
                    <WaitingPanel roomId={roomId as string} />
                </div>
            }
        </div>
    );
}

export default FriendRoom;

function WaitingPanel({ roomId }: { roomId: string }) {
    const roomUrl = `${window.location.origin}/friend-room?roomId=${roomId}`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(roomUrl);
        alert("Link copied to clipboard!");
    };

    return (
        <div className="max-w-md w-full bg-green-50 rounded-xl shadow-lg p-6 flex flex-col items-center gap-6">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-green-800 text-center">
                Challenge a Friend
            </h1>

            <div className="w-full bg-green-100 border border-green-300 rounded-lg p-4 flex flex-col gap-1">
                <span className="font-semibold text-green-700">Time:</span>
                <span className="text-green-800">Untimed</span>
            </div>

            <div className="w-full flex flex-col gap-2">
                <span className="text-lg font-semibold text-green-900">Share this link:</span>
                <div className="flex w-full gap-2">
                    <div className="bg-white p-3 rounded-lg break-all text-gray-800 flex-1 select-all">
                        {roomUrl}
                    </div>
                    <button
                        onClick={copyToClipboard}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
                    >
                        Copy
                    </button>
                </div>
            </div>

            <button className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors">
                Cancel
            </button>
        </div>
    );
}


function GameEndPanel({
    gameState,
    currentUser,
    getOpponent,
    onHome,
    onRematch,
}: {
    gameState: GameState;
    currentUser: User;
    getOpponent: () => PlayerState | null;
    onHome: () => void;
    onRematch?: () => void;
}) {
    const opponent = getOpponent();
    const currentPlayerState = gameState.players?.[currentUser.id];
    const opponentState = opponent ? gameState.players?.[opponent.userId] : null;

    if (!currentPlayerState || !opponentState) return null;

    const didWin = gameState.result?.winnerId === currentUser.id;

    const formatReason = (reason?: GameEndType) => {
        if (!reason) return "";
        switch (reason) {
            case "OUT_OF_TIME":
                return "Out of time";
            case "RESIGN":
                return "Opponent resigned";
            case "LONG_DISCONNECT":
                return "Opponent disconnected";
            default:
                return reason;
        }
    };

    return (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-[1px] flex items-center justify-center z-50">
            <div className="relative lg:left-[12%] bg-[#1a1a1a] border border-[#2e2e2e] rounded p-8 flex flex-col items-center gap-4 min-w-[320px]">
                <span className="text-xs tracking-widest uppercase text-[#555] font-mono">
                    {formatReason(gameState.result?.reason)}
                </span>
                <span className={`text-3xl font-semibold ${didWin ? 'text-[#c8f0a0]' : 'text-[#e07070]'}`}>
                    {didWin ? 'You won' : 'You lost'}
                </span>
                <div className="text-base font-semibold text-white flex justify-between w-full">
                    <div>{currentUser.name}</div>
                    <div>{opponentState.name}</div>
                </div>
                <div className="text-2xl font-semibold text-white flex justify-between w-full">
                    <div>{currentPlayerState.score}</div>
                    <div>{opponentState.score}</div>
                </div>
                <div className="flex gap-4 mt-4">
                    <button
                        onClick={onHome}
                        className="px-5 py-2 border border-[#3a3a3a] text-[#aaa] text-sm font-mono rounded hover:bg-white/5 transition-colors"
                    >
                        Home
                    </button>
                    {onRematch && (
                        <button
                            onClick={onRematch}
                            className="px-5 py-2 border border-[#3a3a3a] text-[#aaa] text-sm font-mono rounded hover:bg-white/5 transition-colors"
                        >
                            Rematch
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

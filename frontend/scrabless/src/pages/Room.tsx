import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiManager } from '../api/apiManager';
import { useGameSync } from '../hooks/useGameSync';
import { Game } from '../components/Game/Game';
import { useAuth } from '../context/authContext';
import { useGame } from '../context/GameContext';
import type { GameState, PlayerState } from '../types/game';
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
    const roomUrl = `${window.location.origin}/room?roomId=${roomId}`;

    return (
        <div className='bg-green-500 max-w-3xl w-full flex items-center justify-center flex-col gap-5 p-5 rounded'>
            <h1 className='text-4xl font-bold'>Challenge a friend</h1>

            <div className='bg-green-100 p-4 border border-green-400 rounded'>
                <div className='font-semibold'>Time:</div>
                <div>Untimed</div>
            </div>

            <div className='flex flex-col gap-2 items-start w-full'>
                <div className='text-lg font-semibold'>Share this link:</div>
                <div className='bg-white p-3 rounded break-all text-sm text-gray-800 w-full'>{roomUrl}</div>
            </div>

            <div>
                <button className='bg-red-600 hover:bg-red-700 px-6 py-2 rounded-md text-white font-semibold transition-colors'>Cancel</button>
            </div>
        </div>
    );
}

function GameEndPanel({ gameState, currentUser, getOpponent, onHome }: {
    gameState: GameState;
    currentUser: User;
    getOpponent: () => PlayerState | null;
    onHome: () => void;
}) {
    const opponent = getOpponent();
    if (!opponent || !gameState.players?.[opponent.userId]) return null;
    const didWin = gameState.result?.winnerId === currentUser.id;

    return (
        <div className="absolute inset-0  bg-black/80 backdrop-blur-[1px] flex items-center justify-center z-50">
            <div className="relative bg-[#1a1a1a] left-[10%] border border-[#2e2e2e] rounded p-10 flex flex-col items-center gap-5 min-w-60">
                <span className="text-xs tracking-widest uppercase text-[#555] font-mono">
                    {gameState.result?.reason?.toLowerCase()}
                </span>
                <span className={`text-3xl font-semibold ${didWin ? 'text-[#c8f0a0]' : 'text-[#e07070]'}`}>
                    {didWin ? 'You won' : 'You lost'}
                </span>
                <div className='text-base font-semibold text-white flex justify-between w-full gap-4'>
                    <div>{currentUser.name}</div>
                    <div>{opponent.name}</div>
                </div>
                <div className={`text-3xl font-semibold text-white flex justify-between w-full`}>
                    <div>{gameState.players[currentUser.id].score}</div>
                    <div>{gameState.players[opponent?.userId].score}</div>

                </div>
                <button onClick={onHome} className="mt-2 px-5 py-2 border border-[#3a3a3a] text-[#aaa] text-sm font-mono rounded hover:bg-white/5 transition-colors">
                    home
                </button>
                <button className="mt-2 px-5 py-2 border border-[#3a3a3a] text-[#aaa] text-sm font-mono rounded hover:bg-white/5 transition-colors">
                    rematch
                </button>
            </div>
        </div>
    );
}
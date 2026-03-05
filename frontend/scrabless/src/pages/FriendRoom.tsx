import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiManager } from '../api/apiManager';
import { useWebSocket } from '../hooks/useWebSocket';
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
    const { gameState } = useGame();
    // const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    let auth = useAuth();

    const joinedRooms = new Set<string>();
    const roomId = searchParams.get('roomId');
    const { setHand, setTurn, setBoard } = useGame();
    const [wsMessage, sendMessage, turn, hand, board] = useWebSocket(
        roomId as string,
        setHand,
        setBoard,
        setTurn,
    );

    // const [board, setBoard] = useState();
    useEffect(() => {
        console.log("auth.user");
        console.log(auth.user);


        if (!roomId) {
            navigate('/');
            return;
        }

        if (joinedRooms.has(roomId)) return;

        joinedRooms.add(roomId);

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
        switch (wsMessage.type) {
            case "game_state":
                setRoomData((prev) => {
                    return prev ? { ...prev, state: "active" } : prev;
                })
        }
    }, [wsMessage])




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
                <h1 className='text-white text-2xl'>{ }</h1>
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
            {roomData?.state == "active" ?
                <div className='flex w-full h-full relative'>
                    {auth.user && (
                        <Game hand={hand} turn={turn} board={board} user={auth.user} sendWsMessage={sendMessage} roomId={roomId as string} />
                    )}
                    {gameState?.result && <GameEndPanel gameState={gameState} currentUser={auth.user as User} getOpponent={() => getOpponent(gameState, auth.user.id)} onHome={function (): void {
                        throw new Error('Function not implemented.');
                    }} />}
                </div>
                :
                <div className='flex max-h-full w-full justify-center'>
                    <WaitingPanel />
                </div>
            }
        </div>
    );
}

export default FriendRoom;

function WaitingPanel() {

    return (
        <div className='bg-green-500 max-w-3xl w-full items-center justify-center flex-col gap-5 p-5'>
            <h1 className='text-4xl'>Challenge a friend</h1>

            <div className='bg-green-100 p-4 border-green-400 '>
                <div>Time: </div>
                <div>Untimed</div>
            </div>

            <div className='flex gap-3 items-center '>
                <div className='text-xl'>Copy link</div>
                <div>http://localhost:5173/friend-room?roomId=ce2aedfe-36cd-4080-ad67-520d4f447f1d</div>

            </div>


            <div>
                <button className='bg-red-600 p-5 rounded-md'>Cancel</button>
            </div>
        </div>
    )




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
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded p-10 flex flex-col items-center gap-5 min-w-[240px]">
                <span className="text-xs tracking-widest uppercase text-[#555] font-mono">
                    {gameState.result?.reason?.toLowerCase()}
                </span>
                <span className={`text-3xl font-semibold ${didWin ? 'text-[#c8f0a0]' : 'text-[#e07070]'}`}>
                    {didWin ? 'You won' : 'You lost'}
                </span>
                <div className={`text-[1] font-semibold text-white flex justify-between w-full gap-4`}>
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
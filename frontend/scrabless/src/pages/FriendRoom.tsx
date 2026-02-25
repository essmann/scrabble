import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiManager } from '../api/apiManager';
import { useWebSocket } from '../hooks/useWebSocket';
import { Board } from '../components/Game/Board';
import { Game } from '../components/Game/Game';
import { useAuth } from '../context/authContext';
import { useGame } from '../context/GameContext';

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
    // const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    let auth = useAuth();

    const joinedRooms = new Set<string>();
    const roomId = searchParams.get('roomId');
    const { setHand, setTurn, setBoard } = useGame();
    const [wsMessage, sendMessage, turn, hand, board] = useWebSocket(
        roomId as string,
        setHand,
        setBoard,
        setTurn
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
            <div className='bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1e] w-full h-screen flex justify-center items-center'>
                <div className='text-white text-xl'>Loading room...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className='bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1e] w-full h-screen flex justify-center items-center'>
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
            {roomData?.state == "active" ? <div className='flex w-full h-full'>
                {auth.user && (
                    <Game hand={hand} turn={turn} board={board} user={auth.user} sendWsMessage={sendMessage} roomId={roomId as string} />
                )}
            </div> :
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
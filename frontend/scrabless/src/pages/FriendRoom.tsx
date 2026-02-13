import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiManager } from '../api/apiManager';
import { wsManager } from '../api/WebSocketManager';
import { useWebSocket } from '../hooks/useWebSocket';
import { Board } from '../components/Board';
import { RightPanel } from '../components/Chat';

interface RoomData {
    role: 'owner' | 'guest';
    state: 'waiting' | 'active';
    message: string;
}

interface GameState {
    hand: string[],
    score: number,
}

// interface ChatMessage {
//     id: string;
//     sender: 'owner' | 'guest';
//     text: string;
//     timestamp: number;
// }

//MessageTypes
interface GetGameUpdate {
    type: "request_game_update";
    roomId?: string;
}

interface GetGameUpdateResponse {
    type: "request_game_update";
}

export function FriendRoom() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [roomData, setRoomData] = useState<RoomData | null>(null);
    // const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [messageInput, setMessageInput] = useState('');

    const roomId = searchParams.get('roomId');

    const [gameState, wsMessage] = useWebSocket(roomId as string); //Subscribes to websocket messages and refreshes automatically.

    useEffect(() => {
        if (!roomId) {
            console.error("No room ID provided");
            navigate('/');
            return;

        }

        const joinRoom = async () => {
            try {
                setLoading(true);
                setError(null);

                console.log("Attempting to join room:", roomId);
                const data = await apiManager.connectToRoom("friend", roomId);

                console.log("Room join response:", data);
                setRoomData(data);

            } catch (err) {
                console.error("Failed to join room:", err);
                setError(err instanceof Error ? err.message : "Failed to join room");
            } finally {
                setLoading(false);
            }
        };

        joinRoom();
    }, [roomId, navigate]);

    useEffect(() => {
        console.log(wsMessage);
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
        <div className='bg-red-600 flex lg:flex-row  p-1 justify-center h-screen   items-center' id='game-wrapper'>
            <div className='flex flex-col-reverse lg:flex-row  gap-4 w-full max-w-full justify-center  items-center bg-pink  lg:flex-row'>
                <Board className="bg-amber-50 flex   aspect-square max-w-3xl w-full  " />
                <RightPanel className="bg-blue-500  lg:max-w-md lg:w-[50%] w-full lg:max-h-3xl max-w-3xl lg:self-stretch" />
            </div>

        </div>
    );
}

export default FriendRoom;
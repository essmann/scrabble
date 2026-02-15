import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiManager } from '../api/apiManager';
import { wsManager } from '../api/WebSocketManager';
import { useWebSocket } from '../hooks/useWebSocket';
import { Board } from '../components/Game/Board';
import { RightPanel } from '../components/Game/RightPanel';
import { InputPanel } from '../components/Game/InputPanel';

interface RoomData {
    role: 'owner' | 'guest';
    state: 'waiting' | 'active';
    message: string;
}

interface WebsocketMessage {

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
    const [waitingForOpponent, setWaitingForOpponent] = useState(true);
    // const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const hasJoined = useRef<boolean>(false);

    const joinedRooms = new Set<string>();
    const roomId = searchParams.get('roomId');

    const [wsMessage, gameState] = useWebSocket(roomId as string); //Subscribes to websocket messages and refreshes automatically.
    useEffect(() => {
        if (!roomId) {
            navigate('/');
            return;
        }

        if (joinedRooms.has(roomId)) return;

        joinedRooms.add(roomId);

        const joinRoom = async () => {
            try {
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
            case "game_start":
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
        <div className='bg-[#16161E] flex flex-col  p-1 justify-center h-screen w-screen  items-center' id='game-wrapper'>
            {roomData?.state == "active" ? <div className='flex flex-col-reverse lg:flex-row  gap-4 w-full max-w-full justify-center  items-center bg-pink  lg:flex-row'>
                <div className='max-w-full max-h-full'>
                    <Board className="bg-amber-50 flex   aspect-square max-w-3xl w-full  " />
                    <InputPanel />
                </div>
                <RightPanel className="bg-[#22222B]  lg:max-w-md lg:w-[50%] w-full lg:max-h-3xl max-w-3xl lg:self-stretch" />
            </div> :

                <div className='flex  max-h-full w-full justify-center '>
                    <WaitingPanel />
                    <Board className="bg-amber-50 flex   aspect-square max-w-3xl w-full  " />
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
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiManager } from '../api/apiManager';
import { wsManager } from '../api/WebSocketManager';
interface RoomData {
    role: 'owner' | 'guest';
    state: 'waiting' | 'active';
    message: string;
}

export function FriendRoom() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [roomData, setRoomData] = useState<RoomData | null>(null);

    const roomId = searchParams.get('roomId');
    useEffect(() => {
        wsManager.connect();

        const unsubscribe = wsManager.subscribe((message: unknown) => {
            console.log("Message from WS:", message);
        });

        return () => { unsubscribe() };
    }, []);

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
        <div className='bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1e] w-full h-screen flex justify-center items-center'>
            <div className='flex flex-col gap-4 max-w-4xl w-full px-8'>
                <div className='text-center mb-4'>
                    <h2 className="text-2xl font-bold text-white/90">
                        Room: {roomId}
                    </h2>
                    <p className='text-white/70 text-sm mt-2'>
                        Role: <span className='font-semibold'>{roomData?.role}</span>
                    </p>
                    <p className='text-white/50 text-sm mt-1'>
                        {roomData?.state === 'waiting'
                            ? 'Waiting for opponent...'
                            : 'Game is active!'}
                    </p>
                </div>

                {/* Game board */}
                <div className="flex items-center justify-center">
                    <div className="
                        aspect-square
                        w-full
                        max-w-[700px]
                        max-h-[85vh]
                        bg-white/5
                        border-2 border-white/10
                        rounded-lg
                        p-8
                        flex
                        items-center
                        justify-center
                    ">
                        <p className="text-white/70">Game board placeholder</p>
                    </div>
                </div>

                <button
                    onClick={() => navigate('/')}
                    className='text-white/50 text-sm hover:text-white/80 transition-colors'
                >
                    ← Leave Room
                </button>
            </div>
        </div>
    );
}

export default FriendRoom;
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiManager } from '../api/apiManager';
import { wsManager } from '../api/WebSocketManager';
import { useWebSocket } from '../hooks/useWebSocket';

interface RoomData {
    role: 'owner' | 'guest';
    state: 'waiting' | 'active';
    message: string;
}

interface GameState {
    hand: string[],
    score: number,
}

interface ChatMessage {
    id: string;
    sender: 'owner' | 'guest';
    text: string;
    timestamp: number;
}

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
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
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

    const handleSendMessage = () => {
        if (!messageInput.trim() || !roomData) return;

        const newMessage: ChatMessage = {
            id: Date.now().toString(),
            sender: roomData.role,
            text: messageInput,
            timestamp: Date.now()
        };

        setChatMessages(prev => [...prev, newMessage]);

        // Send message through WebSocket
        wsManager.sendMessage(JSON.stringify({
            type: 'chat_message',
            message: messageInput,
            sender: roomData.role
        }));

        setMessageInput('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

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
        <div className='bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1e] w-full h-screen flex'>
            {/* Main game area */}
            <div className='flex-1 flex flex-col justify-center items-center px-8 py-6'>
                <div className='flex flex-col gap-4 max-w-4xl w-full'>
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
                        <button
                            onClick={() => {
                                wsManager.sendMessage("Ping message from client");
                            }}
                            className='mt-2 px-4 py-1 bg-white/10 hover:bg-white/20 text-white/70 text-sm rounded transition-colors'
                        >
                            Ping websocket
                        </button>
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

            {/* Chat panel */}
            <div className='w-80 bg-black/20 border-l border-white/10 flex flex-col'>
                {/* Chat header */}
                <div className='p-4 border-b border-white/10'>
                    <h3 className='text-white/90 font-semibold'>Chat</h3>
                </div>

                {/* Messages area */}
                <div className='flex-1 overflow-y-auto p-4 space-y-3'>
                    {chatMessages.length === 0 ? (
                        <p className='text-white/40 text-sm text-center mt-8'>
                            No messages yet. Start chatting!
                        </p>
                    ) : (
                        chatMessages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex flex-col ${msg.sender === roomData?.role ? 'items-end' : 'items-start'
                                    }`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-lg px-3 py-2 ${msg.sender === roomData?.role
                                        ? 'bg-blue-600/80 text-white'
                                        : 'bg-white/10 text-white/90'
                                        }`}
                                >
                                    <p className='text-sm break-words'>{msg.text}</p>
                                </div>
                                <span className='text-xs text-white/40 mt-1 px-1'>
                                    {new Date(msg.timestamp).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>
                        ))
                    )}
                </div>

                {/* Input area */}
                <div className='p-4 border-t border-white/10'>
                    <div className='flex gap-2'>
                        <input
                            type='text'
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder='Type a message...'
                            className='flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/40 focus:outline-none focus:border-white/30 transition-colors'
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!messageInput.trim()}
                            className='px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-white/10 disabled:text-white/30 text-white rounded-lg transition-colors text-sm font-medium'
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FriendRoom;
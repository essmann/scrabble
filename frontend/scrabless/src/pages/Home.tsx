import '../index.css'
import { apiManager } from '../api/apiManager';
import { useState } from 'react';
import AlreadyInRoomModal from '../components/Modals/AlreadyInRoomModal';
import { type AlreadyInRoomError } from '../types/Errors/ApiError';
export default function Home() {

    const [showFriendMenu, setShowFriendMenu] = useState(false);
    const [modal, setModal] = useState(false);
    const [roomId, setRoomId] = useState("");
    async function handleShareRoom() {
        apiManager.createRoom("friend");
    }

    async function handleCreateRoom() {
        const { roomId, error } = await apiManager.createRoom("friend");
        if (error) {
            if (error.code === "already_in_room") {
                const e = error as AlreadyInRoomError;
                console.log(e);
                setRoomId(e.meta.roomId);
                setModal(true);
            }
            else {
                console.error(error);
            }

        } else {
            console.log("Room created:", roomId);
            // Get the current URL
            const currentUrl = window.location.href;

            // Redirect to current URL + '/test'
            window.location.href = currentUrl.replace(/\/$/, '') + '/friend-room?roomId=' + roomId;
            // Navigate to room or copy link
        }

    }

    return (
        <div id="home" className='bg-linear-to-br from-[#1a1a2e] to-[#0f0f1e] w-full h-full flex justify-center items-center'>
            {modal && <AlreadyInRoomModal
                onRejoin={() => setModal(false)}
                onAbort={() => console.log("Aborted")}
                roomId={roomId}
            />}
            <div className='flex flex-col gap-4 max-w-md w-full px-8'>
                <h1 className="text-5xl md:text-6xl font-bold mb-8 text-center tracking-wide bg-linear-to-br from-indigo-400 to-purple-500 bg-clip-text text-transparent">
                    essscrabbles
                </h1>

                <button
                    onClick={() => {
                        setShowFriendMenu(true);
                    }}
                    className='bg-white/5 border-2 border-indigo-500/30 rounded-lg px-6 py-3 text-white text-lg font-medium backdrop-blur-sm transition-all duration-300 hover:bg-indigo-500/15 hover:border-indigo-500/50 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0'>
                    Play with Friend
                </button>

                <button
                    onClick={handleShareRoom}
                    className='bg-white/5 border-2 border-purple-500/30 rounded-lg px-6 py-3 text-white text-lg font-medium backdrop-blur-sm transition-all duration-300 hover:bg-purple-500/15 hover:border-purple-500/50 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0'>
                    Play with Bot
                </button>

                <button
                    onClick={handleShareRoom}
                    className='bg-white/5 border-2 border-emerald-500/30 rounded-lg px-6 py-3 text-white text-lg font-medium backdrop-blur-sm transition-all duration-300 hover:bg-emerald-500/15 hover:border-emerald-500/50 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0'>
                    Join Room
                </button>
            </div>


            {showFriendMenu && <FriendMenu onClose={() => setShowFriendMenu(false)} onCreateRoom={handleCreateRoom} />}
        </div>
    )
}

function FriendMenu({ onClose, onCreateRoom }: any) {
    return (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50'>
            <div className='flex flex-col gap-4 max-w-md w-full px-8 bg-linear-to-br from-[#1a1a2e]/95 to-[#0f0f1e]/95 rounded-2xl p-8 border border-white/10'>
                <h2 className="text-3xl font-bold mb-4 text-center text-white/90">
                    Play with Friend
                </h2>

                <button
                    onClick={onCreateRoom}
                    className='bg-white/5 border-2 border-indigo-500/30 rounded-lg px-6 py-3 text-white text-lg font-medium backdrop-blur-sm transition-all duration-300 hover:bg-indigo-500/15 hover:border-indigo-500/50 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0'>
                    Create Room
                </button>

                <button
                    className='bg-white/5 border-2 border-purple-500/30 rounded-lg px-6 py-3 text-white text-lg font-medium backdrop-blur-sm transition-all duration-300 hover:bg-purple-500/15 hover:border-purple-500/50 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0'>
                    Join Room
                </button>

                <button
                    onClick={onClose}
                    className='mt-4 text-white/50 text-sm hover:text-white/80 transition-colors'>
                    ← Back
                </button>
            </div>
        </div>
    )
}
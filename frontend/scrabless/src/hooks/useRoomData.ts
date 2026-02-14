// hooks/useRoomData.ts
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiManager } from "../api/apiManager";

export interface RoomData {
    role: 'owner' | 'guest';
    room: {
        id: string;
        owner: { id: string; name: string };
        guest: { id: string; name: string } | null;
        state: 'waiting' | 'active' | 'finished';
        createdAt: number;
    };
    message: string;
}

export function useRoomConnection(roomId: string | null) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [roomData, setRoomData] = useState<RoomData | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!roomId) {
            navigate('/');
            return;
        }

        const joinRoom = async () => {
            try {
                setLoading(true);
                setError(null);

                console.log('[ROOM] Joining room:', roomId); // ✅ Debug log

                const data = await apiManager.connectToRoom("friend", roomId);

                console.log('[ROOM] Received room data:', data); // ✅ Debug log

                setRoomData(data);
            } catch (err) {
                console.error('[ROOM] Error joining room:', err); // ✅ Debug log
                setError(err instanceof Error ? err.message : "Failed to join room");
            } finally {
                setLoading(false);
            }
        };

        joinRoom();
    }, [roomId]); // ✅ Only depend on roomId
    // ESLint might warn, but navigate is stable

    return { loading, error, roomData, setRoomData };
}
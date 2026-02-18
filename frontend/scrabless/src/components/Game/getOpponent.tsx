import { useEffect, useState } from "react";
import type { GameState } from "../../types/game";
import type { User } from "../../types/room";

export function useOpponent(gameState: GameState, user: User) {
    const [opponent, setOpponent] = useState<User>({} as User);

    useEffect(() => {
        if (!gameState.room) return;

        const { owner, guest } = gameState.room;

        if (user.id === owner.id) {
            setOpponent(
                guest ?? { id: "waiting", name: "Waiting for guest..." }
            );
            return;
        }

        if (guest && user.id === guest.id) {
            setOpponent(owner);
            return;
        }

        setOpponent({ id: "unknown", name: "Unknown opponent" });
    }, [gameState, user]);

    return opponent;
}

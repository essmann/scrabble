import { useEffect, useState } from "react";
import type { GameState } from "../../types/game";
import { Board } from "./Board";
import { InputPanel } from "./InputPanel";
import { RightPanel } from "./RightPanel";
import type { User } from "../../hooks/useUser";

export function Game({ gameState, user }: { gameState: GameState; user: User }) {
    const [opponent, setOpponent] = useState<User>({ id: "waiting", name: "Waiting..." });

    useEffect(() => {
        console.log("===== Game useEffect Triggered =====");
        console.log("User:", user);
        console.log("GameState:", gameState);

        if (!gameState.room) {
            console.log("No gameState.room yet. Exiting effect.");
            return;
        }

        const { owner, guest } = gameState.room;
        console.log("Owner:", owner);
        console.log("Guest:", guest);

        // If current user is owner
        if (user.id === owner.id) {
            console.log("Current user is OWNER");
            if (guest) {
                console.log("Guest exists. Setting opponent to guest:", guest);
                setOpponent(guest);
            } else {
                console.log("No guest yet. Waiting for guest...");
                setOpponent({ id: "waiting", name: "Waiting for guest..." });
            }
            return;
        }

        // If current user is guest
        if (guest && user.id === guest.id) {
            console.log("Current user is GUEST. Setting opponent to owner:", owner);
            setOpponent(owner);
            return;
        }

        // Fallback (should not happen)
        console.warn("Fallback triggered: user is neither owner nor guest");
        setOpponent({ id: "unknown", name: "Unknown opponent" });
    }, [gameState, user]);

    console.log("Current opponent state:", opponent);

    return (
        <>
            <div className="max-w-full max-h-full">
                <h1>{user.name}</h1>
                <Board className="bg-amber-50 flex aspect-square max-w-3xl w-full" />
                <InputPanel />
            </div>
            <RightPanel
                user={user}
                opponent={opponent}
                className="bg-[#22222B] lg:max-w-md lg:w-[50%] w-full lg:max-h-3xl max-w-3xl lg:self-stretch"
            />
        </>
    );
}

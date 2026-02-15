import type { User } from "../../hooks/useUser"

export function RightPanel({ className, user, opponent }: { className: string, user: User, opponent: User }) {
    console.log("OPPONENT");
    console.log(opponent);
    return <div className={className}>
        <h1>Right</h1>
        <div className="bg-pink-500 flex gap-4 justify-around">
            <PlayerPanel user={user} />
            <PlayerPanel user={opponent} />

        </div>
    </div>
}

function PlayerPanel({ user }: { user: User }) {
    return <div className="flex bg-red-100 p-3 w-full">
        <div className="flex flex-col  ">
            <div>{user.name}</div>
            <div>Score: 0</div>
            <div>Time: 43:26</div>

        </div>

    </div>
}
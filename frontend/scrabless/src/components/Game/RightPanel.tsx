import type { User } from "../../hooks/useUser"

export function RightPanel({ className, user, opponent, myTurn }: { className: string, user: User, opponent: User, myTurn: boolean }) {
    console.log("OPPONENT");
    console.log(opponent);
    console.log(myTurn);
    return <div className={className}>
        <h1>Right</h1>
        <div className="bg-pink-500 flex gap-4 justify-around">
            <PlayerPanel user={user} className={`${myTurn ? "bg-red-500" : "bg-green-500"}`} />
            <PlayerPanel user={opponent} className={`${!myTurn ? "bg-red-500" : "bg-green-500"}`} />

        </div>
    </div>
}

function PlayerPanel({ user, className }: { user: User, className: string }) {
    return <div className={"flex bg-red-100 p-3 w-full " + className}>
        <div className="flex flex-col  ">
            <div>{user.name}</div>
            <div>Score: 0</div>
            <div>Time: 43:26</div>

        </div>

    </div>
}
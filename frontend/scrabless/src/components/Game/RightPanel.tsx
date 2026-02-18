import type { User } from "../../hooks/useUser"

export function RightPanel({ className, user, opponent, myTurn }: { className: string, user: User, opponent: User, myTurn: boolean }) {
    console.log("OPPONENT");
    console.log(opponent);
    console.log(myTurn);
    return <div className={className}>
        <div className="flex gap-1  justify-around">
            <PlayerPanel user={user} className={`${myTurn ? "border-yellow-500" : "border-grey"}`} />
            <PlayerPanel user={opponent} className={`${!myTurn ? "border-white" : "border-grey"}`} />

        </div>
    </div>
}

function PlayerPanel({ user, className }: { user: User, className: string }) {
    return <div className={"flex bg-[#464657] p-3 w-full border-3 rounded-md  " + className}>
        <div className="flex flex-col  ">
            <div className="text-white font-semibold">{user.name}</div>
            <div className="text-gray-400">Score: 0</div>
            <div className="text-gray-400">Time: 43:26</div>

        </div>

    </div>
}
import type { User } from "../../hooks/useUser"

export function RightPanel({ className, user, opponent, myTurn }: { className: string, user: User, opponent: User, myTurn: boolean }) {
    console.log("OPPONENT");
    console.log(opponent);
    console.log(myTurn);
    return <div className={className + "justify-between w-full lg:justify-normal lg:w-auto"}>
        <div className="flex gap-2 ">
            <PlayerPanel user={user} className={`${myTurn ? "border-yellow-500" : "border-grey"}`} />
            <PlayerPanel user={opponent} className={`${!myTurn ? "border-white" : "border-grey"}`} />

        </div>
    </div>
}

function PlayerPanel({ user, className }: { user: User, className: string }) {
    return <div className={"flex bg-[#464657]  w-full border-1  rounded-md  " + className}>
        <div className="flex flex-col   ">
            <div className="text-white font-semibold">{user.name}</div>
            <div className="text-gray-400">Score: 0</div>
            <div className="text-gray-400">Time: 43:26</div>

        </div>

    </div>
}
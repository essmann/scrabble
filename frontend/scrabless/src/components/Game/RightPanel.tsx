import type { User } from "../../hooks/useUser"

export function RightPanel({ className, user, opponent, myTurn }: { className: string, user: User, opponent: User, myTurn: boolean }) {
    console.log("OPPONENT");
    console.log(opponent);
    console.log(myTurn);
    return <div className={className + "justify-between w-full lg:justify-normal  lg:w-full  "}>
        <div className="flex gap-1  ">
            <PlayerPanel user={user} className={`${myTurn ? "border-yellow-500" : "border-grey"}`} />
            <PlayerPanel user={opponent} className={`${!myTurn ? "border-white" : "border-grey"}`} />

        </div>
    </div>
}

function PlayerPanel({ user, className }: { user: User, className: string }) {
    return <div className={"flex bg-[#464657]  w-full border-2  rounded-md " + className}>
        <div className="flex flex-col w-full  ">
            <div className="text-white font-semibold justify-center lg:m-2">{user.name}</div>
            <div className="flex lg:gap-3 justify-between w-full border-t-gray-500 border-1 ">
                <div className="text-gray-400 lg:m-2 lg:text-xl text-white"> 0</div>
                <div className="text-gray-400 lg:m-2 text-white">00:00</div>
            </div>

        </div>

    </div>
}
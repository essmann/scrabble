export function RightPanel({ className }: any) {
    return <div className={className}>
        <h1>Right</h1>
        <div className="bg-pink-500 flex gap-4 justify-around">
            <PlayerPanel />
            <PlayerPanel />

        </div>
    </div>
}

function PlayerPanel({ props }: any) {
    return <div className="flex bg-red-100 p-3 w-full">
        <div className="flex flex-col  ">
            <div>Name</div>
            <div>Score: 0</div>
            <div>Time: 43:26</div>

        </div>

    </div>
}
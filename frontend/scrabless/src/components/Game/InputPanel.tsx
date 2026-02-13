
export function InputPanel({ hand }: any) {

    function drag() {

    }
    let _hand = ['A', 'B', 'C', 'Q', 'D', 'E', 'Z'];
    return (<div className="w-3xl bg-[#2C2C38] mt-2 rounded-sm p-2">

        <div className="bg-[#2C2C38]">

            <div className="flex   p-2 w-full justify-center bg-[#333333] " id="inputBtns">
                {_hand.map((letter) => <Tile letter={letter} />)}
            </div>
        </div>
        <div></div>


    </div>)
}

function Tile({ letter }: { letter: string }) {
    return <div className="bg-yellow-200 p-3 ml-6 mr-6 aspect-square w-full  rounded-md border-black border-1 hover:cursor-grab">{letter}</div>;
}
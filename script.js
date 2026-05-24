const maxCycle = 4;
let currCycle = 0;


const testFunc = () => {
    const myTextArr = [
        "YOU&apos;VE DOOMED US ALL",
        "Just kidding :)",
        "I WAS NOT KIDDING WHY DID YOU DO THAT",
        "Ahh I&apos;m joking I&apos;m joking :))"
    ]
    document.getElementById("button-test").innerHTML = myTextArr[currCycle % maxCycle];
    currCycle++;
}
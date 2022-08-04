declare const name: string;
declare function getName(): string;
declare class Animal {
    constructor(name: string);
    sayHi(): string;
}

declare enum Directions {
    Up,
    Down,
    Left,
    Right
}

interface Options {
    data: any;
}

declare namespace gooooood {
    const name: string;
    namespace bar {
        function baz(): string;
    }
}


export default function foo(): string;
export {name,getName,Animal,Directions,Options,gooooood}
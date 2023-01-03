import { Group } from "three";

export abstract class Object extends Group {
    constructor() {
        super();
    }

    abstract getPosition(): ObjectPosition;
}

export abstract class ObjectPosition extends Group {
    constructor() {
        super();
    }
}
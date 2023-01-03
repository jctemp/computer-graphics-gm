export function connect<Type>(signal: Signal<Type>, slot: Slot<Type>) {
    signal.associate = slot;
}

export class Signal<Type> {

    associate?: Slot<Type>;

    emit(param: Type): void {
        this.associate?.invoke(param);
    }
}

export class Slot<Type> {

    callables = new Array<(param: Type) => void>();

    invoke(param: Type): void {
        this.callables.forEach(func => func(param));
    }

    addCallable(callable: (param: Type) => void): void {
        this.callables.push(callable);
    }
}
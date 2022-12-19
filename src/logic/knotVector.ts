/**
 * The `KnotVector` class is an abstraction to handle the knots
 * via [knot, multiplicity] and making the operations on the list
 * easier.
 */
export class KnotVector {
    _knots: [number, number][];
    size: number;

    constructor(knotVector: number[] = []) {
        this._knots = [];
        this.size = 0;
        knotVector.forEach(element => this.addKnot(element));
    }

    /**
     * Finds the knot value at a given index.
     * @param _index number in the range of the vector
     * @returns the knot value or undefined if the index is not inside the range.
     */
    public at(_index: number): number | undefined {
        if (_index < 0) return undefined;

        let count = -1;
        for (const [knot, multiplicity] of this._knots) {
            count += multiplicity;
            if (_index <= count) return knot;
        }

        return undefined;
    }

    /**
     * Finds the index of a given knot
     * @param _knot knot value of the vector
     * @returns the index of the knot or a tuple if the knot is not
     * in the vector. The tuple has the `[index, multiplicity]`
     */
    public indexOf(_knot: number): [number, number] {
        let index: number = -1;
        for (const [knot, multiplicity] of this._knots) {
            index += multiplicity;
            if (knot < _knot) continue;
            else if (knot == _knot) return [index, multiplicity];
            else return [index - multiplicity, 0];
        }
        return [index, 0];
    }

    /**
     * Inserts a knot into the vector of knots.
     * @param _knot value of the knot
     * @param degree of the piecewise polynomials
     */
    public addKnot(_knot: number | undefined, degree: number = 3): void {
        if (_knot === undefined) return;

        let index = -1;
        let last = true;
        for (let idx = 0; idx < this._knots.length; idx++) {
            const [knot, multiplicity] = this._knots[idx];
            index = idx;
            if (knot === _knot) {
                if (multiplicity === degree) return;
                this._knots[idx][1] = multiplicity + 1;
                this.size++;
                return;
            }
            if (knot > _knot) { last = false; break; }
        }

        if (last) this._knots.push([_knot, 1]);
        else this._knots = [
            ...this._knots.slice(0, index),
            [_knot, 1],
            ...this._knots.slice(index)
        ];

        this.size++;
    }

    /**
     * Removes a knot from the vector of knots.
     * @param _knot value of the knot
     */
    public removeKnot(_knot: number | undefined, degree: number = 3): void {
        if (this.size === 0 || _knot === undefined) return;
        const [leftBoundIndex, rightBoundIndex] = this.supportRange(degree);
        if (rightBoundIndex - leftBoundIndex <= 1) return;

        let index = undefined;
        for (let idx = 0; idx < this._knots.length; idx++) {
            const [knot, multiplicity] = this._knots[idx];
            const same = knot === _knot;
            const zero = multiplicity - 1 === 0;
            if (same && !zero) {
                this._knots[idx][1] = Math.max(multiplicity - 1, 0);
                this.size--;
                return;
            } else if (same && zero) { index = idx; break; }
        }

        if (index === undefined) return;

        this._knots = [
            ...this._knots.slice(0, index),
            ...this._knots.slice(index + 1)
        ];

        this.size--;
    }

    /**
     * This is the interval of knots where the current spline is defined.
     * @param _degree of the piecewise polynomials 
     * @returns the interval with [u_(n-1), u_(L)]
     */
    public support(_degree: number): [number, number] {
        if (_degree < 1 || this.size < _degree)
            return [Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER];
        let a = this.at(_degree - 1);
        let b = this.at(this.size - _degree);

        if (a === undefined || b === undefined)
            throw new Error("Indexed knots are not part of the vector.");
        return [a, b];
    }

    /**
     * Provides the interval of knot indices of the current spline.
     * @param _degree of the piecewise polynomials 
     * @returns the interval with [n-1, L]
     */
    public supportRange(_degree: number): [number, number] {
        if (_degree < 1 || this.size < _degree)
            return [Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER];
        return [_degree - 1, this.size - _degree];
    }

    /**
     * Determines the amount of segme
     * @param _degree of the piecewise polynomials 
     * @returns a tuple with controlPointsCount
     */
    public controlPolygon(_degree: number): number {
        let count = 0;
        for (let idx = _degree - 1; idx < this.size; idx++) {
            count++;
        }
        return count;
    }

    public clone(): KnotVector {
        return new KnotVector(this.array);
    }

    public set knots(_: string) {
        /* 
        THE GETTER AND SETTER IS THERE FOR THE GUI, WHICH IS MANDATORY.
        HERE IS NO IMPLEMENTATION AS IT SHOULD NOT BE USED, HENCE NO
        FUNCTIONALITY.
        */
    }

    public get knots(): string {
        return this.array.toString().replaceAll(",", " ");
    }

    public get array(): number[] {
        let arr: number[] = [];
        for (const [knot, multiplicity] of this._knots) {
            for (let idx = 0; idx < multiplicity; idx++) {
                arr.push(knot);
            }
        }
        return arr;
    }


}
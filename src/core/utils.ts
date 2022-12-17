import { Vector3 } from "three";

function lerp(a: Vector3, b: Vector3, t: number): Vector3 {
    return b.clone().sub(a).multiplyScalar(t).add(a);
}

function roundN(value: number, n: number = 5) {
    const k = 10 ** n;
    return Math.round(value * k) / k;
}

/**
 * Calculates the binomial coefficients.
 */
function binomial(n: number, k: number): number {
    let coefficient = 1;
    for (let x = n - k + 1; x <= n; x++) {
        coefficient *= x;
    }

    for (let x = 1; x <= k; x++) {
        coefficient /= x;
    }

    return coefficient;
}

/**
 * Calculates the binomial coefficients for a whole line of degree.
 */
function pascalRow(n: number): number[] {
    const result = []
    for (let j = 0; j <= n; j++) {
        result.push(binomial(n, j));
    }

    return result;
}

export { lerp, roundN, binomial, pascalRow }
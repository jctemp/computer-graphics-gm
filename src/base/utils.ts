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
 * transpose a given 2d number vector
 */
function transpose(matrix: any[][]): any[][] {
    if (matrix.length === 0) return []
    const transposed: any[][] = [];
    for (let idx = 0; idx < matrix[0].length; idx++) {
        transposed[idx] = [];
        for (let jdx = 0; jdx < matrix.length; jdx++) {
            transposed[idx].push(matrix[jdx][idx]);
        }
    }
    return transposed;
}

export { lerp, roundN, binomial, transpose }
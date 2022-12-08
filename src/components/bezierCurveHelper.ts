import { Group, Vector3 } from "three";
import { CustomLine } from "../core/customLine";
import { CustomPoint, Shape } from "../core/customPoint";
import { BezierGenerator } from "../generators/bezier";
import { BezierCurveObserver } from "./bezierCurve";

// /**
//  * This interface should allow foreign object to get a callback
//  * if a value of the `BezierCurve` changes.
//  */
// export interface BezierCurveHelperObserver {
// }

export class BezierCurveHelper extends Group implements BezierCurveObserver {

    private _t: number;
    private _tangentMagnitude: number;

    private _controlPoints: Array<Vector3>;
    private _contronPointsState: boolean;

    private _point: CustomPoint;
    private _pointTangent: CustomLine;
    private _intermediates: Array<CustomLine>;

    constructor() {
        super();

        this._t = .25;
        this._tangentMagnitude = 2;

        this._controlPoints = new Array<Vector3>();
        this._contronPointsState = true;

        this._point = new CustomPoint(Shape.SPHERE, 0);
        this._pointTangent = new CustomLine();
        this._intermediates = new Array<CustomLine>();

        this.resetHelper();
    }

    public resetHelper(): void {

        // NOTE: we could push and pop form the arrays and other 
        // array manipulations. However, this would introduce
        // unnecessary logic making this function overcomplicated.
        this.children.forEach(child => child.removeFromParent());

        this._point = new CustomPoint(Shape.SPHERE, .25);
        this._point.wireframe = false;
        this._point.color = 0xFF7F00; // orange
        this.add(this._point);

        this._pointTangent = new CustomLine();
        this._pointTangent.color = 0x007FFF; // blue
        this._pointTangent.renderOrder = 2;
        this.add(this._pointTangent);

        const max = BezierGenerator
            .calculateIntermediates(this._controlPoints, 0).length;
        for (let idx = 0; idx < max; idx++) {
            const line = new CustomLine();
            line.color = 0x7F00FF; // violet
            line.renderOrder = 1;
            this._intermediates.push(line);
            this.add(line);
        }
    }

    public updateHelper(): void {

        const point = BezierGenerator.evaluatePoint(this._controlPoints, this._t);
        this._point.setPosition(point);

        const derivative = BezierGenerator
            .evaluateDerivative(this._controlPoints, this._t)
            .normalize()
            .multiplyScalar(this._tangentMagnitude);
        this._pointTangent.data = [
            this._point.position,
            this._point.position.clone().add(derivative)
        ]

        const intermediates = BezierGenerator
            .calculateIntermediates(this._controlPoints, this._t);
        intermediates.forEach((points, idx) => {
            if (idx < this._intermediates.length) {
                this._intermediates[idx].data = points
            }
        });
    }

    /**
     * Get the current calculated point on the curve.
     */
    public get t(): number {
        return this._t;
    }

    /**
     * Set the current calculated point on the curve.
     */
    public set t(t: number) {
        this._t = t;
        this.updateHelper();
    }

    /**
     * Gets the current magnitude of the tangent.
     */
    public get tangentMagnitude(): number {
        return this._tangentMagnitude;
    }

    /**
     * Sets the current magnitude of the tangent.
     */
    public set tangentMagnitude(magnitude: number) {
        this._tangentMagnitude = magnitude;
        this.updateHelper();
    }

    /**
     * ``togglePoint`` is a UI function that disables the point with
     * its tanget.
     */
    public toggleCurrentPoint() {
        const point = this.children.find(obj => obj === this._point);
        const pointTangent = this.children.find(obj => obj === this._pointTangent);
        
        if (point) {
            this.children = this.children.filter(curr => curr != point);
            this.children = this.children.filter(curr => curr != pointTangent);
        } else {
            this.add(this._point);
            this.add(this._pointTangent);
        }
    }

    /**
     * `toggleIntermediates` is a UI function that disables the 
     * lerp intermediates lines.
     */
    public toggleIntermediates(): void {
        let disabled = false;
        this._intermediates
            .map(interm => this.children.find(obj => obj === interm))
            .filter(obj => obj !== undefined)
            .forEach(obj => {
                this.children = this.children.filter((curr) => curr !== obj);
                disabled = true;
            });

        if (!disabled && this._contronPointsState) {
            this._intermediates.forEach(o => this.add(o));
        }
    }

    controlPoints(buffer: Array<Vector3>): void {
        const newLength = this._controlPoints.length !== buffer.length;
        this._controlPoints = buffer;
        if (newLength) {
            this.resetHelper();
        }
        this.updateHelper();
    }

    controlPolygon(state: boolean): void {
        this._contronPointsState = state;
        this.toggleIntermediates();
    }
}
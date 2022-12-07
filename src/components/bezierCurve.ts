import { Vector3, Group } from "three";
import { CustomLine } from "../core/customLine";
import { BezierGenerator } from "../generators/bezierGenerator";

export class BezierCurve extends Group {

    private _resolution: number;
    private _step: number;

    private _curve: CustomLine;
    private _controlPolygon: CustomLine;

    constructor() {
        super();

        this._resolution = 100;
        this._step = .25;

        this._curve = new CustomLine();
        this._controlPolygon = new CustomLine();

        this.add(this._curve);
        this.add(this._controlPolygon);
    }

    /**
     * The `controlPolygon` set the data for the control polygon
     * and update the presented curve.
     */
    public set controlPolygon(points: Array<Vector3>) {
        this._controlPolygon.data = points;
        this._curve.data = BezierGenerator.generateBezierCurve(points, this.resolution);
    }

    /**
     * Gets the current resolution of the curve.
     */
    public get resolution(): number {
        return this._resolution;
    }

    /**
     * Sets the current resolution of the curve, which means the
     * amount of point created to represent the curve. A high
     * resolution means a smoother curve.
     */
    public set resolution(resolution: number) {
        this._resolution = resolution;
        this._curve.data = BezierGenerator.generateBezierCurve(this.controlPoints(), this.resolution);
    }

    /**
     * Get the current calculated point on the curve.
     */
    public get step(): number {
        return this._step;
    }
    
    /**
     * Set the current calculated point on the curve.
     */
    public set step(step: number) {
        this._step = step;
        // TODO: UPDATE 
    }

    /**
     * Add or removes the control polygon from the rendering.
     */
    public toggleControlPolygon(): void {
        let idx = this.children.findIndex(obj => obj === this._controlPolygon);
        if (idx != -1) {
            this.children = this.children.filter((_, jdx) => idx !== jdx);
        } else {
            this.add(this._controlPolygon);
        }
    }

    /**
     * `controlPoints` is a helper function to determine the `Vector3`
     * representation of the plain values in the Buffer.
     * @returns 
     */
    public controlPoints(): Array<Vector3> {
        const buffer = this._controlPolygon.geometry.getAttribute("position").array;
        const points = new Array<Vector3>();
        for (let idx = 0; idx < buffer.length; idx += 3) {
            let p = new Vector3(
                buffer[idx],
                buffer[idx + 1],
                buffer[idx + 2]
            );
            points.push(p);
        }
        return points;
    }

}
import { Group, Vector3 } from "three";
import { Signal, Slot } from "../core/connector";
import { CustomLine } from "../core/customLine";
import { CustomPoint, Shape } from "../core/customPoint";
import { BezierLogic } from "../logic/bezier";

export class BezierCurveHelper extends Group {

    public signalTimeValue: Signal<number>;
    public slotControlPoints: Slot<Array<Vector3>>;
    public slotControlPolygon: Slot<boolean>;

    private _t: number;
    private _tangentMagnitude: number;

    private _controlPoints: Array<Vector3>;
    private _contronPointsState: boolean;

    private _point: CustomPoint;
    private _pointTangent: CustomLine;
    private _intermediates: Array<CustomLine>;

    constructor() {
        super();

        this.signalTimeValue = new Signal<number>();

        this.slotControlPoints = new Slot<Array<Vector3>>();
        this.slotControlPoints.addCallable(buffer => {
            const newLength = this._controlPoints.length !== buffer.length;
            this._controlPoints = buffer;
            if (newLength) {
                this.resetHelper();
            }
            this.updateHelper();
        });

        this.slotControlPolygon = new Slot<boolean>();
        this.slotControlPolygon.addCallable(state => {
            this._contronPointsState = state;
            this.toggleIntermediates();
        });

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
        while (this.children.length > 0) {
            const child = this.children.pop();
            child?.removeFromParent();
        }

        this._point = new CustomPoint(Shape.SPHERE, .25);
        this._point.wireframe = false;
        this._point.color = 0xFF7F00; // orange
        this.add(this._point);

        this._pointTangent = new CustomLine();
        this._pointTangent.color = 0x007FFF; // blue
        this._pointTangent.renderOrder = 2;
        this.add(this._pointTangent);

        const max = BezierLogic
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

        const point = BezierLogic.evaluatePoint(this._controlPoints, this._t);
        this._point.setPosition(point);

        const derivative = BezierLogic
            .evaluateDerivative(this._controlPoints, this._t)
            .normalize()
            .multiplyScalar(this._tangentMagnitude);
        this._pointTangent.data = [
            this._point.position,
            this._point.position.clone().add(derivative)
        ]

        const intermediates = BezierLogic
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
        this.signalTimeValue.emit(this._t);
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
}
import { Vector3 } from "three";
import { CustomLine } from "../core/customLine";
import { Signal, Slot } from "../core/connector";
import { CustomPoint, Shape } from "../core/customPoint";
import { Object, ObjectPosition } from "./object";

/**
 * The `Curve` class represents any curve type. It contains two aspect
 * that are essential: The curve points itself and the control points. 
 */
export class Curve extends Object {

    /**
     * The `set` method updates the buffers of curve and control
     * points.
     * @param curve array with all curve points
     * @param controlPoints array with the control points
     */
    public set(curve: Vector3[], controlPoints: Vector3[]): void {
        this._curve.buffer = curve;
        this._controlPolygon.buffer = controlPoints;
    }

    /**
     * The `toggleControlPolygon` adds or removes the the control polyon
     * from the group. Consequentially, the control polygon is only 
     * rendered if it is appended to the render group. More, triggering
     * this function will emit a signal containing the state as a ``boolean``.
     */
    public toggleControlPolygon(): void {
        let idx = this.children.findIndex(obj => obj === this._controlPolygon);
        let state = false;
        if (idx != -1) {
            this.children = this.children.filter((_, jdx) => idx !== jdx);
        } else {
            this.add(this._controlPolygon);
            state = true;
        }
        this.signalControlPointsState.emit(state);
    }

    /// -----------------------------------------------------------------------
    /// CONSTRUCTOR, GETTER and SETTER

    private _curve: CustomLine;
    private _controlPolygon: CustomLine;
    private _resolution: number;

    public signalControlPointsState: Signal<boolean>;
    public signalResolution: Signal<number>;

    constructor() {
        super();

        this.signalControlPointsState = new Signal<boolean>();
        this.signalResolution = new Signal<number>();

        this._curve = new CustomLine();
        this._controlPolygon = new CustomLine();
        this._resolution = 32;

        this.add(this._curve);
        this.add(this._controlPolygon);
    }

    public get resolution(): number {
        return this._resolution;
    }

    public set resolution(value: number) {
        this._resolution = Math.max(32, Math.min(1024, value));
    }

    override getPosition(): ObjectPosition {
        return new CurvePosition();
    }
}

/**
 * The `CurvePosition` class does represent three aspects regarding
 * a `Curve` point: The current point at t with the corresponding
 * tangent and the intermediate calculates to determine the point.
 */
export class CurvePosition extends ObjectPosition {

    /**
     * The `set` function changes the internal values that provide a
     * look-up for `update()`.
     * @param points curve points positions as `Vector3`
     * @param tangents curve points tangents as `Vector3`
     * @param intermediates de-Casteljau interations for a position 
     */
    public set(points: Vector3[], tangents: Vector3[], intermediates: Vector3[][][]): void {
        this._points = points;
        this._tangents = tangents;
        this._intermediates = intermediates;

        while (this.children.length > 0) {
            const child = this.children.pop();
            child?.removeFromParent();
        }

        this.add(this._point);
        this.add(this._tangent);

        this._intermediate = [];
        for (let idx = 0; idx < this._intermediates[0].length; idx++) {
            const line = new CustomLine();
            line.color = 0x7F00FF; // violet
            line.renderOrder = 1;

            this._intermediate.push(line);
            this.add(line);
        }

        if (!this._controlPointsState)
            this.toggleIntermediates();

        if (!this._pointState)
            this.toggleCurrentPoint();

        this.update();
    }

    /**
     * `update` sets the values for the point, tangent and intermediates based
     * on the current t value.
     */
    public update(): void {
        const idx = Math.floor((this._points.length - 1) * this._t);

        const point = this._points[idx];
        const tangent = this._tangents[idx];
        const intermediate = this._intermediates[idx];

        this._point.buffer = point;
        this._tangent.buffer = [
            point, point.clone()
                .add(tangent.clone().multiplyScalar(this._magnitude))
        ];
        intermediate.forEach((iteration, idx) => {
            this._intermediate[idx].buffer = iteration;
        });
    }

    /**
     * The `toggleCurrentPoint` function adds or removes the point with the 
     * tangent the renderable set.
     */
    public toggleCurrentPoint() {
        const point = this.children.find(obj => obj === this._point);
        if (point) {
            this._pointState = false;
            const tangent = this.children.find(obj => obj === this._tangent);
            this.children = this.children.filter(curr => curr != point);
            this.children = this.children.filter(curr => curr != tangent);
        } else {
            this._pointState = true;
            this.add(this._point);
            this.add(this._tangent);
        }
    }

    /**
     * The `toggleIntermediates` adds or removes the lerp-intermediates from 
     * the renderable set. For consistency, one should connect the state of
     * a corresponding curve.
     */
    public toggleIntermediates(): void {
        let disabled = false;
        this._intermediate
            .map(iteration => this.children.find(obj => obj === iteration))
            .filter(obj => obj !== undefined)
            .forEach(obj => {
                this.children = this.children.filter((curr) => curr !== obj);
                disabled = true;
            });

        if (!disabled && this._controlPointsState) {
            this._intermediate.forEach(iteration => this.add(iteration));
        }
    }

    /// -----------------------------------------------------------------------
    /// CONSTRUCTOR, GETTER and SETTER

    private _points: Vector3[];
    private _tangents: Vector3[];
    private _intermediates: Vector3[][][];

    private _point: CustomPoint;
    private _tangent: CustomLine;
    private _intermediate: CustomLine[];

    private _t: number;
    private _magnitude: number;
    private _size: number;
    private _pointState: boolean;

    public slotControlPointsState: Slot<boolean>;
    private _controlPointsState: boolean;

    public signalTime: Signal<number>;

    constructor() {
        super();

        this.signalTime = new Signal<number>();

        this._controlPointsState = true;
        this.slotControlPointsState = new Slot<boolean>();
        this.slotControlPointsState.addCallable(state => {
            this._controlPointsState = state;
            this.toggleIntermediates();
        });

        this._t = 0.25;
        this._size = .25;
        this._magnitude = .1;
        this._pointState = true;

        this._points = [];
        this._tangents = [];
        this._intermediates = [];

        this._point = new CustomPoint(Shape.SPHERE, .25);
        this._point.wireframe = false;
        this._point.color = 0xFF7F00; // orange

        this._tangent = new CustomLine();
        this._tangent.color = 0x007FFF; // blue
        this._tangent.renderOrder = 2;

        this._intermediate = [];
    }

    public get t(): number {
        return this._t;
    }

    public set t(value: number) {
        this._t = Math.min(Math.max(0, value), 1);
        this.signalTime.emit(value);
        this.update();
    }

    public get size(): number {
        return this._size;
    }

    public set size(value: number) {
        this._size = Math.min(Math.max(0.1, value), 2);
        this._point.scale.set(value, value, value);
    }

    public get magnitude(): number {
        return this._magnitude;
    }

    public set magnitude(value: number) {
        this._magnitude = Math.min(Math.max(0, value), 2);
        this.update();
    }
}

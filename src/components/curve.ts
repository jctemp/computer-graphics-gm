import { Group, Vector3 } from "three";
import { Signal } from "../core/connector";
import { CustomLine } from "../core/customLine";

/**
 * The `Curve` class represents any curve type. It contains two aspect
 * that are essential: The curve points itself and the control points. 
 */
export class Curve extends Group {

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

}
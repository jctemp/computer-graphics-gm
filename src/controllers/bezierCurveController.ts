import { Vector3 } from "three";
import { Canvas } from "../core/canvas";
import { Controller } from "./controller";
import { connect, Slot } from "../core/connector";
import { PolyBase } from "../components/basis";
import { BezierCurveLogic } from "../logic/bezierCurveLogic";
import { Curve } from "../components/curve";
import { CurvePosition } from "../components/curvePosition";
import { ControlPoints1d } from "../components/controlPoints";

export class BezierCurveController extends Controller {

    /// -----------------------------------------------------------------------
    /// CONSTRUCTOR, GETTER and SETTER
    /// ----------------------------------------------------------------------- 

    private _curve: Curve;
    private _curvePosition: CurvePosition;
    private _polynomialBasis: PolyBase;
    private _controlPoints: ControlPoints1d;

    public slotChanged: Slot<null>;

    constructor(canvasWidth: () => number, canvasHeight: () => number) {
        super();

        // 1. create canvas
        this.canvas.push(new Canvas(canvasWidth, canvasHeight));
        this.canvas.push(new Canvas(canvasWidth, canvasHeight, false));

        // 2. control points
        this._controlPoints = new ControlPoints1d();
        this.canvas[0].append(this._controlPoints);
        this._controlPoints._points.forEach(c => this.canvas[0].draggable(c));

        // 3. curve
        this._curve = new Curve();
        this.canvas[0].append(this._curve);

        this._curvePosition = new CurvePosition();
        this.canvas[0].append(this._curvePosition);

        this._polynomialBasis = new PolyBase();
        this.canvas[1].append(this._polynomialBasis);

        // 4. slots
        this.slotChanged = new Slot<null>();
        this.slotChanged.addCallable((_) => this.changed());

        connect(this._controlPoints.signalMaxChanged, this.slotChanged);
        connect(this._curve.signalControlPointsState, this._curvePosition.slotControlPointsState);
        connect(this._curvePosition.signalTime, this._polynomialBasis.slotTime);

        this.changed();
    }
    
    /// -----------------------------------------------------------------------
    /// OVERRIDES
    /// -----------------------------------------------------------------------
    
    override update(): void {
        if (this.needsUpdate) {
            let controlPoints = this._controlPoints.children.map((p, idx) => {
                if (idx < this._controlPoints.max)
                    return p.position.clone();
                else
                    return new Vector3(Number.MAX_SAFE_INTEGER);
            }).filter(value => value.x !== Number.MAX_SAFE_INTEGER);

            const [points, tangents, intermediates] =
                BezierCurveLogic.generateCurve(controlPoints, this._curve.resolution);

            this._curve.set(points, controlPoints);
            this._curvePosition.set(points, tangents, intermediates);
            this._polynomialBasis.set(controlPoints.length - 1, this._curve.resolution);

            this.needsUpdate = false;
        }
    }

    override gui(gui: dat.GUI): void {
        const curve = gui.addFolder("Bezier Curve")
        const curvePoint = gui.addFolder("Bezier Curve Position");

        curve.open();
        curvePoint.open();

        curve.add(this._controlPoints, "max", 3, this._controlPoints._points.length, 1)
            .name("Control Points Count")
        curve.add(this._curve, "resolution", 16, 256, 2)
            .name("Resolution").onChange(() => this.changed());
        curve.add(this._curve, "toggleControlPolygon")
            .name("Toggle Control Polygon");

        curvePoint.add(this._curvePosition, "t", 0, 1, .01)
            .name("t (step)");
        curvePoint.add(this._curvePosition, "size", .1, 2, .1)
            .name("Point Size");
        curvePoint.add(this._curvePosition, "magnitude", 0, 2, .1)
            .name("Tangent Magnitude");
        curvePoint.add(this._curvePosition, "toggleIntermediates")
            .name("Toggle Intermediates");
        curvePoint.add(this._curvePosition, "toggleCurrentPoint")
            .name("Toggle Current Point");

    }
}  
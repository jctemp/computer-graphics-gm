import { Vector3 } from "three";
import { Canvas } from "../base/canvas";
import { Controller } from "../base/controller";
import { connect } from "../base/connector";
import { BezierCurveLogic } from "../bezier/bezierCurveLogic";
import { Curve, CurvePosition } from "../base/curve";
import { ControlPoints1d } from "../base/controlPoints";
import { Basis } from "../base/basis";
import { PolynomialBasisLogic } from "./polynomialBasisLogic";

export class BezierCurveController extends Controller {

    /// -----------------------------------------------------------------------
    /// CONSTRUCTOR, GETTER and SETTER
    /// ----------------------------------------------------------------------- 

    private _basis: Basis;

    constructor(canvasWidth: () => number, canvasHeight: () => number) {
        super();

        // 1. create canvas
        this.addCanvas(new Canvas(canvasWidth, canvasHeight));
        this.addCanvas(new Canvas(canvasWidth, canvasHeight, false));

        // 2. control points
        this.appendControlPoints(new ControlPoints1d(4));

        // 3. curve
        this.addObject(new Curve());

        this._basis = new Basis();
        this.canvas[1].append(this._basis);

        // 4. signals
        this.connectStandardSignals();
        connect(this.object().signalControlPointsState, this.position().slotControlPointsState);
        connect(this.position().signalTime, this._basis.slotTime);

        this.changed();
    }

    /// -----------------------------------------------------------------------
    /// OVERRIDES
    /// -----------------------------------------------------------------------

    override update(): void {
        if (this.needsUpdate) {
            let controlPoints = this._controlPoints.children.map((p, idx) => {
                if (idx < (this._controlPoints as ControlPoints1d).max)
                    return p.position.clone();
                else
                    return new Vector3(Number.MAX_SAFE_INTEGER);
            }).filter(value => value.x !== Number.MAX_SAFE_INTEGER);

            const [points, tangents, intermediates] =
                BezierCurveLogic.generateCurve(controlPoints, this.object().resolution);

            this.object().set(points, controlPoints);
            this.position().set(points, tangents, intermediates);
            this._basis.set(PolynomialBasisLogic.generateBernsteinBasis(controlPoints.length - 1, this.object().resolution));
            this.needsUpdate = false;
        }
    }

    override gui(gui: dat.GUI): void {
        const curve = gui.addFolder("Bezier Curve")
        const curvePoint = gui.addFolder("Bezier Curve Position");

        curve.open();
        curvePoint.open();

        curve.add(this._controlPoints, "max", 3, (this._controlPoints as ControlPoints1d)._points.length, 1)
            .name("Control Points Count")
        curve.add(this.object(), "resolution", 16, 1024, 2)
            .name("Resolution").onChange(() => this.changed());
        curve.add(this, "toggleControlPoints")
            .name("Toggle Control Points");
        curve.add(this.object(), "toggleControlPolygon")
            .name("Toggle Control Polygon");

        curvePoint.add(this.position(), "t", 0, 1, .01)
            .name("t (step)");
        curvePoint.add(this.position(), "size", .1, 2, .1)
            .name("Point Size");
        curvePoint.add(this.position(), "magnitude", 0, 2, .1)
            .name("Tangent Magnitude");
        curvePoint.add(this.position(), "toggleIntermediates")
            .name("Toggle Intermediates");
        curvePoint.add(this.position(), "toggleCurrentPoint")
            .name("Toggle Current Point");

    }

    private object(): Curve {
        return this._object as Curve;
    }
    private position(): CurvePosition {
        return this._position as CurvePosition;
    }
}  
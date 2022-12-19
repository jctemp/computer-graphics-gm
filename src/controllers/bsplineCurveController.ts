import { GUI } from "dat.gui";
import { ControlPoints1d } from "../components/controlPoints";
import { Curve, CurvePosition } from "../components/curve";
import { Canvas } from "../core/canvas";
import { Controller } from "./controller";
import { SplineLogic } from "../logic/splinesLogic";
import { Basis } from "../components/basis";
import { KnotVector } from "../logic/knotVector";

export class BSplineCurveController extends Controller {

    /// -----------------------------------------------------------------------
    /// CONSTRUCTOR, GETTER and SETTER
    /// ----------------------------------------------------------------------- 

    private _basis: Basis;
    private _knots: KnotVector;
    private _degree: number;
    private _u: number;

    public get degree(): number {
        return this._degree;
    }
    public set degree(value: number) {
        // we need to check this invariance as we have to ensure that the curve is
        // not only defined in a point as the derivative is then not existent.
        // Therefore, we check the index range of the support.
        const [leftBoundIndex, rightBoundIndex] = this._knots.supportRange(value);
        if (rightBoundIndex - leftBoundIndex < 1) return;
        if (value === 1) return;
        this._degree = value;
    }

    constructor(canvasWidth: () => number, canvasHeight: () => number) {
        super();

        this._u = 0;

        // 1. create canvas
        this.addCanvas(new Canvas(canvasWidth, canvasHeight));
        this.addCanvas(new Canvas(canvasWidth, canvasHeight, false));

        this._knots = new KnotVector([0, 2, 4, 6, 8, 10]);
        this._degree = 3;

        // 2. control points
        this.appendControlPoints(new ControlPoints1d(this._knots.controlPolygon(this.degree)));

        // 3. curve
        this.addObject(new Curve());

        this._basis = new Basis();
        this.canvas[1].append(this._basis);

        // 4. signals
        this.connectStandardSignals();

        this.changed();
    }

    /// -----------------------------------------------------------------------
    /// OVERRIDES
    /// -----------------------------------------------------------------------

    override update(): void {
        if (this.needsUpdate) {
            this.points().max = this._knots.controlPolygon(this.degree);
            let controlPoints = this.points().children.map(p => p.position.clone());
            const [points, tangent, basis] = SplineLogic.generateCurve(this._knots, controlPoints, this.degree, this.object().resolution)

            this.object().set(points, controlPoints);
            this.position().set(points, tangent, []);
            this._basis.set(basis);
            // let basises = PolynomialBasisLogic.generateNormalisedBasis(this._knots, controlPoints.length - 1, this.object().resolution);

            // get highest degree functions for writing their values to the diagram
            // const coefficients = basises[basises.length - 1];
            // this._basis.set(coefficients);

            this.needsUpdate = false;
        }
    }

    override gui(gui: GUI): void {
        const curve = gui.addFolder("BSplines")
        const curvePoint = gui.addFolder("BSpline Position");

        curve.open();
        curvePoint.open();

        curve.add(this.object(), "resolution", 16, 1024, 2)
            .name("Resolution").onChange(() => this.changed());
        curve.add(this, "degree", 1, 8, 1)
            .name("Degree").onChange(() => this.changed());
        curve.add(this._knots, "knots").listen().name("Knot Vector");
        curve.add(this, "addKnot").onFinishChange(() => this.changed()).name("Add Knot Value");
        curve.add(this, "removeKnot").onFinishChange(() => this.changed()).name("Remove Knot Value");
        curve.add(this, "_u", -100, 100, 1).name("Current Knot Value");

        curvePoint.add(this.position(), "t", 0, 1, .01)
            .name("t (step)");
        curvePoint.add(this.position(), "size", .1, 2, .1);
        curvePoint.add(this.position(), "magnitude", 0, 2, .1);
    }

    private points(): ControlPoints1d {
        return this._controlPoints as ControlPoints1d;
    }
    private object(): Curve {
        return this._object as Curve;
    }
    private position(): CurvePosition {
        return this._position as CurvePosition;
    }

    /**
     * Wrapper to make insert call. Only for the UI.
     */
    // @ts-ignore
    private addKnot(): void {
        this._knots.addKnot(this._u, this.degree);
    }

    /**
     * Wrapper to make delete call. Only for the UI.
     */
    // @ts-ignore
    private removeKnot(): void {
        this._knots.removeKnot(this._u, this.degree);
    }
}
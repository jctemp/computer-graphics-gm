import { GUI } from "dat.gui";
import { ControlPoints1d } from "../components/controlPoints";
import { Curve, CurvePosition } from "../components/curve";
import { Canvas } from "../core/canvas";
import { Controller } from "./controller";
import { SplineLogic } from "../logic/splinesLogic";
import { Basis } from "../components/basis";
import { KnotVector } from "../logic/knotVector";
import { transpose } from "../core/utils";

class Weights {
    private _weights: number[] = [];

    constructor(weights: number[] = []) {
        this._weights = weights;
    }

    public set weights(_: string) {
        /* 
        THE GETTER AND SETTER IS THERE FOR THE GUI, WHICH IS MANDATORY.
        HERE IS NO IMPLEMENTATION AS IT SHOULD NOT BE USED, HENCE NO
        FUNCTIONALITY.
        */
    }

    public get weights(): string {
        return this._weights.toString().replaceAll(",", " ");
    }

    public weightArray(): number[] {
        return this._weights;
    }
    public append(value: number) {
        this._weights.push(value);
    }
    public remove() {
        this._weights.pop();
    }
    public change(pos: number, value: number) {
        if (this._weights.at(pos) !== undefined) this._weights[pos] = value;
    }
}

export class BSplineCurveController extends Controller {

    /// -----------------------------------------------------------------------
    /// CONSTRUCTOR, GETTER and SETTER
    /// ----------------------------------------------------------------------- 

    private _basis: Basis;
    private _knots: KnotVector;
    private _weights: Weights;
    private _degree: number;
    private _u: number;
    private _wPos: number;
    private _wVal: number;

    public get degree(): number {
        return this._degree;
    }
    public set degree(value: number) {
        // we need to check this invariance as we have to ensure that the curve is
        // not only defined in a point as the derivative is then not existent.
        // Therefore, we check the index range of the support.
        if (!this._knots.validDegree(value)) return;
        const [leftBoundIndex, rightBoundIndex] = this._knots.supportRange(value);
        if (rightBoundIndex - leftBoundIndex < 2) return;
        if (value === 1) return;
        this._degree = value;
    }

    constructor(canvasWidth: () => number, canvasHeight: () => number) {
        super();

        this._u = 0;
        this._wPos = 0;
        this._wVal = 1;

        // 1. create canvas
        this.addCanvas(new Canvas(canvasWidth, canvasHeight));
        this.addCanvas(new Canvas(canvasWidth, canvasHeight, false));

        this._knots = new KnotVector([-1, -1, 2, 3, 5, 5, 5, 7, 8, 10, 10]);
        this._degree = 3;
        this._weights = new Weights([1, 1, 1, 1, 1, 1, 1, 1, 1]);

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
            const [points, tangent, interm, basis] = SplineLogic.generateCurve(this._knots, controlPoints, this._weights.weightArray(), this.degree, this.object().resolution)

            this.object().set(points, controlPoints);
            this.position().set(points, tangent, interm);            
            this._basis.set(transpose(basis));

            this.needsUpdate = false;
        }
    }

    override gui(gui: GUI): void {
        const curve = gui.addFolder("BSplines");
        const insertion = gui.addFolder("Knot insertions");
        const weights = gui.addFolder("NURBS Weights");
        const curvePoint = gui.addFolder("BSpline Position");

        curve.open();
        insertion.open();
        weights.open();
        curvePoint.open();


        curve.add(this.object(), "resolution", 16, 1024, 2)
            .name("Resolution").onChange(() => this.changed());
        curve.add(this, "degree", 1, 8, 1)
            .name("Degree").onChange(() => this.changed());
        curve.add(this, "toggleControlPoints")
            .name("Toggle Control Points");
        curve.add(this.object(), "toggleControlPolygon")
            .name("Toggle Control Polygon");

        insertion.add(this._knots, "knots").listen().name("Knot Vector");    
        insertion.add(this, "addKnot").onFinishChange(() => this.changed()).name("Add Knot Value");
        insertion.add(this, "removeKnot").onFinishChange(() => this.changed()).name("Remove Knot Value");
        insertion.add(this, "_u", -100, 100, 1).name("Current Knot Value");

        weights.add(this._weights, "weights").listen().name("Weight Values");
        weights.add(this, "changeWeight").onFinishChange(() => this.changed()).name("Change Weight");
        weights.add(this, "_wPos", 0, 100, 1).name("Weight Position");
        weights.add(this, "_wVal", 1, 100, 1).name("Weight Value");

        curvePoint.add(this.position(), "t", 0, 1, .01)
            .name("t (step)");
        curvePoint.add(this.position(), "size", .1, 2, .1);
        curvePoint.add(this.position(), "magnitude", 0, 2, .1)
            .name("Tangent Magnitude");
        curvePoint.add(this.position(), "toggleIntermediates")
            .name("Toggle Intermediates");
        curvePoint.add(this.position(), "toggleCurrentPoint")
            .name("Toggle Current Point");
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
        if (this._knots.addKnot(this._u, this.degree)) this._weights.append(1);
    }

    /**
     * Wrapper to make delete call. Only for the UI.
     */
    // @ts-ignore
    private removeKnot(): void {
        if (this._knots.removeKnot(this._u, this.degree)) this._weights.remove();
    }

    /**
     * Wrapper to make change call on weights object. Only for the UI.
     */
    // @ts-ignore
    private changeWeight() {
        this._weights.change(this._wPos, this._wVal);
    }
}
import { GUI } from "dat.gui";
import { ControlPoints1d } from "../base/controlPoints";
import { Curve, CurvePosition } from "../base/curve";
import { Canvas } from "../base/canvas";
import { Controller } from "../base/controller";
import { SplineLogic } from "./splinesLogic";
import { Basis } from "../base/basis";
import { KnotVector } from "./knotVector";
import { transpose } from "../base/utils";

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
    /**
     * returns the weights represented as a string for GUI purposes.
     */
    public get weights(): string {
        return this._weights.toString().replaceAll(",", " ");
    }

    /**
     * get the private attribute containing the weights as an array.
     * 
     * @returns array containing numerical weights
     */
    public weightArray(): number[] {
        return this._weights;
    }

    /**
     * append one new weight with default value of 1.
     * 
     * @param value to set the new weight to
     */
    public append(value: number = 1) {
        this._weights.push(value);
    }
    /**
     * remove exactly one weight at the array's end.
     */
    public remove() {
        this._weights.pop();
    }

    /**
     * change the weight's value at the given position to a new numerical value.
     * 
     * @param pos position inside the array of weights
     * @param value new value of the weight
     */
    public change(pos: number, value: number) {
        if (this._weights.at(pos) !== undefined) this._weights[pos] = value;
    }

    /**
     * change the length of the weight array. is needed for sudden changes of more than
     * one difference when e.g. changing the degree from 5 to 3.
     */
    public set length(length: number) {
        while (this._weights.length > length) this.remove();
        while (this._weights.length < length) this.append(1);
    }
}

export class BSplineCurveController extends Controller {
    /// -----------------------------------------------------------------------
    /// ATTRIBUTES
    /// -----------------------------------------------------------------------

    private _basis: Basis;
    private _knots: KnotVector;
    private _weights: Weights;
    private _degree: number;
    private _u: number;
    private _wPos: number;
    private _wVal: number;

    /// -----------------------------------------------------------------------
    /// CONSTRUCTOR, GETTER and SETTER
    /// ----------------------------------------------------------------------- 

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

        // set default value for the point shown on the curve
        this._u = 0;
        // set default values for the weight parameter inside the GUI
        this._wPos = 0;
        this._wVal = 1;

        // 1. create canvas
        this.addCanvas(new Canvas(canvasWidth, canvasHeight));
        this.addCanvas(new Canvas(canvasWidth, canvasHeight, false));

        // 2. set spline specific parameter
        this._knots = new KnotVector([-1, -1, 2, 3, 5, 5, 5, 7, 8, 10, 10]);
        this._degree = 3;
        this._weights = new Weights([1, 1, 1, 1, 1, 1, 1, 1, 1]);

        // 3. control points
        this.appendControlPoints(new ControlPoints1d(this._knots.controlPolygon(this.degree)));

        // 4. curve
        this.addObject(new Curve());

        // 5. append basis for intermediates
        this._basis = new Basis();
        this.canvas[1].append(this._basis);

        // 6. signals
        this.connectStandardSignals();

        // execute changed method for initial calculations
        this.changed();
    }

    /// -----------------------------------------------------------------------
    /// OVERRIDES
    /// -----------------------------------------------------------------------

    override update(): void {
        if (this.needsUpdate) {
            this.points().max = this._knots.controlPolygon(this.degree);
            this._weights.length = this.points().max;
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
        // weights.open();
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

    /// -----------------------------------------------------------------------
    /// CALLS FOR OBJECT-TYPE IDENTIFICATION
    /// -----------------------------------------------------------------------

    private points(): ControlPoints1d {
        return this._controlPoints as ControlPoints1d;
    }
    private object(): Curve {
        return this._object as Curve;
    }
    private position(): CurvePosition {
        return this._position as CurvePosition;
    }

    /// -----------------------------------------------------------------------
    /// WRAPPER. ONLY FOR GUI
    /// -----------------------------------------------------------------------

    /**
     * Wrapper to make knot insert call.
     */
    // @ts-ignore
    private addKnot(): void {
        if (this._knots.addKnot(this._u, this.degree)) this._weights.append(1);
    }

    /**
     * Wrapper to make knot delete call.
     */
    // @ts-ignore
    private removeKnot(): void {
        if (this._knots.removeKnot(this._u, this.degree)) this._weights.remove();
    }

    /**
     * Wrapper to make value change call on weights object.
     */
    // @ts-ignore
    private changeWeight() {
        this._weights.change(this._wPos, this._wVal);
    }
}
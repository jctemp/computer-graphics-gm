import { GUI } from "dat.gui";
import { Vector3 } from "three";
import { ControlPoints1d } from "../components/controlPoints";
import { Curve, CurvePosition } from "../components/curve";
import { Canvas } from "../core/canvas";
import { Controller } from "./controller";
import { SplineLogic, KnotVector } from "../logic/splinesLogic";
import { primaryColor } from "../core/color";
import { Basis } from "../components/basis";
import { transpose } from "../core/utils";

export class BSplineCurveController extends Controller {

    /// -----------------------------------------------------------------------
    /// CONSTRUCTOR, GETTER and SETTER
    /// ----------------------------------------------------------------------- 

    private _basis: Basis;
    private _knots: KnotVector;
    private _degree: number;
    private _u: number;

    constructor(canvasWidth: () => number, canvasHeight: () => number) {
        super();

        this._u = 0;

        // 1. create canvas
        this.addCanvas(new Canvas(canvasWidth, canvasHeight));
        this.addCanvas(new Canvas(canvasWidth, canvasHeight, false));

        this._degree = 3;
        this._knots = new KnotVector([0, 0, 0, 2, 4, 4, 5, 7, 7, 7, 9, 10, 12, 12],
            primaryColor.length + this._degree); // d + n - 1 = k

        // 2. control points
        this.appendControlPoints(new ControlPoints1d(this._knots.requiredControlPoints(this._degree)));

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
            this.points().max = this._knots.requiredControlPoints(this._degree);

            let controlPoints = this._controlPoints.children.map((p, idx) => {
                if (idx < this.points().max)
                    return p.position.clone();
                else
                    return new Vector3(Number.MAX_SAFE_INTEGER);
            }).filter(value => value.x !== Number.MAX_SAFE_INTEGER);

            const [points, tangent, basis] = SplineLogic.generateCurve(this._knots, controlPoints, this._degree, this.object().resolution)

            this.object().set(points, controlPoints);
            this.position().set(points, tangent, []);

            // const test:number[] = [];
            // basis.forEach(value => {
            //     test.push(value[3])
            // });
            // console.log(test)

            const bT = transpose(basis);
            this._basis.set(bT);

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
        curve.add(this, "_degree", 1, 8, 1)
            .name("Degree").onChange(() => this.changed());
        curve.add(this._knots, "knots").listen().name("Knot Vector");
        curve.add(this, "insert").onFinishChange(() => this.changed()).name("Insert Knot Value");
        curve.add(this, "delete").onFinishChange(() => this.changed()).name("Delete Knot Value");
        curve.add(this, "_u", -100, 100, 1).name("Knot Value");

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
    private insert(): void {
        const [_, m] = this._knots.findIndex(this._u);
        if (m === this._degree) return;
        this._knots.insert(this._u);
    }

    /**
     * Wrapper to make delete call. Only for the UI.
     */
    // @ts-ignore
    private delete(): void {
        this._knots.delete(this._u);
    }
}
import { GUI } from "dat.gui";
import { Vector3 } from "three";
import { ControlPoints1d } from "../components/controlPoints";
import { Curve, CurvePosition } from "../components/curve";
import { Canvas } from "../core/canvas";
import { Controller } from "./controller";
import { SplineLogic, KnotVector } from "../logic/splinesLogic";

export class BSplineCurveController extends Controller {

    /// -----------------------------------------------------------------------
    /// CONSTRUCTOR, GETTER and SETTER
    /// ----------------------------------------------------------------------- 

    private _knots: KnotVector;
    private _degree: number;

    constructor(canvasWidth: () => number, canvasHeight: () => number) {
        super();

        // 1. create canvas
        this.addCanvas(new Canvas(canvasWidth, canvasHeight));

        // 2. control points
        this.appendControlPoints(new ControlPoints1d());
        
        // 3. curve
        this.addObject(new Curve());

        // 4. signals
        this.connectStandardSignals();

        this._degree = 3; // -> 
        this._knots = new KnotVector([0,1,2,3,4,5]);

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

            const points = SplineLogic.generateCurve(this._knots, controlPoints, this._degree, this.object().resolution)

            this.object().set(points, controlPoints);
            this.position().set(points, [], []);
            
            this.needsUpdate = false;
        }
    }

    override gui(gui: GUI): void {
        
    }

    private object(): Curve {
        return this._object as Curve;
    }
    private position(): CurvePosition {
        return this._position as CurvePosition;
    }
}
import { Group, Vector3 } from "three";
import { Canvas } from "../core/canvas";
import { primaryColor } from "../core/color";
import { CustomPoint, Shape } from "../core/customPoint";
import { Controller } from "../controllers/controller";
import { BezierCurve } from "../components/bezierCurve";
import { BezierCurveHelper } from "../components/bezierCurveHelper";
import { connect, Signal, Slot } from "../core/connector";
import { randFloat } from "three/src/math/MathUtils";
import { SplineBasis } from "./basis";

class ControlPoints extends Group {

    public signalChanged: Signal<null>;
    public _max: number;
    public _points: Array<CustomPoint>;

    constructor() {
        super();
        this.signalChanged = new Signal<null>();
        this._points = new Array<CustomPoint>();
        for (let idx = 0; idx < primaryColor.length; idx++) {
            const point = this.addPoint(new Vector3(
                randFloat(-10, 10),
                randFloat(-10, 10),
                0
            ));
            point.name = `${idx}`;
            this._points.push(point);
        }

        this._max = 4;
        this.max = this._max;
    }

    public get max(): number {
        return this._max;
    }

    public set max(value: number) {
        this._max = value;

        while (this.children.length > 0) {
            const child = this.children.pop();
            child?.removeFromParent();
        }
        for (let idx = 0; idx < this._max; idx++) {
            this.add(this._points[idx]);
        }
        this.signalChanged.emit(null);
    }

    /**
     * `addPoint` allows add points to the array.
     */
    private addPoint(position: Vector3): CustomPoint {
        let point = new CustomPoint(Shape.CUBE, 1);
        point.setPosition(position);

        point.dragUpdate = () => this.signalChanged.emit(null);
        point.color = primaryColor[this._points.length];

        return point;
    }


}

export class BSplineCurveController extends Controller {

    bezierCurve: BezierCurve;
    bezierCurveHelper: BezierCurveHelper;
    polynomialBasis: SplineBasis;

    controlPoints: ControlPoints;
    slotChanged: Slot<null>;

    constructor(canvasWidth: () => number, canvasHeight: () => number) {
        super();

        // 1. create canvas
        this.canvas.push(new Canvas(canvasWidth, canvasHeight));
        this.canvas.push(new Canvas(canvasWidth, canvasHeight, false));

        // 2. control points
        this.controlPoints = new ControlPoints();
        this.slotChanged = new Slot<null>();
        this.slotChanged.addCallable((_) => this.changed());
        this.canvas[0].append(this.controlPoints);
        this.controlPoints.children.forEach(c => this.canvas[0].draggable(c));

        connect(this.controlPoints.signalChanged, this.slotChanged);

        // 3. create curve
        this.bezierCurve = new BezierCurve();
        this.canvas[0].append(this.bezierCurve);

        this.bezierCurveHelper = new BezierCurveHelper();
        this.canvas[0].append(this.bezierCurveHelper);

        this.polynomialBasis = new SplineBasis();
        this.canvas[1].append(this.polynomialBasis);

        connect(this.bezierCurve.signalControlPoints, this.bezierCurveHelper.slotControlPoints);
        connect(this.bezierCurve.signalControlPolygon, this.bezierCurveHelper.slotControlPolygon);
        connect(this.bezierCurve.signalResolution, this.polynomialBasis.slotResolution);
        
        this.changed();
    }

    /**
     * Called in every `requestFrameAnimation`. It performs all updates on the
     * objects that determine the drawn curve.
     */
    override update(): void {
        if (this.needsUpdate) {
            let cp = this.controlPoints.children.map((p, idx) => {
                if (idx < this.controlPoints.max)
                    return p.position.clone();
                else
                    return new Vector3(Number.MAX_SAFE_INTEGER);
            }).filter(value => value.x !== Number.MAX_SAFE_INTEGER);
            this.bezierCurve.controlPolygon = cp;
            this.needsUpdate = false;
        }
    }

    override gui(gui: dat.GUI): void {
        const bezierCurve = gui.addFolder("Bezier Curve")
        const bezierCurveHelper = gui.addFolder("Bezier Curve Helper");
        const controlPoints = gui.addFolder("Control Points");

        bezierCurve.open();
        bezierCurveHelper.open();
        controlPoints.open();

        bezierCurve.add(this.bezierCurve, "resolution", 16, 256, 2)
            .name("Resolution").onChange(() => this.changed());
        bezierCurve.add(this.bezierCurve, "toggleControlPolygon")
            .name("Toggle Control Polygon");

        bezierCurveHelper.add(this.bezierCurveHelper, "tangentMagnitude", 1, 20, 1)
            .name("Tangent Magnitude");
        bezierCurveHelper.add(this.bezierCurveHelper, "toggleIntermediates")
            .name("Toggle Intermediates");
        bezierCurveHelper.add(this.bezierCurveHelper, "toggleCurrentPoint")
            .name("Toggle Current Point");

        controlPoints.add(this.controlPoints, "max", 2, this.controlPoints._points.length, 1);
    }
}  
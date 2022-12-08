import { Group, Vector3 } from "three";
import { BezierGenerator } from "../generators/bezier";
import { Canvas } from "../core/canvas";
import { primaryColor, primaryColorMax } from "../core/color";
import { CustomLine } from "../core/customLine";
import { CustomPoint, Shape } from "../core/customPoint";
import { Controller } from "./controller";
import { BezierCurve } from "../components/bezierCurve";
import { BezierCurveHelper } from "../components/bezierCurveHelper";
import { PolynomialBasisGenerator } from "../generators/polynomialBasis";


export class BezierCurveController extends Controller {

    step!: number;
    tangentSize: number;

    bezierCurve: BezierCurve;
    bezierCurveHelper: BezierCurveHelper;
    bezierCurvePoints: Array<CustomPoint>;

    bernsteinGroup!: Group;
    bernsteinPolynomials!: Array<CustomLine>;
    bernsteinPoints!: Array<CustomPoint>;

    constructor(canvasWidth: () => number, canvasHeight: () => number) {
        super();

        // 1. create canvas
        this.canvas.push(new Canvas(canvasWidth, canvasHeight));
        this.canvas.push(new Canvas(canvasWidth, canvasHeight, false));

        // 2. set basic variables
        this.step = .5;
        this.tangentSize = 5;

        // 3. create curve
        this.bezierCurve = new BezierCurve();
        this.canvas[0].append(this.bezierCurve);

        this.bezierCurveHelper = new BezierCurveHelper();
        this.bezierCurve.register(this.bezierCurveHelper);
        this.canvas[0].append(this.bezierCurveHelper);

        // 4. create control points
        this.bezierCurvePoints = new Array<CustomPoint>();
        const positions = [
            new Vector3(-10, -10, 0),
            new Vector3(0, 10, 0),
            new Vector3(10, -30, 0),
            new Vector3(-12, -15, 0),
        ];

        for (let idx = 0; idx < 4; idx++) {
            let point = new CustomPoint(Shape.CUBE, 1);
            point.setPosition(positions[idx]);

            point.dragUpdate = () => this.changed();
            point.color = primaryColor[idx];

            this.bezierCurvePoints.push(point);
            this.canvas[0].append(point);
            this.canvas[0].draggable(point);
        }

        this.createBernsteinGroup();

        this.changed();
    }

    private createBernsteinGroup() {
        this.bernsteinGroup?.removeFromParent();

        const points = this.controlPointPositions();

        const coefficients = PolynomialBasisGenerator.generateBasisFunctions(points.length, this.bezierCurve.resolution);
        this.bernsteinGroup = new Group();

        this.bernsteinPolynomials = new Array<CustomLine>();
        coefficients.forEach(coefficient => {
            const line = new CustomLine();
            line.data = coefficient
                .map((y, x) => new Vector3(x / this.bezierCurve.resolution, y, 0));
            this.bernsteinPolynomials.push(line);
            this.bernsteinGroup.add(line);
        });

        this.bernsteinPoints = new Array<CustomPoint>();
        for (let idx = 0; idx < coefficients.length; idx++) {
            let point = new CustomPoint(Shape.SPHERE, .025);
            point.color = primaryColor[idx];
            point.wireframe = false;
            this.bernsteinPoints.push(point);
            this.bernsteinGroup.add(point);
        }

        this.canvas[1].append(this.bernsteinGroup);
        this.bernsteinGroup.position.set(-.5, -.5, 0)
    }

    /**
     * Called in every `requestFrameAnimation`. It performs all updates on the
     * objects that determine the drawn curve.
     */
    override update(): void {
        const points = this.controlPointPositions();

        if (this.needsUpdate) {
            let cp = this.bezierCurvePoints.map(p => p.position.clone());
            this.bezierCurve.controlPolygon = cp;
            this.needsUpdate = false;
        }

        PolynomialBasisGenerator.calculateCoefficients(points.length - 1, this.step)
            .forEach((c, idx) => {
                this.bernsteinPoints[idx].position.set(this.step, c, 0);
            });
    }

    override gui(gui: dat.GUI): void {
        const bezierCurve = gui.addFolder("Bezier Curve")
        bezierCurve.open();
        bezierCurve.add(this.bezierCurve, "resolution", 16, 256, 2)
            .name("Resolution").onChange(() => this.changed());
        bezierCurve.add(this.bezierCurve, "toggleControlPolygon")
            .name("Toggle Control Polygon");

        const bezierCurveHelper = gui.addFolder("Bezier Curve Helper");
        bezierCurveHelper.open();
        bezierCurveHelper.add(this.bezierCurveHelper, "t", 0, 1, .01)
            .name("t (step)").onChange(v=>this.step = v)
        bezierCurveHelper.add(this.bezierCurveHelper, "tangentMagnitude", 1, 20, 1)
            .name("Tangent Magnitude");
        bezierCurveHelper.add(this.bezierCurveHelper, "toggleIntermediates")
            .name("Toggle Intermediates");
        bezierCurveHelper.add(this.bezierCurveHelper, "toggleCurrentPoint")
            .name("Toggle Current Point");
    }


    /**
     * `addPoint` is an UI only function. It allows the user to
     * extend the list of points.
     */
    private addPoint(): void {
        if (this.bezierCurvePoints.length == primaryColorMax) {
            return;
        }

        let point = new CustomPoint("cube", 1);
        point.setPosition(new Vector3());

        point.dragUpdate = () => this.needsUpdate = true;
        point.color = primaryColor[this.bezierCurvePoints.length];
        point.name = `curveControlPoint${this.bezierCurvePoints.length}`;

        this.bezierCurvePoints.push(point);
        this.curveEssentials.add(point);
        this.canvas[0].draggable(point);

        this.createLerpGroup();
        this.createBernsteinGroup();

        this.needsUpdate = true;
    }

    /**
     * `removePoint` is an UI function. It allows users to
     * pop the lsit of points.
     */
    private removePoint(): void {
        if (this.bezierCurvePoints.length > 2) {
            const point = this.bezierCurvePoints.pop();
            point?.removeFromParent();
            this.needsUpdate = true;
            this.createBernsteinGroup();
        }
    }

    /**
     * Helper function.
     */
    private controlPointPositions(): Array<Vector3> {
        return this.bezierCurvePoints.map(point => point.position.clone())
    }
}  
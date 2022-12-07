import { Group, Vector3 } from "three";
import { BezierGenerator } from "../core/bezierGenerator";
import { Canvas } from "../core/canvas";
import { primaryColor, primaryColorMax, secondaryColor } from "../core/color";
import { Line } from "../core/line";
import { Point } from "../core/point";
import { Controller } from "./controller";


export class BezierCurveController extends Controller {

    resolution!: number;
    step!: number;
    tangentSize: number;

    curveEssentials: Group;
    curve: Line;
    curveControlLine: Line;
    curveControlPoints: Array<Point>;

    lerpIntermediates!: Group;
    lerpLines!: Array<Line>;

    lerpCurrentPoint!: Group;
    lerpPoint!: Point;
    lerpDerivative!: Line;

    bernsteinGroup!: Group;
    bernsteinPolynomials!: Array<Line>;
    bernsteinPoints!: Array<Point>;

    constructor(canvasWidth: () => number, canvasHeight: () => number) {
        super();

        // 1. create canvas
        this.canvas.push(new Canvas(canvasWidth, canvasHeight));
        this.canvas.push(new Canvas(canvasWidth, canvasHeight, false));

        // 2. set basic variables
        this.resolution = 100;
        this.step = .5;
        this.tangentSize = 5;

        // 3. create curve essentials
        this.curveEssentials = new Group();
        console.log(this.curveEssentials.name);

        this.curve = new Line();
        this.curve.name = "curve";
        this.curveEssentials.add(this.curve);

        this.curveControlLine = new Line();
        this.curveControlLine.name = "curveControlLine";
        this.curveEssentials.add(this.curveControlLine);

        this.curveControlPoints = new Array<Point>();
        const positions = [
            new Vector3(-10, -10, 0),
            new Vector3(0, 10, 0),
            new Vector3(10, -30, 0),
            new Vector3(-12, -15, 0),
        ];
        for (let idx = 0; idx < 4; idx++) {
            let point = new Point("cube", 1);
            point.updatePosition(positions[idx]);

            point.dragUpdate = () => this.needsUpdate = true;
            point.color = primaryColor[idx];
            point.name = `curveControlPoint${idx}`;

            this.curveControlPoints.push(point);
            this.curveEssentials.add(point);
            this.canvas[0].draggable(point);
        }

        this.canvas[0].append(this.curveEssentials);

        this.createLerpGroup();
        this.createBernsteinGroup();
    }

    private createLerpGroup() {
        this.lerpCurrentPoint?.removeFromParent();
        this.lerpIntermediates?.removeFromParent();

        const points = this.controlPoints();

        this.lerpCurrentPoint = new Group();
        this.lerpIntermediates = new Group();

        this.lerpPoint = new Point("", .25);
        this.lerpPoint.meshMaterial.wireframe = false;
        this.lerpPoint.color = secondaryColor[0];
        this.lerpCurrentPoint.add(this.lerpPoint);

        this.lerpDerivative = new Line();
        this.lerpDerivative.color = secondaryColor[1];
        this.lerpDerivative.renderOrder = 10;
        this.lerpCurrentPoint.add(this.lerpDerivative);

        this.lerpLines = new Array<Line>();
        BezierGenerator.calculateIntermediates(points, this.step)
            .forEach(data => {
                const line = new Line();
                line.data = data;
                line.color = secondaryColor[2];
                this.lerpLines.push(line);
                this.lerpIntermediates.add(line);
            });

        this.canvas[0].append(this.lerpCurrentPoint);
        this.canvas[0].append(this.lerpIntermediates);
    }

    private createBernsteinGroup() {
        this.bernsteinGroup?.removeFromParent();

        const points = this.controlPoints();

        const coefficients = BezierGenerator.generateBasisFunctions(points.length, this.resolution);
        this.bernsteinGroup = new Group();

        this.bernsteinPolynomials = new Array<Line>();
        coefficients.forEach(coefficient => {
            const line = new Line();
            line.data = coefficient
                .map((y, x) => new Vector3(x / this.resolution, y, 0));
            this.bernsteinPolynomials.push(line);
            this.bernsteinGroup.add(line);
        });

        this.bernsteinPoints = new Array<Point>();
        for (let idx = 0; idx < coefficients.length; idx++) {
            let point = new Point("point", .025);
            point.color = primaryColor[idx];
            point.meshMaterial.wireframe = false;
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
        const points = this.controlPoints();

        if (this.needsUpdate) {
            this.curve.data = BezierGenerator.generateBezierCurve(points, this.resolution);
            this.curveControlLine.data = points;

            this.needsUpdate = false;
        }

        BezierGenerator.calculateIntermediates(points, this.step)
            .forEach((v, i) => this.lerpLines[i].data = v);

        this.lerpPoint.updatePosition(BezierGenerator.evaluatePoint(points, this.step));

        const dp = BezierGenerator.evaluateDerivative(points, this.step).normalize();
        dp.multiplyScalar(this.tangentSize);
        this.lerpDerivative.data = [
            this.lerpPoint.position,
            this.lerpPoint.position.clone().add(dp)
        ];

        BezierGenerator.calculateCoefficients(points.length - 1, this.step)
            .forEach((c, idx) => {
                this.bernsteinPoints[idx].position.set(this.step, c, 0);
            });
    }

    override gui(gui: dat.GUI): void {
        const folder = gui.addFolder("Bezier Curve Controller");
        folder.add(this, "resolution", 16, 256, 2)
            .onChange(() => this.needsUpdate = true).name("Resolution");
        folder.add(this, "step", 0, 1, .01).name("t (time)");

        const points = folder.addFolder("Bezier Curve Control Points");
        points.add(this, "addPoint").name("Add Control Point");
        points.add(this, "removePoint").name("Remove Control Point");

        const point = folder.addFolder("Bezier Curve Helper");
        point.add(this, "toggleControlPolygon").name("Toggle Control Polygon");
        point.add(this, "toggleLerpIntermediates").name("Toggle Lerp Intermediates");
        point.add(this, "toggleLerpCurrentPoint").name("Toggle Current Point");
        point.add(this, "tangentSize", 1, 10, .1).name("Tangent Magnitude");
    }


    /**
     * `addPoint` is an UI only function. It allows the user to
     * extend the list of points.
     */
    private addPoint(): void {
        if (this.curveControlPoints.length == primaryColorMax) {
            return;
        }

        let point = new Point("cube", 1);
        point.updatePosition(new Vector3());

        point.dragUpdate = () => this.needsUpdate = true;
        point.color = primaryColor[this.curveControlPoints.length];
        point.name = `curveControlPoint${this.curveControlPoints.length}`;

        this.curveControlPoints.push(point);
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
        if (this.curveControlPoints.length > 2) {
            const point = this.curveControlPoints.pop();
            point?.removeFromParent();
            this.needsUpdate = true;

            this.createLerpGroup();
            this.createBernsteinGroup();
        }
    }

    /**
     * `toggleControlPolygon` is an Ui function.  It allows the user
     * to enable or disable the control polygon.
     */
    private toggleControlPolygon(): void {
        if (this.canvas[0].contains(this.curveControlLine)) {
            this.curveControlLine.removeFromParent();
        } else {
            this.canvas[0].append(this.curveControlLine);
        }
    }

    /**
     * `toggleLerpIntermediates` is an Ui function.  It allows the user
     * to enable or disable the lerp intermediates.
     */
    private toggleLerpIntermediates(): void {
        if (this.canvas[0].contains(this.lerpIntermediates)) {
            this.lerpIntermediates.removeFromParent();
        } else {
            this.canvas[0].append(this.lerpIntermediates);
        }
    }

    /**
     * `toggleLerpCurrentPoint` is an Ui function.  It allows the user
     * to enable or disable the lerp intermediates.
     */
    private toggleLerpCurrentPoint(): void {
        if (this.canvas[0].contains(this.lerpCurrentPoint)) {
            this.lerpCurrentPoint.removeFromParent();
        } else {
            this.canvas[0].append(this.lerpCurrentPoint);
        }
    }

    /**
     * Helper function.
     */
    private controlPoints(): Array<Vector3> {
        return this.curveControlPoints.map(point => point.position.clone())
    }
}  
import { GUI } from "dat.gui";
import { AmbientLight, DirectionalLight, Group } from "three";
import { BezierGenerator } from "../generators/bezier";
import { Canvas } from "../core/canvas";
import { CustomLine } from "../core/customLine";
import { Plane } from "../core/plane";
import { CustomPoint, Shape } from "../core/customPoint";
import { Controller } from "./controller";


export class BezierSurfaceController extends Controller {

    controlGroup!: Group;
    controlPoints!: Array<Array<CustomPoint>>;
    controlPointsT!: Array<Array<CustomPoint>>;
    controlLinesX!: Array<CustomLine>;
    controlLinesY!: Array<CustomLine>;
    controlNeedsUpdate: boolean;
    controlResolutionX: number;
    controlResolutionY: number;

    surfaceGroup: Group;
    surfaceMesh: Plane;
    surfaceMeshResolutionX: number;
    surfaceMeshResolutionY: number;

    derivativeGroup: Group;
    derivativeNormal: CustomLine;
    derivativeX: number;
    derivativeY: number;

    constructor(canvasWidth: () => number, canvasHeight: () => number) {
        super();

        // 1. create canvs
        this.canvas.push(new Canvas(canvasWidth, canvasHeight));
        this.canvas[0].append(new DirectionalLight(0xFFFFFF, .9));
        this.canvas[0].append(new AmbientLight(0x111111));

        // 2. set basic variable
        this.controlNeedsUpdate = true;
        this.controlResolutionX = 4;
        this.controlResolutionY = 6;

        // 3. control points
        this.controlNeedsUpdate = true;

        // 4. create mesh
        this.surfaceGroup = new Group();
        this.canvas[0].append(this.surfaceGroup);

        this.surfaceMesh = new Plane();
        this.surfaceGroup.add(this.surfaceMesh);

        this.surfaceMeshResolutionX = 10;
        this.surfaceMeshResolutionY = 10;

        // 5. derivative
        this.derivativeGroup = new Group();

        this.derivativeX = .4;
        this.derivativeY = .4;

        this.derivativeNormal = new CustomLine();
        this.derivativeNormal.color = 0x00FF00;
        this.derivativeGroup.add(this.derivativeNormal);

        this.canvas[0].append(this.derivativeGroup);

        this.needsUpdate = true;
    }

    private transposePoints(): Array<Array<CustomPoint>> {
        const transposed = new Array<Array<CustomPoint>>();
        for (let y = 0; y < this.controlResolutionY; y++) {
            transposed.push(new Array<CustomPoint>());
            for (let x = 0; x < this.controlResolutionX; x++) {
                transposed[y].push(this.controlPoints[x][y]);
            }
        }
        return transposed;
    }

    private addPoint(point: CustomPoint) {
        point.color = 0xFFFF00;
        point.dragUpdate = () => {
            this.needsUpdate = true;
        }
        this.canvas[0].draggable(point);
        this.controlGroup.add(point);
    }

    update(): void {

        if (this.controlNeedsUpdate) {
            this.controlGroup?.removeFromParent();
            this.controlGroup = new Group();
            this.controlLinesX = new Array<CustomLine>();
            this.controlLinesY = new Array<CustomLine>();
            this.controlPoints = new Array<Array<CustomPoint>>();

            this.canvas[0].append(this.controlGroup);

            for (let x = 0; x < this.controlResolutionX; x++) {
                const line = new CustomLine();
                this.controlLinesX.push(line);
                this.controlGroup.add(line);
            }

            for (let y = 0; y < this.controlResolutionY; y++) {
                const line = new CustomLine();
                this.controlLinesY.push(line);
                this.controlGroup.add(line);
            }

            const xMid = (this.controlResolutionX - 1) / 2;
            const yMid = (this.controlResolutionY - 1) / 2
            for (let x = 0; x < this.controlResolutionX; x++) {
                this.controlPoints.push(new Array<CustomPoint>());

                for (let y = 0; y < this.controlResolutionY; y++) {
                    const point = new CustomPoint(Shape.CUBE, .5);
                    point.color = 0xFFFF00;
                    point.position.set(4 * (x - xMid), -2 * (x - xMid) ** 2, 4 * (y - yMid));
                    this.controlPoints[x].push(point);
                    this.addPoint(point);
                }
            }

            this.controlPointsT = this.transposePoints();
            this.controlNeedsUpdate = false;
            this.needsUpdate = true;
        }

        if (this.needsUpdate) {
            for (let x = 0; x < this.controlPoints.length; x++) {
                const points = this.controlPoints[x]
                    .map(point => point.position.clone());
                this.controlLinesX[x].data = points;
            }

            for (let y = 0; y < this.controlResolutionY; y++) {
                const points = this.controlPointsT[y]
                    .map(point => point.position.clone());
                this.controlLinesY[y].data = points;
            }

            const controlPoints = this.controlPoints.map(parr => parr.map(p => p.position.clone()));
            const [positions, normals] = BezierGenerator.generateBezierSurface(controlPoints,
                [this.surfaceMeshResolutionX, this.surfaceMeshResolutionY]);
            this.surfaceMesh.data(positions, normals);

            this.needsUpdate = false;
        }

        const x = Math.round(this.derivativeX * this.surfaceMeshResolutionX);
        const y = Math.round(this.derivativeY * this.surfaceMeshResolutionY);

        const position = this.surfaceMesh.positions[x][y];
        const normal = this.surfaceMesh.normals[x][y];

        this.derivativeNormal.data = [position, position.clone().add(normal.normalize())];
    }

    gui(gui: GUI): void {
        const control = gui.addFolder("Control points");
        control.add(this, "toggleControlPoints").name("Toggle Control Points");
        control.add(this, "controlResolutionX", 2, 8, 1).name("X Resolution").onChange(() => this.controlNeedsUpdate = true);
        control.add(this, "controlResolutionY", 2, 8, 1).name("Y Resolution").onChange(() => this.controlNeedsUpdate = true);

        const derivate = gui.addFolder("Derivative");
        const derivativeX = derivate.add(this, "derivativeX", 0, 1, 1 / this.surfaceMeshResolutionX).name("X Derivative");
        const derivativeY = derivate.add(this, "derivativeY", 0, 1, 1 / this.surfaceMeshResolutionY).name("Y Derivative");

        const mesh = gui.addFolder("Mesh");
        mesh.add(this, "surfaceMeshResolutionX", 8, 96, 1).name("X Resolution").onChange(() => {
            this.changed();
            derivativeX.step(1 / this.surfaceMeshResolutionX);
        });
        mesh.add(this, "surfaceMeshResolutionY", 8, 96, 1).name("Y Resolution").onChange(() => {
            this.changed();
            derivativeY.step(1 / this.surfaceMeshResolutionY);
        });
        mesh.add(this.surfaceMesh, "wireframe");
        mesh.addColor(this.surfaceMesh, "color");
    }

    toggleControlPoints(): void {
        if (this.canvas[0].contains(this.controlGroup)) {
            this.controlGroup.removeFromParent();
        } else {
            this.canvas[0].append(this.controlGroup);
        }
    }
}

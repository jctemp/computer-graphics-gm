import { GUI } from "dat.gui";
import { AmbientLight, DirectionalLight, Group } from "three";
import { BezierSurfaceLogic } from "../logic/bezierSurfaceLogic";
import { Canvas } from "../core/canvas";
import { CustomLine } from "../core/customLine";
import { Controller } from "./controller";
import { Surface } from "../components/surface";
import { ControlPoints2d } from "../components/controlPoints";
import { connect, Slot } from "../core/connector";


export class BezierSurfaceController extends Controller {

    private _surface: Surface;
    private _controlPoints: ControlPoints2d;
    public slotChanged: Slot<null>;

    surfaceGroup: Group;

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

        // ...
        this._surface = new Surface();
        this.canvas[0].append(this._surface);

        this._controlPoints = new ControlPoints2d();
        this.canvas[0].append(this._controlPoints);
        this._controlPoints.points.forEach(
            arr => arr.forEach(c => this.canvas[0].draggable(c)));

        this.slotChanged = new Slot<null>();
        this.slotChanged.addCallable(_ => this.changed());

        connect(this._controlPoints.signalMaxChanged, this.slotChanged);

        // 4. create mesh
        this.surfaceGroup = new Group();
        this.canvas[0].append(this.surfaceGroup);

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

    update(): void {

        if (this.needsUpdate) {

            this._controlPoints.update();

            let controlPoints = this._controlPoints.positions;

            const positions = BezierSurfaceLogic.generateBezierSurface(controlPoints,
                [this._surface.resolution[0], this._surface.resolution[1]]);
            const localCoordinateSystems = BezierSurfaceLogic.generateBezierSurfaceDerivates(controlPoints,
                [this._surface.resolution[0], this._surface.resolution[1]]);

            this._surface.set({
                positions, normals: localCoordinateSystems.normals
            }, controlPoints);


            this.needsUpdate = false;
        }

        // const x = Math.round(this.derivativeX * this.surfaceMeshResolutionX);
        // const y = Math.round(this.derivativeY * this.surfaceMeshResolutionY);

        // const position = this.surfaceMesh.positions[x][y];
        // const normal = this.surfaceMesh.normals[x][y];

        // this.derivativeNormal.buffer = [position, position.clone().add(normal.normalize())];
    }

    gui(gui: GUI): void {
        const control = gui.addFolder("Control Objects");
        control.add(this._surface, "toggleControlMesh").name("Toggle Control Mesh");
        control.add(this._controlPoints, "toggleControlPoints").name("Toggle Control Points");
        control.add(this._controlPoints, "xMax", 3, ControlPoints2d.MAX, 1).name("X Control Points")
        control.add(this._controlPoints, "yMax", 3, ControlPoints2d.MAX, 1).name("Y Control Points")

        const derivate = gui.addFolder("Derivative");
        const derivativeX = derivate.add(this, "derivativeX", 0, 1, 1 / this._surface.resolution[0]).name("X Derivative");
        const derivativeY = derivate.add(this, "derivativeY", 0, 1, 1 / this._surface.resolution[1]).name("Y Derivative");

        const mesh = gui.addFolder("Mesh");
        mesh.add(this._surface.resolution, "0", 32, 256, 1).name("X Resolution").onChange(() => {
            this.changed();
            derivativeX.step(1 / this._surface.resolution[0]);
        });
        mesh.add(this._surface.resolution, "1", 32, 256, 1).name("Y Resolution").onChange(() => {
            this.changed();
            derivativeY.step(1 / this._surface.resolution[1]);
        });
        mesh.add(this._surface.data, "wireframe");
        mesh.addColor(this._surface.data, "color");
    }
}

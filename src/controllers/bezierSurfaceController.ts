import { GUI } from "dat.gui";
import { AmbientLight, DirectionalLight, Group } from "three";
import { BezierSurfaceLogic } from "../logic/bezierSurfaceLogic";
import { Canvas } from "../core/canvas";
import { CustomLine } from "../core/customLine";
import { Controller } from "./controller";
import { Surface } from "../components/surface";
import { ControlPoints2d } from "../components/controlPoints";
import { connect, Slot } from "../core/connector";
import { SurfacePosition } from "../components/surfacePosition";


export class BezierSurfaceController extends Controller {

    private _surface: Surface;
    private _controlPoints: ControlPoints2d;
    private _surfacePosition: SurfacePosition;
    public slotChanged: Slot<null>;

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

        this._surfacePosition = new SurfacePosition();
        this.canvas[0].append(this._surfacePosition);

        this.slotChanged = new Slot<null>();
        this.slotChanged.addCallable(_ => this.changed());

        connect(this._controlPoints.signalMaxChanged, this.slotChanged);

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

            this._surfacePosition.set({positions, 
                normals: localCoordinateSystems.normals,
                tangents: localCoordinateSystems.tangent,
                bitangents: localCoordinateSystems.bitangent
            })

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
        control.add(this._controlPoints, "plane", { "plane": true, "curve": false }).name("Control Point alignment")

        const derivate = gui.addFolder("Surface Point");
        derivate.add(this._surfacePosition, "s", 0, 1, 1 / this._surface.resolution[0]).name("X Derivative");
        derivate.add(this._surfacePosition, "t", 0, 1, 1 / this._surface.resolution[1]).name("Y Derivative");
        derivate.add(this._surfacePosition, "toggleSurfacePoint").name("Toggle Surface Position");

        const mesh = gui.addFolder("Mesh");
        mesh.add(this._surface.resolution, "0", 32, 256, 1).name("X Resolution").onChange(() => {
            this.changed();
        });
        mesh.add(this._surface.resolution, "1", 32, 256, 1).name("Y Resolution").onChange(() => {
            this.changed();
        });
        mesh.add(this._surface.data, "wireframe");
        mesh.addColor(this._surface.data, "color");
    }
}

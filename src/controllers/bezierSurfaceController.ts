import { GUI } from "dat.gui";
import { AmbientLight, DirectionalLight } from "three";
import { BezierSurfaceLogic } from "../logic/bezierSurfaceLogic";
import { Canvas } from "../core/canvas";
import { Controller } from "./controller";
import { Surface, SurfacePosition } from "../components/surface";
import { ControlPoints2d } from "../components/controlPoints";

export class BezierSurfaceController extends Controller {

    /// -----------------------------------------------------------------------
    /// CONSTRUCTOR, GETTER and SETTER
    /// ----------------------------------------------------------------------- 

    constructor(canvasWidth: () => number, canvasHeight: () => number) {
        super();

        // 1. create canvas
        this.addCanvas(
            new Canvas(canvasWidth, canvasHeight), 
            [new DirectionalLight(0xFFFFFF, .9), new AmbientLight(0x111111)]
        );

        // 2. control points
        this.appendControlPoints(new ControlPoints2d());

        // 3. surface
        this.addObject(new Surface());

        // 4. signals
        this.connectStandardSignals();

        this.changed();
    }

    /// -----------------------------------------------------------------------
    /// OVERRIDES
    /// -----------------------------------------------------------------------

    override update(): void {

        if (this.needsUpdate) {

            this._controlPoints.update();
            let controlPoints = (this._controlPoints as ControlPoints2d).positions;

            const [positions, normals, tangents, bitangents] =
                BezierSurfaceLogic.generateSurface(controlPoints, this.object().resolution);

            this.object().set({ positions, normals, controlPoints });
            this.position().set({ positions, normals, tangents, bitangents });

            this.needsUpdate = false;
        }
    }

    override gui(gui: GUI): void {
        // general control
        const control = gui.addFolder("Control Objects");
        control.add(this.object(), "toggleControlMesh").name("Toggle Control Mesh");
        control.add(this._controlPoints, "toggleControlPoints").name("Toggle Control Points");
        control.add(this._controlPoints, "xMax", 3, ControlPoints2d.MAX, 1).name("X Control Points");
        control.add(this._controlPoints, "yMax", 3, ControlPoints2d.MAX, 1).name("Y Control Points");
        control.add(this._controlPoints, "plane", { "Plane": true, "Curved Surface": false }).name("Control Point alignment")
            .onFinishChange((value: string) => {
                (this._controlPoints as ControlPoints2d).plane = (value === "true" ? true : false);
                this.changed();
            });

        // derivative control
        const derivate = gui.addFolder("Surface Point");
        const xderiv = derivate.add(this.position(), "s", 0, 1, 1 / this.object().resolution[0]).name("X Derivative");
        const yderiv = derivate.add(this.position(), "t", 0, 1, 1 / this.object().resolution[1]).name("Y Derivative");
        derivate.add(this.position(), "toggleSurfacePoint").name("Toggle Surface Position");

        // control for the mesh properties
        const mesh = gui.addFolder("Mesh");
        mesh.add(this.object().resolution, "0", 32, 256, 1).name("X Resolution").onChange(() => {
            this.changed();
            xderiv.step(1 / this.object().resolution[0]);
        });
        mesh.add(this.object().resolution, "1", 32, 256, 1).name("Y Resolution").onChange(() => {
            this.changed();
            yderiv.step(1 / this.object().resolution[1]);
        });
        mesh.add(this.object().data, "wireframe");
        mesh.addColor(this.object().data, "color");
    }

    private object(): Surface {
        return this._object as Surface;
    }
    private position(): SurfacePosition {
        return this._position as SurfacePosition;
    }
}

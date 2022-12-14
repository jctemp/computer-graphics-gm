import { Group, Vector3 } from "three";
import { CustomLine } from "../core/customLine";
import { CustomSurface } from "../core/customSurface";
import { CustomPoint, Shape } from "../core/customPoint";
import { Object, ObjectPosition } from "./object";

export class Surface extends Object {

    /**
     * The `set` method updates the buffers of surface and control
     * points.
     * @param surface 
     * @param controlPoints 
     */
    public set(surface: { positions: Vector3[][], normals: Vector3[][], controlPoints: Vector3[][] }): void {
        this._surface.buffer = surface;

        const length = surface.controlPoints.length + surface.controlPoints[0].length;
        while (length !== this._controlPolygons.length) {
            if (length < this._controlPolygons.length) {
                const polygon = this._controlPolygons.pop();
                polygon?.removeFromParent();
            } else {
                const line = new CustomLine();
                if (this._activated) this.add(line);
                this._controlPolygons.push(line);
            }
        }

        for (let idx = 0; idx < surface.controlPoints.length; idx++) {
            this._controlPolygons[idx].buffer = surface.controlPoints[idx];
        }

        for (let idx = surface.controlPoints.length; idx < length; idx++) {
            const jdx = idx - surface.controlPoints.length;
            const b = surface.controlPoints.map((_, i) => surface.controlPoints[i][jdx])
            this._controlPolygons[idx].buffer = b;
        }
    }


    /**
     * `toggleControlMesh` adds or removes the control polygons from the
     * renderable set.
     */
    public toggleControlMesh(): void {
        this._activated = !this._activated;
        if (this.children.length == 1) {
            this._controlPolygons.forEach(p => this.add(p));
        } else {
            this._controlPolygons.forEach(p => p.removeFromParent());
        }
    }

    /// -----------------------------------------------------------------------
    /// CONSTRUCTOR, GETTER and SETTER

    private _surface: CustomSurface;
    private _controlPolygons: CustomLine[];
    private _resolution: [number, number];
    private _activated: boolean;

    constructor() {
        super();

        this._activated = true;
        this._surface = new CustomSurface();
        this._resolution = [32, 32];
        this._controlPolygons = [];

        this.add(this._surface);
    }

    public get data(): CustomSurface {
        return this._surface;
    }

    public get resolution(): [number, number] {
        return this._resolution;
    }

    public set resolution(value: [number, number]) {
        this._resolution = [
            Math.max(32, Math.min(256, value[0])),
            Math.max(32, Math.min(256, value[1]))
        ];
    }

    override getPosition(): ObjectPosition {
        return new SurfacePosition();
    }
}

/**
 * The `SurfacePosition` class does represent two aspects regarding
 * a `Surface` point: The current point at s and t with the corresponding
 * normal, tangent and bitangent.
 */
export class SurfacePosition extends ObjectPosition {

    /**
     * `set` is a function that changes the internal values to provide
     * a lookup for `update()` as the params `s` and `t` changes.
     * @param positions all positons of the surface
     * @param normals the normals for a corresponding position
     * @param tangents the tangents for a corresponding position
     * @param bitangents the bitangents for a corresponding position
     */
    public set(params: {
        positions: Vector3[][], normals: Vector3[][],
        tangents: Vector3[][], bitangents: Vector3[][]
    }): void {

        this._points = params.positions;
        this._normals = params.normals;
        this._tangents = params.tangents;
        this._bitangents = params.bitangents;

        while (this.children.length > 0) {
            const child = this.children.pop();
            child?.removeFromParent();
        }

        if (this._activated) {
            this.add(this._point);
            this.add(this._normal);
            this.add(this._tangent);
            this.add(this._bitangent);
        }

        this.update();
    }

    /**
     * `update` sets the values for the point, normal, tangent and bitangent based
     * on the current `t` and `s` value.
     */
    public update(): void {
        const x = Math.floor((this._points.length - 1) * this._t);
        const y = Math.floor((this._points[0].length - 1)  * this._s);

        const point = this._points[x][y];
        const normal = this._normals[x][y];
        const tangent = this._tangents[x][y];
        const bitangent = this._bitangents[x][y];

        this._point.buffer = point;
        this._normal.buffer = [point, point.clone().add(normal.clone().normalize())];
        this._tangent.buffer = [point, point.clone().add(tangent.clone().normalize())];
        this._bitangent.buffer = [point, point.clone().add(bitangent.clone().normalize())];
    }

    /**
     * The `toggleSurfacePoint` function adds or removes all objects from the
     * renderable set.
     */
    public toggleSurfacePoint(): void {
        this._activated = !this._activated;
        if (this.children.length === 0) {
            this.add(this._point);
            this.add(this._normal);
            this.add(this._tangent);
            this.add(this._bitangent);
        } else {
            while (this.children.length > 0) {
                const child = this.children.pop();
                child?.removeFromParent();
            }
        }
    }

    /// -----------------------------------------------------------------------
    /// CONSTRUCTOR, GETTER and SETTER

    private _points: Vector3[][];
    private _normals: Vector3[][];
    private _tangents: Vector3[][];
    private _bitangents: Vector3[][];

    private _point: CustomPoint;
    private _normal: CustomLine;
    private _tangent: CustomLine;
    private _bitangent: CustomLine;

    private _s: number;
    private _t: number;
    private _activated: boolean;

    constructor() {
        super();

        this._s = 0.5;
        this._t = 0.5;
        this._activated = false;

        this._points = [];
        this._normals = [];
        this._tangents = [];
        this._bitangents = [];

        this._point = new CustomPoint(Shape.SPHERE, 0.05);
        this._point.wireframe = false;

        this._normal = new CustomLine();
        this._normal.color = 0x0000FF;
        this._normal.renderOrder = 1;

        this._tangent = new CustomLine();
        this._tangent.color = 0xFF0000;
        this._tangent.renderOrder = 1;

        this._bitangent = new CustomLine();
        this._bitangent.color = 0x00FF00;
        this._bitangent.renderOrder = 1;

        this.toggleSurfacePoint();
    }

    public get s(): number {
        return this._s;
    }

    public set s(value: number) {
        this._s = Math.min(Math.max(0, value), 1);
        this.update();
    }

    public get t(): number {
        return this._t;
    }

    public set t(value: number) {
        this._t = Math.min(Math.max(0, value), 1);
        this.update();
    }

}

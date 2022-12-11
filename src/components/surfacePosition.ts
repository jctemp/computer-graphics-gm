import { Group, Vector3 } from "three";
import { CustomLine } from "../core/customLine";
import { CustomPoint, Shape } from "../core/customPoint";

export class SurfacePosition extends Group {

    public set(param: {positions: Vector3[][], normals: Vector3[][],
        tangents: Vector3[][], bitangents: Vector3[][]}): void {

        this._points = param.positions;
        this._normals = param.normals;
        this._tangents = param.tangents;
        this._bitangents = param.bitangents;

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

    public update(): void {
        const x = Math.floor((this._points[0].length - 1) * this._s);
        const y = Math.floor((this._points.length - 1) * this._t);

        const point = this._points[x][y];
        const normal = this._normals[x][y];
        const tangent = this._tangents[x][y];
        const bitangent = this._bitangents[x][y];

        this._point.buffer = point;
        this._normal.buffer = [point, point.clone().add(normal.clone().normalize())];
        this._tangent.buffer = [point, point.clone().add(tangent.clone().normalize())];
        this._bitangent.buffer = [point, point.clone().add(bitangent.clone().normalize())];
    }

    public toggleSurfacePoint(): void {
        console.log("==");
        
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

        this._s = 0;
        this._t = 0;
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
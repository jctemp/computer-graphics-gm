import { Group, Vector3 } from "three";
import { CustomLine } from "../core/customLine";
import { CustomSurface } from "../core/customSurface";

export class Surface extends Group {

    /**
     * The `set` method updates the buffers of surface and control
     * points.
     * @param surface 
     * @param controlPoints 
     */
    public set(surface: { positions: Vector3[][], normals: Vector3[][] },
        controlPoints: Vector3[][]): void {
        this._surface.buffer = surface;

        const length = controlPoints.length + controlPoints[0].length;
        while (length !== this._controlPolygons.length) {
            if (length < this._controlPolygons.length) {
                const polygon = this._controlPolygons.pop();
                polygon?.removeFromParent();
            } else {
                const line = new CustomLine();
                this.add(line);
                this._controlPolygons.push(line);
            }
        }

        for (let idx = 0; idx < controlPoints.length; idx++) {
            this._controlPolygons[idx].buffer = controlPoints[idx];
        }

        for (let idx = controlPoints.length; idx < length; idx++) {
            const jdx = idx - controlPoints.length;
            const b = controlPoints.map((_, i) => controlPoints[i][jdx])
            this._controlPolygons[idx].buffer = b;
        }
    }


    /**
     * `toggleControlMesh` adds or removes the control polygons from the
     * renderable set.
     */
    public toggleControlMesh(): void {
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

    constructor() {
        super();

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

}
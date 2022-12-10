import { BufferAttribute, BufferGeometry, DoubleSide, Mesh, MeshLambertMaterial, Vector3 } from "three";


export class CustomSurface extends Mesh {

    /**
     * The `buffer` sets the interal buffers of the surface. Changing the
     * input size will cause many buffer changes.
     * @param buffer 
     */
    public set buffer(buffer: { positions: Vector3[][], normals: Vector3[][] }) {

        // flatten position and normal array
        const positionsFlat = CustomSurface.toFlat(buffer.positions);
        const normalsFlat = CustomSurface.toFlat(buffer.normals);

        if (positionsFlat.length !== normalsFlat.length) {
            throw new Error("CustomSurface: positions and normals have different lengths.");
        }

        // re-new or update the buffer
        const tmp = this.geometry.getAttribute("position");
        if (tmp === undefined || tmp.array.length !== positionsFlat.length) {
            this.geometry.dispose();
            this.geometry = new BufferGeometry();

            this.geometry.setAttribute("position",
                new BufferAttribute(
                    new Float32Array(positionsFlat),
                    CustomSurface.COMPONENTS));

            this.geometry.setAttribute("normal",
                new BufferAttribute(
                    new Float32Array(normalsFlat),
                    CustomSurface.COMPONENTS));
        } else {
            const positionBuffer = this.geometry.getAttribute("position");
            const normalBuffer = this.geometry.getAttribute("normal");

            for (let idx = 0, jdx = 0; jdx < positionsFlat.length; idx++, jdx += 3) {
                positionBuffer.setXYZ(idx,
                    positionsFlat[jdx],
                    positionsFlat[jdx + 1],
                    positionsFlat[jdx + 2]);
            }

            for (let idx = 0, jdx = 0; jdx < normalsFlat.length; idx++, jdx += 3) {
                normalBuffer.setXYZ(idx,
                    normalsFlat[jdx],
                    normalsFlat[jdx + 1],
                    normalsFlat[jdx + 2]);
            }
        }

        // re-calculate indices
        const xMax = buffer.positions.length;
        const yMax = buffer.positions[0].length;
        const indices = new Array<number>();

        for (let x = 0; x < xMax - 1; x++) {
            for (let y = 0; y < yMax - 1; y++) {
                indices.push(y + yMax * x);
                indices.push(y + yMax * (x + 1));
                indices.push(y + yMax * x + 1);

                indices.push(y + yMax * x + 1);
                indices.push(y + yMax * (x + 1));
                indices.push(y + yMax * (x + 1) + 1);
            }
        }

        this.geometry.setIndex(indices);
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.normal.needsUpdate = true;
    }

    /**
     * `toFlat` is an internal utility function. It takes a 2d array containing
     * a `Vector3` and converts it to a 1d array consisting of `number`.
     * @param buffer is a 2d martix 
     * @returns vector of points `[x1,y1,z1, ..., xN, yN, zN]`
     */
    private static toFlat(buffer: Vector3[][]) {
        const flat: number[] = [];
        buffer.flat().map(v => flat.push(v.x, v.y, v.z));
        return flat;
    }

    /// -----------------------------------------------------------------------
    /// CONSTRUCTOR, GETTER and SETTER

    private static COMPONENTS: number = 3;

    constructor() {
        super();
        this.geometry = new BufferGeometry();
        this.material = new MeshLambertMaterial({ wireframe: false, color: 0x777777 });
        this.material.side = DoubleSide;
    }

    public get wireframe(): boolean {
        const m = this.material as MeshLambertMaterial;
        return m.wireframe;
    }

    public set wireframe(v: boolean) {
        const m = this.material as MeshLambertMaterial;
        m.wireframe = v;
        m.needsUpdate = true;
    }

    public get color(): number {
        const m = this.material as MeshLambertMaterial;
        return m.color.getHex();
    }

    public set color(v: number) {
        const m = this.material as MeshLambertMaterial;
        m.color.setHex(v);
        m.needsUpdate = true;
    }
}
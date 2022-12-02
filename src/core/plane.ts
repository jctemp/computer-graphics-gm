import { BufferAttribute, BufferGeometry, DoubleSide, Mesh, MeshLambertMaterial, Vector3 } from "three";

function toFlat(param: Array<Array<Vector3>>) {
    const flat = new Array<number>();
    param.flat().map(v => flat.push(v.x, v.y, v.z));
    return flat;
}

export class Plane extends Mesh {
    private components: number;

    public positions: Array<Array<Vector3>>;
    public normals: Array<Array<Vector3>>;

    constructor() {
        super();
        this.geometry = new BufferGeometry();
        this.positions = new Array<Array<Vector3>>();
        this.normals = new Array<Array<Vector3>>();

        this.material = new MeshLambertMaterial({ wireframe: false, color: 0xFF00FF });
        this.material.side = DoubleSide;

        this.components = 3;

    }

    public data(positions: Array<Array<Vector3>>, normals: Array<Array<Vector3>>) {
        this.geometry.dispose();

        // create point list
        this.positions = positions;
        this.normals = normals;

        // convert
        const positions_flat = toFlat(positions);
        const normals_flat = toFlat(normals);

        // create buffer
        this.geometry = new BufferGeometry();
        this.geometry.setAttribute("position",
            new BufferAttribute(
                new Float32Array(positions_flat),
                this.components)
        );

        if (normals !== null) {
            this.geometry.setAttribute("normal",
                new BufferAttribute(
                    new Float32Array(normals_flat),
                    this.components
                )
            );
        }

        // calculate indices
        const xMax = positions.length;
        const yMax = positions[0].length;
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
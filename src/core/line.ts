import { BufferGeometry, LineBasicMaterial, Vector3 } from "three";
import * as THREE from "three"

export class Line extends THREE.Line {
    private length: number;
    constructor() {
        super();
        this.geometry = new BufferGeometry();
        this.material = new LineBasicMaterial();
        this.length = 0;
    }

    public set data(points: Array<Vector3>) {
        if (this.length != points.length) {
            // dispose buffer if not undefined
            this.geometry.dispose();

            // create buffer with points
            this.geometry = new BufferGeometry()
                .setFromPoints(points);

            // update length
            this.length = points.length;
        } else {
            // update buffer
            let positions = this.geometry.attributes.position;

            points.forEach((v, i) => { positions.setXYZ(i, v.x, v.y, v.z); });
            this.geometry.attributes.position.needsUpdate = true;
            this.geometry.computeBoundingBox();
        }
    }

    public get color(): number {
        let m = this.material as LineBasicMaterial;
        return m.color.getHex();
    }

    public set color(v: number) {
        let m = this.material as LineBasicMaterial;
        m.color.setHex(v);
        m.needsUpdate = true;
    }
}

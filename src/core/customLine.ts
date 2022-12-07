import { BufferGeometry, LineBasicMaterial, Vector3 } from "three";
import * as THREE from "three"

/**
 * `CustomLine` is an abstraction of the `THREE.Line` which
 * provides a convenient management of the BufferGeometry.
 */
export class CustomLine extends THREE.Line {
    private length: number;
    constructor() {
        super();
        this.geometry = new BufferGeometry();
        this.material = new LineBasicMaterial();
        this.length = 0;
    }

    /**
     * `data` sets internal buffer to the contents 
     * of the points array. Note: Keeping the vectors's
     * length the same allows to efficiently update the
     * buffer.
     */
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
        }
    }

    /**
     * Get the hex representation of the set material 
     * color.
     */
    public get color(): number {
        let m = this.material as LineBasicMaterial;
        return m.color.getHex();
    }

    /**
     * `color` set the material color value. One needs
     * to pass the color in hex representation.
     */
    public set color(v: number) {
        let m = this.material as LineBasicMaterial;
        m.color.setHex(v);
        m.needsUpdate = true;
    }
}

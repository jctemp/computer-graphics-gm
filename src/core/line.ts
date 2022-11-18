import * as THREE from "three";

export class Line extends THREE.Line {
    private length: number;
    constructor() {
        super();
        this.geometry = new THREE.BufferGeometry();
        this.material = new THREE.LineBasicMaterial();
        this.length = 0;
    }

    public set data(points: Array<THREE.Vector3>) {
        if (this.length != points.length) {
            // dispose buffer if not undefined
            this.geometry.dispose();

            // create buffer with points
            this.geometry = new THREE.BufferGeometry()
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

    public set color(v: number) {
        let m = this.material as THREE.LineBasicMaterial;
        m.color.setHex(v);
        m.needsUpdate = true;
    }

    public set thickness(v: number) {
        let m = this.material as THREE.LineBasicMaterial;
        m.linewidth = v;
        m.needsUpdate = true;
    }
}

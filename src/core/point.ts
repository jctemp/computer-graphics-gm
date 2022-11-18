import * as THREE from "three";

export class Point extends THREE.Mesh {

    callback: () => void;

    constructor(type: string, size: number) {
        super();

        this.callback = () => { };

        if (type === "cube") {
            this.geometry = new THREE.BoxGeometry(size, size, size);
        } else {
            this.geometry = new THREE.SphereGeometry(size);
        }

        this.material = new THREE.MeshBasicMaterial({ wireframe: true });
    }



}
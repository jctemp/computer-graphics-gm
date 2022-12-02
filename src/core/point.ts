import { Mesh, BoxGeometry, SphereGeometry, MeshBasicMaterial, Vector3 } from "three";
import { Draggable } from "./canvas";

export class Point extends Mesh implements Draggable {
    constructor(type: string, size: number) {
        super();

        if (type === "cube") {
            this.geometry = new BoxGeometry(size, size, size);
        } else {
            this.geometry = new SphereGeometry(size);
        }

        this.material = new MeshBasicMaterial({ wireframe: true });
    }

    public updatePosition(pos: Vector3) {
        this.position.set(pos.x, pos.y, pos.z);
    }

    public get color(): number {
        let m = this.material as MeshBasicMaterial;
        return m.color.getHex();
    }

    public set color(v: number) {
        let m = this.material as MeshBasicMaterial;
        m.color.setHex(v);
        m.needsUpdate = true;
    }

    public get meshMaterial(): MeshBasicMaterial {
        return this.material as MeshBasicMaterial;
    }

    public set meshMaterial(v: MeshBasicMaterial) {
        this.material = v;
    }


    dragUpdate(): void { /* INTENTIONALLY UNIMPLEMENTED */ }
}
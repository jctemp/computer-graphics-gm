import { Mesh, BoxGeometry, SphereGeometry, MeshBasicMaterial, Vector3, BufferGeometry } from "three";
import { Draggable } from "./canvas";

/**
 * Encodes varient of ``CustomPoint``.
 */
export enum Shape {
    CUBE,
    SPHERE
}

/**
 * `CustomPoint` is an abstraction to manage a point. It
 * provides the option to add the Object a drag_list, which
 * makes the object interactive.
 */
export class CustomPoint extends Mesh implements Draggable {
    constructor(type: Shape, size: number = 1) {
        super();

        switch (type) {
            case Shape.CUBE:
                this.geometry = new BoxGeometry(size, size, size);
                break;
            case Shape.SPHERE:
                this.geometry = new SphereGeometry(size);
                break;
            default:
                throw new Error("Should be impossible");
        }

        this.material = new MeshBasicMaterial({ wireframe: true });
    }

    /**
     * `setPosition` is a wrapper for `position` to make the
     * it easier to set the new position.
     * @param pos new position
     */
    public setPosition(pos: Vector3) {
        this.position.set(pos.x, pos.y, pos.z);
    }

    /**
     * Color in hex of the material.
     */
    public get color(): number {
        let m = this.material as MeshBasicMaterial;
        return m.color.getHex();
    }

    /**
     * Set color of the material.
     */
    public set color(hexColor: number) {
        let m = this.material as MeshBasicMaterial;
        m.color.setHex(hexColor);
        m.needsUpdate = true;
    }

    /**
     * Get the wireframe value of the material.
     */
    public get wireframe(): boolean {
        let m = this.material as MeshBasicMaterial;
        return m.wireframe;
    }

    /**
     * Set the wireframe value of the material.
     */
    public set wireframe(wireframe : boolean) {
        let m = this.material as MeshBasicMaterial;
        m.wireframe = wireframe;
        m.needsUpdate = true;
    }
    
    dragUpdate(): void { /* INTENTIONALLY UNIMPLEMENTED */ }
}
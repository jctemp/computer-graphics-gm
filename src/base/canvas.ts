import * as THREE from 'three';
import { DragControls } from "three/examples/jsm/controls/DragControls";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export interface Draggable {
    dragUpdate(): void;
}

export function isDraggable(object: any): boolean {
    return object.dragUpdate != undefined;
}

export class Canvas {

    renderer: THREE.WebGLRenderer;
    camera: THREE.Camera;
    scene: THREE.Scene;

    dragControls: DragControls;
    orbitControls: OrbitControls;
    canvas: HTMLCanvasElement;

    constructor(width: () => number, height: () => number, perspective: boolean = true, htmlId: string = "app") {

        const app = document.getElementById(htmlId);
        if (app === null) {
            throw new Error(`Container element with id '${htmlId}' does not exists.`);
        }

        // CREATE RENDERER
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width(), height());
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(1);

        window.addEventListener("resize", () => {
            this.renderer.setSize(width(), height());
        }, false);

        // APPEND RENDERER
        this.canvas = app.appendChild(this.renderer.domElement);

        // CREATE CAMERA
        if (perspective) { // CREATE PERSPECTIVE CAMERA
            const aspect = width() / height();
            this.camera = new THREE.PerspectiveCamera(45, aspect, 1, 500);
            this.camera.position.set(0, 0, 100);
            this.camera.lookAt(0, 0, 0);

            window.addEventListener("resize", () => {
                const camera = this.camera as THREE.PerspectiveCamera;
                camera.aspect = width() / height();
                camera.updateProjectionMatrix();
            });
        } else { // CREATE ORTHOGONAL CAMERA
            const aspect = width() / height();
            this.camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0.1, 1000);
            this.camera.position.z = 10;

            window.addEventListener('resize', () => {
                const aspect = width() / height();
                const camera = this.camera as THREE.OrthographicCamera;
                camera.left = -aspect;
                camera.right = aspect;
                camera.updateProjectionMatrix()
            });
        }

        // CREATE SCENE
        this.scene = new THREE.Scene();

        // CREATE CONTROLS
        this.dragControls = new DragControls([], this.camera, this.renderer.domElement);
        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);

        if (!perspective) {
            this.orbitControls.enableRotate = false;
        }

        this.dragControls.addEventListener("dragstart", (event) => {
            this.orbitControls.enabled = false;
            if (isDraggable(event.object)) {
                event.object.dragUpdate();
            }
        });

        this.dragControls.addEventListener("drag", (event) => {
            if (isDraggable(event.object)) {
                event.object.dragUpdate();
            }
        });

        this.dragControls.addEventListener('dragend', (event) => {
            this.orbitControls.enabled = true;
            if (isDraggable(event.object)) {
                event.object.dragUpdate();
            }
        });
    }

    public append(item: THREE.Object3D): void {
        this.scene.add(item);
    }

    public contains(item: THREE.Object3D): boolean {
        return this.scene.getObjectById(item.id) != undefined;
    }

    public draggable(item: THREE.Object3D): void {
        this.dragControls.getObjects().push(item);
    }

    public draw(): void {
        this.renderer.render(this.scene, this.camera);
    }
}
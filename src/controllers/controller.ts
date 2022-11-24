import { Canvas } from "../core/canvas";

export abstract class Controller {
    canvas: Array<Canvas> = new Array<Canvas>();
    needsUpdate: boolean = true;

    public run(): void {
        this.canvas.forEach(c => c.draw());
        this.update();

        requestAnimationFrame(() => {
            this.run();
        });
    }

    public changed(): void {
        this.needsUpdate = true;
    }

    abstract update(): void;

    abstract gui(gui: dat.GUI): void;
}

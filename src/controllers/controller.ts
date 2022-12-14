import { Canvas } from "../core/canvas";

/**
 * abstract super class for controller of specific curve or surface types
 */
export abstract class Controller {
    canvas: Array<Canvas> = new Array<Canvas>();
    needsUpdate: boolean = true;

    /**
     * loop for eternity: handle drawing elements on the canvas and update if needed
     */
    public run(): void {
        this.canvas.forEach(c => c.draw());
        this.update();

        requestAnimationFrame(() => {
            this.run();
        });
    }

    /**
     * mark the "update needed" boolean so that run knows a redraw is needed
     */
    public changed(): void {
        this.needsUpdate = true;
    }

    /// -----------------------------------------------------------------------
    /// ABSTRACT FUNCTIONS FOR OVERRIDE
    /// -----------------------------------------------------------------------

    /**
     * Called in every `requestFrameAnimation`. It performs all updates on the
     * objects.
     */
    abstract update(): void;

    /**
     * Adds controls to the ui.
     * @param gui parent UI element
     */
    abstract gui(gui: dat.GUI): void;
}

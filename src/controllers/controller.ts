import { Canvas } from "../core/canvas";
import { Slot, connect } from "../core/connector";
import { ControlPoints } from "../components/controlPoints";
import { Light } from "three";

/**
 * abstract super class for controller of specific curve or surface types
 */
export abstract class Controller {

    /// -----------------------------------------------------------------------
    /// VARIABLES, CONSTRUCTOR, GETTER and SETTER
    /// ----------------------------------------------------------------------- 

    canvas: Array<Canvas> = new Array<Canvas>();
    needsUpdate: boolean = true;
    slotChanged: Slot<null>;

    _controlPoints!: ControlPoints;


    constructor() {
        this.slotChanged = new Slot<null>();
        this.slotChanged.addCallable((_) => this.changed());
    }

    /// -----------------------------------------------------------------------
    /// CLASS METHODS
    /// ----------------------------------------------------------------------- 

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
    /// FUNCTIONS FOR SUB-CONSTRUCTOR USE
    /// -----------------------------------------------------------------------

    public appendControlPoints(points: ControlPoints) {
        this._controlPoints = points;
        this.canvas[0].append(this._controlPoints);
        this._controlPoints.listControlPoints().forEach(c => this.canvas[0].draggable(c));
    }
    public connectStandardSignals() {
        connect(this._controlPoints.signalMaxChanged, this.slotChanged);
    }
    public addCanvas(cv: Canvas, lights: Light[] = []) {
        this.canvas.push(cv);
        lights.forEach(value => {
            cv.append(value);
        });
    }
    public addLight(lights: Light[]) {
        lights.forEach(value => {
            this.canvas[0].append(value);
        });
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

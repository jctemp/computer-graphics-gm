import './style.css'

import * as dat from 'dat.gui';
import { Controller } from './controllers/controller';
import { BezierCurveController } from './controllers/bezierCurveController';
import { BezierSurfaceController } from './controllers/bezierSurfaceController';

const bcurves = document.getElementById("bezier-curve");
const bsurfaces = document.getElementById("bezier-surface");
const bnurbs = document.getElementById("bsplines-nurbs");

let gui = new dat.GUI();
let controller: Controller = createBezierSurfaceController();

function requestNavElement(): HTMLElement {
    const nav = document.getElementById("nav");
    if (nav === null) {
        throw new Error("Container element with id 'nav' does not exists.");
    }
    return nav;
}

function requestAppElement(): HTMLElement {
    const app = document.getElementById("app");
    if (app === null) {
        throw new Error("Container element with id 'app' does not exists.");
    }
    return app;
}

function resetAppElement(): void {
    const app = document.getElementById("app");
    if (app === null) {
        throw new Error("Container element with id 'app' does not exists.");
    }
    app.replaceChildren();
}

function createBezierCurveController(): Controller {
    const nav = requestNavElement();
    const app = requestAppElement();
    const gap = getComputedStyle(app).gap.replace("[a-zA-Z]", "")
    const width = () => (window.innerWidth - Number.parseFloat(gap)) / 2;
    const height = () => window.innerHeight - nav.offsetHeight;

    return new BezierCurveController(width, height);
}

function createBezierSurfaceController(): Controller {
    const nav = requestNavElement();
    const width = () => window.innerWidth;
    const height = () => window.innerHeight - nav.offsetHeight;

    return new BezierSurfaceController(width, height);
}

if (bcurves) {
    bcurves.onclick = () => {
        gui.destroy();
        gui = new dat.GUI();
        resetAppElement();
        controller = createBezierCurveController();
        controller.run()
        controller.gui(gui);
    }
}

if (bsurfaces) {
    bsurfaces.onclick = () => {
        gui.destroy();
        gui = new dat.GUI();
        resetAppElement();
        controller = createBezierSurfaceController();
        controller.run()
        controller.gui(gui);
    }
}

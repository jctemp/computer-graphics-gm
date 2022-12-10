import './style.css'

import * as dat from 'dat.gui';
import { Controller } from './controllers/controller';
import { BezierCurveController } from './controllers/bezierCurveController';
import { BezierSurfaceController } from './controllers/bezierSurfaceController';
import { BSplineCurveController } from './splines/bSplineCurveController';

// fetch button elements from the navbar
const bcurves = document.getElementById("bezier-curve");
const bsurfaces = document.getElementById("bezier-surface");
const bnurbs = document.getElementById("bsplines-nurbs");

// initialise a gui with an controller
let gui = new dat.GUI();
let controller: Controller = createBezierSurfaceController();

// find navbar element
function requestNavElement(): HTMLElement {
    const nav = document.getElementById("nav");
    if (nav === null) {
        throw new Error("Container element with id 'nav' does not exists.");
    }
    return nav;
}

// find app element
function requestAppElement(): HTMLElement {
    const app = document.getElementById("app");
    if (app === null) {
        throw new Error("Container element with id 'app' does not exists.");
    }
    return app;
}

// remove all elements within the app html element
function resetAppElement(): void {
    const app = document.getElementById("app");
    if (app === null) {
        throw new Error("Container element with id 'app' does not exists.");
    }
    app.replaceChildren();
}

// procedure to create a bezier curve controller
function createBezierCurveController(): Controller {
    const nav = requestNavElement();
    const app = requestAppElement();
    const gap = getComputedStyle(app).gap.replace("[a-zA-Z]", "")
    const width = () => (window.innerWidth - Number.parseFloat(gap)) / 2;
    const height = () => window.innerHeight - nav.offsetHeight;

    return new BezierCurveController(width, height);
}

// procedure to create a bezier surface controller
function createBezierSurfaceController(): Controller {
    const nav = requestNavElement();
    const width = () => window.innerWidth;
    const height = () => window.innerHeight - nav.offsetHeight;

    return new BezierSurfaceController(width, height);
}

// procedure to create a bspline controller
function createBSplineCurveController(): Controller {
    const nav = requestNavElement();
    const app = requestAppElement();
    const gap = getComputedStyle(app).gap.replace("[a-zA-Z]", "");
    const width = () => (window.innerWidth - Number.parseFloat(gap)) / 2;
    const height = () => window.innerHeight - nav.offsetHeight;

    return new BSplineCurveController(width, height);
}

// procedure to set a new scene with bezier curve controller
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

// procedure to set a new scene with bezier surface controller
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

// procedure to set a new scene with bspline controller
if (bnurbs) {
    bnurbs.onclick = () => {
        gui.destroy();
        gui = new dat.GUI();
        resetAppElement();
        controller = createBSplineCurveController();
        controller.run()
        controller.gui(gui);
    }
}

import './style.css'

import * as dat from 'dat.gui';
import { Controller } from './controllers/controller';
import { BezierCurveController } from './controllers/bezierCurveController';

// 1. prepare canvas
const nav = document.getElementById("nav");
const app = document.getElementById("app");
if (nav === null || app === null) {
    throw new Error("Container element with id 'nav' does not exists.");
}

const gap = getComputedStyle(app).gap.replace("[a-zA-Z]", "")
const width = () => (window.innerWidth - Number.parseFloat(gap)) / 2;
const height = () => window.innerHeight - nav.offsetHeight;

const gui = new dat.GUI();
const controller: Controller = new BezierCurveController(width, height);

controller.gui(gui);
controller.run()

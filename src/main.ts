import './style.css'

import { Canvas } from './core/canvas';

import * as THREE from 'three';
import { BezierCurveGenerator } from './core/bezierCurveGenerator';
import * as dat from 'dat.gui';
import { Line } from './core/line';
import { Point } from './core/point';

const nav = document.getElementById("nav");
const app = document.getElementById("app");
if (nav === null || app === null) {
  throw new Error("Container element with id 'nav' does not exists.");
}

const gap = getComputedStyle(app).gap.replace("[a-zA-Z]", "")
const width = () => (window.innerWidth - Number.parseFloat(gap)) / 2;
const height = () => window.innerHeight - nav.offsetHeight;

// CREATE CANVES
const canvasMain = new Canvas(width, height);
const canvasSub = new Canvas(width, height);

// CREATE OBJECTS
const resolution = 100;
let step = 0;

const meshToPoints = (v: Array<THREE.Mesh>) => {
  return v.map(m => m.position.clone())
}

// control points
const controlPoints: Array<Point> = [];
for (let idx = 0; idx < 3; idx++) {
  controlPoints.push(new Point("cube", .2));
}

// curve points
const curve = new Line();
controlPoints.forEach(p =>
  p.callback = () => {
    curve.data = BezierCurveGenerator.evaluateCurve(meshToPoints(controlPoints), resolution);
  }
)

// additional annotation to points
const point = new Point("point", 0.3);
const tangent = new Line();
tangent.material = new THREE.LineBasicMaterial({color: 0xFF0000})
const intermediates = new Array<Line>();
intermediates.push(new Line());
intermediates[0].data = meshToPoints(controlPoints);
BezierCurveGenerator.calculateIntermediates(meshToPoints(controlPoints), step).forEach(
  (intermediate, idx) => {
    intermediates.push(new Line());
    intermediates[idx + 1].data = intermediate;
  }
)

// bernstein polynom
let basisCoefficients = BezierCurveGenerator.evaluateBasisFunctions(controlPoints.length, resolution);
const basis = new Array<Line>();

basisCoefficients.forEach((element, idx) => {
  basis.push(new Line());
  basis[idx].data = element.map((y, x) => new THREE.Vector3(x / resolution, y, 0));
});

const basisPoints = new Array<Point>();
for (let idx = 0; idx < basisCoefficients.length; idx++) {
  basisPoints.push(new Point("point", .025));
}

BezierCurveGenerator.calculateCoefficients(controlPoints.length - 1, step).forEach((c, idx) => {
  basisPoints[idx].position.set(step, c, 0);
});

const update = () => {
  const p = BezierCurveGenerator.evaluatePoint(meshToPoints(controlPoints), step);
  const t = BezierCurveGenerator.evaluateDerivative(meshToPoints(controlPoints), step);
  const i = BezierCurveGenerator.calculateIntermediates(meshToPoints(controlPoints), step);

  BezierCurveGenerator.calculateCoefficients(controlPoints.length - 1, step).forEach((c, idx) => {
    basisPoints[idx].position.set(step, c, 0);
  });

  point.position.set(p.x, p.y, p.z);
  tangent.data = [p, p.clone().add(t)];
  intermediates[0].data = meshToPoints(controlPoints);
  i.forEach((intermediate, idx) => {
    intermediates[idx + 1].data = intermediate;
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key == " ") {
    step += 1 / resolution;
    if (step > 1) step = 0;
  }
})

// APPEND OBJECTS
canvasMain.append(curve);
controlPoints.forEach(p => canvasMain.append(p, true));

canvasMain.append(point);
canvasMain.append(tangent);
intermediates.forEach(i => canvasMain.append(i));

basis.forEach(b => canvasSub.append(b));
basisPoints.forEach(b => canvasSub.append(b));


function loop(): void {

  canvasMain.draw();
  canvasSub.draw();

  update();

  requestAnimationFrame(() => {
    loop();
  });
}

loop()


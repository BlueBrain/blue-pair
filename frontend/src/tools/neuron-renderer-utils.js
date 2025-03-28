import {
  Mesh,
  Vector3,
  Geometry,
  BufferGeometry,
  SphereBufferGeometry,
  CylinderGeometry,
  Matrix4,
  MeshLambertMaterial,
  Color,
  DoubleSide,
  Quaternion,
  Float32BufferAttribute,
} from 'three';

import last from 'lodash/last';
import * as chroma from 'chroma-js';

import { Pool } from '../services/threads';


const geometryWorkerFactory = () => new Worker(new URL('../workers/neuron-geometry.js', import.meta.url), { name: 'geometry-worker'});
const geometryWorkerPool = new Pool(geometryWorkerFactory, 2);

const HALF_PI = Math.PI * 0.5;

const baseMorphColors = {
  soma: chroma('#A9A9A9'),
  axon: chroma('#0080FF'),
  apic: chroma('#C184C1'),
  dend: chroma('#FF0033'),
  myelin: chroma('#F5F5F5'),
};


class RendererCtrl {
  countinuousRenderCounter = 0;

  once = true;

  stopTime = null;

  get render() {
    if (this.countinuousRenderCounter) return true;

    if (this.stopTime) {
      const now = Date.now();
      if (this.stopTime > now) return true;

      this.stopTime = null;
      return false;
    }

    const { once } = this;
    this.once = false;
    return once;
  }

  renderOnce() {
    this.once = true;
  }

  renderFor(time) {
    const now = Date.now();
    if (this.stopTime && this.stopTime > now + time) return;
    this.stopTime = now + time;
  }

  renderUntilStopped() {
    this.countinuousRenderCounter += 1;
    return () => { this.countinuousRenderCounter -= 1; };
  }
}

function disposeMesh(obj) {
  obj.geometry.dispose();
  obj.material.dispose();
}

function createSecGeometryFromPoints(pts, simplificationRatio = 2) {
  const sRatio = simplificationRatio;

  const secGeometry = new Geometry();

  for (let i = 0; i < pts.length - 1; i += sRatio) {
    const vstart = new Vector3(pts[i][0], pts[i][1], pts[i][2]);
    const vend = new Vector3(
      pts[i + sRatio] ? pts[i + sRatio][0] : last(pts)[0],
      pts[i + sRatio] ? pts[i + sRatio][1] : last(pts)[1],
      pts[i + sRatio] ? pts[i + sRatio][2] : last(pts)[2],
    );
    const distance = vstart.distanceTo(vend);
    const position = vend.clone().add(vstart).divideScalar(2);

    const dStart = pts[i][3] * 2;
    const dEnd = (pts[i + sRatio] ? pts[i + sRatio][3] : last(pts)[3]) * 2;

    const geometry = new CylinderGeometry(
      dStart,
      dEnd,
      distance,
      Math.max(5, Math.ceil(24 / sRatio)),
      1,
      true,
    );

    const orientation = new Matrix4();
    const offsetRotation = new Matrix4();
    orientation.lookAt(vstart, vend, new Vector3(0, 1, 0));
    offsetRotation.makeRotationX(HALF_PI);
    orientation.multiply(offsetRotation);
    geometry.applyMatrix4(orientation);

    const cylinder = new Mesh(geometry);
    cylinder.position.copy(position);
    cylinder.updateMatrix();

    secGeometry.merge(cylinder.geometry, cylinder.matrix);
    disposeMesh(cylinder);
  }

  const secBufferGeometry = new BufferGeometry().fromGeometry(secGeometry);
  secGeometry.dispose();

  return secBufferGeometry;
}

async function createSecMeshFromPoints(pts, material, simplificationRatio) {
  const [vertices, normals] = await geometryWorkerPool.queue(thread => thread.createSecGeometryFromPoints(pts, simplificationRatio));

  const normalsBuffer = new Float32BufferAttribute(normals, 3);
  const vertexBuffer = new Float32BufferAttribute(vertices, 3);

  const geometry = new BufferGeometry();

  geometry.setAttribute('position', vertexBuffer);
  geometry.setAttribute('normal', normalsBuffer);

  return new Mesh(geometry, material);
}

function getSomaPositionFromPoints(pts) {
  let position;

  if (pts.length === 1) {
    position = new Vector3().fromArray(pts[0]);
  } else if (pts.length === 3) {
    position = new Vector3().fromArray(pts[0]);
  } else {
    position = pts
      .reduce((vec, pt) => vec.add(new Vector3().fromArray(pt)), new Vector3())
      .divideScalar(pts.length);
  }

  return position;
}

function getSomaRadiusFromPoints(pts) {
  const position = getSomaPositionFromPoints(pts);
  let radius;

  if (pts.length === 1) {
    radius = pts[0][3];
  } else if (pts.length === 3) {
    const secondPt = new Vector3().fromArray(pts[1]);
    const thirdPt = new Vector3().fromArray(pts[2]);
    radius = (position.distanceTo(secondPt) + position.distanceTo(thirdPt)) / 2;
  } else {
    // radius = pts.reduce((distance, pt) => distance + position.distanceTo(new THREE.Vector3().fromArray(pt)), 0) / pts.length;
    radius = Math.max(...pts.map(pt => position.distanceTo(new Vector3().fromArray(pt))));
  }

  return radius;
}

function createSomaMeshFromPoints(pts, material) {
  const position = getSomaPositionFromPoints(pts);
  const radius = getSomaRadiusFromPoints(pts);

  const geometry = new SphereBufferGeometry(radius, 14, 14);
  const mesh = new Mesh(geometry, material);
  mesh.position.copy(position);
  mesh.updateMatrix();

  return mesh;
}

function generateSecMaterialMap(colorDiff) {
  const materialMap = Object.entries(baseMorphColors).reduce((map, [secType, chromaColor]) => {
    const glColor = chromaColor
      .brighten(colorDiff)
      .desaturate(colorDiff)
      .gl();

    const color = new Color(...glColor);
    const material = new MeshLambertMaterial({ color, transparent: true });
    material.side = DoubleSide;

    return Object.assign(map, { [secType]: material });
  }, {});

  return materialMap;
}

function rotMatrix4x4FromArray3x3(array3x3) {
  const rotMatrix = new Matrix4();

  rotMatrix.set(
    ...array3x3.reduce((acc, row) => ([...acc, ...row, 0]), []),
    0, 0, 0, 1,
  );

  return rotMatrix;
}

function quatFromArray3x3(array3x3) {
  const rotationMatrix = rotMatrix4x4FromArray3x3(array3x3);

  const quaternion = new Quaternion().setFromRotationMatrix(rotationMatrix);

  return quaternion;
}

export default {
  createSecGeometryFromPoints,
  createSecMeshFromPoints,
  disposeMesh,
  createSomaMeshFromPoints,
  getSomaPositionFromPoints,
  getSomaRadiusFromPoints,
  generateSecMaterialMap,
  quatFromArray3x3,
  RendererCtrl,
};


import * as THREE from 'three';
import * as chroma from 'chroma-js';
import throttle from 'lodash/throttle';
import isEqual from 'lodash/isEqual';

// TODO: refactor to remove store operations
// and move them to vue viewport component
import store from '@/store';


// TODO: consider to use trackball ctrl instead
const OrbitControls = require('three-orbit-controls')(THREE);


const FOG_COLOR = 0xffffff;
const NEAR = 1;
const FAR = 50000;
const AMBIENT_LIGHT_COLOR = 0x555555;
const CAMERA_LIGHT_COLOR = 0xffffff;
const BACKGROUND_COLOR = 0xfefdfb;
const HOVER_BOX_COLOR = 0xffdf00;
const hoverNeuronColor = new THREE.Color(0xf26d21).toArray();

const baseMorphColors = {
  soma: chroma('#A9A9A9'),
  axon: chroma('#0080FF'),
  apic: chroma('#C184C1'),
  dend: chroma('#FF0033'),
  myelin: chroma('#F5F5F5'),
};


class NeuronRenderer {
  constructor({ canvasElementId, onHover, onClick }) {
    const canvas = document.getElementById(canvasElementId);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });

    const { clientWidth, clientHeight } = canvas.parentElement;

    this.renderer.setSize(clientWidth, clientHeight);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(BACKGROUND_COLOR);
    this.scene.fog = new THREE.Fog(FOG_COLOR, NEAR, FAR);
    this.scene.add(new THREE.AmbientLight(AMBIENT_LIGHT_COLOR));

    this.mouseGl = new THREE.Vector2();
    this.mouseNative = new THREE.Vector2();

    this.raycaster = new THREE.Raycaster();

    this.camera = new THREE.PerspectiveCamera(45, clientWidth / clientHeight, 1, 100000);
    this.scene.add(this.camera);
    this.camera.add(new THREE.PointLight(CAMERA_LIGHT_COLOR, 0.9));

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    this.hoveredNeuron = null;
    this.mousePressed = false;

    this.secMarkerObj = new THREE.Object3D();
    this.scene.add(this.secMarkerObj);

    const segInjTexture = new THREE.TextureLoader().load('/seg-inj-texture.png');
    segInjTexture.wrapS = THREE.RepeatWrapping;
    segInjTexture.wrapT = THREE.RepeatWrapping;

    const segRecTexture = new THREE.TextureLoader().load('/seg-rec-texture.png');
    segRecTexture.wrapS = THREE.RepeatWrapping;
    segRecTexture.wrapT = THREE.RepeatWrapping;

    this.recMarkerMaterial = new THREE.MeshBasicMaterial({
      color: 0x00bfff,
      opacity: 0.7,
      map: segRecTexture,
      transparent: true,
    });

    this.injMarkerMaterial = new THREE.MeshBasicMaterial({
      color: 0xffa500,
      opacity: 0.7,
      map: segInjTexture,
      transparent: true,
    });

    this.onHoverHandler = onHover;
    this.onClickHandler = onClick;

    this.initEventHandlers();
    this.animate();
  }

  initNeuronCloud(cloudSize) {
    const positionBuffer = new Float32Array(cloudSize * 3);
    const colorBuffer = new Float32Array(cloudSize * 3);
    const alphaBuffer = new Float32Array(cloudSize).fill(0.8);

    this.neuronCloud = {
      positionBufferAttr: new THREE.BufferAttribute(positionBuffer, 3),
      colorBufferAttr: new THREE.BufferAttribute(colorBuffer, 3),
      alphaBufferAttr: new THREE.BufferAttribute(alphaBuffer, 1),
    };

    const geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', this.neuronCloud.positionBufferAttr);
    geometry.addAttribute('color', this.neuronCloud.colorBufferAttr);
    geometry.addAttribute('alpha', this.neuronCloud.alphaBufferAttr);

    const neuronTexture = new THREE.TextureLoader().load('/neuron-texture.png');

    const material = new THREE.PointsMaterial({
      vertexColors: THREE.VertexColors,
      size: store.state.circuit.pointNeuronSize,
      opacity: 0.85,
      transparent: true,
      alphaTest: 0.4,
      sizeAttenuation: true,
      map: neuronTexture,
    });

    this.neuronCloud.points = new THREE.Points(geometry, material);
    this.neuronCloud.points.name = 'neuronCloud';
    this.neuronCloud.points.frustumCulled = false;
    this.scene.add(this.neuronCloud.points);
  }

  alignCamera() {
    this.neuronCloud.points.geometry.computeBoundingSphere();
    const { center, radius } = this.neuronCloud.points.geometry.boundingSphere;
    this.camera.position.x = center.x;
    this.camera.position.y = center.y;

    const distance = radius / Math.tan(Math.PI * this.camera.fov / 360) * 1.15;

    this.camera.position.z = distance + center.z;
    this.controls.target = center;
  }

  showSynConnections() {
    const connections = store.state.simulation.synConnections;
    this.synConnectionsObj = new THREE.Object3D();
    const material = new THREE.MeshLambertMaterial({ color: 0x1020ff });
    connections.forEach(([x, y, z]) => {
      const geometry = new THREE.SphereGeometry(5, 32, 32);
      const synapse = new THREE.Mesh(geometry, material);
      synapse.position.set(x, y, z);
      this.synConnectionsObj.add(synapse);
    });
    this.scene.add(this.synConnectionsObj);
  }

  hideNeuronCloud() {
    this.neuronCloud.points.visible = false;
  }

  showNeuronCloud() {
    this.neuronCloud.points.visible = true;
  }

  initMorphology() {
    const gids = store.state.circuit.simAddedNeurons.map(n => n.gid);
    const { morphology } = store.state.simulation;

    this.cellMorphologyObj = new THREE.Object3D();
    // TODO: improve naming here

    gids.forEach((gid, cellIndex) => {
      const sections = morphology[gid].morph;
      const { quaternion } = morphology[gid];

      const neuronIndex = gid - 1;
      const neuron = store.$get('neuron', neuronIndex);
      const [x, y, z] = store.$get('neuronPosition', neuronIndex);
      const cellObj3D = new THREE.Object3D();
      Object.keys(sections).forEach((sectionName) => {
        const sec = sections[sectionName];
        const sectionType = sectionName.match(/\.(\w*)/)[1];

        sec.xstart.forEach((val, i) => {
          const v = new THREE.Vector3(sec.xcenter[i], sec.ycenter[i], sec.zcenter[i]);
          const axis = new THREE.Vector3(sec.xdirection[i], sec.ydirection[i], sec.zdirection[i]);
          axis.normalize();
          const rotQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis);
          const length = sec.length[i];
          const distance = sec.distance[i];
          const scaleLength = distance / length;
          const geometry = new THREE.CylinderGeometry(sec.diam[i], sec.diam[i], length, 20, 1, false);
          // TODO: reuse color objects
          const glColor = baseMorphColors[sectionType]
            .brighten(cellIndex)
            .desaturate(cellIndex)
            .gl();

          const color = new THREE.Color(...glColor);
          // TODO: reuse material
          const material = new THREE.MeshLambertMaterial({ color });
          const cylinder = new THREE.Mesh(geometry, material);
          cylinder.name = 'morphSegment';
          // TODO: optimize memory consumption?
          cylinder.userData = { neuron, sectionName, segmentIndex: i };

          cylinder.scale.setY(scaleLength);
          cylinder.setRotationFromQuaternion(rotQuat);
          cylinder.position.copy(v);
          cellObj3D.add(cylinder);
        });
      });

      const orientation = new THREE.Quaternion();
      orientation.fromArray(quaternion);
      cellObj3D.applyQuaternion(orientation);
      cellObj3D.position.copy(new THREE.Vector3(x, y, z));
      this.cellMorphologyObj.add(cellObj3D);
    });

    this.scene.add(this.cellMorphologyObj);
  }

  addSecMarker(config) {
    const [x, y, z] = store.$get('neuronPosition', config.gid - 1);
    const { morphology } = store.state.simulation;

    const sec = morphology[config.gid].morph[config.sectionName];
    const { quaternion } = morphology[config.gid];

    sec.xstart.forEach((val, i) => {
      const v = new THREE.Vector3(sec.xcenter[i], sec.ycenter[i], sec.zcenter[i]);
      const axis = new THREE.Vector3(sec.xdirection[i], sec.ydirection[i], sec.zdirection[i]);
      axis.normalize();
      const rotQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis);
      const length = sec.length[i];
      const distance = sec.distance[i];
      const scaleLength = distance / length;
      const diamDelta = 2 / Math.ceil(Math.sqrt(sec.diam[i]));
      const diam = sec.diam[i] + diamDelta;
      const markerGeometry = new THREE.CylinderGeometry(diam, diam, length, 20, 1, true);
      const material = config.type === 'recording' ? this.recMarkerMaterial : this.injMarkerMaterial;
      const marker = new THREE.Mesh(markerGeometry, material);
      marker.name = 'sectionMarker';
      marker.userData = config;
      marker.scale.setY(scaleLength);
      marker.setRotationFromQuaternion(rotQuat);
      marker.position.copy(v);

      // global position
      const markerContainer = new THREE.Object3D();
      markerContainer.add(marker);
      const orientation = new THREE.Quaternion();
      orientation.fromArray(quaternion);
      markerContainer.applyQuaternion(orientation);
      markerContainer.position.copy(new THREE.Vector3(x, y, z));

      this.secMarkerObj.add(markerContainer);
    });
  }

  removeSecMarker(config) {
    // TODO: refactor
    const markersToRemove = [];
    this.secMarkerObj.traverse((child) => {
      if (child instanceof THREE.Mesh && isEqual(config, child.userData)) {
        markersToRemove.push(child);
      }
    });

    markersToRemove.forEach((mesh) => {
      this.secMarkerObj.remove(mesh.parent);
      this.disposeObject(mesh);
    });
  }

  disposeCellMorphology() {
    this.scene.remove(this.cellMorphologyObj);
    this.cellMorphologyObj.traverse((child) => {
      if (child instanceof THREE.Mesh) this.disposeObject(child);
    });

    this.cellMorphologyObj = null;
  }

  disposeSecMarkers() {
    this.scene.remove(this.secMarkerObj);
    this.secMarkerObj.traverse((child) => {
      if (child instanceof THREE.Mesh) this.disposeObject(child);
    });

    this.secMarkerObj = new THREE.Object3D();
    this.scene.add(this.secMarkerObj);
  }

  setNeuronCloudPointSize(size) {
    this.neuronCloud.points.material.size = size;
  }

  updateNeuronCloud() {
    this.neuronCloud.points.geometry.attributes.position.needsUpdate = true;
    this.neuronCloud.points.geometry.attributes.color.needsUpdate = true;
  }

  initEventHandlers() {
    this.renderer.domElement.addEventListener('mousedown', this.onMouseDown.bind(this), false);
    this.renderer.domElement.addEventListener('mouseup', this.onMouseUp.bind(this), false);
    this.renderer.domElement.addEventListener('mousemove', throttle(this.onMouseMove.bind(this), 100), false);
    window.addEventListener('resize', this.onResize.bind(this), false);
  }

  onMouseDown(e) {
    this.mousePressed = true;
    this.mouseNative.set(e.clientX, e.clientY);
  }

  onMouseUp(e) {
    this.mousePressed = false;
    if (e.clientX !== this.mouseNative.x || e.clientY !== this.mouseNative.y) return;

    const clickedMesh = this.getMeshByNativeCoordinates(e.clientX, e.clientY);
    if (!clickedMesh) return;

    this.onClickHandler({
      type: clickedMesh.object.name,
      index: clickedMesh.index,
      data: clickedMesh.object.userData,
    });
  }

  onMouseMove(e) {
    if (this.mousePressed) return;

    const mesh = this.getMeshByNativeCoordinates(e.clientX, e.clientY);
    if (!mesh) {
      this.unhoverMorphSegment();
      this.unhoverNeuron();
      return;
    }

    switch (mesh.object.name) {
      case 'neuronCloud':
        this.hoverNeuron(mesh.index);
        break;
      case 'morphSegment':
        this.hoverMorphSegment(mesh);
        break;
      default:
        break;
    }
  }

  hoverNeuron(neuronIndex) {
    if (this.hoveredNeuron && this.hoveredNeuron[0] === neuronIndex) return;

    if (this.hoveredNeuron) this.unhoverNeuron();

    this.onHoverHandler({
      type: 'cloudNeuron',
      neuronIndex,
    });

    this.hoveredNeuron = [
      neuronIndex,
      this.neuronCloud.colorBufferAttr.getX(neuronIndex),
      this.neuronCloud.colorBufferAttr.getY(neuronIndex),
      this.neuronCloud.colorBufferAttr.getZ(neuronIndex),
    ];
    this.neuronCloud.colorBufferAttr.setXYZ(neuronIndex, ...hoverNeuronColor);
    this.neuronCloud.points.geometry.attributes.color.needsUpdate = true;
  }

  unhoverNeuron() {
    if (!this.hoveredNeuron) return;

    this.onHoverHandler();

    this.neuronCloud.colorBufferAttr.setXYZ(...this.hoveredNeuron);
    this.neuronCloud.points.geometry.attributes.color.needsUpdate = true;
    this.hoveredNeuron = null;
  }

  hoverMorphSegment(mesh) {
    if (this.hoverBox) {
      if (
        this.hoverBox.userData.sectionName === mesh.object.userData.sectionName &&
        this.hoverBox.userData.segmentIndex === mesh.object.userData.segmentIndex
      ) return;

      this.scene.remove(this.hoverBox);
      this.disposeObject(this.hoverBox);
    }

    const geometry = new THREE.EdgesGeometry(mesh.object.geometry);
    const material = new THREE.LineBasicMaterial({
      color: HOVER_BOX_COLOR,
      linewidth: 2,
    });
    this.hoverBox = new THREE.LineSegments(geometry, material);

    mesh.object.getWorldPosition(this.hoverBox.position);
    mesh.object.getWorldQuaternion(this.hoverBox.rotation);
    this.hoverBox.name = mesh.object.name;
    this.hoverBox.userData = mesh.object.userData;
    this.scene.add(this.hoverBox);
  }

  unhoverMorphSegment() {
    if (!this.hoverBox) return;

    this.scene.remove(this.hoverBox);
    this.disposeObject(this.hoverBox);
    this.hoverBox = null;
  }

  disposeObject(obj) {
    obj.geometry.dispose();
    obj.material.dispose();
  }

  onResize() {
    const { clientWidth, clientHeight } = this.renderer.domElement.parentElement;
    this.camera.aspect = clientWidth / clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(clientWidth, clientHeight);
  }

  getMeshByNativeCoordinates(x, y) {
    this.mouseGl.x = (x / this.renderer.domElement.clientWidth) * 2 - 1;
    // TODO: remove hardcoded const
    this.mouseGl.y = -((y - 28) / this.renderer.domElement.clientHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouseGl, this.camera);
    const intersections = this.raycaster.intersectObjects(this.scene.children, true);
    return intersections.find(mesh => mesh.object.name !== 'sectionMarker');
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}


export default NeuronRenderer;

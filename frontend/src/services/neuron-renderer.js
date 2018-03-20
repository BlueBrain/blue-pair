
import * as THREE from 'three';
import * as chroma from 'chroma-js';
import throttle from 'lodash/throttle';

// TODO: refactor to remove store operations
// and move them to vue viewport component
import store from '@/store';


// TODO: consider to use trackball ctrl instead
const OrbitControls = require('three-orbit-controls')(THREE);


const FOG_COLOR = 0x000000;
const NEAR = 0.1;
const FAR = 50000;
const AMBIENT_LIGHT_COLOR = 0x888888;
const DIRECTIONAL_LIGHT_COLOR = 0xffffff;
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
    this.scene.fog = new THREE.Fog(FOG_COLOR, NEAR, FAR);
    this.scene.background = new THREE.Color(BACKGROUND_COLOR);
    this.scene.add(new THREE.AmbientLight(AMBIENT_LIGHT_COLOR));
    this.scene.add(new THREE.DirectionalLight(DIRECTIONAL_LIGHT_COLOR, 0.5));

    this.mouseGl = new THREE.Vector2();
    this.mouseNative = new THREE.Vector2();

    this.raycaster = new THREE.Raycaster();

    this.camera = new THREE.PerspectiveCamera(45, clientWidth / clientHeight, 1, 100000);

    // TODO: remove hardcoded stuff here
    this.camera.position.x = 200;
    this.camera.position.y = 1000;
    this.camera.position.z = 3800;
    this.camera.lookAt(new THREE.Vector3(350, 1000, 1000));

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    this.hoveredNeuron = null;
    this.mousePressed = false;

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
    // const {circuit: {neuronPropIndex}, simulation: {morphology}} = store.state;
    const neuronPropIndex = store.state.circuit.neuronPropIndex;
    const gids = store.state.circuit.simAddedNeurons.map(n => n.gid);
    const morphology = store.state.simulation.morphology;
    const cellMorphs = gids.reduce((cells, gid) => {
      return Object.assign(cells, {
        [gid]: morphology[gid],
      });
    }, {});

    this.cellMorphologyObj = new THREE.Object3D();
    // TODO: improve naming here

    Object.keys(cellMorphs).forEach((gid, cellIndex) => {
      const sections = cellMorphs[gid].morph;
      const quaternion = cellMorphs[gid].quaternion;

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

  disposeCellMorphology() {
    this.scene.remove(this.cellMorphologyObj);
    this.disposeObject(this.cellMorphologyObj);
    this.cellMorphologyObj = null;
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
    return intersections[0];
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}


export default NeuronRenderer;

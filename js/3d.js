
var kt = require('./lib/kutility');
var Monolith = require('./monolith');

var container;

var camera, scene, renderer, light;

var eat3d;

var composer;

var mouseX = 0;
var mouseY = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var xgrid = 30;
var ygrid = 30;
var xsize = 640 / xgrid;
var ysize = 360 / ygrid;
function zsize() {
  return kt.randInt(40, 20);
}

var velocity = 0.012; // originally 0.001;
var pauseCount = 200; // originally 200
var cycleCount = 300; // originally 1000

if (init());
  animate();

function init() {

  container = document.createElement('div'); // a place to hold my 3d
  document.body.appendChild(container);

  camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.z = 600;

  scene = new THREE.Scene();

  light = new THREE.DirectionalLight(0xffffff); // a lil white light
  light.position.set(0.5, 1, 1).normalize();
  scene.add(light);

  try { // create and append renderer
    renderer = new THREE.WebGLRenderer({ antialias: false });
  } catch(e) {
    console.log('NO WEBGL HERE');
    return false;
  }
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.autoClear = false;
  container.appendChild(renderer.domElement);

  eat3d = new Monolith('eat3d', {
    xgrid: 30,
    ygrid: 30,
    xsize: 640 / 30,
    ysize: 360 / 30,
    velocity: 0.012
  }, renderer, scene);
  eat3d.addTo(scene);

  document.addEventListener('mousemove', onDocumentMouseMove, false);

  // postprocessing

  var renderModel = new THREE.RenderPass(scene, camera);
  var effectBloom = new THREE.BloomPass(1.3);
  var effectCopy = new THREE.ShaderPass(THREE.CopyShader);

  effectCopy.renderToScreen = true;

  composer = new THREE.EffectComposer(renderer);
  composer.addPass(renderModel);
  composer.addPass(effectBloom);
  composer.addPass(effectCopy);

  window.addEventListener('resize', onWindowResize, false);

  return true;
}

function onWindowResize() {
  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.reset();
}

function onDocumentMouseMove(event) {
  mouseX = event.clientX - windowHalfX;
  mouseY = (event.clientY - windowHalfY) * 0.6;
}

function animate() {
  setTimeout(animate, 20);
  render();
}

var counter = 1;

function render() {
  var time = Date.now() * 0.00005;

  camera.position.x += (mouseX - camera.position.x) * 0.05;
  camera.position.y += (-mouseY - camera.position.y) * 0.05;
  camera.lookAt(scene.position);

  if (counter % cycleCount > pauseCount) {
    eat3d.mode = 'moving';
  } else {
    eat3d.mode = 'still';
  }

  if (counter % cycleCount === 0) {
    eat3d.reverseDirection();
  }

  eat3d.render();

  counter++;
  renderer.clear();
  composer.render();
}

var container;

var camera, scene, renderer;

var eat3d, $eat3d;
var vidTexture, material, mesh;

var composer;

var mouseX = 0;
var mouseY = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var cube_count;
var meshes = [];
var materials = [];

var xgrid = 20;
var ygrid = 10;

if (init());
  animate();

function init() {

  container = document.createElement('div'); // a place to hold my 3d
  document.body.appendChild(container);

  camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.z = 500;

  scene = new THREE.Scene();

  var light = new THREE.DirectionalLight(0xffffff); // a lil white light
  light.position.set(0.5, 1, 1).normalize();
  scene.add(light);

  try { // create and append renderer
    renderer = new THREE.WebGLRenderer({ antialias: false });
  } catch(e) {
    console.log('NO WEBGL HERE');
    return false;
  }
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  eat3d = document.getElementById('eat3d');
  $eat3d = $(eat3d);

  vidTexture = new THREE.Texture(eat3d); // texture that comes from the video wait wut
  vidTexture.minFilter = THREE.LinearFilter;
  vidTexture.magFilter = THREE.LinearFilter;
  vidTexture.format = THREE.RGBFormat;
  vidTexture.generateMipmaps = false;

  var i, j;
  var ux, uy;
  var ox, oy;
  var geometry;
  var xsize, ysize;

  ux = 1 / xgrid;
  uy = 1 / ygrid;

  xsize = eat3d.videoWidth / xgrid;
  ysize = eat3d.videoHeight / ygrid;

  var materialParams = {color: 0xffffff, map: vidTexture};
  var material_base = new THREE.MeshLambertMaterial(materialParams);

  renderer.initMaterial(material_base, scene.__lights, scene.fog);

  cube_count = 0;

  for (i = 0; i < xgrid; i++) {
    for (j = 0; j < ygrid; j++) {
      ox = i;
      oy = j;

      geometry = new THREE.BoxGeometry(xsize, ysize, xsize);
      change_uvs(geometry, ux, uy, ox, oy);

      materials[cube_count] = new THREE.MeshLambertMaterial(materialParams);
      material = materials[cube_count];
      material.hue = i / xgrid;
      material.saturation = 1 - j / ygrid;
      material.color.setHSL(material.hue, material.saturation, 0.5);

      mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = ( i - xgrid / 2 ) * xsize;
      mesh.position.y = ( j - ygrid / 2 ) * ysize;
      mesh.position.z = 0;
      mesh.scale.x = 1;
      mesh.scale.y = 1;
      mesh.scale.z = 1;
      scene.add(mesh);

      mesh.dx = 0.001 * (0.5 - Math.random());
      mesh.dy = 0.001 * (0.5 - Math.random());
      meshes[cube_count] = mesh;

      cube_count += 1;
    }
  }

  renderer.autoClear = false;

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

function change_uvs(geometry, unitx, unity, offsetx, offsety) {
  var faceVertexUvs = geometry.faceVertexUvs[0];

  for (var i = 0; i < faceVertexUvs.length; i++) {
    var uvs = faceVertexUvs[i];
    for (var j = 0; j < uvs.length; j++) {
      var uv = uvs[j];
      uv.x = (uv.x + offsetx) * unitx;
      uv.y = (uv.y + offsety) * unity;
    }
  }
}


function onDocumentMouseMove(event) {
  mouseX = (event.clientX - windowHalfX);
  mouseY = (event.clientY - windowHalfY) * 0.3;
}

//

function animate() {
  setTimeout(animate, 20);
  render();
}

var h, counter = 1;

function render() {
  var time = Date.now() * 0.00005;

  camera.position.x += (mouseX - camera.position.x) * 0.05;
  camera.position.y += (-mouseY - camera.position.y) * 0.05;
  camera.lookAt(scene.position);

  if (eat3d.readyState === eat3d.HAVE_ENOUGH_DATA) {
    if (vidTexture)
      vidTexture.needsUpdate = true;
  }

  for (var i = 0; i < cube_count; i++) {
    material = materials[i];
    h = ( 360 * ( material.hue + time ) % 360 ) / 360;
    material.color.setHSL( h, material.saturation, 0.5 );
  }

  if (counter % 1000 > 200) {
    for (var i = 0; i < cube_count; i++) {
      mesh = meshes[i];
      mesh.rotation.x += 10 * mesh.dx;
      mesh.rotation.y += 10 * mesh.dy;

      mesh.position.x += 200 * mesh.dx;
      mesh.position.y += 200 * mesh.dy;
      mesh.position.z += 400 * mesh.dx;
    }
  }

  if (counter % 1000 === 0) {
    for (i = 0; i < cube_count; i ++) {
      mesh = meshes[i];
      mesh.dx *= -1;
      mesh.dy *= -1;
    }
  }

  counter++;

  //renderer.clear();
  composer.render();
  console.log('r');
}

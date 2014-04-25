
var kt = require('./lib/kutility');
var Monolith = require('./monolith');
var mover = require('./mover');

var container;

var camera, scene, renderer, light, composer;

var mouseX = 0;
var mouseY = 0;
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var eat3d;
var stranger1;
var strangers = [];
var onslaught = [];

var velocity = 0.015; // originally 0.001;

var START_DECAY = 13666;
var STRANGER_1 = 26666;
var STRANGER_2 = 36666;
var LIGHT_SHIFT = 40000;
var ONSLAUGHT = 65000;
var BREAKDOWN = 100000;

var active = {
  eat3d: false,
  stranger1: false,
  stranger2: false
};
var breakdownInterval;

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
    xgrid: 21,
    ygrid: 21,
    width: 640,
    height: 360,
    velocity: velocity,
    mode: 'still'
  }, renderer, scene);
  eat3d.addTo(scene);

  stranger1 = new Monolith('eat3d', {
    xgrid: 15,
    ygrid: 15,
    width: 300,
    height: 200,
    velocity: 0.02,
    initX: 200,
    initY: 0,
    initZ: 60,
    randZ: true,
    zsize: 30,
    mode: 'still'
  }, renderer, scene);

  stranger2 = new Monolith('eat3d', {
    xgrid: 16,
    ygrid: 16,
    width: 150,
    height: 150,
    breakDown: true,
    velocity: 0.03,
    randVel: true,
    initX: -250,
    initY: -50,
    initZ: 20,
    zsize: 60
  }, renderer, scene);

  // postprocessing
  var renderModel = new THREE.RenderPass(scene, camera);
  var effectBloom = new THREE.BloomPass(0.9, 30);
  var effectCopy = new THREE.ShaderPass(THREE.CopyShader);
  effectCopy.renderToScreen = true;

  composer = new THREE.EffectComposer(renderer);
  composer.addPass(renderModel);
  composer.addPass(effectBloom);
  composer.addPass(effectCopy);

  document.addEventListener('mousemove', onDocumentMouseMove, false);
  window.addEventListener('resize', onWindowResize, false);

  setTimeout(startDecay, START_DECAY);
  setTimeout(addStranger1, STRANGER_1);
  setTimeout(addStranger2, STRANGER_2);
  setTimeout(performOnslaught, ONSLAUGHT);
  setTimeout(lightShift, LIGHT_SHIFT);
  setTimeout(breakdown, BREAKDOWN)

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

// break down a video, then bring it back together, then callback
function deconstruct(monolith, maxT, diffSpeeds, callback) {
  var t = kt.randInt(maxT, 50);
  monolith.setVelocity();
  monolith.mode = 'moving';
  setTimeout(function() {
    monolith.reverseDirection();

    if (!diffSpeeds)
      var t2 = t;
    else {
      var t2 = kt.randInt(maxT, 50);
      var diff = t / t2;
      monolith.speedChange(diff);
    }

    setTimeout(function() {
      monolith.mode = 'still';
      callback();
    }, t2);

  }, t);
}

function moveMonolith(mono, callback) {
  var x = (Math.random() * 2000) - 1000;
  var y = (Math.random() * 2000) - 1000;
  var z = (Math.random() * 500) - 400;

  mover.move(mono, x, y, z, false, function() {
    callback();
  });
}

function startDecay() {

  function decomposeEat() {
    deconstruct(eat3d, 1200, true, function() {
      eat3d.resetMeshes(true, false);
      if (active.eat3d) {
        setTimeout(decomposeEat, kt.randInt(1500));
      }
    });
  }

  active.eat3d = true;
  decomposeEat();
}

function addStranger1() {
  stranger1.addTo(scene);
  strangers.push(stranger1);
  active.stranger1 = true;

  var decomposing = false;
  var colored = false;

  function makeStrange() {
    var p = Math.random();
    if (p < 0.3 && !decomposing) {
      decomposing = true;
      deconstruct(stranger1, 3000, true, function() {
        decomposing = false;
      });
    }

    if (!colored && p < 0.65) {
      stranger1.setColors();
      colored = true;
    } else if (colored) {
      stranger1.resetColors();
      colored = false;
    }

    /*if (active.stranger1)*/ setTimeout(makeStrange, kt.randInt(1000, 200));
  }

  function moveit() {
    moveMonolith(stranger1, function() {
      //stranger1.resetMeshes(true, false);
      setTimeout(function() {
        if (active.stranger1) setTimeout(moveit, 1);
      }, kt.randInt(7000, 1000));
    });
  }

  makeStrange();
  setTimeout(function() {
    moveit();
  }, 5000);

  stranger1.interval = setInterval(function() {
    stranger1.resetMeshes(true, false);
  }, 12000);
}

function addStranger2() {
  active.stranger2 = true;
  stranger2.addTo(scene);
  strangers.push(stranger2);
  stranger2.mode = 'moving';

  function colorize() {
    stranger2.resetColor(kt.randColor());
    if (active.stranger2) setTimeout(colorize, kt.randInt(8000, 1000));
  }

  stranger2.interval = setInterval(function() {
    stranger2.resetMeshes(true, false);
  }, 10000);
}

function performOnslaught() {
  active.onslaught = true;
  doIt();

  function doIt() {
    var w = kt.randInt(120, 40);
    var h = kt.randInt(90, 30);
    var g = kt.randInt(7, 2);
    var bd = (Math.random() < 0.5)? true : false;
    var os = new Monolith('eat3d', {
      xgrid: g,
      ygrid: g,
      width: w,
      height: h,
      breakDown: bd,
      velocity: Math.random() * 0.01 + 0.004,
      randVel: true,
      mode: 'moving',
      initX: (Math.random() * 700) - 350,
      initY: (Math.random() * 300) - 150,
      initZ: (Math.random() * 50) + 10,
      zsize: w
    }, renderer, scene);

    os.addTo(scene);
    onslaught.push(os);

    if (active.onslaught) setTimeout(doIt, kt.randInt(7000, 2500));
  }
}

function lightShift() {
  function shift() {
    light.color = new THREE.Color(kt.randColor());

    setTimeout(function() {
      light.color = new THREE.Color(0xffffff);
      if (active.light) setTimeout(shift, kt.randInt(1000, 100));
    }, kt.randInt(300, 60));
  }

  active.light = true;
  shift();
}

function breakdown() {
  for (var key in active) {
    active[key] = false;
  }
  active.eat3d = true;
  active.onslaught = true;
  active.light = true;

  function bobulate(mono) {
    mono.randVel = false;
    mono.setVelocity();
  }

  for (var i = 0; i < strangers.length; i++) {
    bobulate(strangers[i]);
    clearInterval(strangers[i].interval);
    strangers[i].mode = 'moving';
  }

  for (var i = 0; i < onslaught.length; i++) {
    bobulate(onslaught[i]);
  }

  function flash() {
    renderer.setClearColor(0xffffff);
    setTimeout(function() {
      renderer.setClearColor(0x000000);
      setTimeout(flash, kt.randInt(300, 30));
    }, kt.randInt(300, 30));
  }

  flash();

  breakdownInterval = setInterval(function() {
    for (var i = 0; i < strangers.length; i++) {
      strangers[i].resetMeshes(true, false);
      strangers[i].mode = 'moving';
      bobulate(strangers[i]);
    }

    for (var i = 0; i < onslaught.length; i++) {
      onslaught[i].resetMeshes(true, false);
      bobulate(onslaught[i]);
    }
  }, 15000);
}

function render() {
  camera.position.x += (mouseX - camera.position.x) * 0.05;
  camera.position.y += (-mouseY - camera.position.y) * 0.05;
  camera.lookAt(scene.position);

  eat3d.render();

  for (var i = 0; i < strangers.length; i++) {
    strangers[i].render();
  }

  for (var i = 0; i < onslaught.length; i++) {
    onslaught[i].render();
  }

  renderer.clear();
  composer.render();
}

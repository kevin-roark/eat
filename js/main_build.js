(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

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

function breakdown() {

  for (var key in active) {
    active[key] = false;
  }
  active.eat3d = true;
  active.onslaught = true;

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

},{"./lib/kutility":2,"./monolith":4,"./mover":5}],2:[function(require,module,exports){
/* export something */
module.exports = new Kutility;

/* constructor does nothing at this point */
function Kutility() {

}

/**
 * get a random object from the array arr
 *
 * @api public
 */

Kutility.prototype.choice = function(arr) {
    var i = Math.floor(Math.random() * arr.length);
    return arr[i];
}

/**
 * return shuffled version of an array.
 *
 * adapted from css tricks
 *
 * @api public
 */
Kutility.prototype.shuffle = function(arr) {
  var newArray = new Array(arr.length);
  for (var i = 0; i < arr.length; i++)
    newArray[i] = arr[i];

  newArray.sort(function() { return 0.5 - Math.random() });
  return newArray;
}

/**
 * returns a random color as an 'rgb(x, y, z)' string
 *
 * @api public
 */
Kutility.prototype.randColor = function() {
    var r = Math.floor(Math.random() * 256);
    var g = Math.floor(Math.random() * 256);
    var b = Math.floor(Math.random() * 256);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
}

Kutility.prototype.randInt = function(max, min) {
  if (min)
    return Math.floor(Math.random() * (max - min)) + min;
  else
    return Math.floor(Math.random() * (max));
}

/**
 * Color wheel 1 -> 1536.
 *
 * Written by Henry Van Dusen, all attribution to the big boy.
 * Slightly modified by Kev.
 *
 * @api public
 */
 Kutility.prototype.colorWheel = function(num) {
    var text = "rgb(";
    var entry = num % 1536;
    var num = entry % 256;

    if(entry < 256 * 1)
    	return text + "0,255," + num + ")";
    else if(entry < 256 * 2)
    	return text + "0," + (255 - num) + ",255)";
    else if(entry < 256 * 3)
      return text + num + ",0,255)";
    else if(entry < 256 * 4)
      return text + "255,0," + (255 - num) + ")";
    else if(entry < 256 * 5)
      return text + "255," + num + ",0)";
    else
      return text + (255 - num) + ",255,0)";
 }

 /**
  * Make an rbg() color string an rgba() color string
  *
  * @api public
  */
Kutility.prototype.alphize = function(color, alpha) {
  color.replace('rgb', 'rgba');
  color.replace(')', ', ' + alpha + ')');
  return color;
}

/**
 * Get an array of two random contrasting colors.
 *
 * @api public
 */
Kutility.prototype.contrasters = function() {
  var num = Math.floor(Math.random() * 1536);
  var fg = this.colorWheel(num);
  var bg = this.colorWheel(num + 650);
  return [fg, bg];
}

/**
 * Add a random shadow to a jquery element
 *
 * @api public
 */
Kutility.prototype.randomShadow = function(el, size) {
  var s = size + 'px';
  var shadow = '0px 0px ' + s + ' ' + s + ' ' + this.randColor();
  addShadow(el, shadow);
}

/**
 * Add shadow with offset x and y pixels, z pixels of blur radius,
 * w pizels of spread radius, and cool color
 *
 * @api public
 */
Kutility.prototype.shadow = function(el, x, y, z, w, color) {
  var xp = x + "px";
  var yp = y + "px";
  var zp = z + "px";
  var wp = w + "px";

  var shadow = xp + " " + yp + " " + zp + " " + wp + " " + color;
  addShadow(el, shadow);
}

function addShadow(el, shadow) {
  el.css('-webkit-box-shadow', shadow);
  el.css('-moz-box-shadow', shadow);
  el.css('box-shadow', shadow);
}

/**
 * Add transform to element with all the lame browser prefixes.
 *
 * @api public
 */
Kutility.prototype.addTransform = function(el, transform) {
  var curTransform = this.getTransform(el);
  curTransform = curTransform.replace('none', '');
  var newTransform = curTransform + transform;
  this.setTransform(el, newTransform);
}

/**
 * Set transform of element with all the lame browser prefixes.
 *
 * @api public
 */
Kutility.prototype.setTransform = function(el, transform) {
  el.css('-webkit-transform', transform);
  el.css('-moz-transform', transform);
  el.css('-ms-transform', transform);
  el.css('-o-transform', transform);
  el.css('transform', transform);
}

/**
 * Check an elements tansform.
 *
 * @api public
 */
Kutility.prototype.getTransform = function(el) {
  var possible = ['transform', '-webkit-transform', '-moz-transform', '-ms-transform', '-o-transform'];

  for (var i = 0; i < possible.length; i++) {
    var f = el.css(possible[i]);
    if (f == 'none' && i + 1 < possible.length) {
      var pf = el.css(possible[i + 1]);
      if (pf)
        continue;
    }
    return f;
  }
}

/**
 * Remove all transforms from element.
 *
 * @api public
 */
Kutility.prototype.clearTransforms = function(el) {
  el.css('-webkit-transform', '');
  el.css('-moz-transform', '');
  el.css('-ms-transform', '');
  el.css('-o-transform', '');
  el.css('transform', '');
}

/**
 * Rotate an element by x degrees.
 *
 * @api public
 */
Kutility.prototype.rotate = function(el, x) {
  var ct = this.getTransform(el);
  ct = ct.replace(/matrix\(.*?\)/, '').replace('none', '');

  var t = ' rotate(' + x + 'deg)';
  this.setTransform(el, ct  + t);
}

/**
 * Scale an element by x (no units);
 *
 * @api public
 */
Kutility.prototype.scale = function(el, x) {
  var ct = this.getTransform(el);
  ct = ct.replace(/matrix\(.*?\)/, '').replace('none', '');

  var t = ' scale(' + x + ',' + x + ')';
  this.setTransform(el, ct + t);
}

/**
 * Translate an element by x, y (include your own units);
 *
 * @api public
 */
Kutility.prototype.translate = function(el, x, y) {
  var ct = this.getTransform(el);
  console.log(ct);
  ct = ct.replace(/matrix\(.*?\)/, '').replace('none', '');

  var t = ' translate(' + x + ', '  + y + ')';
  this.setTransform(el, ct + t);
}

/**
 * Skew an element by x, y degrees;
 *
 * @api public
 */
Kutility.prototype.skew = function(el, x, y) {
  var ct = this.getTransform(el);
  ct = ct.replace(/skew\(.*?\)/, '').replace(/matrix\(.*?\)/, '').replace('none', '');

  var xd = x + 'deg';
  var yd = y + 'deg';
  var t = ' skew(' + xd + ', ' + yd + ')';
  this.setTransform(el, ct + t);
}

/**
 * Warp an element by rotating and skewing it.
 *
 * @api public
 */
Kutility.prototype.warp = function(el, d, x, y) {
  var ct = this.getTransform(el);
  ct = ct.replace(/matrix\(.*?\)/, '').replace('none', '');

  var r = ' rotate(' + d + 'deg)';
  var xd = x + 'deg';
  var yd = y + 'deg';
  var s = ' skew(' + xd + ', ' + yd + ')';

  this.setTransform(el, ct + r + s);
}

/**
 * scale by w, translate x y
 *
 * @api public
 */
Kutility.prototype.slaw = function(el, w, x, y) {
  var ct = this.getTransform(el);
  ct = ct.replace(/matrix\(.*?\)/, '').replace('none', '');

  var s = ' scale(' + w + ',' + w + ')';
  var t = ' translate(' + x + ', '  + y + ')';
  this.setTransform(el, ct + s + t);
}

/**
 * scale by w, rotate by x
 *
 * @api public
 */
Kutility.prototype.straw = function(el, w, x) {
  var ct = this.getTransform(el);
  ct = ct.replace(/matrix\(.*?\)/, '').replace('none', '');

  var s = ' scale(' + w + ',' + w + ')';
  var r = ' rotate(' + x + 'deg)';
  this.setTransform(el, ct + s + r);
}

/**
 * Set perspective to x pixels
 *
 * @api public
 */
Kutility.prototype.perp = function(el, x) {
  var p = x + 'px';
  el.css('-webkit-perspective', p);
  el.css('-moz-perspective', p);
  el.css('-ms-perspective', p);
  el.css('-o-perspective', p);
  el.css('perspective', p);
}

/**
 * Set perspective-origin to x and y percents.
 *
 * @api public
 */
Kutility.prototype.perpo = function(el, x, y) {
  var p = x + "% " + y + "%";
  el.css('-webkit-perspective-origin', p);
  el.css('-moz-perspective-origin', p);
  el.css('-ms-perspective-origin', p);
  el.css('-o-perspective-origin', p);
  el.css('perspective-origin', p);
}

/**
 * Translate an element by x, y, z pixels
 *
 * @api public
 */
Kutility.prototype.trans3d = function(el, x, y, z) {
  var ct = this.getTransform(el);
  ct = ct.replace(/matrix3d\(.*?\)/, '').replace('none', '');

  var t = ' translate3d(' + x + 'px, ' + y + 'px, ' + z + 'px)';
  this.setTransform(el, ct + t);
}

/**
 * Scale an element by x (no units)
 *
 * @api public
 */
Kutility.prototype.scale3d = function(el, x) {
  var ct = this.getTransform(el);
  ct = ct.replace(/matrix3d\(.*?\)/, '').replace('none', '');

  var t = ' scale3d(' + x + ', ' + x + ', ' + x + ')';
  this.setTransform(el, ct + t);
}

/**
 * Rotate an element about <x, y, z> by d degrees
 *
 * @api public
 */
Kutility.prototype.rotate3d = function(el, x, y, z, d) {
  var ct = this.getTransform(el);
  ct = ct.replace(/matrix3d\(.*?\)/, '').replace('none', '');

  var t = ' rotate3d(' + x + ', ' + y + ', ' + z + ', ' + d + 'deg)';
  this.setTransform(el, ct + t);
}

/**
 * Rotate an element about x axis by d degrees
 *
 * @api public
 */
Kutility.prototype.rotate3dx = function(el, d) {
  this.rotate3d(el, 1, 0, 0, d);
}

/**
 * Rotate an element about y axis by d degrees
 *
 * @api public
 */
Kutility.prototype.rotate3dy = function(el, d) {
  this.rotate3d(el, 0, 1, 0, d);
}

/**
 * Rotate an element about z axis by d degrees
 *
 * @api public
 */
Kutility.prototype.rotate3dz = function(el, d) {
  this.rotate3d(el, 0, 0, 1, d);
}

/** rotate and scale in 3d */
Kutility.prototype.straw3d = function(el, x, y, z, d, s) {
  var ct = this.getTransform(el);
  ct = ct.replace(/matrix3d\(.*?\)/, '').replace('none', '');

  var t = ' scale3d(' + s + ', ' + s + ', ' + s + ')';
  t += ' rotate3d(' + x + ', ' + y + ', ' + z + ', ' + d + 'deg)';
  this.setTransform(el, ct + t);
}

/**
 * Add filter to element with all the lame browser prefixes.
 *
 * @api public
 */
Kutility.prototype.addFilter = function(el, filter) {
  var curFilter = this.getFilter(el);
  curFilter = curFilter.replace('none', '');
  var newFilter = curFilter + ' ' + filter;
  this.setFilter(el, newFilter);
}

/**
 * Set filter to element with all lame prefixes.
 *
 * @api public
 */
Kutility.prototype.setFilter = function(el, filter) {
  el.css('-webkit-filter', filter);
  el.css('-moz-filter', filter);
  el.css('-ms-filter', filter);
  el.css('-o-filter', filter);
  el.css('filter', filter);
}

/**
 * Check an elements filter.
 *
 * @api public
 */
Kutility.prototype.getFilter = function(el) {
  var possible = ['filter', '-webkit-filter', '-moz-filter', '-ms-filter', '-o-filter'];

  for (var i = 0; i < possible.length; i++) {
    var f = el.css(possible[i]);
    if (f == 'none' && i + 1 < possible.length) {
      var pf = el.css(possible[i + 1]);
      if (pf)
        continue;
    }
    return f;
  }
}

/**
 * Remove all filters from element.
 *
 * @api public
 */
Kutility.prototype.clearFilters = function(el) {
  el.css('-webkit-filter', '');
  el.css('-moz-filter', '');
  el.css('-ms-filter', '');
  el.css('-o-filter', '');
  el.css('filter', '');
}

/**

/**
 * Grayscale an element by x percent.
 *
 * @api public
 */
Kutility.prototype.grayscale = function(el, x) {
  var cf = this.getFilter(el);
  cf = cf.replace(/grayscale\(.*?\)/, '').replace('none', '');

  var f = ' grayscale(' + x + '%)';
  this.setFilter(el, cf  + f);
}

/**
 * Sepia an element by x percent.
 *
 * @api public
 */
Kutility.prototype.sepia = function(el, x) {
  var cf = this.getFilter(el);
  cf = cf.replace(/sepia\(.*?\)/, '').replace('none', '');

  var f = ' sepia(' + x + '%)';
  this.setFilter(el, cf + f);
}

/**
 * Saturate an element by x percent.
 *
 * @api public
 */
Kutility.prototype.saturate = function(el, x) {
  var cf = this.getFilter(el);
  cf = cf.replace(/saturate\(.*?\)/, '').replace('none', '');

  var f = ' saturate(' + x + '%)';
  this.setFilter(el, cf + f);
}

/**
 * Invert an element by x percent.
 *
 * @api public
 */
Kutility.prototype.invert = function(el, x) {
  var cf = this.getFilter(el);
  cf = cf.replace(/invert\(.*?\)/, '').replace('none', '');

  var f = ' invert(' + x + '%)';
  this.setFilter(el, cf + f);
}

/**
 * Hue-rotate an element by x degrees.
 *
 * @api public
 */
Kutility.prototype.hutate = function(el, x) {
  var cf = this.getFilter(el);
  cf = cf.replace(/hue-rotate\(.*?\)/, '').replace('none', '');

  var f = ' hue-rotate(' + x + 'deg)';
  this.setFilter(el, cf + f);
}

/**
 * Set opacity of an element to x percent.
 *
 * @api public
 */
Kutility.prototype.opace = function(el, x) {
  var cf = this.getFilter(el);
  cf = cf.replace(/opacity\(.*?\)/, '').replace('none', '');

  var f = ' opacity(' + x + '%)';
  this.setFilter(el, cf + f);
}

/**
 * Set brightness of an element to x percent.
 *
 * @api public
 */
Kutility.prototype.brightness = function(el, x) {
  var cf = this.getFilter(el);
  cf = cf.replace(/brightness\(.*?\)/, '').replace('none', '');

  var f = ' brightness(' + x + '%)';
  this.setFilter(el, cf + f);
}

/**
 * Set contrast of an element to x percent.
 *
 * @api public
 */
Kutility.prototype.contrast = function(el, x) {
  var cf = this.getFilter(el);
  cf = cf.replace(/contrast\(.*?\)/, '').replace('none', '');

  var f = ' contrast(' + x + '%)';
  this.setFilter(el, cf + f);
}

/**
 * Blur an element by x pixels.
 *
 * @api public
 */
Kutility.prototype.blur = function(el, x) {
  var cf = this.getFilter(el);
  cf = cf.replace(/blur\(.*?\)/, '').replace('none', '');

  var f = ' blur(' + x + 'px)';
  this.setFilter(el, cf + f);
}

},{}],3:[function(require,module,exports){
$(function() {

  var kt = require('./lib/kutility'); /* you can remove this if you don't want it */

  var eat = document.querySelector('#eat');
  var $eat = $(eat);

  //var audio = document.querySelector('#audio');
  //var $aud = $(audio);

  var vids = [eat];
  var $vids = [$eat];

  /** THREE JS CODES */

  var threeD = require('./3d');

  /** BACK TO MEDIA */

  var numMedia = vids.length; // number of things to load
  var mediasReady = 0;

  var active = {
    eat: false
  };

  var AUDIO_LENGTH = 300000;

  for (var i = 0; i < vids.length; i++)
    vids[i].addEventListener('canplaythrough', mediaReady);

  function mediaReady() {
    mediasReady++;
    if (mediasReady == numMedia) {
      start();
    }
  }

  function start() {

    //audio.play();

    //startVids();

    setTimeout(hideFooter, 1000);
    setTimeout(endgame, AUDIO_LENGTH);

    soundControl();

    setInterval(function() {
      $('.debug-timer').html(vids[0].currentTime);
    }, 200);
  }

  function endgame() {

    function restart() {

      //audio.currentTime = 0;
      for (var i = 0; i < vids.length; i++)
        vids[i].currentTime = 0;

      for (var key in active)
        active[key] = false;

      start();
    }

    function showFooter() {
      $('.footer').animate({
        opacity: 1.0
      }, 600);

      $('.footer').unbind('mouseenter');
      $('.footer').unbind('mouseleave');
    }

    showFooter();
    setTimeout(restart, 5000);
  }

  function hideFooter() {
    $('.footer').animate({
      opacity: 0.0
    }, 800);

    $('.footer').mouseenter(function() {
      $(this).animate({
        opacity: 1.0
      }, 400);
    });

    $('.footer').mouseleave(function() {
      $(this).animate({
        opacity: 0.0
      }, 400);
    });
  }

  function soundControl() {
    for (var i = 0; i < vids.length; i++)
      vids[i].muted = true;
  }

  function speed(vid, rate) {
    vid.playbackRate = rate;
  }

  function removeLater(el) {
    setTimeout(function() {
      el.remove();
    }, kt.randInt(6666, 2666));
  }

  function startVids() {
    active.eat = true;
    eat.play();
  }

});

},{"./3d":1,"./lib/kutility":2}],4:[function(require,module,exports){
var kt = require('./lib/kutility');

module.exports = Monolith;

// name, num x, num y, size x, size y, size z, ...
function Monolith(vid, options, renderer, scene) {

  this.xgrid = options.xgrid || 30;
  this.ygrid = options.ygrid || 30;
  this.width = options.width || 640;
  this.height = options.height || 360;
  this.xsize = this.width / this.xgrid;
  this.ysize = this.height / this.ygrid;
  this.randZ = options.randZ || false;
  this.zsize = options.zsize || this.xsize;
  this.velocity = options.velocity || 0.01;
  this.randVel = options.randVel || false;
  this.mode = options.mode || '';
  this.breakDown = options.breakDown;
  if (this.breakDown === undefined) this.breakDown = true;
  this.initX = options.initX || 0;
  this.initY = options.initY || 0;
  this.initZ = options.initZ || 0;
  this.gdx = options.gdx || 0;
  this.gdy = options.gdy || 0;
  this.gdz = options.gdz || 0;

  this.video = document.getElementById(vid);
  this.$video = $(this.video);
  this.video.muted = true;

  this.materials = [];
  this.meshes = [];

  this.vidTexture = new THREE.Texture(this.video);
  this.vidTexture.minFilter = THREE.LinearFilter;
  this.vidTexture.magFilter = THREE.LinearFilter;
  this.vidTexture.format = THREE.RGBFormat;
  this.vidTexture.generateMipmaps = false;

  this.ux = 1 / this.xgrid;
  this.uy = 1 / this.ygrid;

  this.materialParams = {color: 0xffffff, map: this.vidTexture};
  this.material_base = new THREE.MeshLambertMaterial(this.materialParams);

  renderer.initMaterial(this.material_base, scene.__lights, scene.fog);

  this.cube_count = 0;

  var i, j;
  var ox, oy;
  var geometry;

  for (i = 0; i < this.xgrid; i++) {
    for (j = 0; j < this.ygrid; j++) {
      ox = i;
      oy = j;

      geometry = new THREE.BoxGeometry(this.xsize, this.ysize, this.z());

      // THIS IS WHAT BREAKS DOWN VIDEO INTO PARTS
      if (this.breakDown)
        change_uvs(geometry, this.ux, this.uy, ox, oy);

      this.materials[this.cube_count] = new THREE.MeshLambertMaterial(this.materialParams);
      material = this.materials[this.cube_count];

      mesh = new THREE.Mesh(geometry, material);
      this.meshes[this.cube_count] = mesh;

      this.cube_count += 1;
    }
  }

  //this.setColors(true);
  this.setVelocity();
  this.resetMeshes(true, true);
}

Monolith.prototype.z = function() {
  if (!this.randZ)
    return this.zsize;

  return (Math.random() * this.zsize * 1.5) + (this.zsize * 0.5);
}

Monolith.prototype.addTo = function(scene) {
  for (var i = 0; i < this.cube_count; i++) {
    scene.add(this.meshes[i]);
  }
}

Monolith.prototype.render = function() {
  if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
    if (this.vidTexture)
      this.vidTexture.needsUpdate = true;
  }

  var micro = false;
  if (this.mode == 'moving')
    micro = true;

  for (var i = 0; i < this.cube_count; i++) {
    mesh = this.meshes[i];

    mesh.position.x += this.gdx;
    mesh.position.y += this.gdy;
    mesh.position.z += this.gdz;

    if (micro && !this.randVel) {
      mesh.rotation.x += 10 * mesh.dx;
      mesh.rotation.y += 10 * mesh.dy;
      mesh.position.x += 200 * mesh.dx;
      mesh.position.y += 200 * mesh.dy;
      mesh.position.z += 400 * mesh.dx;
    } else if (micro) {
      mesh.rotation.x += (10 * mesh.dx) * (Math.random() - 0.5);
      mesh.rotation.y += 10 * mesh.dy * (Math.random() - 0.5);
      mesh.position.x += 200 * mesh.dx * (Math.random() - 0.5);
      mesh.position.y += 200 * mesh.dy * (Math.random() - 0.5);
      mesh.position.z += 400 * mesh.dx * (Math.random() - 0.5);
    }
  }
}

Monolith.prototype.reverseDirection = function() {
  for (i = 0; i < this.cube_count; i++) {
    mesh = this.meshes[i];
    mesh.dx *= -1;
    mesh.dy *= -1;
  }
}

Monolith.prototype.speedChange = function(rate) {
  for (i = 0; i < this.cube_count; i++) {
    mesh = this.meshes[i];
    mesh.dx *= rate;
    mesh.dy *= rate;
  }
}

Monolith.prototype.setVelocity = function() {
  for (var i = 0; i < this.cube_count; i++) {
    var mesh = this.meshes[i];
    mesh.dx = this.velocity * (0.5 - Math.random());
    mesh.dy = this.velocity * (0.5 - Math.random());
  }
}

Monolith.prototype.setColors = function(ordered) {
  for (var i = 0; i < this.xgrid; i++) {
    for (var j = 0; j < this.ygrid; j++) {
      var idx = (i * this.xgrid) + j;
      var mesh = this.meshes[idx];

      if (!mesh) continue;

      if (ordered) {
        mesh.material.hue = i / this.xgrid;
        mesh.material.saturation = 1 - j / this.ygrid;
        mesh.material.lightness = 0.5;
      } else {
        mesh.material.hue = Math.random();
        mesh.material.saturation = (Math.random() * 0.5) + 0.1; // don't want too much saturation
        mesh.material.lightness = (Math.random() * 0.5) + 0.25; // 0.25 -> 0.75
      }

      mesh.material.color.setHSL(mesh.material.hue, mesh.material.saturation, mesh.material.lightness);
    }
  }
}

Monolith.prototype.resetColors = function(color) {
  for (var i = 0; i < this.cube_count; i++) {
    var mesh = this.meshes[i];
    if (!color)
      mesh.material.color = new THREE.Color(0xffffff);
    else
      mesh.material.color = new THREE.Color(color);
  }
}

Monolith.prototype.structureVel = function(dx, dy, dz) {
  this.gdx = dx;
  this.gdy = dy;
  this.gdz = dz;
}

Monolith.prototype.resetMeshes = function(pos, scale) {
  for (var i = 0; i < this.xgrid; i++) {
    for (var j = 0; j < this.ygrid; j++) {
      var idx = (i * this.xgrid) + j;
      var mesh = this.meshes[idx];

      if (!mesh) continue;

      if (pos) {
        mesh.position.x = this.initX + ( i - this.xgrid / 2 ) * this.xsize;
        mesh.position.y = this.initY + ( j - this.ygrid / 2 ) * this.ysize;
        mesh.position.z = this.initZ;
        mesh.rotation.x = 0;
        mesh.rotation.y = 0;
      }

      if (scale) {
        mesh.scale.x = 1;
        mesh.scale.y = 1;
        mesh.scale.z = 1;
      }
    }
  }
}

Monolith.prototype.scaleMeshes = function(scale) {
  for (var i = 0; i < this.xgrid; i++) {
    for (var j = 0; j < this.ygrid; j++) {
      var idx = (i * this.xgrid) + j;
      var mesh = this.meshes[idx];

      if (!mesh) continue;

      mesh.scale.x = scale;
      mesh.scale.y = scale;
      mesh.scale.z = scale;
    }
  }
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

},{"./lib/kutility":2}],5:[function(require,module,exports){

var kt = require('./lib/kutility');

var frametime = module.exports.frametime = 20.0;

module.exports.move = function (mono, x, y, z, rotate, callback) {
  var length = kt.randInt(8000, 1000);

  var xv = x / length * 10;
  var yv = y / length * 10;
  var zv = z / length * 10;

  console.log(xv + ' ' +  yv + ' ' +  zv);

  mono.structureVel(xv, yv, zv);

  if (rotate) {
    // do something later
  }

  setTimeout(function() {
    mono.structureVel(0, 0, 0);
    callback();
  }, length);
}

},{"./lib/kutility":2}]},{},[3])
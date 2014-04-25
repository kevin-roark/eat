
var kt = require('./lib/kutility');

var frametime = module.exports.frametime = 20.0;

module.exports.move = function (mono, x, y, z, rotate, callback) {
  var length = kt.randInt(3000, 700);

  var xv = x / length * 10;
  var yv = y / length * 10;
  var zv = z / length * 10;

  mono.structureVel(xv, yv, zv);

  if (rotate) {
    // do something later
  }

  setTimeout(function() {
    mono.structureVel(0, 0, 0);
    callback();
  }, length);
}

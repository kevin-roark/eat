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

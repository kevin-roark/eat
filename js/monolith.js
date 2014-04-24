var kt = require('./lib/kutility');

module.exports = Monolith;

// name, num x, num y, size x, size y, size z, ...
function Monolith(vid, options, renderer, scene) {

  this.xgrid = options.xgrid || 30;
  this.ygrid = options.ygrid || 30;
  this.xsize = options.xsize || 21;
  this.ysize = options.ysize || 15;
  this.zsize = options.zsize || this.xsize;
  this.velocity = options.velocity || 0.01;
  this.mode = options.mode || '';

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

      geometry = new THREE.BoxGeometry(this.xsize, this.ysize, this.zsize);

      // THIS IS WHAT BREAKS DOWN VIDEO INTO PARTS
      change_uvs(geometry, this.ux, this.uy, ox, oy);

      this.materials[this.cube_count] = new THREE.MeshLambertMaterial(this.materialParams);
      material = this.materials[this.cube_count];

      mesh = new THREE.Mesh(geometry, material);
      //scene.add(mesh);
      this.meshes[this.cube_count] = mesh;

      this.cube_count += 1;
    }
  }

  //this.setColors(true);
  this.setVelocity();
  this.resetMeshes(true, true);
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

  if (this.mode == 'moving') {
    for (var i = 0; i < this.cube_count; i++) {
      mesh = this.meshes[i];

      mesh.rotation.x += 10 * mesh.dx;
      mesh.rotation.y += 10 * mesh.dy;

      mesh.position.x += 200 * mesh.dx;
      mesh.position.y += 200 * mesh.dy;
      mesh.position.z += 400 * mesh.dx;
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

Monolith.prototype.doubleVelocity = function() {
  for (i = 0; i < this.cube_count; i++) {
    mesh = this.meshes[i];
    mesh.dx *= 2;
    mesh.dy *= 2;
  }
}

Monolith.prototype.setColors = function(ordered) {
  for (var i = 0; i < this.xgrid; i++) {
    for (var j = 0; j < this.ygrid; j++) {
      var idx = (i * this.xgrid) + j;
      var mesh = this.meshes[idx];

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

Monolith.prototype.resetColors = function() {
  for (var i = 0; i < this.xgrid; i++) {
    for (var j = 0; j < this.ygrid; j++) {
      var idx = (i * this.xgrid) + j;
      var mesh = this.meshes[idx];
      mesh.material.color = new THREE.Color(0xffffff);
    }
  }
}

Monolith.prototype.setVelocity = function() {
  for (var i = 0; i < this.xgrid; i++) {
    for (var j = 0; j < this.ygrid; j++) {
      var idx = (i * this.xgrid) + j;
      var mesh = this.meshes[idx];
      mesh.dx = this.velocity * (0.5 - Math.random());
      mesh.dy = this.velocity * (0.5 - Math.random());
    }
  }
}

Monolith.prototype.resetMeshes = function(pos, scale) {
  for (var i = 0; i < this.xgrid; i++) {
    for (var j = 0; j < this.ygrid; j++) {
      var idx = (i * this.xgrid) + j;
      var mesh = this.meshes[idx];

      if (pos) {
        mesh.position.x = ( i - this.xgrid / 2 ) * this.xsize;
        mesh.position.y = ( j - this.ygrid / 2 ) * this.ysize;
        mesh.position.z = 0;
      }

      if (scale) {
        mesh.scale.x = 1;
        mesh.scale.y = 1;
        mesh.scale.z = 1;
      }
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

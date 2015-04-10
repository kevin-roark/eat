$(function() {

  var kt = require('./lib/kutility'); /* you can remove this if you don't want it */

  var eat = document.querySelector('#eat');
  var $eat = $(eat);

  var audio = document.querySelector('#audio');
  var $aud = $(audio);

  var vids = [eat];
  var $vids = [$eat];

  /** THREE JS CODES */

  var threeD = require('./3d');

  /** BACK TO MEDIA */

  var numMedia = vids.length + 1 + 1; // vids + audio + s key
  var mediasReady = 0;

  var active = {
    eat: false
  };

  var AUDIO_LENGTH = 630000 * 2; // 7.1 minutes of real life + 7.1 minutes of loop
  var INV_TIME = 80000;

  for (var i = 0; i < vids.length; i++)
    vids[i].addEventListener('canplaythrough', mediaReady);
  audio.addEventListener('canplaythrough', mediaReady);

  $(document).keypress(function(ev) {
    if (ev.keyCode == 115) { // the 's' key
      mediaReady();
    }
  });

  function mediaReady() {
    mediasReady++;
    if (mediasReady == numMedia) {
      start();
    }
  }

  function start(restarting) {

    audio.play();

    if (!threeD.init(restarting)) {
      $('.fallback').show();
      setTimeout(function() {
        $('.fallback').fadeOut();
      }, 5000);
    }

    startVids();

    setTimeout(hideFooter, 100);
    setTimeout(endgame, AUDIO_LENGTH);

    soundControl();
    speedControl();
  }

  function endgame() {

    function restart() {
      audio.currentTime = 0;
      for (var i = 0; i < vids.length; i++)
        vids[i].currentTime = 0;

      threeD.clear();

      for (var key in active)
        active[key] = false;

      location.reload();

      start(true);
    }

    function showFooter() {
      $('.footer').animate({
        opacity: 1.0
      }, 600);

      $('.footer').unbind('mouseenter');
      $('.footer').unbind('mouseleave');
    }
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

  function speedControl() {
    setTimeout(function() {
      speed(vids[0], 0.9);
    }, 57500); // we stop sampling video at 57.5 seconds
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

    ghostLooper();
    setTimeout(ghostInverter, INV_TIME);
  }

  function ghostLooper() {
    var p = Math.random();
    if (p < 0.9)
      var o = Math.random() * 0.23 + 0.02;
    else
      var o = Math.random() * 0.66 + 0.02;

    $eat.css('opacity', o);
    setTimeout(ghostLooper, kt.randInt(400, 20));
  }

  function ghostInverter() {
    var i = kt.randInt(100, 70);
    kt.invert($eat, i);
    setTimeout(function() {
      kt.invert($eat, 0);
      setTimeout(ghostInverter, kt.randInt(1200, 600));
    }, kt.randInt(1200, 200));
  }

});

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

    startVids();

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

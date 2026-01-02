/*
EchoLisp audio.lib
*/
var _AUDIO;

/*
<audio id="demo" src="audio.mp3"></audio>
<div>
  <button onclick="document.getElementById('demo').play()">Play the Audio</button>
  <button onclick="document.getElementById('demo').pause()">Pause the Audio</button>
  <button onclick="document.getElementById('demo').volume+=0.1">Increase Volume</button>
  <button onclick="document.getElementById('demo').volume-=0.1">Decrease Volume</button>
</div>
*/

var _audio_play = function () {
	_AUDIO.play();
	return __void;
}
var _audio_pause = function () {
	_AUDIO.pause();
	return __void;
}
var _audio_show = function () {
	_AUDIO.style.display = 'block';
	return __void;
}
var _audio_hide = function () {
	_AUDIO.style.display = 'none';
	return __void;
}
var _audio_volume = function (top,argc) {
	if (argc) {
		var volume = _stack[top];
		if(volume < 0 || volume > 1) glisp_error(42,volume, "(audio-volume [0..1])");
		_AUDIO.volume = volume;
		}
	return _AUDIO.volume;
}
var _audio_src = function (top,argc) {
	if (argc) {
		var src =  nameToString(_stack[top],"audio-src");
		if(src.indexOf(".mp3") === -1) src = src + ".mp3" ;
		_AUDIO.src= src;
		_AUDIO.load();
		}
	return _AUDIO.src;
}


function __audio_error() {
	writeln("Cannot play audio " + this.src, "color:orange")
}

/*---------------
library
-------------*/

function audio_boot() {
_AUDIO = document.getElementById("audio");
_AUDIO.addEventListener("error", __audio_error);

		define_sysfun (new Sysfun('audio.audio-play', _audio_play,0,0)); 
		define_sysfun (new Sysfun('audio.audio-pause', _audio_pause,0,0)); 
		define_sysfun (new Sysfun('audio.audio-hide', _audio_hide,0,0)); 
		define_sysfun (new Sysfun('audio.audio-show', _audio_show,0,0)); 
		define_sysfun (new Sysfun('audio.audio-volume', _audio_volume,0,1)); 
		define_sysfun (new Sysfun('audio.audio-src', _audio_src,0,1)); 
		
    	writeln("audio.lib v1.5 ® EchoLisp","color:green");			
     	_LIB["audio.lib"] = true;
}
audio_boot();
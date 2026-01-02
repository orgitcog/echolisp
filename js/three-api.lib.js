/*
https://aerotwist.com/tutorials/an-introduction-to-shaders-part-1/

http://threejs.org/examples/

https://stemkoski.github.io/Three.js/Graphulus-Function.html

*/

// OBSOLETE
_require("three.lib")


function _d3_basic() {
var scene, camera, renderer;
	var geometry, material, mesh;

	__toggle_visibility(document.getElementById("page"),"false");
	__toggle_visibility(document.getElementById("pagecontrol"),"true");

	init();
	animate();

	function init() {

		scene = new THREE.Scene();
		
		camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
		camera.position.z = 1000;

		geometry = new THREE.BoxGeometry( 200, 200, 200 );
		material = new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: true } );

		mesh = new THREE.Mesh( geometry, material );
		scene.add( mesh );

		renderer = new THREE.WebGLRenderer();
		renderer.setSize( window.innerWidth, window.innerHeight );

		document.body.appendChild( renderer.domElement );

	}

	function animate() {

		requestAnimationFrame( animate );

		mesh.rotation.x += 0.01;
		mesh.rotation.y += 0.02;

		renderer.render( scene, camera );

	}
}

var _d3_version = function () {
writeln("Three rev:76","color:green");
writeln("Three-api 1.2","color:green");
}

// reloadable sysfuns
function boot_three_api() {
define_sysfun (new Sysfun ("d3-basic", _d3_basic,0,0,[],true));
_d3_version();
}

boot_three_api();

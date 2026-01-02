/*
https://aerotwist.com/tutorials/an-introduction-to-shaders-part-1/
http://threejs.org/examples/
https://stemkoski.github.io/Three.js/Graphulus-Function.html
*/

/*
CAVEAT - dev
open /Applications/Google\ Chrome.app --args --allow-file-access-from-files
*/

/*
COLLECTION :
http://prideout.net/blog/?p=44 (klein bottle etc ...) ***
https://stemkoski.github.io/Three.js/ *
*/

/*
d3-plot.lib.js
© Simon Gallubert 2016
*/

_require("three.lib") ;

// D O M
function _d3_plot_show() {
	__toggle_visibility(document.getElementById("d3plot"),"true") ;
	__toggle_visibility(document.getElementById("page"),"false") ;
}
// Hide  ⚪️  🎥  🔮 button
function _d3_plot_hide( ){
	__toggle_visibility(document.getElementById("d3plot"),"false") ;
	__toggle_visibility(document.getElementById("page"),"true") ;
}
function _d3_clock( ){
}
// X button
function _d3_plot_dispose( ) {
	if(! GD3Plotter) return ;
	GD3Plotter.dispose();
	GD3Plotter = null ;
	_d3_plot_hide() ;
}

/*----------------------
GD3Plotter instanciate
---------------------------*/
var GD3Plotter = null;

function D3Plotter () {		
// DOM
		// this.sliders = document.getElementById("d3sliders");
		this.parent = document.getElementById("d3plot");
		this.renderer = null ;  // DOM element
		
// init parameters
		this.segments = 100 ; // graphMesh resolution
		this.fun = null ; // lambda
		this.axis = true ;
		
// THREE objects sets by init
        this.scene= null;
        this.xgrid = null; 
        this.ygrid = null;
        this.zgrid = null; // z = 0 plane
        this.camera = null;
        this.light = null;
        this.controls = null; // track ball
        this.clock = null;
        this.material = null;
        
        this.geometry = null;
        this.mesh = null;  // graph Mesh
        
// parametrics
        this.umin = 0; 
        this.umax = 1;
        this.vmin = 0; 
        this.vmax = 1;
// user choices (false is auto)
        this.xminmax = false; 
        this.yminmax = false; 
        this.zminmax = false; 
// computed or user choice
        this.xmin=-10; this.xmax=10;
        this.ymin=-10; this.ymax=10;
        this.zmin=-10; this.zmax=10;
// console.log("GD3Plotter",GD3Plotter);
return this ;
}

D3Plotter.prototype.dispose = function () {
	this.controls.dispose(); // listeners
	this.geometry.dispose();
	this.material.dispose();
	// this.mesh.dispose(); 
	// this.grids.dispose();
	// this.scene.dispose();
	this.parent.removeChild(this.renderer);
}

D3Plotter.prototype.addMesh = function () {
if (this.mesh) 
	{
		this.scene.remove( this.mesh);
		this.mesh.dispose();
		this.mesh = null;
	}
	this.mesh= new THREE.Mesh( this.geometry, this.material );
	this.mesh.doubleSided = true;
	this.scene.add(this.mesh);
}

D3Plotter.prototype.addCamera = function () {
	// CAMERA
	var xMax = this.xmax, xMin = this.xmin ;
	var yMax = this.ymax, yMin = this.ymin ;
	var zMax = this.zmax, zMin = this.zmin ;
	var camera ;
	
	var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight -10; // hack -10 ?
	var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 2000;
	camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
	camera.position.set( 2*xMax, 0.5*yMax, 4*zMax);
	camera.up = new THREE.Vector3( 0, 0, 1 );
	camera.lookAt(this.scene.position);	
	this.scene.add(camera);
	
	this.controls = new THREE.TrackballControls( camera, this.renderer.domElement );
	THREEx.WindowResize(this.renderer, camera); // sets "on" event
	
	this.camera = camera;
}

D3Plotter.prototype.addZgrid = function (numsteps) {
		var step;
		var geometry = new THREE.Geometry();
		numsteps = numsteps || 20;
		step = (this.ymax-this.ymin) / numsteps ;
		for ( var i = this.ymin; i <= this.ymax; i += step ) {
			geometry.vertices.push( new THREE.Vector3(this.xmin, i, 0 ) );
			geometry.vertices.push( new THREE.Vector3(this.xmax, i ,0 ) );
			}
		step = (this.xmax-this.xmin) / numsteps ;
		for ( var i = this.xmin; i <= this.xmax; i += step ) {
			geometry.vertices.push( new THREE.Vector3(i,this.ymin,  0 ) );
			geometry.vertices.push( new THREE.Vector3(i,this.ymax,  0 ) );
			}
		var material = new THREE.LineBasicMaterial
					( { color: 0x000000, opacity: 0.2, transparent: true } );
		var line = new THREE.LineSegments( geometry, material );
		this.scene.add( line );	
}

// sets this.texture (if any) , this.material
D3Plotter.prototype.addMaterial = function (mat) {
	var material = null ;
	// dispose if existing NYI
	mat = mat || 'wire' ;
	if(mat === 'lambert') {
		material = new THREE.MeshLambertMaterial( { side : THREE.DoubleSide , color: 0xccdd00 } );
		}
		
	else if (mat === 'phong') {
		material = new THREE.MeshPhongMaterial( 
			{ side : THREE.DoubleSide , ambient: 0x050505, 
			color: 0x0033ff, specular: 0x555555, shininess: 30 } );
		}
		
	else if (mat === 'vcolor') {
		material = new THREE.MeshBasicMaterial( 
			{  side : THREE.DoubleSide , vertexColors: 	THREE.VertexColors } );
	}
	
	else if (mat === 'wire') { // gray/lightgray or square.png
		var wireTexture = new THREE.ImageUtils.loadTexture( 'images/square-lightgray.png' ); 
		wireTexture.wrapS = wireTexture.wrapT = THREE.RepeatWrapping; 
		// wireTexture.repeat.set( segments, segments); // ??????? old 40 40
		material = new THREE.MeshBasicMaterial( 
			{ map: wireTexture, 
			vertexColors: THREE.VertexColors, 
			side:THREE.DoubleSide } );
		material.map.repeat.set( this.segments,this.segments );
		this.texture = wireTexture;
		}
		
	else console.log("D3Plotter : unk material: " + mat);
	
	this.material = material ;
}

// func = (lambda (x y ..) -> z
D3Plotter.prototype.addGeometry = function (env) {
// dispose of this.geometry NYI NYI

	var zMin,zMax,zRange;
	var xRange = this.xmax - this.xmin ;
	var yRange = this.ymax - this.ymin ;
	var xMin = this.xmin, yMin = this.ymin;
	var fun = this.fun ;
	var call = [fun ,[null, [null]]] ;
	var callx = call[1];
	var cally = call[1][1];
	
	var meshFunction = function(x, y) // best (u,v) in [0,1]
	{
		callx = x = xRange * x + xMin;
		cally = y = yRange * y + yMin;
		var z ;
		
		if(fun) // test null function
		z = __ffuncall(call,env);
		else  	z = 3.5 * Math.sin (Math.sqrt(x*x  + 1.5*y*y)) ;

		if ( isNaN(z) )
			return new THREE.Vector3(0,0,0); // TODO: better fix
		else
			return new THREE.Vector3(x, y, z);
	};
	
	var graphGeometry = new THREE.ParametricGeometry( meshFunction, this.segments, this.segments );
	
	///////////////////////////////////////////////
	// calculate vertex colors based on Z values //
	///////////////////////////////////////////////
	
	graphGeometry.computeBoundingBox();
	zMin = graphGeometry.boundingBox.min.z;
	zMax = graphGeometry.boundingBox.max.z;
	zRange = zMax - zMin;
	
	var color, point, face, numberOfSides, vertexIndex;
	// faces are indexed using characters
	var faceIndices = [ 'a', 'b', 'c'];
	// first, assign colors to vertices as desired
	for ( var i = 0; i < graphGeometry.vertices.length; i++ ) 
	{
		point = graphGeometry.vertices[ i ];
		color = new THREE.Color( 0x0000ff );
		color.setHSL( 0.7 * (zMax - point.z) / zRange, 1, 0.5 );
		graphGeometry.colors[i] = color; // use this array for convenience
	}
	
	// copy the colors as necessary to the face's vertexColors array.
	for ( var i = 0; i < graphGeometry.faces.length; i++ ) 
	{
		face = graphGeometry.faces[ i ];
		for( var j = 0; j < 3; j++ ) 
		{
			vertexIndex = face[ faceIndices[ j ] ];
			face.vertexColors[ j ] = graphGeometry.colors[ vertexIndex ];
		}
	}
	this.geometry = graphGeometry;
}

// sets scene
D3Plotter.prototype.init = function (fun) {
	var scene,camera,renderer,container ;
	var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight -10;

	this.fun = fun ;
	
// SCENE
	this.scene = scene = new THREE.Scene();
	
// RENDERER (DOM)
// aspect ratio ?? circles are circles ..
	 if ( Detector.webgl )
		renderer = new THREE.WebGLRenderer( {antialias:true} );
	else
		 renderer = new THREE.CanvasRenderer(); 
	renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
	container = this.parent ;
	container.appendChild( renderer.domElement );
	this.renderer = renderer;
	_d3_plot_show();
	
	// BACKGROUND
	renderer.setClearColor( 0xffffff, 1 );
	
	// LIGHT
	var light = new THREE.PointLight(0xffffff);
	light.position.set(0,250,0);
	scene.add(light);
	
	// AXIS
	if(this.axis) {
		var dmax = Math.max(Math.abs(this.xmin),Math.abs(this.xmax),Math.abs(this.ymin),
		Math.abs(this.ymax),Math.abs(this.zmin),Math.abs(this.zmax));
		scene.add( new THREE.AxisHelper(dmax*1.2));
		
		this.addZgrid();
	}
	
	
	// Material
	this.addMaterial('wire') ;
	this.addGeometry(); // sets Zmin,zmax NYI
	this.addMesh();
	
	
	// CAMERA (needs zmin,zmax)
	this.addCamera(); // and controls
	
	// EVENTS
	THREEx.WindowResize(this.renderer, this.camera);
	THREEx.FullScreen.bindKey({ charCode : 'f'.charCodeAt(0) });
}

D3Plotter.prototype.render = function () {
	this.update();
	this.renderer.render( this.scene, this.camera );
}

D3Plotter.prototype.update = function () {
	this.controls.update();
	// stats.update();
	if(! this.mesh) return ;
	//this.mesh.rotation.x += 0.002;
	//this.mesh.rotation.y += 0.004;
}


function __d3_animate() {
 if(! GD3Plotter) return ; // import
 requestAnimationFrame( __d3_animate);
 GD3Plotter.render();
 GD3Plotter.update();
}
	

D3Plotter.prototype.interval = function () {
    		var xminmax =   [round100(this.xmin), [round100(this.xmax),null]] ;
    		xminmax = this.xminmax ?  ["x", xminmax] : ["x:auto", xminmax] ;
    		var yminmax =   [round100(this.ymin), [round100(this.ymax),null]] ;
    		yminmax = this.yminmax ?  ["y", yminmax] : ["y:auto", yminmax] ;
    		var zminmax =   [round100(this.zmin), [round100(this.zmax),null]] ;
    		zminmax = this.zminmax ?  ["z", zminmax] : ["z:auto", zminmax] ;

    		return [xminmax, [yminmax, [zminmax,null]]] ;
    		}

/*------------------
Small  (redef) utils
-----------------------*/
// input user (min max) list or short-cut +/- number
function __arg_min (aminmax) {
	if(typeof aminmax === "number") {
		if(aminmax >= 0) return 0;
		if(aminmax < 0)  return aminmax ;
		}
		else return aminmax[0]; 
}
function __arg_max (aminmax) {
	if(typeof aminmax === "number") {
		if(aminmax >= 0) return aminmax;
		if(aminmax < 0)  return -aminmax ;
		}
		else return aminmax[1][0]; 
}

/*--------------------------------
API
------------------------------------*/
var _d3_plot = function( fun, env) {
	if (fun) fun = checkProc(fun,2,2,"d3-plot");
	/* if(! GD3Plotter)  */GD3Plotter = new D3Plotter() ;
	GD3Plotter.init(fun,env); // scene , .. camera, .. material, .. segments, ...axis, ..
	//GD3Plotter.render();
	__d3_animate();
	return GD3Plotter.interval();
}

// load extras (only once)
var Detector = null;
function __d3_import_extras() {
	if(Detector) return;
	_import("/controls/Detector");
	_import("/controls/TrackballControls");
	_import("/controls/THREEx.FullScreen");
	_import("/controls/THREEx.WindowResize");
}

var _d3_version = function () {
	writeln("THREE.js:" + THREE.REVISION,"color:green");
	writeln("d3-plot.lib  1.4","color:green");
}

// reloadable sysfuns
function boot_plot_3d() {
	__d3_import_extras();
	define_sysfun (new Sysfun ("d3-version", _d3_version,0,0,[],true));
	define_sysfun (new Sysfun ("d3-plot-hide", _d3_plot_hide,0,0,[],true));
	define_sysfun (new Sysfun ("d3-plot-show", _d3_plot_show,0,0,[],true));
	
	define_sysfun (new Sysfun ("d3-plot", _d3_plot,1,1,[],true)); // (fun)
	_d3_version();
// _LIB["d3-plot"] = true; // import for tests
}

boot_plot_3d();

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
plot-3d.lib.js
© Simon Gallubert 2016
*/

_require("three.lib") ;

//  RELOAD
	if(typeof g3D !== "undefined" && g3D !== null) { g3D.dispose(); g3D = null; } // remove from DOM
	
/*----------------------
INTERPOL functions
from plot.lib
------------------------------*/
function _smoothstep(x) {
	if(x < 0) return - _smoothstep(-x);
    return x*x*(3 - 2*x);
}

function _s_curve (x , g) { // S-curve x in [0 1] --> [0 1] g = gamma 
	 if (x <= 0.5) return Math.pow (( 2 * x), g) / 2 ;
	 return 1 - _s_curve ((1-x) , g);
}

// [xmin ...x .. xmax] -> [ymin ... ymax]
function _lerp (x,xmin,xmax,ymin,ymax) {
	return ymin + (x - xmin) * (ymax - ymin) / (xmax - xmin) ;
	}
	
// [ 0   m  1] --> [ymin   M   ymax]  quadratic
function _qlerp ( x, m, ymin, M, ymax) {
	 ymax -= ymin ;
	 var a =  ((M-ymin) - m *  ymax ) / (m*m - m) ;
	 return x * (a * x + ymax - a) + ymin ;
	 }
	 
// [ 0   m  1] --> [ymin   M   ymax]  exponential
function _xlerp (x , m, ymin, M , ymax, K) {
	K = K || 10  ;
	x -= m ;
	if (x <= 0) return ymin + (M - ymin) * Math.exp (-x * x * K) ;
	return ymax + (M - ymax) *  Math.exp (-x * x * K) ;
}

// [ 0  0.5  1] ---> [lo  1   hi] // linear
function __mid_map (x,lo,hi) {
	if(x < 0.5) return map(x,0,0.5,lo,1);
	return map(x,0.5,1,1,hi);
}

//  [ a  m  b] --> [ 0(a) ...  M  @ (a+b)/2 ..  0(b)]
function __mid_angle (x , a , b , M) {
	var m = (a + b) * 0.5 ;
	var d =  2 / (b - a) ;
	if (x <= m) return M * (x -a) * d;
	return M -  M * ( x - m)  * d ;
}

// [ 0 xa xb 1] ---> [ 1 1(xa)  M(xa+xb/2)  1(xb)  1] // cubic
function __mid_cube (x , xa, xb,  M) {
	 M -= 1 ;
	 if( x <= xa || x >= xb ) return 1;
	 x  =  (x - xa) / (xb - xa) ;
	 
	 var a = -2 * M;
	 var b =  3 * M ;
	 if( x <= 0.5 ) x *= 2 ; else x = -2*x + 2 ;
	 return x * x * ( a * x + b) + 1 ;
}

// [ 0 xa xb 1] ---> [ 1 1(xa)  M(xa+xb/2)  1(xb)  1] // exponential
function __mid_exp (x , xa, xb, M, K) {
	K = K || 10  ;
	x -=  (xa + xb) / 2 ;
	return 1 + (M - 1) * Math.exp (-x * x * K) ;
	}
	
// [ 0  0.5  1] ---> [lo  1   hi]
function __mid_map_smooth(x,lo,hi) {
	x = _s_curve(x,0.4) ;
	return __mid_map(x,lo,hi);
}


// D O M & buttons
// Show   🎥  🔮 button
function _plot_3d_show() {
	__toggle_visibility(document.getElementById("plot3d"),"true") ;
	__toggle_visibility(document.getElementById("plot3dbuttons"),"true") ;
	__toggle_visibility(document.getElementById("plotwrapper"),"true") ;
	__toggle_visibility(document.getElementById("page"),"false") ;
	 if(g3D) {
	 		// must not be hidden to compute boundingBox
	 		// used by TrackBall controls. Hence :
	 		if(g3D.controls.handleResize) g3D.controls.handleResize();
	 		if(g3D.framing) return ;
	 		g3D.framing = true; 
	 		__3d_animate();
	 		} 
}
// Hide  ⚪️   🔮 button
function _plot_3d_hide( ){
	__toggle_visibility(document.getElementById("plot3d"),"false") ;
	__toggle_visibility(document.getElementById("plot3dbuttons"),"false") ;
	__toggle_visibility(document.getElementById("plotwrapper"),"false") ;
	__toggle_visibility(document.getElementById("page"),"true") ;
	// must scroll to stdin
	stdin.focus();
	if(g3D) { g3D.param.clock = false; g3D.framing = false; }
}

function _plot_3d_sliders_toggle() {
	__toggle_visibility(document.getElementById("plot3dsliders")) ;
}

// reset own rotation
// reset camera
// Button
function _plot_3d_align(){
	_plot_3d_rotate(0,0,0);
	g3D.param.clock = false ;
	g3D.setCamera();
	g3D.update();
}

// Buttons and API

function _plot_3d_rotate(x,y,z ){
	if(g3D.mesh) g3D.mesh.rotation.set(x,y,z) ;
	return [x,[y,[z,null]]] ;
}

function _plot_3d_clock(stop ){
	if(stop === undefined) g3D.param.clock = ! g3D.param.clock ; // from button
	else if(stop === _false) g3D.param.clock = false ;
	else   g3D.param.clock = true;
	return g3D.param.clock ;
}

/*---------------------
DOM sliders
--------------------------*/
function __3d_slider ( num) { // --> element
	var sliders = document.getElementById("plot3dsliders");
	sliders = sliders.getElementsByTagName('input');
	return sliders[num];
}
function __set_3d_slider(num,value) {
	var slider = __3d_slider(num);
	slider.value = '' + value;
}

function __3d_slider_value(num) {
	var slider = __3d_slider(num);
	return parseFloat(slider.value);
}

// slider EVENTS
// t parameter
function __set_slider_title(elem) {
	var val = parseFloat(elem.value);
	elem.title = elem.title.replace(/\[.*\]/,"[" + round100(val) + "]") ;
	}
	
function do3DTimeSlider(slider,num, time) { 
	 time = parseFloat(time);
	 time = map(time,0,1,g3D.tmin,g3D.tmax) ;
	 __set_slider_title(slider) ;
	 g3D.adjustGeometry(time) ; 
}

function do3DSlider(slider,num, value) { 
 	__set_slider_title(slider) ;
	 __3d_pipe_line() ; 
}

function do3DScaleSlider(slider,num, value) { 
	 __set_slider_title(slider) ;
	 __3d_scale_mesh() ; 
}
function do3DRotationSlider(slider,num, value) { 
	 __set_slider_title(slider) ;
	 __3d_rotate_mesh() ; 
}

function do3DSliderReset(mute) { // h,s,v slider "reset"
	__set_3d_slider(1,0); // hue rotate
	for(var i=2;i<=6;i++)
		__set_3d_slider(i,0.5) ; // gamma
	__set_3d_slider(7,0.0) ; // gray shader
	__set_3d_slider(8,0.0) ; // pixmap shader
	for(var i=9;i<=14;i++)
		__set_3d_slider(i,0.5) ; // X Y Z  a b c
	for(vari=1;i<=14;i++) __set_slider_title(__3d_slider(i)) ;
	if(! mute)  { __3d_pipe_line(); __3d_scale_mesh(); __3d_rotate_mesh();}
}

function __3d_pipe_line () {
	__3d_hsv_slider();
}



// returns a pixmap or null from p in [0,1]
function  __3d_pixmap (p) { 
if( p === 0) return null ;
	p = Math.pow (p, 0.15) ; // too slow at 1 ? NYI
	var slices = map (p, 0 , 1 ,255 , 1);
	var sdim  = 255 / slices ;
	var pixmap = [];
	for(var i = 0; i <= 255 ; i++) 
		pixmap[i] = Math.min (255 , Math.floor (Math.ceil( i / sdim) * sdim));
	return pixmap ;
}

function  __3d_scale_mesh () { 
	var x = __3d_slider_value(9); // hgamma
	var y = __3d_slider_value(10);
	var z = __3d_slider_value(11); 
	x= __mid_map_smooth(x,0.2,5); // [0  0.5 1] --> 0.2 ... 1 .. 5
	y= __mid_map_smooth(y,0.2,5);
	z= __mid_map_smooth(z,0.2,5);
	
	g3D.adjustScale(x,y,z);
}
function  __3d_rotate_mesh () { 
	var x = __3d_slider_value(12); //alpha
	var y = __3d_slider_value(13);
	var z = __3d_slider_value(14); 
	x= map(x,0,1,-Math.PI,Math.PI) ;
	y= map(y,0,1,-Math.PI,Math.PI) ;
	z= map(z,0,1,-Math.PI,Math.PI) ;
	
	g3D.adjustRotation(x,y,z);
}

// compute adjust hgamma, sgamma, vgamma , .. params from sliders values
function  __3d_hsv_slider () { 
	var hdisp = __3d_slider_value(1); // hue increment
	var gamma = __3d_slider_value(2); // gamma
	var h = __3d_slider_value(3); // hgamma
	var s = __3d_slider_value(4);
	var v = __3d_slider_value(5); 
	var contrast = __3d_slider_value(6); 
	var gray = __3d_slider_value(7); // ggamma
	var p = __3d_slider_value(8) ;
	var pixmap = __3d_pixmap (p) ; // colormap
	
	gamma = 1 - gamma ;
	gamma = __mid_map(gamma,0.2,4);
	h = __mid_map (h,0.8,1.2) ;
	s = 1-s ;
	v = 1-v;
	s = __mid_map(s,0.1,20);
	v = __mid_map(v,0.5,2);	
	contrast = __mid_map(contrast,0.5,2) ;
		
	if (gray > 0.03) 
		gray = map(gray,0,1,0.3,4);
		else gray = 0;
		
// console.log("adjust hsl gammas",h,s,v) ;
//	console.log("adjust hsl hdisp", hdisp, "Gamma", gamma , "Contrast", contrast, "gray", gray, "pixmap",p);
	
	g3D.adjustColors(h,s,v,hdisp,gamma,contrast,gray,pixmap);
}

// input THREE.color and change params
// out new THREE color
function __3d_adjust_hsl (color,hgamma,sgamma,vgamma, hdisp, gamma,contrast, graygamma,pixmap) {
       
       if(v === 0) return color;
       
        if(gamma !== 1) {
        color.setRGB (Math.pow(color.r,gamma) ,Math.pow(color.g,gamma), Math.pow(color.b,gamma) );
        } // here?
        
        var hsl = color.getHSL();
        var h = hsl.h, s = hsl.s , v = hsl.l ;

        h += hdisp ; // disp
        h *= hgamma ; // fine tune
        if(h > 1) h -= 1;
        if(h < -1) h += 1;
        s = Math.pow(s,sgamma);
        v = Math.pow(v,vgamma);
        
		if(pixmap) {
       			h = pixmap[Math.round(h*255)] / 255 ;
        		s = pixmap[Math.round(s*255)] / 255 ;
        		v = pixmap[Math.round(v*255)] / 255 ;
        		}
 
		color.setHSL(h,s,v);
		
		if(contrast !== 1) // clamp ??????
		color.setRGB (
			contrast * (color.r - 0.5) + 0.5 ,
			contrast * (color.g - 0.5) + 0.5 ,
			contrast * (color.b - 0.5) + 0.5 ) ;   
		
		 if(graygamma) {
        	var g = (color.r * 0.2126 + color.g * 0.7152 + color.b * 0.0722  );
        	g = Math.pow(g,graygamma);
        	color.setRGB (g,g,g);
        	}  
}

/*----------------------
g3D instanciate
---------------------------*/
var g3D = null;

function G3DPlotter (param) {		
// DOM
		// this.sliders = document.getElementById("3dsliders");
		this.parent = document.getElementById("plot3d");
		this.renderer = null ;  // DOM element
		this.framing = false ;  // requesting animation frames
		this.time = 0; // t parameter for functions f(...,t) in tmin..tmax
		this.frame = 0; // counter % 60
		this.clock = new THREE.Clock();
		
// ray casting
		this.raycaster = null ;
		this.mouse = new THREE.Vector2();
		
// fun's types
		this.env = glisp.user ;
		this.meshFunction = null ; // cache for color adjust
		
// THREE objects sets by init        this.scene= null;
        this.camera = null;
        this.lights = null ; // js array RFU
        this.controls = null; // track ball
        this.resize = null; // WindowResize {stop : stop function()}
        
        this.lines = null ; // Group object
        this.balls = null; // Group object
        this.cubes = null ; 
        
// Textures
		this.wireTexture = null ; // cache material option  = wireframe
		this.texture = null ;
		this.normalMap = null ;
        
// plot-fun results
        this.alphas =   null;  // angles indexed by vertex num (complex fun)
        this.mesh = null;  // graph Mesh
        
// computed or default
		this.tmin = 0; this.tmax = 1; // fun (..,t)
        this.xmin= -1; this.xmax= 1;
        this.ymin= -1; this.ymax= 1;
        this.zmin= -1; this.zmax= 1;
        this.dmax = 1;
        this.zscale = null ; // z-scaling method or number
        
//  user -3d-param - only set by user
		if(param) this.param = param ;
		else  this.defaults() ;
return this ;
}

/*-------------------
mouse events
-------------------------*/
function onMouseUp( event ) {

	// calculate mouse position in normalized device coordinates
	// (-1 to +1) for both components
	if(! g3D) return;
	g3D.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	g3D.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;		
	g3D.updateMouse();
// console.log("g3D.mouse",g3D.mouse);
} 

// needs camera
G3DPlotter.prototype.setMouse = function () {
	if (!this.param.mouse) { // remove handler if any NYI NYI
			this.raycaster = null ;
	}
	else {
		 this.raycaster = new THREE.Raycaster();
		 this.parent.addEventListener( 'mouseup', onMouseUp, false );
	}
}

G3DPlotter.prototype.updateMouse = function () {
	if(! this.raycaster) return ;
	// if(! this.mesh) return ;
	this.raycaster.setFromCamera( this.mouse, this.camera );	

	// calculate objects intersecting the picking ray
	var intersects = this.raycaster.intersectObjects( this.scene.children );

	for ( var i = 0; i < intersects.length; i++ ) {
		// intersects[ i ].object.material.color.set( 0xff0000 );
		console.log("RAYCASTER", intersects[i].point);
		break;
	}
}

/*---------------
default and init values
--------------------------*/
G3DPlotter.prototype.defaults = function () {
this.param = {} ;

		this.param.fundef = null ; // surface def or blob def or shape def
		this.param.funtype = null; // "funxy"|"funxyz"|"complex"|"param"|"blob"|"shape"
		
		this.param.background = 0x000000 ;
		this.param.camera_position = null; // (x,y,z) RFU
		this.param.controls = "track" ;
		this.param.mouse = false;
		this.param.view_angle = 50 ;
		
		this.param.segments = 80 ;
		this.param.axis = true ;
		this.param.xgrid = false; 
        this.param.ygrid = false; 
        this.param.zgrid = false; // z = 0 plane
        
        this.param.lines = null; // or [ [v1 v2] ..[vi vj] ..] (additive)
        this.param.line_color =  null ; 
        
        this.param.plane_x = null;
        this.param.plane_y = null;
        this.param.plane_z = null ;  // or displacement 
        this.param.plane_color = 0x666666 ; 
        this.param.plane_texture = "wood";
        this.param.plane_width = 0; // dmax * 8
        this.param.plane_repeat=1;
        
        this.param.ball_color = 0;
        this.param.ball_repeat = 1;
        this.param.ball_material = null;
        this.param.ball_texture = null;
        this.param.balls_rotate = false;
        this.param.balls_scale = false;
        
        this.param.cube_color = 0;
        this.param.cube_repeat = 1;
        this.param.cube_material = null;
        this.param.cube_texture = null;
        this.param.cubes_rotate = false;
        this.param.cubes_scale = false;
        
        this.param.xminmax = -10; //one  of  null, +3, -4 , js array (-5 66) 
        this.param.yminmax = null;
        this.param.zminmax = null;
        this.param.uminmax = 1;
        this.param.vminmax = 1;
        this.param.tminmax = 1;
        this.param.zscale = "auto" ; // "log", "norm", "auto" , null | number // normalize NYI 
        this.param.translate = null ; // [dx dy dz]
        // z-scale naming NYI
        
        this.param.xform = null; // transform function xform(x,y,z) -> x
        this.param.yform = null; //  yform(x,y,z) -> y
        this.param.zform = null; //  zform(x,y,z) -> z
        this.param.attractors = null; // attractors ( center K n  times)
        this.param.fzmin = null; // inline fun  to cut z (internal)
        this.param.fzmax = null;
        this.param.xtorsions = null ; 
        this.param.ytorsions = null ;
        this.param.ztorsions = null ; // array of [theta ,a ,b]
        this.param.zbumpers = null ;
        this.param.ybumpers = null ; 
        this.param.zbumpers = null ; // array of [M a,b[,K]] bumpers

        
        this.param.force_normal = false; // DBG
        this.param.material = "colored" ; // lambert,phong,colored,normal
        this.param.wireframe = false ;
        this.param.material_color = 0xbbbbbb ; // if lambert of phong
        this.param.shininess = 30; // phong
        this.param.opacity = 1.0 ; // => transparent = false
        this.param.specular_color = null ; // default is material_color * 0.5
        this.param.gradient = null; // [ colorfrom, colorto]  if colored  or wireframe
        
		this.param.texture = null ; // name
		this.param.texture_repeat = 1 ;
		this.param.texture_normals = false;
        
// z-coloring functions
        this.param.hgamma = 0.7 ;
        this.param.sgamma = 0.9 ;
        this.param.lgamma = 0.5 ;
        this.param.color_rgb = null ; // f(x,y,z) -> 0xaabbcc
        this.param.color_hsl = null ; // f(x,y,z) -> [h,s,l]
        
// lights
        this.param.ambient_color = 0x606060 ; 
        this.param.directional_color = 0x606060 ;
        this.param.spot_color = 0x606060 ;
        this.param.point_color = 0x606060 ;
        this.param.directional_lights = 0 ;
        this.param.spot_lights = 0 ;
        this.param.point_lights = 0 ;
        this.param.hemisphere_color = null ;
        
//      
        this.param.light_alpha = Math.PI/3; // angle rad of first light 
        this.param.light_distance = 0; // def : 10 * dmax
        this.param.light_theta = Math.PI/4; // z(light)
        
        this.param.shadow = false; // shadow variant - 0 = none // RFU
        
        this.param.clock = false; // auto rotate
        this.param.anim_rotate = 2; // speed
        this.param.anim_bounce = 0;
        this.param.anim_scale = 0;
}

// reset Three objects, always followed by dispose
G3DPlotter.prototype.reset = function () {
	if(this.scene === null) return ; // already done
	if(this.resize) this.resize.stop(); // window resize handler
	if(this.controls) this.controls.dispose(); // listeners
	if(this.mesh) {
	if(this.mesh.geometry) this.mesh.geometry.dispose();
	if(this.mesh.material) this.mesh.material.dispose();
	this.scene.remove(this.mesh) ;
	}

	// if(this.lines) map dispose all lines geometries NYI NYI
	// if(this.texturel) this.texture.dispose(); ?????
	// this.grids.dispose(); NYI
	// this.mesh.dispose () ; ???

console.log("Reset",this);
}

G3DPlotter.prototype.dispose = function () {
	this.reset();
	if(! this.parent.lastChild) console.log("**** dispose", this.parent,this.parent.lastChild) ;
	if (this.parent.lastChild) this.parent.removeChild (this.parent.lastChild);
	g3D = null; // only case
}

// input : geometry,material
G3DPlotter.prototype.addMesh = function (geometry,material) {
	this.mesh = new THREE.Mesh( geometry, material );
	this.mesh.doubleSided = true;
	// this.mesh.dynamic = true; // ???
	this.mesh.castShadow = this.param.shadow;
	this.scene.add(this.mesh);
}

// input xMax,yMax,zMax// make an API NYI NYI
G3DPlotter.prototype.setCamera = function (dmax) {
	var dmax =  this.dmax || this.xmax  || 10 ;
	this.camera.position.set( 2*dmax, 2*dmax, 4*dmax);
	// this.camera.updateProjectionMatrix(); // unnecessary - test me
	this.camera.up = new THREE.Vector3( 0, 0, 1 );
	this.camera.lookAt(this.scene.position);
	}

// Add camera and controls which need camera 
// input this.xMax
G3DPlotter.prototype.addCamera = function () {
	var camera,controls ;
	
	var SCREEN_WIDTH = window.innerWidth , SCREEN_HEIGHT = window.innerHeight ; 
	var VIEW_ANGLE =  this.param.view_angle || 50 ;
	var ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 2000;
	camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
	this.camera = camera;
	this.setCamera();
	this.scene.add(camera);
	
	if(this.param.controls === 'orbit') {
		if(this.controls) this.controls.dispose(); // listeners
		controls = new THREE.OrbitControls( camera, this.renderer.domElement );
				//controls.addEventListener( 'change', render ); // add this only if there is no animation loop (requestAnimationFrame)
				controls.enableDamping = true;
				controls.dampingFactor = 0.25;
				controls.enableZoom = true;
	}
	else if(this.param.controls === 'track') {
		if(this.controls) this.controls.dispose(); 
		controls = new THREE.TrackballControls( camera, this.renderer.domElement );
		controls.rotateSpeed = 5;
		controls.zoomSpeed = 1.2;
		controls.panSpeed = 1.3;
	}
	else __3d_param_error("controls") ;
	
	controls.target.set(0,0,0) ;
	this.controls = controls ;
	this.resize = THREEx.WindowResize(this.renderer, camera); // sets "on" event 
}

// input xMinmax, yMinMax
G3DPlotter.prototype.addYgrid = function (numsteps) {
		numsteps = numsteps || 10;
		var size = this.xmax - this.xmin ;
		var step = size / numsteps ;
		var gridHelper = new THREE.GridHelper( size, step ,"red", this.param.line_color || "blue" );
		gridHelper.setColors("red",this.param.line_color || "green");
		this.scene.add( gridHelper);	
}
G3DPlotter.prototype.addZgrid = function (numsteps) {
		numsteps = numsteps || 10;
		var size = this.xmax - this.xmin ;
		var step = size / numsteps ;
		var gridHelper = new THREE.GridHelper( size, step ,"red", this.param.line_color || "blue" );
		gridHelper.rotation.x = -Math.PI/2 ;
		gridHelper.setColors("red",this.param.line_color || "blue");
		this.scene.add( gridHelper);	
}
G3DPlotter.prototype.addXgrid = function (numsteps) {
		numsteps = numsteps || 10;
		var size = this.xmax - this.xmin ;
		var step = size / numsteps ;
		var gridHelper = new THREE.GridHelper( size, step ,"red",this.param.line_color || "blue" );
		gridHelper.rotation.z = -Math.PI/2 ;
		gridHelper.setColors("red",this.param.line_color || "yellow");
		this.scene.add( gridHelper);	
}

// http://stackoverflow.com/questions/16752075/quality-of-three-js-shadow-in-chrome-macos
// view-source:https://stemkoski.github.io/Three.js/Mouse-Click.html  (checkerboard plane)

// material.transparent= true
// material.opacity [0 1]

G3DPlotter.prototype.addPlanes = function () {
	var dmax = this.param.plane_width || this.dmax * 8 ;
	var dx = dmax/2, dy = dmax/2, dz = dmax/2 ;
	var texture = null ,material,plane,geometry ;
	if(this.param.plane_x === null 
			&& this.param.plane_y === null 
			&& this.param.plane_z === null) return;	
	if(dmax < 0)  { // centered	
			dmax = dmax * -2;
			dx = dy = dz = 0;
			}		
	
	if(this.param.plane_texture) {
		texture = this.getTexture(this.param.plane_texture,this.param.plane_repeat);
		}
		
	if(this.param.shadow)
		material = new THREE.MeshLambertMaterial( 
			{
			map : texture,
			color: this.param.plane_color || 0x666666,
			side: THREE.DoubleSide} ); 
	else  
		material = new THREE.MeshBasicMaterial( 
			{
			map : texture,
			color: this.param.plane_color || 0xdddddd, 
			side: THREE.DoubleSide} );
		
	if(this.param.plane_z !== null) {
		geometry = new THREE.PlaneGeometry(dmax,dmax, 10 , 10 );  // w/h Segments
		plane = new THREE.Mesh( geometry, material );
		plane.position.y = dy + this.param.plane_y; 
		plane.position.x = dx + this.param.plane_x; 
		plane.position.z = this.param.plane_z;
		plane.receiveShadow = this.param.shadow;
		this.scene.add( plane );
		}
		
	if(this.param.plane_y !== null) {
		geometry = new THREE.PlaneGeometry(dmax,dmax, 10 , 10 );  // w/h Segments
		plane = new THREE.Mesh( geometry, material );
		plane.rotation.x = -Math.PI/2 ;
		plane.position.x = dx + this.param.plane_x; 
		plane.position.z = dz + this.param.plane_z; 
		plane.position.y = this.param.plane_y;
		plane.receiveShadow = this.param.shadow;
		this.scene.add( plane );
		}
		
	if(this.param.plane_x !== null) {
		geometry = new THREE.PlaneGeometry(dmax,dmax, 10 , 10 );  // w/h Segments
		plane = new THREE.Mesh( geometry, material );
		plane.rotation.y = -Math.PI/2 ;
		plane.position.y = dy  + this.param.plane_y; 
		plane.position.z = dz + this.param.plane_z; 
		plane.position.x = this.param.plane_x;
		plane.receiveShadow = this.param.shadow;
		this.scene.add( plane );
		}
}

// input param.lines = [line1,line2,...]
// line_i = [v1,v2,...]
// set g3D.lines = Group of THREE.lines
G3DPlotter.prototype.addLines = function () {
	if(! this.param.lines) return ;
	var color, line , geometry, material ;
	var lines = this.param.lines ;
	
	this.param.line_color = this.param.line_color || 0x0000ff ;
	this.lines = new THREE.Group(); ;
	
	material = new THREE.LineBasicMaterial({
	color: this.param.line_color   
	});

// push this.lines (geometry, material) to dispose . NYI 
	for(var i=0; i < lines.length; i++) {
	geometry = new THREE.Geometry();
	geometry.vertices = lines[i] ;
	line = new THREE.Line( geometry, material );
	this.lines.add( line );
	}
	this.scene.add(this.lines);
}

/* --------------
input
param.balls := [ball, ball, ...]
ball := ( center, radius, [color||0])
	param.ball_material 
	param.ball_texture 
	param.ball_color = color (common)
	param.ball_repeat
----------------------------*/ 

G3DPlotter.prototype.addBalls = function () {
	if(! this.param.balls) return ;
	var color, ball , geometry, mesh, material, custom , position;
	var matname = this.param.ball_material || "normal" ;
	var repeat = this.param.ball_repeat || 1 ;
	var texture = this.param.ball_texture ? this.getTexture (this.param.ball_texture, repeat) : null;
	var segments = this.param.segments ;
	color = this.param.ball_color || "green" ;
	material = this.getMaterial(matname,texture,color);

	this.balls =  new THREE.Group(); 
	for(var i= 0; i< this.param.balls.length; i++) {
		ball = this.param.balls[i];
		position = ball[0];
		if(! Array.isArray(position)) position = [position,position,position];
		geometry =  new THREE.SphereGeometry( ball[1] ,segments,segments) ; // check defaults
		if(ball[2]) { // custom color
			custom = this.getMaterial(matname,texture,ball[2]);
			mesh = new THREE.Mesh( geometry,custom );
			}
		else
			mesh = new THREE.Mesh( geometry,material );
		mesh.position.x = position[0];
		mesh.position.y = position[1];
		mesh.position.z = position[2];
		this.balls.add(mesh) ;
	}
	this.scene.add(this.balls);
}

// cube := [ center dims [rotation] [color]]
G3DPlotter.prototype.addCubes = function () {
	if(! this.param.cubes) return ;
	var color, cube , geometry, mesh, material, custom, position ;
	var matname = this.param.cube_material  || "normal" ;
	var repeat = this.param.cube_repeat || 1 ;
	var texture = this.param.cube_texture ? this.getTexture (this.param.cube_texture,repeat) : null;
	var segments = this.param.segments ;
	
	var rotation,dims ;
	color = this.param.cube_color || "green" ;
	material = this.getMaterial(matname,texture,color,repeat);
	
	this.cubes =  new THREE.Group(); 
	for(var i= 0; i< this.param.cubes.length; i++) {
		cube = this.param.cubes[i];
		position = cube[0];
		if(! Array.isArray(position)) position = [position,position,position];
		dims = cube[1];
		if(! Array.isArray(dims)) dims = [dims,dims,dims];
		rotation = cube[2] ;
		geometry =  new THREE.BoxGeometry( dims[0],dims[1],dims[2], segments ,segments,segments) ; // check defaults
		if(cube[3]) { // custom color
			custom = this.getMaterial(matname,texture,cube[3],repeat);
			mesh = new THREE.Mesh( geometry,custom );
			}
		else
			mesh = new THREE.Mesh( geometry,material );
			
		mesh.position.x = position[0];
		mesh.position.y = position[1];
		mesh.position.z = position[2];
		if(rotation) {
				mesh.rotation.x = rotation[0];
				mesh.rotation.y = rotation[1];
				mesh.rotation.z = rotation[2];
			}
		this.cubes.add(mesh) ;
	}
	this.scene.add(this.cubes);
}


// return a Texture or null
G3DPlotter.prototype.getTexture = function(name,repeat) {
	repeat = repeat || this.param.texture_repeat || 1  ; 
	name = name || this.param.texture ;
	if(name === null) return (this.texture = null) ;
	var texture = new THREE.TextureLoader().load( "js/textures/" + name + ".jpg" );
	if(texture === null) {
					writeln("* unknown texture: " + name, "color:red");
					return  this.getTexture("stone-2"); 
					}
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set( repeat,repeat );
console.log("Texture",name);
	return texture ;
}

// sets this.texture (if any) , this.material
// http://threejs.org/docs/#Reference/Materials/MeshLambertMaterial
// https://stemkoski.github.io/Three.js/Color-Explorer.html
// return material

G3DPlotter.prototype.getMaterial = function (mat,texture,color) {
	mat = mat ||  this.param.material || 'normal' ;
	texture = texture || this.texture || null ; 
	color = color || this.param.material_color  || 0x00bbcc ;
	
	var material = null ;
	var specular = 	this.param.specular_color || 
			new THREE.Color(this.param.material_color).multiplyScalar(0.5).getHex() ;
	var shininess = this.param.shininess || 30;
	this.normalMap =
		(mat === "phong" && this.param.texture_normals) ? this.getTexture("waternormals") : null ;

	if(mat === 'normal') {
		material = new THREE.MeshNormalMaterial( 
			{
			 side : THREE.DoubleSide ,
			 wireframe : this.param.wireframe
			 } );
		}
		
	else if(mat === 'lambert') {
		material = new THREE.MeshLambertMaterial( 
			{ map : texture ,
			 side : THREE.DoubleSide ,
			 color: color } );
		}
		
	else if (mat === 'phong') {
		material = new THREE.MeshPhongMaterial( 
			{ 
			map : texture ,
			normalMap : this.normalMap , 
			side : THREE.DoubleSide , 
			color: color, 
			specular: specular, 
			shininess: shininess } );
		}
		
	else if (mat === 'colored' && ! this.param.wireframe ) { // z-colored
		material = new THREE.MeshBasicMaterial( 
			{  
			map : texture ,
			side : THREE.DoubleSide , 
			vertexColors: 	THREE.VertexColors } );
	}
	
	else if (mat === 'colored'  && this.param.wireframe) { // gray/lightgray or square.png
	
		if(this.wireTexture === null) {
		var wireTexture = new THREE.TextureLoader().load( 'js/textures/square.png' ); 
		wireTexture.wrapS = wireTexture.wrapT = THREE.RepeatWrapping; 
		wireTexture.repeat.set( this.param.segments,this.param.segments ); 
		this.wireTexture = wireTexture; // save to reuse 
		}
		
		material = new THREE.MeshBasicMaterial( 
			{ map: this.wireTexture, 
			vertexColors: THREE.VertexColors, 
			side:THREE.DoubleSide } );
		}
		
	else {
			__3d_param_error("material") ;
			return this.getMaterial('normal',null);
			}
			
// console.log("Colors:material,specular",color.toString(16),specular.toString(16));
	return material ;
}

var PI = Math.PI ;
var PI_2 = Math.PI/2 ;
var PI2 = PI*2;

var _3D_BLACK = new THREE.Color (0x000000) ;
var _3D_WHITE = new THREE.Color (0xffffff) ;

//// DISTANCES MAPS
// log scaling
function __3d_scale_log(z) {
	if (z > 1) return 1 + Math.log(z) ;
	else if (z < -1) return -1 - Math.log(-z) ;
	else return z ;
}

// scaling to [0..1]
function __3d_scale_norm (z,zmin,zrange) {
	return  (z - zmin) / zrange ;
}

//// COLORS MAPS
// z any
/*
function __3d_z_to_rgb (color,z,hgamma,sgamma,lgamma,gradient) {
	z = Math.atan(Math.abs(z)) / PI_2 ; // map z to [0,1]
	if(gradient) {
		color.copy(gradient[0]);
		color.lerp(gradient[1],z) ;
		}
	else
	color.setHSL(z*hgamma,sgamma,lgamma);
}
*/

// x in [-1..1]
function __3d_01_to_rgb (color,x,hgamma,sgamma,lgamma,gradient) {
		color.setHSL(Math.abs(x)*hgamma,sgamma,lgamma) ;
}

function __3d_01_to_gradient (color,x,gradient) {
		color.copy(gradient[1]); // zero value
		if( x >= 0) 
			color.lerp(gradient[2],x) ;
			else
			color.lerp(gradient[0],Math.abs(x)) ;
}

// theta in [-PI,PI] --> [ 1 .. 0  .. 1] hue
function __3d_theta_to_rgb (color,t,hgamma,sgamma,lgamma) {
    t = Math.abs(t) / Math.PI ;
	color.setHSL(t*hgamma,sgamma,lgamma) ;
}

function __3d_theta_to_gradient (color,t,gradient) {
    t  /=  Math.PI ;
	color.copy(gradient[1]); // zero value
		if( t >= 0) 
			color.lerp(gradient[2],t) ;
			else
			color.lerp(gradient[0],Math.abs(t)) ;
}

G3DPlotter.prototype.setTminmax = function () {
	if(this.param.tminmax === null) return;
	this.tmin = __arg_min(this.param.tminmax);
	this.tmax = __arg_max(this.param.tminmax);
console.log("setTminmax: xmin: ",this.tmin, "xmax: ",this.tmax );
	}

// inut user xminmax 
G3DPlotter.prototype.setXminmax = function () {
	if(this.param.xminmax === null) return;
	this.xmin = __arg_min(this.param.xminmax);
	this.xmax = __arg_max(this.param.xminmax);
console.log("setXminmax: xmin: ",this.xmin, "xmax: ",this.xmax );
	}
	
// default to xmin,xmax
G3DPlotter.prototype.setYminmax = function () {
	if(this.param.yminmax === null) {
		this.ymin = this.xmin;
		this.ymax = this.xmax;
console.log("setYminmax: ymin: ",this.ymin, "ymax: ",this.ymax );
		return;
		}
	this.ymin = __arg_min(this.param.yminmax);
	this.ymax = __arg_max(this.param.yminmax);
console.log("setYminmax: ymin: ",this.ymin, "ymax: ",this.ymax );
	}

// input : this.fun[z],xmin,max,ymin,max,segements
// sampling : segments*segments
// return [zmin,zmax]

G3DPlotter.prototype.setZminmax = function () {
	var z, zMin=0, zMax=-Infinity , zRange; // to compute
	var xMin = this.xmin, xMax = this.xmax,  xRange = xMax- xMin ; 
	var yMin = this.ymin, yMax = this.ymax , yRange = yMax - yMin;
	var xStep = xRange / this.param.segments ;
	var yStep = yRange / this.param.segments ;

	var env =  this.env;
	var call,callx, cally ;
	
	if(this.param.zminmax ) {
		zMin = __arg_min(this.param.zminmax);
		zMax = __arg_max(this.param.zminmax);
	}
	
	else if (this.param.fundef && this.param.funtype === "funxy") { // "auto" z 
		call = [this.param.fundef ,[null, [null, [0 ,null]]]] ; // t = 0
		callx = call[1];
		cally= call[1][1];
		
		for(var x = xMin; x <= xMax ; x += xStep) {
			callx[0]= x;
			for(var y=yMin; y<= yMax ; y += yStep) {
			cally[0]= y;
		
			z = __ffuncall(call,env);

			if(isNaN(z)) continue;
			if(z < zMin) zMin = z;
			if(z > zMax) zMax = z; 
			}}
			
		if(zMin > 0) zMin = 0; // dubious
		if(zMax > 1000000)   zMax = 1000000 ;
		if(zMin < -1000000)  zMin = -1000000 ;
	 }
	 
	 else { // default
	 	zMin = this.xmin;
	 	zMax = this.xmax;
	 }

	this.zmin = zMin;
	this.zmax = zMax;
	console.log("setZminmax: zmin: ",this.zmin, "zmax: ",this.zmax );
	
	if(this.param.funtype !== "funxy") return ; // no auto scale
	
	// compute scaling method : fun, cfun
	this.zscale = this.param.zscale || 1.0 ; // user choice
	
	if(this.param.zscale === "auto") {
		this.zscale = "none" ;
		zRange = this.zmax - this.zmin ;
		if(zRange > 10*xRange) this.zscale = "log" ;
		if(zRange < 0.1*xRange) this.zscale = "norm" ; // normalized z [-1,1]
	}

	console.log("param.zscale: ", this.param.zscale, "zscale: ", this.zscale);
	return;
}
    	
// input a three geometry shape : box ...
// input : segments
// returns geometry

G3DPlotter.prototype.setShape = function() {
var geometry, segments = this.param.segments, shape = this.param.fundef; // {type: x: ... }

	var center = __3d_val_convert(shape.center);
	if(! Array.isArray(center)) center= [center,center,center]; // allow 0
	var dx = center[0], dy = center[1] || 0 , dz = center[2] || 0 ;
	
	var abcd = __3d_val_convert(shape.dims);
	if( ! Array.isArray(abcd)) abcd = [abcd,abcd,abcd,0]; // allow #(radius) or radius
	var a = abcd[0] , b = abcd[1], c = abcd[2], d = abcd[3] ;

	if(shape.type === "box") {
		geometry =  new THREE.BoxGeometry (a,b,c , segments,segments,segments) ;
		this.dmax = Math.max (a,b,c) ;
	}
	
// SphereGeometry(radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength)
	else if(shape.type === "sphere") {
		geometry =  
		new THREE.SphereGeometry( a , segments, segments, 0, b || 2*Math.PI, 0, c || Math.PI)  ;
		this.dmax = a / 2 ;
	}
	
	else if(shape.type === "torus") {
		geometry =  
		new THREE.TorusGeometry ( a ,b,  segments, segments, c || 2 * Math.PI) ;
		this.dmax = a / 2 ;
	}
		
	else if(shape.type === "knot") {
		geometry =  
		new THREE.TorusKnotGeometry( a , b,  segments, segments, c || 2 , d || 3) ;
		this.dmax = a / 2 ;
	}
// CylinderGeometry(radiusTop, radiusBottom, height, radiusSegments, heightSegments, openEnded, thetaStart, thetaLength)
	else if(shape.type === "cylinder") {
		geometry =  
		new THREE.CylinderGeometry( a , b, c, segments, segments, d || false) ;
		//  geometry.rotateX(-Math.PI/2) ;
		this.dmax = c ;
	}
	
	else if(shape.type === "tetrahedron") { //: 4 faces
		geometry =  
		new THREE.TetrahedronGeometry( a , b) ; // a = radius b= detail : must be small
		this.dmax = a * 2 ;
	}
	
	else if(shape.type === "octahedron") { // 8 faces
		geometry =  
		new THREE.OctahedronGeometry( a , b) ; 
		this.dmax = a * 2 ;
	}
		
	else if(shape.type === "dodecahedron") { // 12
		geometry =  
		new THREE.DodecahedronGeometry( a , b) ; 
		this.dmax = a*2 ;
	}
	
	else if(shape.type === "icosahedron") { // 20
		geometry =  
		new THREE.IcosahedronGeometry( a , b) ;
		this.dmax = a*2 ;
	}


	geometry.translate (dx,dy,dz);
	geometry.dynamic = true; // may be not needed, try me
	return geometry ;
}

function __powneg (x , n) {
	return (x >= 0) ? Math.pow(x,n) : - Math.pow(-x,n) ;
	}

// transforms a geometry in place
// iff (transform true)
// x,y,zform : inline functions

G3DPlotter.prototype.xformGeometry = function (geometry,t) {
	var xform = this.param.xform;
	var yform = this.param.yform;
	var zform = this.param.zform;
	var vertices = geometry.vertices, point,x,y,z , times , n, center ;
	var box,amin,amax,DD, mu, bumper,bumpers,a,b,M, K, R;
	var torsion, torsions, theta, alpha, m, d ;
	t = t || 0 ;

	if(xform || yform || zform) {
	
	if(xform) xform = checkProc(xform,3,3,"3d-geometry:xform(x,y,z)");
	if(yform) yform = checkProc(yform,3,3,"3d-geometry:yform(x,y,z)");
	if(zform) zform = checkProc(zform,3,3,"3d-geometry:zform(x,y,z)");
	
	for(var i=0; i< vertices.length;i++) {
		point = geometry.vertices[ i ];
		x =point.x; y = point.y, z= point.z ;
		if(xform) point.x = xform(x,y,z);
		if(yform) point.y = yform(x,y,z);
		if(zform) point.z = zform(x,y,z);
		}
	} // xform
	
	// use t slider
	if(this.param.attractors) { 
	// attractor (center (Kx Ky Kz) (n || 2] [ times || 1])
	var attractor ;
	for(var a = 0; a < this.param.attractors.length;a++) {
		attractor = this.param.attractors[a] ;
		center = attractor[0];
		K = attractor[1] || 1 ; // [Kx,Ky,Kz]
		if( ! Array.isArray(K)) K = [K,K,K];
console.log("attractor K",K);
		n = attractor[2] || 2 ;
		times = attractor[3] || 1 ;
		
		var x0= center[0] , y0 = center[1], z0 = center[2];
		var d,dx,dy,dz ;
		var Kx = K[0], Ky = K[1], Kz = K[2];
	
	// t slider : K to K^2 or K to -(K^2)
		Kx = __powneg(Kx,1+t) ; Ky = __powneg(Ky,1+t) ; Kz = __powneg(Kz,1+t) ;

		for(var loop = 0 ; loop < times ; loop++)
		for(var i=0; i< vertices.length;i++) {
			point = geometry.vertices[ i ];
			x = point.x; y = point.y, z= point.z ;
			dx = x-x0; dy = y - y0; dz = z - z0;
			d = Math.pow(Math.abs(dx),n) +  Math.pow(Math.abs(dy),n) + Math.pow(Math.abs(dz),n)   ;
			if(d < 0.01) d = 0.01 ;
			point.x += dx * Kx / d ;
			point.y += dy * Ky / d ;
			point.z += dz * Kz / d ;
			}
	}} // attractors loop
	
	if(! geometry.boundingBox ) geometry.computeBoundingBox();
	box = geometry.boundingBox ;

	// torsions = [[theta a b] ...]
	// uses t slider : theta *= (1 + 2 *t) ; 
	
/*
// [ a  .. b] --> [0(a) .. M ((a+b)/2) ... 0(b)]
function __mid_angle (x , a , b , M) {
	var m = (a + b) * 0.5 ;
	var d =  2 / (b - a) ;
	if (x <= m) return M * (x -a) * d;
	return M -  M * ( x - m)  * d ;
}
*/
	
	if(this.param.ztorsions) {
		torsions = this.param.ztorsions ;
		amin = box.min.z; amax = box.max.z; DD  = amax - amin;
		
			for(var ib = 0; ib <torsions.length; ib++) {
			torsion = torsions[ib];
			if(! Array.isArray (torsion)) torsion = [torsion,0,1] ;
			
	   	    theta = torsion[0]; a = torsion[1] || 0 ; b = torsion[2] || 1 ;
	   	    m = (a+b) * 0.5 ;
	   	    d = 2 / (b - a);

			for(var i=0; i< vertices.length;i++) {
			point = geometry.vertices[ i ];
			
			x = point.x; y = point.y, z= point.z ;
			mu = (z - amin) / DD ;
			if(mu <= a) continue;
			if(mu >= b) continue;
			if(mu <= m) mu = (mu - a) * d; // --> [ 0(a)  1 (a+b)/2  0(b)]
				else 
				mu = 1 - (mu - m) * d ;
			
			mu = mu*mu*(3 - 2*mu); // smoothstep it
			
			alpha = Math.atan2(y,x);
			alpha += theta * mu;
			R = Math.sqrt(x*x + y*y) ;
			
			point.x = R * Math.cos(alpha);
			point.y = R * Math.sin(alpha);	
	}}} // torsion-z 
	
	if(this.param.xtorsions) {
		torsions = this.param.xtorsions ;
		amin = box.min.x; amax = box.max.x; DD  = amax - amin;
		
			for(var ib = 0; ib <torsions.length; ib++) {
			torsion = torsions[ib];
			if(! Array.isArray (torsion)) torsion = [torsion,0,1] ;
			
	   	    theta = torsion[0]; a = torsion[1] || 0 ; b = torsion[2] || 1 ;
	   	    m = (a+b) * 0.5 ;
	   	    d = 2 / (b - a);

			for(var i=0; i< vertices.length;i++) {
			point = geometry.vertices[ i ];
			
			x = point.x; y = point.y, z= point.z ;
			mu = (x - amin) / DD ;
			if(mu <= a) continue;
			if(mu >= b) continue;
			if(mu <= m) mu = (mu - a) * d; // --> [ 0(a)  1 (a+b)/2  0(b)]
				else 
				mu = 1 - (mu - m) * d ;
			
			mu = mu*mu*(3 - 2*mu); // smoothstep it
			
			alpha = Math.atan2(z,y);
			alpha += theta * mu;
			R = Math.sqrt(z*z + y*y) ;
			
			point.z = R * Math.cos(alpha);
			point.y = R * Math.sin(alpha);	
	}}} // torsion-x 
	
	if(this.param.ytorsions) {
		torsions = this.param.ytorsions ;
		amin = box.min.y; amax = box.max.y; DD  = amax - amin;
		
			for(var ib = 0; ib <torsions.length; ib++) {
			torsion = torsions[ib];
			if(! Array.isArray (torsion)) torsion = [torsion,0,1] ;
			
	   	    theta = torsion[0]; a = torsion[1] || 0 ; b = torsion[2] || 1 ;
	   	    m = (a+b) * 0.5 ;
	   	    d = 2 / (b - a);

			for(var i=0; i< vertices.length;i++) {
			point = geometry.vertices[ i ];
			
			x = point.x; y = point.y, z= point.z ;
			mu = (y - amin) / DD ;
			if(mu <= a) continue;
			if(mu >= b) continue;
			if(mu <= m) mu = (mu - a) * d; // --> [ 0(a)  1 (a+b)/2  0(b)]
				else 
				mu = 1 - (mu - m) * d ;
			
			mu = mu*mu*(3 - 2*mu); // smoothstep it
			
			alpha = Math.atan2(z,x);
			alpha += theta * mu;
			R = Math.sqrt(z*z + x*x) ;
			
			point.z = R * Math.cos(alpha);
			point.x = R * Math.sin(alpha);	
	}}} // torsion-y
	
	// bumper := [ M a b [K]] - cubic iff K == 0, else exponential
	// z bumper [z : 0 ...1] --> any (x,y) multiplier
	
	if(this.param.zbumpers) {
		bumpers = this.param.zbumpers ;
		amin = box.min.z; amax = box.max.z; DD = amax - amin ;
		
		for(var ib = 0; ib < bumpers.length; ib++) {
		bumper = bumpers[ib];
		if(! Array.isArray (bumper)) bumper = [bumper,0,1,0] ;
	    M = bumper[0]; a = bumper[1] || 0 ; b = bumper[2] || 1 ; K = bumper[3] || 0;
		
		for(var i=0; i< vertices.length;i++) {
			point = geometry.vertices[ i ];
			if (K) mu = __mid_exp ((point.z - amin) / DD ,a,b,M,K) ;
				else
				mu =  __mid_cube ((point.z - amin) / DD ,a,b,M) ;
			point.x *= mu;
			point.y *= mu;
	}}} // zbumpers loop
	
	if(this.param.xbumpers) {
		bumpers = this.param.xbumpers ;
		amin = box.min.x; amax = box.max.x; DD = amax - amin ;
		
		for(var ib = 0; ib < bumpers.length; ib++) {
		bumper = bumpers[ib];
		if(! Array.isArray (bumper)) bumper = [bumper,0,1,0] ;
	    M = bumper[0]; a = bumper[1] || 0 ; b = bumper[2] || 1 ; K = bumper[3] || 0;
		
		var DD = amax - amin, mu ;
		for(var i=0; i< vertices.length;i++) {
			point = geometry.vertices[ i ];
			if (K) mu = __mid_exp ((point.x - amin) / DD ,a,b,M,K) ;
				else
				mu =  __mid_cube ((point.x - amin) / DD ,a,b,M) ;
			point.z *= mu;
			point.y *= mu;
	}}} // zbumpers loop
	
	if(this.param.ybumpers) {
		bumpers = this.param.ybumpers ;
		amin = box.min.y; amax = box.max.y; DD = amax-amin ;
		
		for(var ib = 0; ib < bumpers.length; ib++) {
		bumper = bumpers[ib];
		if(! Array.isArray (bumper)) bumper = [bumper,0,1,0] ;
	    M = bumper[0]; a = bumper[1] || 0 ; b = bumper[2] || 1 ; K = bumper[3] || 0;
	
		for(var i=0; i< vertices.length;i++) {
			point = geometry.vertices[ i ];
			if (K) mu = __mid_exp ((point.y - amin) / DD ,a,b,M,K) ;
				   else
				   mu =  __mid_cube ((point.y - amin) / DD ,a,b,M) ;
			point.x *= mu;
			point.z *= mu;
	}}} // zbumpers loop
}



// input : xMin,..zMax , fun
// returns geometry
G3DPlotter.prototype.setGeometry = function () {
	var zMin = this.zmin, zMax = this.zmax ,zRange = zMax-zMin ;
	var xMin = this.xmin, xMax = this.xmax ,xRange = xMax-xMin ;
	var yMin = this.ymin, yMax = this.ymax ,yRange = yMax-yMin ;
	var time = this.tmin ;
	var env = this.env;
	var call , callx, cally, callz,callt ;
	var zscale = this.zscale ;
	var zscalenum = 0;
	var fzmax = this.param.fzmax ; // inline function
	var fzmin = this.param.fzmin;
	
	if(fzmin) fzmin = checkProc(fzmin,2,2,"3d-geometry:fzmin(x,y)");
	if(fzmax) fzmax = checkProc(fzmax,2,2,"3d-geometry:fzmax(x,y)");

	var meshFunction ;
	
		if(typeof zscale === "number")
			zscalenum = zscale || 1.0 ;
		else if (zscale === "log")
			 zscale = __3d_scale_log ;
		else if (zscale === "norm") 
			zscale = __3d_scale_norm ;
		else if (zscale === "none") zscale = false ;
	
		
	if (this.param.funtype === "funxy")  { // z = f(x,y,[t])

	call = [this.param.fundef ,[null, [null , [time, null]]]] ;
	callx = call[1];
	cally = call[1][1];
	callt = call[1][1][1];
	
	this.meshFunction = meshFunction = function(x, y, t, vertex) // best (u,v) in [0,1]
	{
	t = t || time ;
		callx[0] = x = xRange * x + xMin;
		cally[0] = y = yRange * y + yMin;
		callt[0] =   t ; 
//if(x === 0 && y === 0) console.log("** meshFunction",t);
		var z  = __ffuncall(call,env);
	
		if(fzmin) zMin = fzmin(x,y);
		if(fzmax) zMax = fzmax(x,y);
		if	(z < zMin) z = zMin;
			else if(z > zMax) z = zMax;
			
		if (zscalenum) z *= zscalenum ;
		else if (zscale) z = zscale(z,zMin,zRange);

		if ( isNaN(z)) { x = y = z = 0 ; }
			
		if (vertex) {
			vertex.set(x,y,z) ;
			}
		else
			return new THREE.Vector3(x, y, z);
	};}

	else if (this.param.funtype === "complex") { // f(cx) -> cz
		alphas = this.alphas = [] ; 
		if(zMin < 0) zMin = 0;
		
		var cx = new Complex(0,0) ;
		call = [this.param.fundef,[cx,[time,null]]] ;
		callt = call[1][1] ;
		
		this.meshFunction = meshFunction = function(x, y, t, vertex) // best (u,v) in [0,1]
		{
		t = t || time ;

			cx.a = x = xRange * x + xMin;
			cx.b = y = yRange * y + yMin;
			callt[0] =   t ; 
			var cz  = __ffuncall(call,env);

			alphas.push (Math.atan2(cz.b,cz.a)) ;   // remember alpha[vertex] [-PI,PI]
			z = Math.sqrt (cz.a*cz.a + cz.b*cz.b) ; // modulus
			
				if(fzmin) zMin = fzmin(x,y);
				if(fzmax) zMax = fzmax(x,y);
				if	(z < zMin) z = zMin;
					else if(z > zMax) z = zMax;

			if ( isNaN(z)) {x = y = z = 0} ;
			
			if (vertex) {
				vertex.set(x,y,z) ;
				}
			else
			return new THREE.Vector3(x, y, z);
	};}


	else if (this.param.funtype === "param") { // param
	var umin =  __arg_min(this.param.uminmax || 0);
	var umax =  __arg_max(this.param.uminmax || 1);
	var vmin =  __arg_min(this.param.vminmax || 0);
	var vmax =  __arg_max(this.param.vminmax || 1);
	var urange = umax-umin, vrange = vmax- vmin ;
	var calluv = [null,[null,[null,[time,null]]]] ;
	var callu = calluv[1], callv = calluv[1][1], callt = calluv[1][1][1] ;
	var funp = this.param.fundef;
	
	this.meshFunction =  meshFunction = function(u,v,t,vertex) 
	{
	t = t || time ;
	var x,y,z ;
//if(u === 0 && v === 0) console.log("** Param meshFunction",t) ;
		callu[0] = u * urange + umin;
		callv[0] = v * vrange + vmin;
		callt[0] =  t ; 
		calluv[0] =funp[0];  x = __ffuncall(calluv,env);
		calluv[0] =funp[1];  y = __ffuncall(calluv,env);
		calluv[0] =funp[2];  z = __ffuncall(calluv,env);
	
		if(fzmin) zMin = fzmin(x,y);
		if(fzmax) zMax = fzmax(x,y);
			if	(z < zMin) z = zMin;
				else if(z > zMax) z = zMax;
				
		if ( isNaN(z)) { x = y = z = 0 ;}
			
		if (vertex) { // re-use if adjust f(t)
				vertex.set(x,y,z) ;
				}
			else
			return new THREE.Vector3(x, y, z);
	};}
	

	var geometry = 
	new THREE.ParametricGeometry( meshFunction, this.param.segments, this.param.segments );
	
	if(this.param.force_normal) { // A TRY 
	console.log("Computing NORMALS");
	geometry.computeFaceNormals();
	geometry.computeVertexNormals(); 
	}
	
	var translate = this.param.translate ;
	if(translate)
		geometry.translate( translate[0], translate[1], translate[2]); // three.js r.72
		
	geometry.dynamic = true; // may be not needed, try me
// console.log("Geometry",geometry);
	return geometry;

}

// patch existing vertices using meshFunction ( ..., vertex)
// directly from time slider
G3DPlotter.prototype.adjustGeometry = function (t) {
	if(this.mesh === null) return;
	if(this.mesh.geometry === null) return;
	
	if(this.param.funtype === "blob" || this.param.funtype === "funxyz") 
			return this.adjustCubesGeometry(t);
	
	if(typeof this.meshFunction === "function") { // re-apply f(..t)
	var vertices = this.mesh.geometry.vertices;
	var u,v , func = this.meshFunction ;
	var slices = this.param.segments;
	var stacks = this.param.segments;
	// this.alphas= [] ; needed when we will re-compute colors = f(geometry)

	var iv = 0;
	for ( i = 0; i <= stacks; i ++ ) {
		v = i / stacks;
		for ( j = 0; j <= slices; j ++ ) {
			u = j / slices;
			func( u, v , t, vertices[iv++]); // patch
		}}
	this.mesh.geometry.computeBoundingBox() ; 
	} 
	else { // coming from shape -must recompute at t = 0
		var material = this.mesh.material ; // try to re-use
		this.mesh.geometry.dispose();
		this.scene.remove(this.mesh) ;

		var geometry = this.setShape();
		geometry.computeBoundingBox() ; // needed for colors
		this.setColors(geometry); 
		// var material = this.getMaterial() ;
		this.addMesh(geometry,material); // to scene
	}
	
	this.xformGeometry(this.mesh.geometry,t);
	this.mesh.geometry.verticesNeedUpdate = true;
}

// marching cubes
G3DPlotter.prototype.adjustCubesGeometry = function (t) {
	if(this.scene === null) return ; // already done
	if(this.mesh) {
		// if(this.resize) this.resize.stop(); // window resize handler
		// if(this.controls) this.controls.dispose(); // listeners
		if(this.mesh.geometry) this.mesh.geometry.dispose();
		if(this.mesh.material) this.mesh.material.dispose();
		this.scene.remove(this.mesh) ;
		}
	var geometry = this.setMarchingCubes(t) ; 
	this.setColors(geometry); 
	var material = this.getMaterial() ;
	this.addMesh(geometry,material); // to scene
}

//////////////////////////
// coloring effects : faces/vertices
// view-source:https://stemkoski.github.io/Three.js/Vertex-Colors.html
///////////////////////////

	
///////////////////////////////////////////////
// calculate vertex colors based on Z values  or alpha values //
///////////////////////////////////////////////
// input : boundingBox must be set
G3DPlotter.prototype.setColors = function (geometry) {

	if(this.param.material !== 'colored')  return;
	
	var z,zMin,zMax,zRange;
	zMin = geometry.boundingBox.min.z;
	zMax = geometry.boundingBox.max.z;
	zRange = zMax - zMin;
	var h0 = this.param.hgamma;
	var s0 = this.param.sgamma;
	var l0 = this.param.lgamma;
	var gradient = (this.param.gradient === null)  ? null : 
			[new THREE.Color(this.param.gradient[0]),
			new THREE.Color(this.param.gradient[1]),
			new THREE.Color(this.param.gradient[2])] ;

	var color, hsl ,point, face, numberOfSides, vertexIndex;
	// faces are indexed using characters
	var faceIndices = [ 'a', 'b', 'c'];
	
// first, assign colors to vertices as desired

	if(this.param.color_rgb)  {// must be inline function
	var color_proc = checkProc(this.param.color_rgb,3,3,"color-rgb") ;
			for ( var i = 0; i < geometry.vertices.length; i++ ) {
			point = geometry.vertices[ i ];
			color = new THREE.Color();
			color.setHex(color_proc(point.x,point.y,point.z)) ;
			geometry.colors[i] = color; // use this array for convenience
			}}
			
	else if(this.param.color_hsl) {  // must be inline function return [h,s,l] 
	var color_proc = checkProc(this.param.color_hsl,3,3,"color-hsl") ;
			for ( var i = 0; i < geometry.vertices.length; i++ ) {
			point = geometry.vertices[ i ];
			color = new THREE.Color(0);
			hsl = color_proc(point.x,point.y,point.z) ;
			color.setHSL(hsl[0],hsl[1],hsl[2]) ;
			geometry.colors[i] = color; // use this array for convenience
			}}

	else if(this.alphas && gradient)
		for ( var i = 0; i < geometry.vertices.length; i++ ) {
		color = new THREE.Color(0) ;
		__3d_theta_to_gradient(color,this.alphas[i],gradient); 
		geometry.colors[i] = color; // use this array for convenience
		}
		
	else if(this.alphas) 
			for ( var i = 0; i < geometry.vertices.length; i++ ) {
			color = new THREE.Color(0) ;
			__3d_theta_to_rgb(color,this.alphas[i],h0,s0,l0) ;
			geometry.colors[i] = color; 
			}
			
	else if(gradient) 
		for ( var i = 0; i < geometry.vertices.length; i++ ) {
			point = geometry.vertices[ i ];
			color = new THREE.Color(0) ;
		    z = point.z ;
			z = (z > 0) ? z/zMax : (z === 0) ? 0 : -z/zMin ; // -> [-1..1]
			 __3d_01_to_gradient(color,z, gradient); 
			 geometry.colors[i] = color; 
			}
	else 
			for ( var i = 0; i < geometry.vertices.length; i++ ) {
			point = geometry.vertices[ i ];
			color = new THREE.Color(0) ;
		    z = point.z ;
			z = (z > 0) ? z/zMax : (z === 0) ? 0 : -z/zMin ; // -> [-1..1]
			 __3d_01_to_rgb(color,z, h0,s0,l0); 
			 geometry.colors[i] = color; 
			}
			
	// not needed for phong or lambert
	// copy the colors as necessary to the face's vertexColors array.
	for ( var i = 0; i < geometry.faces.length; i++ ) 
	{
		face = geometry.faces[ i ];
		for( var j = 0; j < 3; j++ ) 
		{
			vertexIndex = face[ faceIndices[ j ] ];
			face.vertexColors[ j ] = geometry.colors[ vertexIndex ];
		}
	} // faces
// console.log("Colors");
} // set colors

// https://github.com/mrdoob/three.js/issues/1051 

G3DPlotter.prototype.adjustColors = function (hgamma,sgamma,vgamma,hdisp,gamma,contrast,gray,pixmap) {
if(this.mesh === null) return; 
	var geometry = this.mesh.geometry;
	var faceIndices = [ 'a', 'b', 'c'];
	var  material,color ;
	
	if(this.param.material === 'normal') return;
	
	if (this.param.material === "colored" ) {
	
		var zMin = geometry.boundingBox.min.z;
		var zMax = geometry.boundingBox.max.z;
		var zRange = zMax - zMin;
		var z,point;
		var h0 = this.param.hgamma;
		var s0 = this.param.sgamma;
		var l0 = this.param.lgamma;
		var gradient = (this.param.gradient === null)  ? null : 
				[new THREE.Color(this.param.gradient[0]),
				new THREE.Color(this.param.gradient[1]),
				new THREE.Color(this.param.gradient[2])] ;
				
	if(this.param.color_rgb){  // must be inline function
	var color_proc = checkProc(this.param.color_rgb,3,3,"color-rgb") ;

			for ( var i = 0; i < geometry.vertices.length; i++ ) {
			point = geometry.vertices[ i ];
			geometry.colors[i].setHex(color_proc(point.x,point.y,point.z)) ;
	__3d_adjust_hsl(geometry.colors[i],hgamma,sgamma,vgamma,hdisp,gamma,contrast,gray,pixmap);
			}}
			
	else if(this.param.color_hsl) {  // must be inline function return [h,s,l] 
	var color_proc = checkProc(this.param.color_hsl,3,3,"color-hsl") ;

			for ( var i = 0; i < geometry.vertices.length; i++ ) {
			point = geometry.vertices[ i ];
			hsl = color_proc (point.x,point.y,point.z) ;
			geometry.colors[i].setHSL(hsl[0],hsl[1],hsl[2]) ;
		__3d_adjust_hsl(geometry.colors[i],hgamma,sgamma,vgamma,hdisp,gamma,contrast,gray,pixmap);
			}}
				
	else if(this.alphas && gradient)
		for ( var i = 0; i < geometry.vertices.length; i++ ) {
	__3d_theta_to_gradient(geometry.colors[i],this.alphas[i],gradient); 
	__3d_adjust_hsl(geometry.colors[i],hgamma,sgamma,vgamma,hdisp,gamma,contrast,gray,pixmap);
		}
		
	else if(this.alphas) 
			for ( var i = 0; i < geometry.vertices.length; i++ ) {
		__3d_theta_to_rgb(geometry.colors[i],this.alphas[i],h0,s0,l0) ;
		__3d_adjust_hsl(geometry.colors[i],hgamma,sgamma,vgamma,hdisp,gamma,contrast,gray,pixmap);
			}
			
	else if(gradient) 
		for ( var i = 0; i < geometry.vertices.length; i++ ) {
			point = geometry.vertices[ i ];
		    z = point.z ;
			z = (z > 0) ? z/zMax : (z === 0) ? 0 : -z/zMin ; // -> [-1..1]
		__3d_01_to_gradient(geometry.colors[i],z, gradient); 
		__3d_adjust_hsl(geometry.colors[i],hgamma,sgamma,vgamma,hdisp,gamma,contrast,gray,pixmap);
			}
	else 
			for ( var i = 0; i < geometry.vertices.length; i++ ) {
			point = geometry.vertices[ i ];
		    z = point.z ;
			z = (z > 0) ? z/zMax : (z === 0) ? 0 : -z/zMin ; // -> [-1..1]
		__3d_01_to_rgb(geometry.colors[i],z, h0,s0,l0); 
		__3d_adjust_hsl(geometry.colors[i],hgamma,sgamma,vgamma,hdisp,gamma,contrast,gray,pixmap);
			}
				
		this.mesh.geometry.colorsNeedUpdate = true;
		return;
		} // colored
		
/*
	this.mesh.material.color.set(this.param.material.color);
	__3d_adjust_hsl(this.mesh.material.color,hgamma,sgamma,vgamma,hdisp,gamma,contrast,gray,pixmap); 
	this.mesh.material.needsUpdate = true; // TRY
	return ;
*/
	var specular ;
	var shininess = this.param.shininess || 30;
	
	color = new THREE.Color(this.param.material_color);
	__3d_adjust_hsl(color,hgamma,sgamma,vgamma,hdisp,gamma,contrast,gray,pixmap);
	color = color.getHex();
	
	specular = this.param.specular_color || 
			new THREE.Color(color).multiplyScalar(0.5).getHex() ;
	
// console.log("newcolor/specular",color.toString(16),specular.toString(16)) ;
	
	if(this.param.material === 'lambert') {
		material = new THREE.MeshLambertMaterial( 
			{ 
			 map : this.texture,
			 side : THREE.DoubleSide ,
			 color: color } );
		}
		
	else if (this.param.material === 'phong') {
		material = new THREE.MeshPhongMaterial( 
			{ 
			map : this.texture,
			normalMap : this.normalMap ,
			side : THREE.DoubleSide , 
			color: color, 
			specular: specular, 
			shininess: shininess } );
		}
	
	this.mesh.material = material;
	this.mesh.material.needsUpdate = true;
} 

// Just do mesh.scale.x = 2 or mesh.scale.set( 2, 1, 1 ).
G3DPlotter.prototype.adjustScale = function ( x,y,z) {
	if(this.mesh) this.mesh.scale.set (x,y,z);
	if(this.balls && this.param.balls_scale) this.balls.scale.set (x,y,z);
	if(this.cubes && this.param.cubes_scale) this.cubes.scale.set (x,y,z);
	if(this.lines) this.lines.scale.set (x,y,z);
}

G3DPlotter.prototype.adjustRotation = function ( x,y,z) {
	if(this.mesh) this.mesh.rotation.set (x,y,z);
	if(this.balls && this.param.balls_rotate) this.balls.rotation.set (x,y,z);
	if(this.cubes &&  this.param.cubes_rotate) this.cubes.rotation.set (x,y,z);
	if(this.lines) this.lines.rotation.set (x,y,z);
}

// target ?? undef
// https://github.com/mrdoob/three.js/blob/master/examples/webgl_lights_spotlight.html


G3DPlotter.prototype.addLights = function () {
	var dlight = this.param.light_distance || this.dmax*10 ; // light distance
	var alpha =  this.param.light_alpha ; // first source position (def PI/3)
	var light_theta = this.param.light_theta ; // angular light azimuth (def PI/4)

	var lights = [];
	var light,color;
	
	if(this.param.directional_lights + this.param.spot_lights === 0 &&
	   (this.param.material === "phong" || this.param.material === "lambert"))
	   		this.param.directional_lights = 1 ;
	
// build lights array
	for(var i = 0; i < this.param.directional_lights; i++)
		lights.push("directional");
	for(var i = 0; i < this.param.spot_lights; i++)
		lights.push("spot");
	for(var i = 0; i < this.param.point_lights; i++)
		lights.push("point");

	if(this.param.ambient_color) {
			light  = new THREE.AmbientLight(this.param.ambient_color);
			this.scene.add(light);
			}
			
	if(this.param.hemisphere_color) { // not in 3D-UI
			color = this.param.hemisphere_color ;
			light = new THREE.HemisphereLight( color[0] , color[1]  , 1 );
			this.scene.add(light);
			}
	
	// first one is x -axis
	for(var i=0; i< lights.length;i++) {
		
		if (lights[i] === "directional") {
			color = this.param.directional_color;
			light  = new THREE.DirectionalLight(color);
			light.castShadow = this.param.shadow ;
			light.shadow.mapSize.width = 1024 ;
			light.shadow.mapSize.height = 1024 ;
			}
			
		else if (lights[i] === "spot") { // decreasing / shades
			color = this.param.spot_color;
			light  = new THREE.SpotLight(color);
			light.castShadow = this.param.shadow ;
			light.shadow.mapSize.width = 1024 ;
			light.shadow.mapSize.height = 1024 ;
			}
					
		else if (lights[i] === "point")  { // all around no shade
			color = this.param.point_color;
			light.castShadow = this.param.shadow ;
			light  = new THREE.PointLight(color,1,0); // ?? 
			}
			
		else 
			__3d_param_error("lights") ;
			
		light.position.set(
				dlight * Math.cos(alpha),
				dlight * Math.sin(alpha),
				dlight * Math.sin(light_theta));
			this.scene.add(light);
console.log("Light",lights[i],light.position);
			
					
		// rotate spots && directional && point
		alpha += Math.PI/2 ;
		light_theta = - light_theta  ; // haut/bas/...
		}
}

// sets scene
// input : fun|cfun| ...
G3DPlotter.prototype.init = function () {
	var scene,camera,renderer,container,light, material, geometry ;
	var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
	
	// set a few default values in case nullified
	this.param.segments = this.param.segments || 100 ;
	this.param.xminmax =  this.param.xminmax || 10 ;
	this.param.material_color = this.param.material_color  || 0xbbbbbb;
	
	this.setTminmax(); 
	this.setXminmax();
	this.setYminmax();
	this.setZminmax(); // computed or user, and sets this.zscale
	this.interval() ; // sets dmax


console.log("g3D:dmax",this.dmax);

// SCENE
	this.scene = scene = new THREE.Scene();
	
// RENDERER (DOM)
// aspect ratio ?? circles are circles ..
	 if ( Detector.webgl )
		renderer = new THREE.WebGLRenderer( {antialias:true} );
	else
		 renderer = new THREE.CanvasRenderer(); 
		 
	// options are THREE.BasicShadowMap | THREE.PCFShadowMap | THREE.PCFSoftShadowMap
	renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
	renderer.setPixelRatio( window.devicePixelRatio ); // see three doc and test me
	renderer.setSize(SCREEN_WIDTH-8, SCREEN_HEIGHT-8); // -8 unuseful now ??? - check  me
	// BACKGROUND
	renderer.setClearColor( this.param.background , 1 ); // alpha=1
	if(this.param.shadow) renderer.shadowMap.enabled = true;

	container = this.parent ;
	container.appendChild( renderer.domElement );

	///// renderer.shadowMapType = THREE.PCFSoftShadowMap;
	this.renderer = renderer;
		
	// load user texture
	this.texture = this.getTexture();
	
	// mesh = a function
	if(this.param.fundef) {
	// Curve mesh
	if(this.param.funtype === "blob" || this.param.funtype === "funxyz") 
					geometry = this.setMarchingCubes() ; 
			else if(this.param.funtype === "shape")
					geometry = this.setShape();
			else 	geometry = this.setGeometry(); 
	 
    geometry.computeBoundingBox() ;
	this.setColors(geometry); // material = colored or wire
	this.xformGeometry(geometry); 
	
	material = this.getMaterial() ; // uses this.texture
	this.addMesh(geometry,material); // to scene
	}
	
	
	// LIGHT - use dmax
	this.addLights() ;

	this.addPlanes();
	
	if(this.param.axis) {
			scene.add( new THREE.AxisHelper(this.dmax*1.2)); 
			}
			
	if(this.param.zgrid) {
			this.addZgrid();
			}
	if(this.param.ygrid) {
			this.addYgrid();
			}
	if(this.param.xgrid) {
			this.addXgrid();
			}
			
	if(this.param.lines) { // user lines 
			this.addLines();
			}
			
	if(this.param.balls) { // user has balls
			this.addBalls();
			}
			
	if(this.param.cubes) { // user has cubes
			this.addCubes();
			}
	
	// CAMERA (needs zmin,zmax) & MOUSE & RESIZE events handlers
	this.addCamera(); // and controls.  f(dmax) - theta = 45 ° -
	
	// EVENTS
	// THREEx.FullScreen.bindKey({ charCode : 'f'.charCodeAt(0) }); // may have elem as param
	// _plot_3d_show(); // DOM
	// TRY
	
	// MOUSE
	this.setMouse() ;
	setTimeout(_plot_3d_show,100) ; // TRY
}

G3DPlotter.prototype.render = function () {
	if(this.scene === null) return ;	
	this.update();
	this.renderer.render( this.scene, this.camera );
}

function __3d_bump_rotation(obj, rotation) {
	if(! obj) return ;
	obj.rotation.x += rotation[0];
	obj.rotation.y += rotation[1];
	obj.rotation.z += rotation[2];
}

G3DPlotter.prototype.update = function () {
	if(! this.controls) return;
	var delta = this.clock.getDelta();
	this.controls.update(delta);
	// stats.update();
	if(! this.param.clock) return ;
	var speed = this.param.anim_rotate;
	var rotation = [0.002*speed,0.003*speed,0.004*speed] ;
	
	__3d_bump_rotation(this.mesh,rotation) ;
	if(this.param.balls_rotate) __3d_bump_rotation(this.balls,rotation) ;
	if(this.param.cubes_rotate) __3d_bump_rotation(this.cubes,rotation) ;
	__3d_bump_rotation(this.lines,rotation) ;
	
	if( this.mesh) {
	// speed = 1 : 1 second cycle , 0.5 : 2 seconds cycle ...
	if(this.param.anim_bounce) {
		speed= this.param.anim_bounce * this.frame * Math.PI / 30 ;
		this.mesh.position.x = this.dmax/5 * Math.sin (speed );
		this.mesh.position.y = this.dmax/7 * Math.sin ( speed );
		}
		
	if (this.param.anim_scale) {
		speed = this.param.anim_scale * this.frame * Math.PI / 30 ;
		this.mesh.scale.set (
			1 + Math.sin  (speed) / 5,
			1 + Math.sin  (speed) / 5,
			1 + Math.sin  (speed ) / 5) ;
		}} // mesh
		
	this.frame = this.frame + 1;
	this.frame = this.frame % 60;
}

// sets this.dmax
G3DPlotter.prototype.interval = function () {
var xminmax,yminmax,zminmax ;
var xmin,xmax,ymin,ymax,zmin,zmax;
		if(this.mesh && this.mesh.geometry.boundingBox) {
		var box = this.mesh.geometry.boundingBox ;
		xmin = box.min.x; xmax = box.max.x;
		ymin = box.min.y; ymax = box.max.y;
		zmin = box.min.z; zmax = box.max.z;
		}
		else {
		xmin = this.xmin; xmax = this.xmax;
		ymin = this.ymin; ymax = this.ymax;
		zmin = this.zmin; zmax = this.zmax;
		}
		
	// DMAX to set camera
	this.dmax = 	
			Math.max(Math.abs(xmin),Math.abs(xmax),
			Math.abs(ymin),Math.abs(ymax),
			Math.abs(zmin),Math.abs(zmax));
		
    	xminmax =   [round100(xmin), [round100(xmax),null]] ;
    	yminmax =   [round100(ymin), [round100(ymax),null]] ;
    	zminmax =   [round100(zmin), [round100(zmax),null]] ;

    	return [xminmax, [yminmax, [zminmax,null]]] ;
    }

/*------------------
Small  (redef) utils
-----------------------*/
// input user  js array (min max) list or short-cut +/- number
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
		else return aminmax[1]; 
}

/////////////////
// params handling
/////////////////////
var _3D_FUN_PARAMS = ["color_hsl","color_rgb","fzmin","fzmax","xform","yform","zform"] ;

/*--------------------------
params
--------------------------------*/
function __3d_param_error(name) {
			writeln("* unknown param value " + name + " : " + 
			glisp_message(g3D.param[name],""),"color:lightbrown") ;
}
function __3d_param(name) {
			writeln(name + " : " + glisp_message(g3D.param[name],""),"color:green") ;
}


function __3d_val_convert (val) {
// convert val
			if(typeof val === "number") { }
			else if (typeof val === "string" && (!isNaN(val)))  val = parseFloat(val) ;
			else 
			if (val === _false || val === "false" || val === false || val === "#f") val = false ;
			else if (val === _true || val === "true" || val === true || val === "#t" ) val = true;
			else if (val === null) { }
			else if (val instanceof Vector) {
					val = val.vector ;
					__jsmaparray(__3d_val_convert,val) ;
					}
			else if ( Array.isArray (val)) {
					val = __list_to_array(val);
					__jsmaparray(__3d_val_convert,val) ;
				} 
			else val = nameToString(val,"scene-3d") ;
	return (val === "none") ?  null : val ;
}

// input : params : lisp list
// param : object with slots to patch

function __set_param (params, /* into */param, sender) {
sender = sender || "set-3d-param" ;
var val , uval,  uname , jname ,hit ;

	while (params) {
		uname = nameToString(params[0],sender);
		params = params[1] ; if(params === null) break;
		// val = __eval(params[0],env);
		uval = val = params[0] ;
		val = __3d_val_convert(val);
		params = params[1];
		
		hit = false;
		jname = uname.replace("-","_");
		
		for(var name in param) {
			if(jname === name && param.hasOwnProperty(name)) {
			if(_3D_FUN_PARAMS.indexOf(name) >= 0) val = new Symbol(val) ; // convert to fun names
					param[name] = val ;
					// console.log("set param",name,val);
					hit = true;
					break ;
					}}
		if(!hit) writeln("* unknown param: " + uname, "color:lightbrown") ;
		//  if(hit)  writeln( name + " ⟵ " + glisp_message(uval,"")) ; // DBG
	} // params
}



// UI params/values selector

function __3d_ui_select_param () {
var param = document.getElementById("select-3d-param").value;
	param = param.replace("-","_") ;
	value = g3D.param[param] || "" ;
	
// transate param value to UI
	if(param.indexOf("color") >= 0 && typeof value === "number") value = "0x" + value.toString(16);
	if(value === null) value = "null" ;
	
	 document.getElementById("select-3d-value").value = value ;
}

function __3d_ui_select_value () { // on change
var elemparam = document.getElementById("select-3d-param");
var param = elemparam.value;
var value = document.getElementById("select-3d-value").value;
	if(elemparam.selectedIndex <= 0) return ;
	if(value === "" ) return ;
	// save index for next show
	g3D.param.selectedIndex = elemparam.selectedIndex; 
	
	param = param.replace("-","_") ;
// translate UI string to param value
	if(value.indexOf("0x") === 0) value = parseInt(value);
	value = __3d_val_convert(value);
	console.log("UI",param,value) ;
	if(g3D.param[param] === value) return ;
	
	g3D.param[param]= value ;
	var camera = g3D.camera.clone() ;
	g3D = __plot_3d_new();

	__3d_plot_start(camera) ;
}
	

/*--------------------------------
API Helpers
Creates g3D on demand
------------------------------------*/
function __3d_plot_start(camera) {
	document.getElementById("select-3d-param").selectedIndex = g3D.param.selectedIndex || "0" ;
	__3d_ui_select_param();
	
	
	g3D.init(); // time out show 100  and show !!
	
	__cells_update_buttons() ;
	// __set_3d_slider(0,0) ; // t slider
	g3D.framing = true;
	setTimeout(__3d_animate, 2);
}

function __3d_animate() {
	if(g3D === null) return;
	if(g3D.scene === null) return ;
	if(glisp.error) return ;
	if(!g3D.framing) return;
 	requestAnimationFrame( __3d_animate);
	g3D.render();
}

function __plot_3d_new() {
	if(g3D == null) return new G3DPlotter() ;
	var param  = g3D.param ;
	g3D.dispose(); // remove from DOM
	return new G3DPlotter (param);
	}
	
////////////
// API
///////////////////////////
	
// ( scene-3d name val ... .. ...) inti g3D.param
var _scene_3d_reset = function () {
	if(g3D) g3D.defaults() ; 
	return __void;
}

var _scene_3d = function (self,env) {
var  params = self[1];
	if(g3D === null) g3D = new G3DPlotter();
	if(params === null) {
			return _prop_val_to_list(g3D.param) ;
		}
	__set_param (params, g3D.param) ;
	// integer parms checking
	g3D.param.segments = Math.floor(g3D.param.segments);
	return __void ;
}
var _plot_3d_bounding_box = function () {
	if(g3D.mesh && g3D.mesh.geometry) g3D.mesh.geometry.computeBoundingBox();
	return g3D.interval();
	}
	
	
var _plot_3d = function( funxy, env) {
	if (funxy) funxy = checkProc(funxy,2,3,"plot-3d");
	g3D = __plot_3d_new();
	g3D.param.fundef = funxy ; // may be null
	g3D.param.funtype = "funxy";
	__3d_plot_start() ;
	return g3D.interval();
}

var _plot_3d_param = function ( funx,funy,funz, env) {
	funx = checkProc(funx,2,3,"plot-3d-param");
	funy = checkProc(funy,2,3,"plot-3d-param");
	funz = checkProc(funz,2,3,"plot-3d-param");
	g3D = __plot_3d_new();
	g3D.param.fundef = [funx,funy,funz];
	g3D.param.funtype = "param";
	__3d_plot_start() ;
	return g3D.interval();
}

// f(cx [,t])
var _cplot_3d = function( cfun, env) {
	cfun = checkProc(cfun,1,2,"cplot-3d");
	g3D = __plot_3d_new();
	g3D.param.fundef = cfun ; // may be null
	g3D.param.funtype = "complex";

	__3d_plot_start() ;
	return g3D.interval();
}

var _plot_3d_xyz = function(funxyz, env) {
	funxyz = checkProc(funxyz,3,4,"plot-3d-xyz");
	g3D = __plot_3d_new();
	g3D.param.fundef = funxyz ; // may be null
	g3D.param.funtype = "funxyz";
	__3d_plot_start() ;
	return g3D.interval();
}

// (plot-3d-blobs U blob blob ...)
// blob := ( radius R center (x y z) abc ( a b c) shape n)
// into funxyz = [ U [ x y z r a b c n] ....]

var _plot_3d_blob = function(blobs, env) {
	var  blob, oblob ;
	var blobdefs = [ blobs[0]]; // isolevel
	blobs = blobs[1] ;
	
	while (blobs) {
	blob = blobs[0];
	oblob = { radius : 1 , center : [0,0,0] , abc : [1,1,1] , shape : 2 };
	__set_param(blob,oblob,"blob-def");
	blobdefs.push( [oblob.center[0],oblob.center[1],oblob.center[2],
					oblob.radius,
					oblob.abc[0],oblob.abc[1],oblob.abc[2],
					oblob.shape]) ;
	blobs = blobs[1];
	}

console.log("blobdefs", blobdefs);

	g3D = __plot_3d_new();
	g3D.param.fundef = blobdefs ;
	g3D.param.funtype = "blob" ;
	
	__3d_plot_start() ;
	return g3D.interval();
}

// shapes common
function __plot_3d_shape (type, center,dims) {
	g3D = __plot_3d_new();
	g3D.param.fundef = {type: type, center : center , dims : dims} ;
	g3D.param.funtype = "shape" ;
	__3d_plot_start() ;
	return g3D.interval();
}

var _plot_3d_box = function (center , dims /* w h d */) {
	return __plot_3d_shape("box",center,dims);
}

var _plot_3d_sphere = function (center , dims /*r,phi,theta */) {
	return __plot_3d_shape("sphere",center,dims);
}

var _plot_3d_torus = function (center , dims /* r ,tube,arc */) {
	return __plot_3d_shape("torus",center,dims);
}

var _plot_3d_knot = function (center, dims /*r,tube,p,q */) {
	return __plot_3d_shape("knot",center,dims);
}

// cone : r = 0
var _plot_3d_cylinder = function (center, dims /* R r h open */) {
	return __plot_3d_shape("cylinder",center,dims);
}

var _plot_3d_tetrahedron = function (center, dims /* R detail | 0  */) {
	return __plot_3d_shape("tetrahedron",center,dims);
}
var _plot_3d_octahedron = function (center, dims /* R detail | 0  */) {
	return __plot_3d_shape("octahedron",center,dims);
}
var _plot_3d_dodecahedron = function (center, dims /* R detail | 0  */) {
	return __plot_3d_shape("dodecahedron",center,dims);
}
var _plot_3d_icosahedron = function (center, dims /* R detail | 0  */) {
	return __plot_3d_shape("icosahedron",center,dims);
}




// (scene-3d lines null) : reset all
// line = ( v1 .. vn)
// lines = (line line ...)

var _scene_3d_lines = function(lines) {
	function array_to_vector3 (a3) {
		var v3 = new THREE.Vector3();
		v3.fromArray(a3);
		return v3 ;
	}
	// check list NYI
	
	if(notIsList(lines)) glisp_error(20,lines,"scene-3D-lines");
	lines = __3d_val_convert (lines);
	
	for(var i=0; i<lines.length;i++) 
		__jsmaparray(array_to_vector3,lines[i]) ;
	
	if(g3D === null) g3D = new G3DPlotter();
	g3D.param.lines = lines ;
	return _true;
}

// set balls
// ball := ( center  radius [color])
var _scene_3d_balls = function(balls) {
	if(notIsList(balls)) glisp_error(20,line,"scene-3D-balls");
	balls = __3d_val_convert (balls);
	
	if(g3D === null) g3D = new G3DPlotter();
	g3D.param.balls = balls ;
	return _true;
}

// add cube made of lines 
// cube := (#( center) #(dims) color)
var _scene_3d_cubes = function(cubes) {
	if(notIsList(cubes)) glisp_error(20,line,"scene-3D-cubes");
	cubes = __3d_val_convert (cubes);
	
	if(g3D === null) g3D = new G3DPlotter();
	g3D.param.cubes = cubes ;
	return _true;
}

/*------------------
LOADER
------------------------*/

// load extras (only once)
function __3d_import_extras() {
	_import("MarchingCubes");
	if(_LIB["plot-3D-extras"]) return;
	_import("/controls/Detector");
	_import("/controls/TrackballControls");
	_import("/controls/OrbitControls");
	// _import("/controls/THREEx.FullScreen"); // out - YES
	_import("/controls/THREEx.WindowResize"); // patched to reserve 40px
	_LIB["plot-3D-extras"] = true;
}

var _plot_3d_version = function () {
	writeln("THREE.js:" + THREE.REVISION,"color:green");
	writeln("plot-3d.lib  1.5","color:green");
}

// reloadable sysfuns
function boot_plot_3d() {
	__3d_import_extras();
	
// INTERPOL 
	define_sysfun (new Sysfun ("lerp", _lerp ,5,5,[],true));
	define_sysfun (new Sysfun ("xlerp", _xlerp ,6,6,[],true));
	define_sysfun (new Sysfun ("qlerp", _qlerp ,5,5,[],true));
	
// SCENE
	define_special (new Sysfun ("scene-3d", _scene_3d ,0,undefined,[],true));
	define_sysfun (new Sysfun ("scene-3d-reset", _scene_3d_reset,0,0,[],true));
	
	define_sysfun (new Sysfun ("plot-3d-version", _plot_3d_version,0,0,[],true));
	define_sysfun (new Sysfun ("plot-3d-hide", _plot_3d_hide,0,0,[],true));
	define_sysfun (new Sysfun ("plot-3d-show", _plot_3d_show,0,0,[],true));
	define_sysfun (new Sysfun ("plot-3d-bounding-box", _plot_3d_bounding_box,0,0,[],true)); // get bounnding box
	
// surfaces
	define_sysfun (new Sysfun ("plot-3d", _plot_3d,1,1,[],true)); // (z = fun(x,y))
	define_sysfun (new Sysfun ("cplot-3d", _cplot_3d,1,1,[],true)); // (cz = fun(cx))
	define_sysfun (new Sysfun ("plot-3d-xyz", _plot_3d_xyz,1,1,[],true)); // (fun-xyz = 0)
	define_sysfun (new Sysfun ("plot-3d-blob", _plot_3d_blob,1,1,[],true));  // revoir blobdef !!!!
	define_sysfun (new Sysfun ("plot-3d-param", _plot_3d_param,3,3,[],true));
	
// THREE geometries
	define_sysfun (new Sysfun ("plot-3d-box", _plot_3d_box,2,2,[],true)); // ((x y z) (a b c))
	define_sysfun (new Sysfun ("plot-3d-sphere", _plot_3d_sphere,2,2,[],true)); // (x y z) (R arc arc)
	define_sysfun (new Sysfun ("plot-3d-torus", _plot_3d_torus,2,2,[],true)); // (x y z) (R  r arc)
	define_sysfun (new Sysfun ("plot-3d-knot", _plot_3d_knot,2,2,[],true)); // (x y z) (R r p q)
	define_sysfun (new Sysfun ("plot-3d-cylinder", _plot_3d_cylinder,2,2,[],true)); // (x y z) (R r h open)
	
	define_sysfun (new Sysfun ("plot-3d-tetrahedron", _plot_3d_tetrahedron,2,2,[],true));
	define_sysfun (new Sysfun ("plot-3d-octahedron", _plot_3d_octahedron,2,2,[],true));
	define_sysfun (new Sysfun ("plot-3d-dodecahedron", _plot_3d_dodecahedron,2,2,[],true));
	define_sysfun (new Sysfun ("plot-3d-icosahedron", _plot_3d_icosahedron,2,2,[],true));
	
// things  to add to scene
	define_sysfun (new Sysfun ("scene-3d-lines", _scene_3d_lines,1,1,[],true)); 
	define_sysfun (new Sysfun ("scene-3d-balls", _scene_3d_balls,1,1,[],true));
	//  (x0 y0 z0) (a b c) [rot [color]]
	define_sysfun (new Sysfun ("scene-3d-cubes", _scene_3d_cubes,1,1,[],true)); // #(x y z) #(a b c)
	
	_plot_3d_version();
	if (_PRODUCTION) _LIB["plot-3d.lib"] = true; // (import 'plot-3d.lib)
	
}

boot_plot_3d();


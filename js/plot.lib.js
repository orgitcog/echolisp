/*
plotting
 https://hacks.mozilla.org/2011/12/faster-canvas-pixel-manipulation-with-typed-arrays/
 http://www.mathcurve.com/courbes2d/courbes2d.shtml
 plot V2 : (xy->d x y n)
           (fminmax f range)
*/
// adjust hsv = f(sliders)
// (define ( f x y) (rgba-abs (atan x) (atan y) 0 (+ (sin x)(sin y))))

var _ZOOMING = false;
var GPlotters = { };  // plotters dict // re-init me NYI  NYI NYI
var GPlotter = null ; // current plotter


/*-------------
DOM for Graph
graph -> sons =  div:hsliders , div:sliders , canvas
--------------------------*/
 // __cell_graph(cell)

function __graph_slider (graph , num) {
	var sliders = get_Child(graph,"sliders") ;
	sliders = sliders.getElementsByTagName('input');
	return sliders[num];
}

function __slider_graph(slider) { // graph elem
	return slider.parentNode.parentNode ;
}

function __slider_plotter(slider) {
	var cell = slider.parentNode.parentNode.parentNode;
	var name = cell.dataset.plotter ;
	if(! name || ! GPlotters[name]) glisp_error(1,"no plotter","__slider_plotter");
	return GPlotters[name];
	}
	

var _plot_clear = function () {
    GPlotter.canvas.width = GPlotter.canvas.width ;
    GPlotter.imgData = []; // clear undo stack
    GPlotter.imgSave = null;
    return _true;
}

/*----------------------
GPlotter instanciate
---------------------------*/

// NYI : check isFunction (fun) -> system|lambda|symb.fval|formal.fval
// NYI doc: color must be a string

function Plotter (cell) {
		var model = document.getElementById('graph0'); // model
		
// DOM
		this.name = _gensym().name;
		this.cell = cell ;
		this.graph = model.cloneNode(true); 
		this.graph.id = this.name;
		this.sliders = get_Child(this.graph,"sliders");
        this.canvas = get_Child(this.graph,"canvas");
        
        this.context = null;
        this.call = null; // last plotted function
        
// defaults - overridable
       this.strokeStyle = 'red' ;
       this.fillStyle = 'lightgreen' ;
       this.lineWidth = 2;
    	this.font = "16px verdana" ;
        this.steps = 500;
        this.hgamma = 0.8; // default for plot_z
        this.sgamma= 0.8;
        this.vgamma= 0.8;
        this.variant= 1; // 1 isophore hsv (else rgb) 4 = rho= log2(rho) ..
// mouse
		this.dfun = null; // date function
        this.fun = null; // mouse show  
        this.zfun = null;
        this.ifun = null; // sequence
        this.xyfun = null;
// parametrics
        this.umin = 0; 
        this.umax = 1;
// user choices (false is auto)
        this.xminmax = false; 
        this.yminmax = false; 
// computed
        this.xmin=-1; this.xmax=1;
        this.ymin=-1; this.ymax=1;
       
        this.duration = 0 ;  // anim duration
        this.start = 0 ; // anim start
        this.imgData = [] ; // undo
        this.imgSave = null ; // editing
        
// DOM
		GPlotter = this;
		cell.setAttribute("data-plotter", this.name);
		cell.appendChild(this.graph);
		this.texts = this.graph.getElementsByClassName("stext"); // 3 display fields
		GPlotters[this.name] = this ;
		_plot_init();
		__toggle_visibility(this.graph,"true");
// console.log("GPlotter",GPlotter);
return this ;
}

/*-------------
PROTOS
-------------------*/
function __display_interval(plotter,xscale,yscale) {
	var x  = plotter.texts[0];
	var y = plotter.texts[1];
	x.innerHTML = glisp_message(xscale,"&nbsp;X-axis:&nbsp;") ;
	y.innerHTML = glisp_message(yscale,"&nbsp;Y-axis:&nbsp;") ;
}

Plotter.prototype.xunscale = function (x) 
	{return map (x,0,this.canvas.height,this.xmin,this.xmax);};
Plotter.prototype.yunscale = function (y) 
	{return map (y,0,this.canvas.height,this.ymax,this.ymin);};
Plotter.prototype.xscale = function (x) 
	{return map (x,this.xmin,this.xmax,0,this.canvas.height);},
Plotter.prototype.yscale = function (y) 
    {return map 	(y,this.ymax,this.ymin,0,this.canvas.height);};
Plotter.prototype.moveTo = function(x,y) {this.context.moveTo(this.xscale(x),this.yscale(y));};
Plotter.prototype.lineTo = function(x,y) {this.context.lineTo(this.xscale(x),this.yscale(y));};
Plotter.prototype.interval = function () {
    		var xminmax =   [round100(this.xmin), [round100(this.xmax),null]] ;
    		xminmax = this.xminmax ?  ["x", xminmax] : ["x:auto", xminmax] ;
    		var yminmax =   [round100(this.ymin), [round100(this.ymax),null]] ;
    		yminmax = this.yminmax ?  ["y", yminmax] : ["y:auto", yminmax] ;
    		__display_interval(this,xminmax,yminmax);
    		return [xminmax, [yminmax,null]] ;} ;

// (re)init current GPlotter
function _plot_init () { 
    height =  410;
    width = height ;
    GPlotter.canvas.width=width;
    GPlotter.canvas.height=height;
    
    GPlotter.canvas.style.left = "220px"; // compute - NYI
    GPlotter.context = GPlotter.canvas.getContext('2d');
    GPlotter.context.lineWidth = GPlotter.lineWidth;
    GPlotter.context.strokeStyle = GPlotter.strokeStyle;
    GPlotter.context.fillStyle = GPlotter.fillStyle;
    GPlotter.canvas.addEventListener("mousemove",plot_event, false);
    GPlotter.xminmax = GPlotter.yminmax = false;
    GPlotter.imgData = [];
    GPlotter.canvas.style.backgroundColor = "white" ;
    return GPlotter.interval();
}


/*----------------
Interpolation functions
----------------------------*/
function _smoothstep(x)
{
    // Scale, bias and saturate x to 0..1 range
    x = Math.min(Math.max(x,0),1) ;
    // Evaluate polynomial
    return x*x*(3 - 2*x);
}

function _s_curve (x , g) { // S-curve x in [0 1] g = gamma 
	 if (x <= 0.5) return Math.pow (( 2 * x), g) / 2 ;
	 return 1 - _s_curve ((1-x) , g);
}

function __linear (x,xmin,xmax,ymin,ymax) {
	return ymin + (x - xmin) * (ymax - ymin) / (xmax - xmin) ;
}
var _linear = function (top, argc) { // opt ymin/max = 0/1
	var x = _stack[top++];
	var xmin = _stack[top++];
	var xmax = _stack[top++];
	var ymin = (argc > 3) ? _stack[top++] : 0;
	var ymax = (argc > 3) ?  _stack[top] : 1 ;
	return ymin + (x - xmin) * (ymax - ymin) / (xmax - xmin) ;
}

/*----------------
sliders
------------------------*/

function _adjust_hsv (input,hgamma,sgamma,vgamma, hdisp, vmin, vmax) {
 	var canvasWidth  = GPlotter.canvas.width;
    var canvasHeight = GPlotter.canvas.height;
    var context = GPlotter.context;
   // var input =  GPlotter.imgSave ; // context.getImageData(0, 0, canvasWidth, canvasHeight);
    var inputData = input.data;
    var inbuffer =  inputData.buffer; 
    var in32 =  new Uint32Array(inbuffer); 
    var output = context.createImageData(canvasWidth, canvasHeight);
    var outputData = output.data;
    var outbuffer = outputData.buffer; 
    var out32 = new Uint32Array(outbuffer);
    
    var w = input.width, h = input.height, wh = w*h;
    var i,r,g,b,a,pix,vpix;
    var hsv,h,s,v ;
        
        for(i= 0; i< wh; i++) {
        pix = in32[i];
        
        r = (pix & 0x000000ff);
        g = (pix >> 8) & 0x000000ff;
        b = (pix >> 16) & 0x000000ff; 
        a = (pix >> 24) & 0x000000ff; 
        if(r===0 && g === 0 && b===0) { out32[i] = pix; continue;}
        hsv = _rgb_to_hsv(r/255,g/255,b/255);
        h = hsv[0];
        s = hsv[1];
        v = hsv[2];
        h = _s_curve(h, hgamma) ; // before hdisp
        h += hdisp ;
        if(h > 1) h -= 1;
        if(h < -1) h += 1;
if (v < vmin)   v = vmin;
if (v > vmax)   v = vmax;
        s = Math.pow(s,sgamma);
if( v > 1 ||  v < 0 ) glisp_error(1,v,"hsv");
        v = Math.pow(v,vgamma);
        vpix = _hsv_to_rgba(h,s,v,a/255);
                
        out32[i] =  vpix ; // f( r,g,b)
        }
        return output ;
}

function _adjust_pixel(input,pixmap) {
 	var canvasWidth  = GPlotter.canvas.width;
    var canvasHeight = GPlotter.canvas.height;
    var context = GPlotter.context;
   // var input =  GPlotter.imgSave ; // context.getImageData(0, 0, canvasWidth, canvasHeight);
    var inputData = input.data;
    var inbuffer =  inputData.buffer; 
    var in32 =  new Uint32Array(inbuffer); 
    var output = context.createImageData(canvasWidth, canvasHeight);
    var outputData = output.data;
    var outbuffer = outputData.buffer; 
    var out32 = new Uint32Array(outbuffer);
    
    var w = input.width, h = input.height, wh = w*h;
    var i,r,g,b,a,pix,vpix;
    var hsv,h,s,v ;
        
        for(i= 0; i< wh; i++) {
        pix = in32[i];
        
        r = (pix & 0x000000ff);
        g = (pix >> 8) & 0x000000ff;
        b = (pix >> 16) & 0x000000ff; 
        a = (pix >> 24) & 0x000000ff; 
        if(r===0 && g === 0 && b===0) { out32[i] = pix; continue;}
        
        if(GPlotter.variant & 1) { // isophore hsv
        hsv = _rgb_to_hsv(r/255,g/255,b/255);
        h = hsv[0];
        s = hsv[1];
        v = hsv[2];
        h = pixmap[Math.round(h*255)] / 255 ;
        s = pixmap[Math.round(s*255)] / 255 ;
        v = pixmap[Math.round(v*255)] / 255 ;
        vpix = _hsv_to_rgba(h,s,v,a/255);
        }
        else { // isophore rgb
        r = pixmap[r];
        g = pixmap[g];
        b = pixmap[b];
        vpix = _rgba(r,g,b,a);
        }
        
        out32[i] =  vpix ; // f( r,g,b)
        }
        return output ;	
      //  context.putImageData(output, 0, 0);
}

/*--------------------------
Sliders handling
--------------------------*/

function _plot_variant (n) {
	GPlotter.variant = n;
	_pipe_line();
	return n;
}

// slider EVENTS
function __plot_slider(slider,num, value) { 
	GPlotter = __slider_plotter(slider) ;
	switch(num) {
	case 0 : _time_slider(_slider_value(0)); break;
	case 1 :
	case 2 : 
	case 3 :
	case 4 : case 5 : case 6 :  _pipe_line() ; break; 
	case 7 : _zoom_slider(_slider_value(7)); break;
	}
}


function __plot_button_reset(btn,btnOnly) { // h,s,v slider "reset"
	GPlotter= __slider_plotter(btn) ;
	// _set_slider(0,0);
	_set_slider(1,0); // hdisp
	_set_slider(4,0.5); // s 
	_set_slider(5,0.5); // v
	_set_slider(2,0.5); // h
	_set_slider(3,0.5) ; // light
	_set_slider(6,0.0) ; // pix
	if(btnOnly) return;
	__plot_restore();
}

function _pipe_line () {
var output;
	if(! GPlotter.imgSave) return;
	output = _hsv_slider(GPlotter.imgSave);
	output = _pixel_slider(output);
	GPlotter.context.putImageData(output, 0, 0);
}


function  _hsv_slider (input ) { 
var hdisp = _slider_value(1); // hue increment
var h = _slider_value(2); // hgamma
var light = _slider_value(3); // light
var s = _slider_value(4);
var v = _slider_value(5); 
var vmin = 0, vmax = 1;


if(light > 0.5) vmin= map(light,0.5,1,0,1);
if(light < 0.5) vmax = map(light,0.5,0,1,0.5);
// s_curve A REVOIR - cf plot-3d
	if(h < 0.5)  h = map (h,0,0.5,0.1,1);
	else h = map(h,0.5,1,1,20) ;
s = 1-s ;
v = 1-v;
	if( s < 0.5 ) s = map (s,0,0.5,0,1);
		else s = map(s,0.5,1,1,4);
	if( v < 0.5 ) v = map (v,0,0.5,0,1);
		else v = map(v,0.5,1,1,4);
//	console.log("adjust hsv",h,s,v);
	return _adjust_hsv(input,h,s,v,hdisp,vmin,vmax);
}

function  _pixel_slider (input) { // on change
if(! GPlotter.imgSave) return;
var p = _slider_value(6) ;
if( p === 0) return input;
	p = Math.pow (p, 0.15) ; // too slow at 1 ? NYI
	var slices = map (p, 0 , 1 ,255 , 1);
	var sdim  = 255 / slices ;
	var pixmap = [];
	for(var i = 0; i <= 255 ; i++) 
		pixmap[i] = Math.min (255 , Math.floor (Math.ceil( i / sdim) * sdim));
	
//	console.log("pixmap",slices,pixmap);
	return _adjust_pixel(input,pixmap);
}


function  _zoom_slider (z) { // on change
if(! GPlotter.imgSave) return;
if (_PLOTTING ) return;
	if( z < 0.5 ) z = map (z,0,0.5,0.1,1);
			else z = map(z,0.5,1,1,10);
	_adjust_zoom(z);
	_pipe_line();
}

function _set_slider(num,value) {
	var slider = __graph_slider(GPlotter.graph,num);
	slider.value = '' + value;
}

function _slider_value(num) {
	var slider = __graph_slider(GPlotter.graph,num);
	return parseFloat(slider.value);
}

function _time_slider(t) {
	if(GPlotter.call === null) return;
	 // _plot_draw (GPlotter.fun ,null, null, t) ;
	 _plot_undo();
	 __plot_save();
	 __plot_redraw(t); 
}

function __zoom_minmax(aminmax, z) {
	if(aminmax === null) return null;
	if(typeof aminmax === "number") return aminmax * z;
	if(isList(aminmax)) return [ aminmax[0]*z, [aminmax[1][0]*z, null]] ;
	return aminmax;
}

// call = [_plot_fun this args .....]
// args =  userfun [userfun] xminmax [yminmax] 
function _adjust_zoom(z) {
	GPlotter.canvas.width = GPlotter.canvas.width ; // clear
	GPlotter.xminmax = false;
	GPlotter.yminmax = false ; // switch to auto mode
	if(GPlotter.call === null) return;
	var call = GPlotter.call;
	var call_save = [], i;
	var args = call.slice(2);
	for(i=0; i< call.length;i++) call_save[i] = call[i] ;
	
	switch (call[0]) {
	case _plot_time_serie : // NYI NYI NYI
			break;
	case _plot_draw :
	case _plot_sequence : 
	case _plot_spiral :
	case _plot_hilbert : 
			args[1] = __zoom_minmax(args[1],z);
			break ;
	case _plot_param :
	case _plot_polar :
			args[2] = __zoom_minmax(args[2],z) ; // u param
			break;
	case __plot_z :
	case _plot_rgb :
	case _plot_xy :
		args[1] = __zoom_minmax(args[1],z);
		args[2] = __zoom_minmax(args[2],z);
		break;
	default :
		console.log("adjust_zoom- unk fun",call[0]);
	}
	_ZOOMING = true;
	call[0].apply(call[1],args) ;
	_ZOOMING = false;
	GPlotter.call = call_save;
	
	writeln (glisp_tostring (GPlotter.interval() ,"Zoom")) ;
  }

function __plot_redraw(t) {
t = t || 0 ;
//	console.log("REDRAW",t,GPlotter.call);
//	GPlotter.canvas.width = GPlotter.canvas.width ; // clear
// try
	__plot_restore();
	var call = GPlotter.call;
	var args = call.slice(2);
	args[args.length-1] = t;
	call[0].apply(call[1],args) ;
}


// formats :  3 -> [0 3] ; -3 --> [-3 3] , (4 5) -> [ 4 5]
// date (string,or seconds, or Date object) | (date-from date-to)
function __arg_date_min (aminmax) { 
		if(isList(aminmax)) return __ds_convert_date (aminmax[0]) ;
		return __ds_convert_date (aminmax) ;
		}
function __arg_date_max (aminmax) {
		if(isList(aminmax)) return __ds_convert_date (aminmax[1][0] ) ;
		return Math.round(Date.now()/1000); 
		}
		
function __arg_min (aminmax) {
	if(typeof aminmax === "number") {
		if(aminmax >= 0) return 0;
		if(aminmax < 0)  return aminmax ;
		}
		else return aminmax[0]; // check legal NYI
}
function __arg_max (aminmax) {
	if(typeof aminmax === "number") {
		if(aminmax >= 0) return aminmax;
		if(aminmax < 0)  return -aminmax ;
		}
		else return aminmax[1][0]; // check legal NYI
}
function __set_plot_xminmax(xminmax) { 
	GPlotter.xmin = __arg_min(xminmax);
	GPlotter.xmax = __arg_max(xminmax);
	return GPlotter.interval();
}

function __set_plot_yminmax(yminmax) { 
	GPlotter.ymin = __arg_min(yminmax);
	GPlotter.ymax = __arg_max(yminmax);
	return GPlotter.interval();
}


function __plot_push  () {
if(_ANIMATING || _ZOOMING) return;
//console.log("===> plot-push");
	if(GPlotter.imgData.length < 32)
		GPlotter.imgData.push(
		GPlotter.context.getImageData(0,0,GPlotter.canvas.width,GPlotter.canvas.height));
	return GPlotter.imgData.length;
}

function __plot_save() { // for image editing
	if(_ANIMATING) return;
	GPlotter.imgSave =
	GPlotter.context.getImageData(0,0,GPlotter.canvas.width,GPlotter.canvas.height);
	return _true;
//	__plot_button_reset(btn,true); // button only
}

function __plot_restore () { // hsv reset
	if(GPlotter.imgSave)
	GPlotter.context.putImageData(GPlotter.imgSave,0,0);
}
var _plot_undo = function () {
	if(GPlotter.imgData.length === 0) return;
	// GPlotter.call = null ; // no zoom ..
	GPlotter.context.putImageData(GPlotter.imgData.pop(),0,0);
	return GPlotter.imgData.length;
}

// SHOULD get t from slider here NYI
var _Z_MOUSE = new Complex (0,0) ;
function __z_round (z) {
	z.a = round100(z.a);
	z.b = round100(z.b);
}

function plot_event (evt) { // mouse move
		// if(!GPlotter.status) return;
        var rect = GPlotter.canvas.getBoundingClientRect();
        var x = evt.clientX - rect.left;
        var y = evt.clientY - rect.top;
        var txt ,f, call;
        x = GPlotter.xunscale(x);
        y = GPlotter.yunscale(y);
        var t = _slider_value(0);
        var mouseloc ;
       
        if(GPlotter.zfun) {
        	_Z_MOUSE.a = x; _Z_MOUSE.b = y;
        	call = [GPlotter.zfun, [_Z_MOUSE, [t , null]]] ;
        	f = __funcall(call,glisp.user);
        	__z_round(f);
        	__z_round(_Z_MOUSE);
        	txt = " f(" + _Z_MOUSE.toString() + ") = " + f.toString();
        	//txt +=  mouseloc;
        }
        else if (GPlotter.fun) {
            call = [GPlotter.fun , [x, [t, null]]] ; // (fun x [t])
            f = __funcall(call,glisp.user);
            txt =  " <b>f</b>(" + round100(x) + ") = " + round100(f) ;
            //txt +=  mouseloc;
        }
        else if (GPlotter.ifun) {
        	x = Math.round(x);
            call = [GPlotter.ifun , [x, [t, null]]] ; // (fun n [t])
            f = __funcall(call,glisp.user);
            txt =   " u(" + x +") = "  + round100(f) ;
        }
        else if (GPlotter.xyfun) {
            call = [GPlotter.xyfun , [x, [y , [t, null]]]] ; // (fun x y [t])
            f = __funcall(call,glisp.user);
            txt =   " f(" + round100(x) +", " + round100(y) + ") = "  + round100(f) ;
        }
        else if (GPlotter.dfun) {
            f = _data_serie_get(GPlotter.dfun,x);
            var date = new Date (x * 1000);
            txt = " ⌚️ "  + _date_to_string(date) + "  📈 = " + round100(f) ;
        }
        else {
              mouseloc = " [ x: " + round100(x) + "  y: " + round100(y) + " ]" ;
              txt = mouseloc;
              }
              
  		if(t) txt  =   " t: " + round100(t) + "  " + txt ;
  		GPlotter.texts[2].innerHTML = "&nbsp;" + txt ;
      } // mouse_event



var _plot_minmax = function() {
		return GPlotter.interval();
}

var _plot_x_minmax = function (xminmax) { // user choice
		if(xminmax === null || xminmax === "auto" || xminmax === 0 ) {
				GPlotter.xminmax = false;
				return "x:auto";
				}
		GPlotter.xminmax = true;
         __set_plot_xminmax(xminmax);  // GPlotter.xmin,xmax
        return GPlotter.interval();
}
var _plot_y_minmax = function (yminmax) { // user choice
        if(yminmax === null || yminmax === "auto" || yminmax === 0 ) {
		GPlotter.yminmax = false;
		return "y:auto";
		}
		GPlotter.yminmax = true;
         __set_plot_yminmax(yminmax);  // GPlotter.ymin,ymax
        return GPlotter.interval();
}

var _plot_steps = function (steps) {
        if(steps) GPlotter.steps = steps ;
        return GPlotter.steps;
}
var _plot_color = function (color) {
		if(typeof color === "number")  color = _rgb_to_string(color);
        if(color) GPlotter.strokeStyle = color ;
        return GPlotter.strokeStyle;
}
var _plot_fill_color = function (color) {
		if(typeof color === "number")  color = _rgb_to_string(color); 
        if(color) GPlotter.fillStyle = color ;
        return GPlotter.fillStyle;
}
var _plot_font = function (font) {
        if(font) GPlotter.font = font ;
        return GPlotter.font;
}
var _plot_line_width = function (lineWidth) {
        if(lineWidth) GPlotter.lineWidth = lineWidth ;
        return GPlotter.lineWidth;
}

var _plot_background = function (color) { // immediate
		if(typeof color === "number")  color = _rgb_to_string(color); 
		GPlotter.canvas.style.backgroundColor = color ;
		return color;
}

function __plot_axis  (x, y , color , ingrid) { 
    var ctx = GPlotter.context;
    if(!ingrid) __plot_push();
     ctx.save();
     ctx.lineWidth = 1 ;
     if (!color) color = GPlotter.strokeStyle;
     ctx.strokeStyle = color ;
     		
     x = Math.round(GPlotter.xscale(x));
     y = Math.round(GPlotter.yscale(y));
     
    	ctx.beginPath();
    	ctx.moveTo(x,0);
    	ctx.lineTo(x,GPlotter.canvas.height);
    	ctx.stroke();
    	ctx.closePath();
    	

    	ctx.beginPath();
       	ctx.moveTo(0,y);
        ctx.lineTo(GPlotter.canvas.width,y);
        ctx.stroke();
        ctx.closePath();
    	
    	
    ctx.fillStyle = color;
    if(! ingrid) ctx.fillRect(x-3,y-3,7,7); // center
    
	ctx.restore();
return [x, [y,null]] ; // dbg
}

var _plot_axis = function (top,argc) {
	var x = (argc > 0) ? _stack[top++] : 0 ;
	var y = (argc > 1) ? _stack[top++] : x ;
	var color = (argc === 3) ? _stack[top] : 'gray' ;
	return __plot_axis(x,y,color);
}


// var _plot_grid = function(xunit,yunit , color) {
var _plot_grid = function (top, argc) {
 	var xmin = GPlotter.xmin,xmax=GPlotter.xmax,ymin=GPlotter.ymin,ymax=GPlotter.ymax ;
	var xunit = (argc > 0) ? _stack[top++] : (xmax-xmin) / 10 ;
	var yunit = (argc === 0) ? (ymax-ymin)/10 : (argc === 1) ? xunit  : _stack[top++]  ;
	var color = (argc === 3) ? _stack[top] : 'lightgray' ;
    var i,j,x,y ;
   
    var width = GPlotter.canvas.width;
    var height = GPlotter.canvas.height;
    var ctx = GPlotter.context;
     
    __plot_push();
    var xstart = 0, ystart = 0;
    if(xmin > 0 || xmax < 0 ) xstart = xmin ;
    if(ymin > 0 || ymax < 0 ) ystart = ymin ;
    if((xunit <= 0) || (yunit <=0)) return _false;
    
    ctx.save();
    ctx.lineWidth = 1;
    for(x=xstart;; x += xunit) {
    if(GPlotter.xscale(x) > width) break;
    for(y=ystart;; y += yunit) {
     	if(GPlotter.yscale(y) < 0 ) break;
    	if(x >= xmin || y >= ymin)
    	__plot_axis(x,y,color,true); // ingrid
//console.log("plot-axis",x,y);
    }}
    
    for(x=xstart;; x -= xunit) {
    if(GPlotter.xscale(x) < 0 ) break;
    for(y=ystart;; y -= yunit) {
    	if(GPlotter.yscale(y) > height ) break;
    	if(x <= xmax || y <= ymax)
    	__plot_axis(x,y,color,true); // ingrid
//console.log("plot-axis",x,y);
	}}
	ctx.restore();
	// __plot_save();
    return _true;
} // _plot_grid

var _plot_rect = function(x,y,x1,y1) { 
    var ctx = GPlotter.context;
    __plot_push();
    ctx.fillStyle = GPlotter.fillStyle;
    x = GPlotter.xscale(x);
    y = GPlotter.yscale(y);
    var w = GPlotter.xscale(x1) - x;
    var h = GPlotter.yscale(y1) - y;
    ctx.fillRect(x ,y , w , h);
    // __plot_save();
	return _true;	
}

var _plot_segment = function(x,y,x1,y1) { 
    var ctx = GPlotter.context;
    __plot_push();
    ctx.save();
    x = GPlotter.xscale(x);
    y = GPlotter.yscale(y);
    x1 = GPlotter.xscale(x1);
    y1 = GPlotter.yscale(y1);
    ctx.beginPath();
    ctx.strokeStyle = GPlotter.strokeStyle ;
    ctx.lineWidth = GPlotter.lineWidth;
    ctx.moveTo(x,y);
    ctx.lineTo(x1,y1);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
    // __plot_save();
	return _true;	
}

var _plot_arc = function(top, argc) {
	var x = _stack[top++];
	var y = _stack[top++];
	var R = _stack[top++];
	var a = _stack[top++];
	var b = _stack[top++];
	var clock = (argc === 5) ? true : (_stack[top] === _false) ? false : true;
	var ctx = GPlotter.context;
    x = GPlotter.xscale(x);
    y = GPlotter.yscale(y);
    
    __plot_push();
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = GPlotter.strokeStyle ;
    ctx.lineWidth = GPlotter.lineWidth;
   
    ctx.arc(x,y,R,a,b,clock);
    ctx.stroke();
    ctx.restore();
    // __plot_save();
	return _true;	
}

function __plot_circle  (x,y,r_pixels) { 
    var ctx = GPlotter.context;
    x = GPlotter.xscale(x);
    y = GPlotter.yscale(y);
    ctx.beginPath();
    ctx.fillStyle = GPlotter.fillStyle;
    ctx.arc(x,y,r_pixels,0,2*Math.PI);
	ctx.fill();
	return _true;	
}
var _plot_circle = function(x,y,r_pixels) { 
	__plot_push();
	__plot_circle(x,y,r_pixels);
	return _true;
	}
	
function __plot_square  (x,y,w) { 
    var ctx = GPlotter.context;
    x = GPlotter.xscale(x);
    y = GPlotter.yscale(y);
    ctx.fillStyle = GPlotter.fillStyle;
    ctx.fillRect (x - w, y - w , w*2, w*2) ;
	return _true;	
}
var _plot_square = function(x,y,w_pixels) { 
	__plot_push();
	__plot_square(x,y,w_pixels);
	return _true;
	}

//var _plot_text = function(text, x, y, color ) { 
var _plot_text = function (top, argc) {
	var text = _stack[top++];
	text = nameToString(text);
	var x = _stack[top++];
	var y = _stack[top++];
	var color = (argc === 4) ? _stack[top] : GPlotter.fillStyle ;
	var ctx=GPlotter.context;
	if( !_ANIMATING) __plot_push();
	x = GPlotter.xscale(x);
    y = GPlotter.yscale(y);

	ctx.save();
	ctx.font = GPlotter.font;
	ctx.fillStyle = color ;
	ctx.fillText(text,x ,y );
	ctx.restore();
	__plot_save();
	return _true;
	}

/*
// Create gradient
var gradient=ctx.createLinearGradient(0,0,c.width,0);
gradient.addColorStop("0","magenta");
gradient.addColorStop("0.5","blue");
gradient.addColorStop("1.0","red");
// Fill with gradient
ctx.fillStyle=gradient;
ctx.fillText("Big smile!",10,90); 
*/

var _make_gradient = function (x0,y0,x1,y1) {
	x0 = GPlotter.xscale(x0);
	x1 = GPlotter.xscale(x1);
	y0 = GPlotter.yscale(y0);
	y1 = GPlotter.yscale(y1);
    var ctx = GPlotter.context;
    var gradient = ctx.createLinearGradient(x0,y0,x1,y1);
    ctx.fillStyle = GPlotter.fillStyle = gradient ;
	return gradient ;
}
var _make_circular_gradient = function (top, argc) {
	var x0 = _stack[top++];
	var y0 = _stack[top++];
	var r0 = _stack[top++];
	var x1 = _stack[top++];
	var y1 = _stack[top++];
	var r1 = _stack[top];
	x0 = GPlotter.xscale(x0);
	x1 = GPlotter.xscale(x1);
	y0 = GPlotter.yscale(y0);
	y1 = GPlotter.yscale(y1);
    var ctx = GPlotter.context;
    var gradient = ctx.createRadialGradient(x0,y0,r0,x1,y1,r1);
    ctx.fillStyle = GPlotter.fillStyle = gradient ;
	return gradient ;
}

var _gradient_add_stop = function (gradient ,x , color) {
var ctx = GPlotter.context;
	gradient.addColorStop(x,color);
	ctx.fillStyle = GPlotter.fillStyle = gradient ;
	return gradient;
}

// frames/sec
function _plot_animate (duration) {
window.requestAnimationFrame = window.requestAnimationFrame 
	|| window.mozRequestAnimationFrame 
	|| window.webkitRequestAnimationFrame 
	|| window.msRequestAnimationFrame;

	GPlotter.start = null;
	GPlotter.duration = duration * 1000; // msec

	function step (timestamp) {
		if(GPlotter.start === null) GPlotter.start = timestamp;
		var progress = (timestamp-GPlotter.start) / GPlotter.duration; // [0..1]
		if(progress <= 1) _ANIMATING = true;
						  else _ANIMATING = false; // save last frame
		__plot_redraw  ( progress); 
		_set_slider(0,progress);
		if(progress <=1)    requestAnimationFrame(step);
		} // step function
		
 _plot_undo();
__plot_save();
	 requestAnimationFrame(step);
	 var yminmax= [GPlotter.ymin, [GPlotter.ymax, null]];
	 xminmax = [GPlotter.xmin, [GPlotter.xmax, null]];
	 return [xminmax, [yminmax, null]];
}


function _fminmax( fun, xminmax) {  //  f1:2-> (fmin fmax)
	var xmin = __arg_min(xminmax);
    var xmax = __arg_max(xminmax);
    var ymax = -Infinity ;
    var ymin = Infinity ;
    var x,y,dx, env = glisp.user;
    var call = [fun, [null, [0, null]]] ; // (fun x [t=0])
    var step = (xmax - xmin) / 1000 ;
   	x = xmin;
    	while (x <=  xmax) { 
        	call[1][0] = x;
       		y = __ffuncall(call,env);
       		if(typeof y === "number") {
        		if(y < ymin) ymin = y;
        		if(y > ymax) ymax = y ;
        		}
        	x += step; 
    	}
    return [ymin, [ymax, null]] ;
}

// sets GPlotter ymin,ymax before drawing iff auto
// quick samples xmin,xmax interval 
// use step == 1 for int sequences

function __set_y_minmax(fun, xmin, xmax, step, integer) {
    var ymax = -1.e+12 ;
    var ymin = 1.e+12 ;
    
	var i,x,y,dx, env = glisp.user;
	
    var call = [fun, [null, [0, null]]] ; // (fun x [t=0])
    step =  step || (xmax - xmin) / 100 ;
    	
   		if(!GPlotter.yminmax)  {
    		x = xmin;
    		while (x <=  xmax) { // auto ymin/max (100 steps to get ymin/max)
        		call[1][0] = x;
       			y = __ffuncall(call,env);
       			if(typeof y === "number") {
        			if(y < ymin) ymin = y;
        			if(y > ymax) ymax = y ;
        			}
        			x += step; 
    			}
			//ymin -= Math.abs(ymin) / 10;
			//ymax += Math.abs(ymax) / 10;
			var delta = (ymax - ymin ) / 10;
			if(ymin < 0) ymin -= delta ;
			if(ymax > 0) ymax += delta ;
			
			if(integer) { ymin = Math.floor(ymin); ymax = Math.ceil(ymax); }
    		GPlotter.ymin = ymin; // remember for animate or next curves
    		GPlotter.ymax = ymax;
    		
    		} // yminmax
// console.log("__setminmax",GPlotter.xmin,GPlotter.xmax,GPlotter.ymin,GPlotter.ymax) ;
}

// SEQUENCES
// options line/noline and nice square dots NYI
function _plot_sequence (fun ,xminmax, env, t ) { 
t = t || 0;
    var i,x,y,dx,xmin,xmax ;
   
   	GPlotter.fun = GPlotter.dfun = GPlotter.zfun = GPlotter.xyfun = null ;
	GPlotter.ifun = fun;
	if(! _ANIMATING && !_ZOOMING)  __plot_push(); // for undo
	GPlotter.call = [_plot_sequence,this,fun,xminmax,env,t];

    var call = [fun, [null, [t || 0, null]]] ; // (fun x)
    xmin = __arg_min(xminmax);
    xmax = __arg_max(xminmax);
    xmin = Math.floor(xmin);
    xmax = Math.floor(xmax);
    if(! GPlotter.xminmax) __set_plot_xminmax(xminmax);
    if(! GPlotter.yminmax) __set_y_minmax(fun,xmin,xmax,1,true); // step 1 & integer
 	
        var ctx = GPlotter.context;
        ctx.lineWidth = GPlotter.lineWidth;
        ctx.strokeStyle = GPlotter.strokeStyle;
        ctx.beginPath();

        var moved = false;
         for(x =xmin; x<= xmax; x++) {
            call[1][0] = x;
            y = __ffuncall(call,glisp.user);
            if(typeof y === "number") {
            	if(!moved) { GPlotter.moveTo(x,y); moved = true; }
            	else GPlotter.lineTo(x,y);
            	}
        }
        ctx.stroke();
		if(! _ANIMATING)  __plot_save(); // for image editing
   		return GPlotter.interval();
} // _sequence


// CURVES
// t is hidden param for animate
// xminmax === null --> animation

function _plot_draw (fun ,xminmax, env, t) { 
t = t || 0 ;

	if(GPlotter === null) {
		cell_toggle_plotter() ; // stdin
		}
		
    var i,x,y,dx,xmin,xmax ;
// should detect fun-arity to do t-sampling NYI
    GPlotter.ifun = GPlotter.zfun = GPlotter.dfun = GPlotter.xyfun = null ;
	GPlotter.fun = fun;
    var call = [fun, [null, [t || 0, null]]] ; // (fun x [t])
    if(! _ANIMATING && !_ZOOMING)  __plot_push(); // for undo
    xmin = __arg_min(xminmax);
    xmax = __arg_max(xminmax);
    if(! GPlotter.xminmax)  __set_plot_xminmax(xminmax);
    if(! GPlotter.yminmax)  __set_y_minmax(fun,xmin,xmax); 
    GPlotter.call = [_plot_draw,this,fun,xminmax,env,t];
 	
        var ctx = GPlotter.context;
        ctx.lineWidth = GPlotter.lineWidth;
        ctx.strokeStyle = GPlotter.strokeStyle;
        ctx.beginPath();

        x = xmin;
        dx = (xmax -xmin) / GPlotter.steps ;
        var moved = false;
        for( i = 0; i <= GPlotter.steps; i++) {
            call[1][0] = x;
            y = __ffuncall(call,glisp.user);
            if(typeof y === "number") {
            	if(!moved) { GPlotter.moveTo(x,y); moved = true; }
            	else GPlotter.lineTo(x,y);
            	}
            x += dx;
        }
        ctx.stroke();
        
	   if(! _ANIMATING)  __plot_save(); // for image editing
   		return GPlotter.interval() ;
} // _draw

/*----------------
time serie
plots in [dmin dmax] date interval delta
fun = fun (date : seconds)
--------------------*/
//function _plot_time_serie (serie , delta , dminmax, env, t) { 
var _plot_time_serie = function (top, argc) {
    var i,x,y,dx,xmin,xmax ;
	var serie = _stack[top++];
	var delta = (argc > 1) ? _stack[top++] : 24 * 3600 ; // DAY
	var dminmax = (argc > 2) ? _stack[top] : null;
	var sminmax ; // min max from data
	
    GPlotter.ifun = GPlotter.zfun = GPlotter.fun = GPlotter.xyfun = null ;
	GPlotter.dfun = serie ; // mouse à revoir NYI
	
//glisp_trace(serie,"","serie",true);
	serie =    _data_serie(serie,"time-serie"); // convert if needed
//glisp_trace(serie,"",">serie",true);
	sminmax =  _data_serie_minmax(serie);
	if (dminmax === null) dminmax = sminmax[0] ; // from data
//glisp_trace(dminmax,"","dminmax",true);
    xmin = __arg_date_min(dminmax);
    xmax = __arg_date_max(dminmax);
    if(! GPlotter.xminmax)  __set_plot_xminmax([xmin,[xmax,null]]);
    if(! GPlotter.yminmax)  __set_plot_yminmax(sminmax[1][0]);
    
     if(! _ANIMATING && !_ZOOMING)  __plot_push(); // for undo
    // RFU for ZOOM
    //GPlotter.call = [_plot_time_serie,this,top,argc,env,t];
 	
        var ctx = GPlotter.context;
        ctx.lineWidth = GPlotter.lineWidth;
        ctx.strokeStyle = GPlotter.strokeStyle;
        ctx.beginPath();

       
       var moved = false;
       for(x =xmin; x<= xmax; x += delta) {
            y = _data_serie_get(serie,x);
            if(typeof y === "number") {
            	if(!moved) { GPlotter.moveTo(x,y); moved = true; }
            	else GPlotter.lineTo(x,y);
            	}
        }
        ctx.stroke();
        
	   if(! _ANIMATING)  __plot_save(); // for image editing
   		return GPlotter.interval() ;
} // _time_serie

/*----------------
plot-dots 
--------------------*/
function _plot_dots (cloud ,text) { // text may be unicode char
    var i,ndots,x,y, xyminmax;
	text = nameToString(text,"plot-dots");
    GPlotter.ifun = GPlotter.zfun = GPlotter.fun = GPlotter.xyfun = GPlotter.dfun = null ;

// try to get font metrics
	var ctx = GPlotter.context;
	ctx.font = GPlotter.font;
	ctx.fillStyle = GPlotter.fillStyle;
	
	var font= ctx.font ; // "40px verdana"
	var tW = ctx.measureText (text) ; tW = tW.width / 2 ;
	var tH = parseFloat(font);
	if(isNaN(tH)) tH = 8; else tH /= 2;
// console.log("DOTS",font,tH,tW);

	var width = GPlotter.canvas.width -   tW*2 - 2 ;
    var height = GPlotter.canvas.height - 2;


    if(! _ANIMATING && !_ZOOMING)  __plot_push(); // for undo
    
    cloud = _data_serie(cloud,"plot-dots");
    xyminmax = _data_serie_minmax (cloud); // ((xmin max) (ymin ymax))
    cloud = cloud.vector ;
    ndots = cloud.length;
    
    if(! GPlotter.xminmax)  __set_plot_xminmax(xyminmax[0]);
    if(! GPlotter.yminmax)  __set_plot_yminmax(xyminmax[1][0]);
 
	for(i=0; i< ndots;i++) {
		x = cloud[i][0];
		y = cloud[i][1];
		x = GPlotter.xscale(x);
        y = GPlotter.yscale(y);
        x -= tW; if(x < 0) x = 2; if( x > width) x =  width ; 
        y += tH; if(y < tH*2 ) y = tH * 2 + 2 ; if (y > height) y = height ;
	
		ctx.fillText(text,x ,y );
	}
        
	   if(! _ANIMATING)  __plot_save(); // for image editing
   		return GPlotter.interval() ;
} // _plot-dots



// parametric curves
var _plot_param = function (xu, yu , uminmax, env, t) { // u in [umin umax]
t = t || 0;
    	var xmin= Infinity, ymin=Infinity, xmax = -Infinity, ymax = -Infinity;
        var i,x,y,u,du ;
        uminmax = uminmax || [0, [1,null]] ;
        GPlotter.umin = __arg_min(uminmax);
        GPlotter.umax = __arg_max(uminmax);
        
//console.log("param",uminmax);
        du = (GPlotter.umax - GPlotter.umin) / GPlotter.steps ;
        var callx = [xu, [null, [t || 0 , null]]] ;
        var cally = [yu, [null,  [t || 0 , null]]] ;
        if(! _ANIMATING && !_ZOOMING)  __plot_push(); // for undo
         GPlotter.call = [_plot_param,this,xu,yu,uminmax,env,t];

        // compute mins,maxs
		if(!GPlotter.xminmax || !GPlotter.yminmax) {
        u = GPlotter.umin;
        for( i =0; i <= GPlotter.steps; i++) {
            callx[1][0] = u;
            cally[1][0] = u;
            x = __ffuncall(callx,glisp.user);
            y = __ffuncall(cally,glisp.user);
            if(y < ymin) ymin = y;
            if(y > ymax) ymax = y ;
            if(x < xmin) xmin = x;
            if(x > xmax) xmax = x ;
            u += du ;
        }
        if(xmax > 0) xmax *= 1.1;
        if(xmin < 0) xmin *=  1.1;
        if(ymax > 0) ymax *= 1.1;
        if(ymin < 0) ymin *=  1.1;

        
        if(!GPlotter.xminmax) 
        	{GPlotter.xmin = xmin;  GPlotter.xmax = xmax;}
        if(!GPlotter.yminmax)
        	{GPlotter.ymin =ymin ; GPlotter.ymax = ymax;}
        } // min/max auto compute

            var ctx = GPlotter.context;
            ctx.lineWidth = GPlotter.lineWidth;
            ctx.strokeStyle = GPlotter.strokeStyle;
            ctx.beginPath();
			var moved = false;
            u = GPlotter.umin;
            for( i = 0 ; i <= GPlotter.steps; i++) {
                callx[1][0] = u;
                cally[1][0] = u;

                x = __ffuncall(callx,glisp.user);
                y = __ffuncall(cally,glisp.user);
				 if(!moved) 
                	{GPlotter.moveTo(x,y); moved = true;}
                	else GPlotter.lineTo(x,y);
            u += du ;
            }
            ctx.stroke();

	if(! _ANIMATING)  __plot_save(); // for image editing
    return GPlotter.interval() ;
    } // plot_param

var _plot_polar = function (ru,au,uminmax,env,t) { // u in [umin umax]
t = t || 0 ;
    	var xmin= Infinity, ymin=Infinity, xmax = -Infinity, ymax = -Infinity;
        var i, x,y,u,du, r, a ;
        var callr = [ru, [null,[t || 0,null]]] ;
        var calla = [au, [null,[t || 0,null]]] ;
        if(! _ANIMATING && !_ZOOMING)  __plot_push(); // for undo
        GPlotter.call = [_plot_polar,this,ru,au,uminmax,env,t];

        uminmax = uminmax || [0, [1,null]] ;
        GPlotter.umin = __arg_min(uminmax);
        GPlotter.umax = __arg_max(uminmax);

        du = (GPlotter.umax - GPlotter.umin)   / GPlotter.steps ;
        
		if(!GPlotter.xminmax || !GPlotter.yminmax) {
        u = GPlotter.umin;
        for( i =0; i <= GPlotter.steps; i++) {
            callr[1][0] = u;
            calla[1][0] = u;
            r = __funcall(callr,glisp.user);
            a = __funcall(calla,glisp.user);
            x = r * Math.cos(a);
            y = r * Math.sin(a);

            if(y < ymin) ymin = y;
            if(y > ymax) ymax = y ;
            if(x < xmin) xmin = x;
            if(x > xmax) xmax = x ;
            u += du;
        }
        
        if(xmax > 0) xmax *= 1.1;
        if(xmin < 0) xmin *=  1.1;
        if(ymax > 0) ymax *= 1.1;
        if(ymin < 0) ymin *=  1.1;

        if(!GPlotter.xminmax) 
        	{GPlotter.xmin = xmin; GPlotter.xmax = xmax;}
        if(!GPlotter.yminmax)
        	{GPlotter.ymin = ymin; GPlotter.ymax = ymax;}
        } // min/max auto compute

			var moved = false ;
            var ctx = GPlotter.context;
            ctx.lineWidth = GPlotter.lineWidth;
            ctx.strokeStyle = GPlotter.strokeStyle;
            ctx.beginPath();

            u = GPlotter.umin;
            for( i = 0; i <= GPlotter.steps; i++) {
                callr[1][0] = u;
                calla[1][0] = u;
                r = __ffuncall(callr,glisp.user);
                a = __ffuncall(calla,glisp.user);
                x = r * Math.cos(a);
                y = r * Math.sin(a);
                if(!moved) 
                	{GPlotter.moveTo(x,y); moved = true;}
                	else GPlotter.lineTo(x,y);
                u += du;
            }
            ctx.stroke();

	if(! _ANIMATING)  __plot_save(); // for image editing
    return GPlotter.interval();
    } // plot_polar


var TWOPI = 6.283185307179586;
var PI_2 = 1.5707963267948966;
var PI = 3.141592653589793;

/*-----------------
domain coloring
----------------------*/
function __R_to_rgb (x,hgamma,sgamma,vgamma) {
    var  h , s=sgamma , v= vgamma; // default 0.8
    var rho ;

	 if(x === Infinity) return _rgba(0,0,0,0) ; 
     if(isNaN(x))  return _rgba(0,0,0,0) ; // Xparent --> back ground
     if (x === 0)  return _rgba(1,0,0,1) ; 

// map x [0 .. infinity] to hue [0..0.5]
// map x [0 ..-infinity] to hue [1..0.5]
	h = Math.atan(x) / PI_2 ; // [-1 1]
	if( h >= 0) h /= 2 ; else h = 1 + h/2 ;
    	
    rho = Math.abs(x);
    if(rho >= 1)  // map rho [1 infinity] onto saturation [1--> 0]  (bright = 1)
        	s = 1 - Math.atan(Math.log2(rho)) / PI_2 ; //Math.atan(rho-1) / PI_2 ;
    else 
    		v = Math.pow(rho,0.2) ;  // rho [ 1 -> 0] onto brightness [1 --> 0] (sat = 1)
    	
  if( v > 1 ||  v < 0 ) glisp_error(1,v,"hsV");   
  if( s > 1 ||  s  < 0 ) glisp_error(1,s,"hSv");   
  return _hsv_to_rgb(h,s,v);
} // R to rgb 

/*
what = 0 : hue = t(theta)
xhat = 1 : hue = f(rho)
*/

function __complex_to_rgb (z,what,hgamma,sgamma,vgamma) {
    var  h , s=sgamma , v= vgamma; // default 0.8
    var rho, theta ,re, im ;

	// if(isNaN(z)) return _rgba(0,0,0,0) ; 	
    if(z instanceof Complex) 
    		{ re = z.a ; im = z.b ;}
    		else 
    		{ re = 0 + z ; im = 0; }
    		
     if(re === Infinity || im === Infinity) return _rgba(0,0,0,0) ;
     if(isNaN(re) || isNaN(im)) return _rgba(0,0,0,0) ; // Xparent --> back ground
    
    rho = Math.sqrt(re*re + im*im ) ; 
//    if(rho < _MATH_PRECISION) return _rgb(0,0,0) ; // 0 in black
    theta = Math.atan2(im,re) / PI  ; // [-1 1]
 // hue = f(theta)
	if (! what) { 
	    h = Math.abs(theta);
    	
    	if (rho === 0) return _rgba(0,0,0,0) ; 
    	else if(rho > 1)  // map rho [1 infinity] onto saturation [1--> 0]  (bright = 1)
        	s = 1 - Math.atan(Math.log2(rho)) / PI_2 ; //Math.atan(rho-1) / PI_2 ;
    	else if (rho < 1)  
    		v = Math.pow(rho,0.2) ;  // rho [ 1 -> 0] onto brightness [1 --> 0] (sat = 1)
    	return _hsv_to_rgb (h, s, v) ; // alpha = 1;
    	} // theta in colors
    	
// hue = f(rho)
// map rho [0 .. infinity] to hue [0..1]

	h = Math.atan(rho) / PI_2 ;
    
    // theta
    // s=v=1 for Real  ; s=v=0 for Real < 0

   		if(theta >= 0) 
    			s = 1 - theta; // v = def
    			else
    			v = 1 + theta ; // s = def
  if( v > 1 ||  v < 0 )  glisp_error(1,v,"hsV");   
  if( s > 1 ||  s  < 0 ) glisp_error(1,s,"hSv");   
    return _hsv_to_rgb(h,s,v);
} // complex to rgb 


const _PLOT_TIME_SLICE = 900;
const _PLOT_TIME_SLEEP = 300;

function _plot_xy (fun ,xminmax, yminmax, env,t , ystart, buf8 ,data32) { 
t = t || 0;
 	var canvasWidth  = GPlotter.canvas.width;
    var canvasHeight = GPlotter.canvas.height;
    var ctx = GPlotter.context;
    var imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    var buf; 
    var buf8; 
    var data32;
    var px,py,x,y, fxy;
    var callxy = [fun, [null, [null, [ t || 0  , null]]]] ; // (fun z)
    var env = glisp.user;
    var hgamma = GPlotter.hgamma;
    var sgamma = GPlotter.sgamma;
    var vgamma = GPlotter.vgamma;
    ystart = ystart || 0 ; // first call
    var t0 = Date.now();
    
    _PLOTTING = true;
    if(ystart === 0) { // PROLOGUE
    if(! _ANIMATING && !_ZOOMING)  __plot_push(); // for undo  
    buf = new ArrayBuffer(imageData.data.length);
    buf8 = new Uint8ClampedArray(buf);
    data32 = new Uint32Array(buf);
    __set_plot_xminmax(xminmax);
    __set_plot_yminmax(yminmax);
    GPlotter.call = [_plot_xy,this,fun,xminmax,yminmax,env,t];
	GPlotter.ifun = GPlotter.dfun = GPlotter.fun = GPlotter.zfun =  null ;
	GPlotter.xyfun = fun;
    }
    
    for (y = ystart; y < canvasHeight; ++y) { // TIME SLICED

    	if(Date.now() - t0 > _PLOT_TIME_SLICE) break; // time-slice 2 seconds
    	py = GPlotter.yunscale(y);
    	callxy[1][1][0] = py;
        for (x = 0; x < canvasWidth; ++x) {
        	px = GPlotter.xunscale(x);
        	callxy[1][0] = px;
        	fxy = __ffuncall(callxy,env);
            data32[y * canvasWidth + x] = __R_to_rgb(fxy,hgamma,sgamma,vgamma);
        }
    }
    
    if(y >= canvasHeight || !_PLOTTING) { // CTRl-C interrupt
    imageData.data.set(buf8);
    ctx.putImageData(imageData, 0, 0);   
	if(! _ANIMATING)  __plot_save(); // for image editing
 	 info("");
 	 _PLOTTING=false;
 	 // writeln("plotting 100%.",_STYLE.plist["warning"]);
 	 return GPlotter.interval() ;
 	 }
 	 
 	// restart
 	var restart = 
 		function () {return _plot_xy (fun ,xminmax, yminmax ,env,t , y, buf8 ,data32) ;}
 	var percent = " " + Math.floor(y*100/canvasHeight) + "%" ;
 	
 	setTimeout (restart, _PLOT_TIME_SLEEP);
 	info("plot-xy: " + percent); 
 	// writeln("&#x023F3; plotting ..." + percent,"color:orange");
 	_logo_blink();
 	return GPlotter.interval() ;
} // plot-xy

// Complex functions
// what = 0 : show theta in colors and rho in sat/val
// what = 1 : show rho in colors and theta in sat/val
// http://www.mai.liu.se/~hanlu09/complex/domain_coloring-unicode.html
// (define (f z) (cpoly z '(6 7 8 -6 -5 -4) '(7 -8 -9 3 2 8)))

function __plot_z (fun ,xminmax, yminmax, what,env,t , ystart, buf8 ,data32) { 
t = t || 0;
console.log("PLOT-Z",xminmax,yminmax);
 	var canvasWidth  = GPlotter.canvas.width;
    var canvasHeight = GPlotter.canvas.height;
    var ctx = GPlotter.context;
    var imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    var buf; 
    var buf8; 
    var data32;
    var x,y,z = new Complex(0,0), fz ;
    var callz = [checkProc(fun,1,1,"plot-z"), [z, [ t || 0 , null]]] ; // (fun z)
    var env = glisp.user;
    var hgamma = GPlotter.hgamma;
    var sgamma = GPlotter.sgamma;
    var vgamma = GPlotter.vgamma;
    ystart = ystart || 0 ; // first call
    var t0 = Date.now();
    
    _PLOTTING = true;
    if(ystart === 0) { // PROLOGUE
    if(! _ANIMATING && !_ZOOMING)  __plot_push(); // for undo  
    buf = new ArrayBuffer(imageData.data.length);
    buf8 = new Uint8ClampedArray(buf);
    data32 = new Uint32Array(buf);
    __set_plot_xminmax(xminmax);
    __set_plot_yminmax(yminmax);
    GPlotter.call = [__plot_z,this,fun,xminmax,yminmax,what,env,t];
	GPlotter.ifun = GPlotter.dfun  = GPlotter.fun  = GPlotter.xyfun = null  ;
	GPlotter.zfun = fun;
	glisp_cursor("plotter","crosshair"); // rgb etc NYI
    }
    
    for (y = ystart; y < canvasHeight; ++y) { // TIME SLICED
/*
if(ystart) {
    	imageData.data.set(buf8);
     	ctx.putImageData(imageData, 0, 0);
}
*/

    	if(Date.now() - t0 > _PLOT_TIME_SLICE) break; // time-slice 2 seconds
    	z.b = GPlotter.yunscale(y);
        for (x = 0; x < canvasWidth; ++x) {
        	z.a = GPlotter.xunscale(x);
        	fz = __ffuncall(callz,env);
            data32[y * canvasWidth + x] = __complex_to_rgb(fz,what,hgamma,sgamma,vgamma);
        }
    }
    
    if(y >= canvasHeight || !_PLOTTING) { // CTRl-C interrupt
    imageData.data.set(buf8);
    ctx.putImageData(imageData, 0, 0);   
	if(! _ANIMATING)  __plot_save(); // for image editing
 	 info("");
 	 _PLOTTING=false;
 	  glisp_cursor("plotter","crosshair");
 	 // writeln("plotting 100%.",_STYLE.plist["warning"]);
 	 return GPlotter.interval() ;
 	 }
 	 
 	// restart
 	var restart = 
 		function () {return __plot_z (fun ,xminmax, yminmax, what,env,t , y, buf8 ,data32) ;}
 	var percent = " " + Math.floor(y*100/canvasHeight) + "%" ;
 	
 	setTimeout (restart, _PLOT_TIME_SLEEP);
 	info("plot-z: " + percent); // PANEL BEST NYI
 	glisp_cursor("plotter","wait");
 	// writeln("&#x023F3; plotting ..." + percent,"color:orange");
 	_logo_blink();
 	return GPlotter.interval() ;
} // plot-z

// (plot-z-arg xrange xrange)
var _plot_arg_z = function (fz, xminmax,yminmax) {
	_PLOTTING = false;
	return __plot_z(fz,xminmax, yminmax, 0);
}
var _plot_mod_z = function (fz, xminmax,yminmax) {
	_PLOTTING = false;
	return __plot_z(fz,xminmax, yminmax, 1);
}

// plots function (col x y)
// (col ..) returns (rgb r g b) or (hsv-to-rgb h s v)

function _plot_rgb (rgbxy , xminmax, yminmax, env, t, ystart, buf8, data32)  { // (rgbxy x y) --> #[r g b a]
t = t || 0;
 	var canvasWidth  = GPlotter.canvas.width;
    var canvasHeight = GPlotter.canvas.height;
    var ctx = GPlotter.context;
    var imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    var buf, buf8, data32 ; 
    var callrgb = [rgbxy , [ null, [ null , [t || 0 ,null]]]] ;
    var env = glisp.user;
    var x,y;
    ystart = ystart || 0 ;
    var t0 = Date.now();
   
   _PLOTTING = true;
   if(ystart === 0) { // PROLOGUE
    	__set_plot_xminmax(xminmax);
   	 	__set_plot_yminmax(yminmax);
    	if(! _ANIMATING && !_ZOOMING)  __plot_push(); // for undo
     	buf = new ArrayBuffer(imageData.data.length);
     	buf8 = new Uint8ClampedArray(buf);
     	data32 = new Uint32Array(buf);
    	GPlotter.call = [_plot_rgb,this,rgbxy,xminmax,yminmax,env,t];
    	GPlotter.ifun =  GPlotter.dfun = GPlotter.fun  = GPlotter.xyfun =  GPlotter.zfun = null  ;
    	}
    
    for ( y = ystart; y < canvasHeight; ++y) { 
        if(Date.now() - t0 > _PLOT_TIME_SLICE) break; // time-slice 2 seconds
    	callrgb[1][1][0] = GPlotter.yunscale(y);
        for ( x = 0; x < canvasWidth; ++x) {
        	callrgb[1][0] = GPlotter.xunscale(x);
            data32[y * canvasWidth + x] = __ffuncall(callrgb,env);
        }} // xy
   
    if( y >= canvasHeight || !_PLOTTING) { // Ctrl-C interrupt bigint:NYI
    	info("");
 	 	_PLOTTING=false;
    	imageData.data.set(buf8);
     	ctx.putImageData(imageData, 0, 0);
      	if(! _ANIMATING)  __plot_save(); // for image editing
     	return GPlotter.interval() ;
     	}
     	
     	// restart
 	var restart = 
 		function () {return _plot_rgb (rgbxy ,xminmax, yminmax ,env,t , y, buf8 ,data32) ;}
 	var percent = " " + Math.floor(y*100/canvasHeight) + "%" ;
 	
 	setTimeout (restart, _PLOT_TIME_SLEEP);
 	info("plot-rgb: " + percent); 
 	
 	_logo_blink();
 	return GPlotter.interval() ;
} // _plot_rgb

/*--------------------
pixels <-> vectors
-------------------------*/
var _pixels_dim = function () { // deprecated - use plot-size
	return [ GPlotter.canvas.width , GPlotter.canvas.height ] ;
}

// returns [buf , arr8]
function __pixels_to_buf () {
	var canvasWidth  = GPlotter.canvas.width;
    var canvasHeight = GPlotter.canvas.height;
    var ctx = GPlotter.context;
    var imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    var buf = new ArrayBuffer(imageData.data.length);
    var arr8 = new Uint8ClampedArray(buf);
    
    var lg = imageData.data.length , i , data = imageData.data ;
    for(i=0;i<lg;i++) arr8[i] = data[i];
    
    return [buf, arr8];
    }
    
var _pixels_to_uint32 = function () {
	var buf8 = __pixels_to_buf();
    var V = new  Vector (0) ;
    V.buffer = buf8[0];
    V.type = "uint32";
    V.vector =  new Uint32Array(buf8[0]);
    return V ;
}

var _pixels_to_int32 = function () {
	var buf8 = __pixels_to_buf();
    var V = new  Vector (0) ;
    V.buffer = buf8[0];
    V.type = "int32";
    V.vector =  new Int32Array(buf8[0]);
    return V ;
}

var _pixels_to_uint8 = function () {
	var buf8 = __pixels_to_buf();
    var V = new  Vector (0) ;
    V.buffer = buf8[0];
    V.type = "uint8-clamped";
    V.vector =  buf8[1] ;
    return V ;
}
var _vector_to_pixels = function ( V) {
	var canvasWidth  = GPlotter.canvas.width;
    var canvasHeight = GPlotter.canvas.height;
    var ctx = GPlotter.context;
    var imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    var buf8 = new Uint8ClampedArray(V.buffer);
    imageData.data.set(buf8);
    ctx.putImageData(imageData, 0, 0);
    if(! _ANIMATING)  __plot_save(); // for image editing
	return buf8.length ;
}

// pix[x](y]   := (proc x y)
var _pixels_map = function (proc , V , env) {
	proc = checkProc(proc,2,2,"pixels-map");
	if(V.type !== "int32" && V.type !== "uint32") glisp_error(141,V,"pixels-map");
	var width =  GPlotter.canvas.width  ;
	var height = GPlotter.canvas.height ;
	var vector = V.vector;
	var x,y ;
	var call = [proc, [null, [null ,null]]] ;
	for(y = 0; y < height; y++) {
		call[1][1][0] = y;
		for(x = 0; x < width; x++) {
		call[1][0] = x;
	 	vector[x + y*width] = __ffuncall(call,env) ;
		}}
	return width * height ;
}

/*
(define BB (pixels->int32-vector ))
(pixel-set! BB 0 0 (rgb 1 0 0))
(define (region V x y) (or (< x 12) (< y 6) (= x y) (= x (1- y))))
(make-region region BB 0 0)
(vector->pixels BB)
*/
// return # of pixels in region
function __make_region_1 (rq,rcall,vector,color,w,h,env) {
var x,y, rcount = 0, next = false;
	while (rq.length) {
		y = rq.pop();
		x = rq.pop();
		if(next) {
			 if (vector[x+y*w] === color) continue;
			 rcall[1][1][0] = x ;
			 rcall[1][1][1][0]= y;
			 if(__ffuncall(rcall,env) === _false) continue;
			 vector[x+y*w]=color;
		     }
		rcount++;
		next = true;
		// von Neumann neighborhood 
		if(x > 0) { rq.push(x-1); rq.push(y);}
		if(x < w-1) { rq.push(x+1); rq.push(y);}
		if(y > 0) { rq.push(x); rq.push(y-1);}
		if(y < h-1) { rq.push(x); rq.push(y+1);}
		}
		return rcount;
}

// propagates [x,y] color to all voisins x',y', iff rproc(V x' y') = #t
var _make_region  = function (rproc, V , x, y, env ) {
	rproc = checkProc(rproc,3,3,"make-region");
	if(V.type !== "int32" && V.type !== "uint32") glisp_error(141,V,"make-region");

	var width =  GPlotter.canvas.width  ;
	var height = GPlotter.canvas.height ;
	var vector = V.vector;
	var color = vector[x + y*width];
	var rcall = [rproc, [V ,[null, [null ,null]]]];
	var rcount = [0] ;
	var rq = [x,y] ;
	return __make_region_1(rq,rcall,vector,color,width,height,env);
}

// 	define_sysfun (new Sysfun("plot.pixel-set", _pixel_set,4,4)); // (vector x y  color)
// compile NYI NYI NYI
var _pixel_set= function (V, x, y, color) {
	if(V.type !== "int32" && V.type !== "uint32") glisp_error(141,V,"pixel-set!");
	// clamping NYI
	return (V.vector[x + y * GPlotter.canvas.width ] = color) ;
}
var _pixel_ref= function (V, x, y) {
	if(V.type !== "int32" && V.type !== "uint32") glisp_error(141,V,"pixel-ref");
	// clamping NYI
	return V.vector[x + y * GPlotter.canvas.width ]  ;
}

/*------------------
HILBERT
// http://en.wikipedia.org/wiki/Hilbert_curve
in : m = 2^p, (x,y)  in (0..n-1)
out : d  in [0..n^2-1]
-------------------------*/

function _hilbert_to_d (x,y,m) { // n must be 2^p
// check types/values NYI
if(x >= m ) return m*m;
if(y >= m)  return m*m;
var rx, ry, s, d=0, t;

    for (s=m/2; s>=1; s/=2) {
        rx = ((x & s) > 0) ? 1 : 0 ;
        ry = ((y & s) > 0) ? 1 : 0 ;

        d += s * s * ((3 * rx) ^ ry);
      //  rot(s, &x, &y, rx, ry);
      if (ry === 0) {
        if (rx === 1) {
        	x = s-1 - x;
            y = s-1 - y;
        	}
        //Swap x and y
        t  = x;
        x = y;
        y = t;
    	} // rot
    } // for s
    
    return d;
}
	
// plots rgbn(d [nmax [t]) d in [dmin ... dmax]
// d interval aligned to n =  m ^ 2 = (2^p) ^ 2

function _plot_hilbert (rgbn , dminmax,  env, t, ystart, buf8, data32)  { 
t = t || 0;
 	var canvasWidth  = GPlotter.canvas.width;
    var canvasHeight = GPlotter.canvas.height;
    var ctx = GPlotter.context;
    var imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    var buf, buf8, data32 ; 
    
    var env = glisp.user;
    var x,y ; // pixel
    ystart = ystart || 0 ;
    var t0 = Date.now();
    var nmin = __arg_min(dminmax);
    var nmax = __arg_max(dminmax);
    // n = m * m , m = 2^p + 1
    var n , m = 1 , e  ; 
    for(e = 1 ; e < 12 ; e++) {
    	m *= 2 ;
    	n = m*m ;
    	if(n >= (nmax-nmin)) break;
    }
    var callrgb = [rgbn , [ null, [n + nmin , [ t  || 0, null]]]] ;
	
	var dx = canvasWidth / m ;
	dx = Math.floor(dx/2);
	var dy = canvasHeight / m ;
	dy = Math.floor(dy/2);
    
//console.log("HILBERT","m",m,"n",n,"dx",dx,"dy",dy);
   _PLOTTING = true;
   if(ystart === 0) { // PROLOGUE
    	__set_plot_xminmax(m); // informative only
   	 	__set_plot_yminmax(m);
    	if(! _ANIMATING && !_ZOOMING)  __plot_push(); // for undo
     	buf = new ArrayBuffer(imageData.data.length);
     	buf8 = new Uint8ClampedArray(buf);
     	data32 = new Uint32Array(buf);
    	GPlotter.call = [_plot_hilbert,this,rgbn,dminmax,env,t];
    	GPlotter.ifun =  GPlotter.dfun = GPlotter.fun  = GPlotter.xyfun =  GPlotter.zfun = null  ;
    	}
    
	var d  ;
	var  ix,iy;
	var  color, xL,xH,yL,yH ;
	
	for(ix=0;ix<m;ix++)
	for(iy=0;iy<=m;iy++) {
		d = _hilbert_to_d(ix,iy,m);
		callrgb[1][0] = d + nmin ;
		color =  __ffuncall(callrgb,env);
		
	x = __linear (ix , 0, m-1 , dx, canvasWidth-1-dx);
	y = __linear (iy , 0, m-1 , dy, canvasHeight-1-dy);
	x = Math.floor(x);
	y = Math.floor(y);

	
	xL = x - dx; xL = Math.max (xL, 0);
	yL = y - dy; yL = Math.max (yL, 0);
	xH = x + dx + 1; xH = Math.min (xH, canvasWidth-1);
	yH = y + dy + 1; yH = Math.min (yH, canvasHeight-1);
	
		for(x = xL; x <=  xH ; x++)
		for(y = yL ; y <= yH ; y++) data32[y * canvasWidth + x] = color ;
	}
	
		 _PLOTTING = false;
 		imageData.data.set(buf8);
     	ctx.putImageData(imageData, 0, 0);
      	if(! _ANIMATING)  __plot_save(); // for image editing
 return [nmin, [nmin + n -1 , null ]] ;
} // _plot_hilbert

// plots rgbn(d  [ nmax [t]]) d in [nmin ... nmax]
// d interval aligned to n =  m ^ 2 = (2p +1) ^ 2

function _plot_spiral (rgbn , dminmax,  env, t, dstart, buf8, data32)  { 
t = t || 0;
 	var canvasWidth  = GPlotter.canvas.width;
    var canvasHeight = GPlotter.canvas.height;
    var ctx = GPlotter.context;
    var imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    var buf, buf8, data32 ; 
    var env = glisp.user;
    var x,y ; // pixel
    dstart = dstart || 0 ;
    var t0 = Date.now();
    var nmin = __arg_min(dminmax);
    var nmax = __arg_max(dminmax);
    var p  = Math.floor(Math.sqrt(nmax-nmin)/2) ;
    p = Math.max(p, 1);
    var m = 2 * p + 1 ;
    var n = m * m ; // d will be [nmin ... nmin + n - 1]
    var dirx = [1,0,-1,0] ; // right/up/left/down
	var diry = [0,1,0,-1] ;
	var callrgb = [rgbn , [ null, [n + nmin  , [t || 0 ,null]]]] ;
	
	var dx = canvasWidth / m ;
	dx = Math.floor(dx/2);
	var dy = canvasHeight / m ;
	dy = Math.floor(dy/2);
    
//console.log("SPIRAL","m",m,"n",n,"dx",dx,"dy",dy);
   _PLOTTING = true;
   if(dstart === 0) { // PROLOGUE
    	__set_plot_xminmax(m); // informative only
   	 	__set_plot_yminmax(m);
    	if(! _ANIMATING && !_ZOOMING)  __plot_push(); // for undo
     	buf = new ArrayBuffer(imageData.data.length);
     	buf8 = new Uint8ClampedArray(buf);
     	data32 = new Uint32Array(buf);
    	GPlotter.call = [_plot_spiral,this,rgbn,dminmax,env,t];
    	GPlotter.ifun = GPlotter.fun  = GPlotter.xyfun =   GPlotter.dfun = GPlotter.zfun = null  ;
    	}
    
	var d  ;
	var  ix= 0, iy = 0 , minx = 0, maxx = 0, maxy = 0 , miny = 0,  direction = 0 ;
	var  color, xL,xH,yL,yH ;
	
	for(d = 0 ; d < n ; d++) {
	x = __linear (ix , -p, p , dx, canvasWidth-1-dx);
	y = __linear (iy , -p, p , dy, canvasHeight-1-dy);
	x = Math.floor(x);
	y = Math.floor(y);
// console.log("plot-spiral at ",x,y);
	callrgb[1][0] = d + nmin ;
	color =  __ffuncall(callrgb,env);
	
	xL = x - dx; xL = Math.max (xL, 0);
	yL = y - dy; yL = Math.max (yL, 0);
	xH = x + dx + 1; xH = Math.min (xH, canvasWidth-1);
	yH = y + dy + 1; yH = Math.min (yH, canvasHeight-1);
	
		for(x = xL; x <=  xH ; x++)
		for(y = yL ; y <= yH ; y++) data32[y * canvasWidth + x] = color ;
		
		ix += dirx[direction]; // ix in [-p  p]
		iy += diry[direction];

		if ( ix < minx) { minx = ix ; direction = (direction+1) % 4;}
		if ( ix > maxx) { maxx = ix ; direction = (direction+1) % 4;}
		if ( iy < miny) { miny = iy ; direction = (direction+1) % 4;}
		if ( iy > maxy) { maxy = iy ; direction = (direction+1) % 4;}
//  console.log("ULAM",ix,iy,"d",d,"xminmax",minx,maxx,"yminmax",miny,maxy) ;
	}
	
		 _PLOTTING = false;
 		imageData.data.set(buf8);
     	ctx.putImageData(imageData, 0, 0);
      	if(! _ANIMATING)  __plot_save(); // for image editing
 return [nmin, [nmin + n -1 , null ]] ;
} // _plot_spiral



// BIT-MAPS
// http://jsperf.com/canvas-pixel-manipulation/125
const _OPAQUE = (255 << 24)
const _CMASK = 0x000000ff;

var _rgb_to_list = function (rgb) {
return __array_to_list
([rgb & 0x0000ff, (rgb >> 8) & 0x000000ff, (rgb >> 16) & 0x000000ff, (rgb >> 24) & 0x000000ff]) ;
}

var _rgb_to_string = function (rgb) { // -> #rrggbb
	var a = (rgb >> 24) & 0x000000ff ;
	if(a !== 1) return _rgba_to_string (rgb);
	var r = rgb & 0x0000ff;
	var g = (rgb >> 8) & 0x000000ff ;
	var b = (rgb >> 16) & 0x000000ff ;
	return "#" + 
		("0" + r.toString(16)).slice(-2) +
		("0" + g.toString(16)).slice(-2) +
		("0" + b.toString(16)).slice(-2) ;
	}
	
var _rgba_to_string = function (rgba) { // -> #rrggbbaa
	var r = rgba & 0x0000ff;
	var g = (rgba >> 8) & 0x000000ff ;
	var b = (rgba >> 16) & 0x000000ff ;
	var a = (rgba >> 24) & 0x000000ff ;
	return "rgba(" + r +"," + g + "," + b + "," + (a/255) + ")";
	}
		

function _rgb (r, g, b ) { // in : [0..1]**3 : out rgba word a= 255
	return _OPAQUE | // constant 
	((b * 255) << 16)  |
	((g * 255) << 8)   |
	((r * 255) & 0xff)  ;
}

/*
moved to inline
function _rgba (r, g, b, a ) { // in : [0..1]**4
	a = a || 0 ;
	return ((a * 255) << 24) | 
	((b * 255) << 16)  |
	((g * 255) << 8)   |
	((r * 255) & 0xff)  ;
}
*/

function _rgb_clamp (r, g, b) { // in : [0..1]**3
	r= Math.abs(r); g = Math.abs(g); b = Math.abs(b); 
	if(r >1) r=1; if(g > 1) g = 1; if(b > 1) b = 1; 
	return _OPAQUE | 
	((b * 255) << 16)  |
	((g * 255) << 8)   |
	((r * 255) & 0xff)  ;
}

function _rgba_abs (r, g, b, a ) { // in : [0..1]**4
	r= Math.abs(r); g = Math.abs(g); b = Math.abs(b); a = Math.abs(a);
	return ((a * 255) << 24) | 
	((b * 255) << 16)  |
	((g * 255) << 8)   |
	((r * 255) & 0xff)  ;
}
function _rgba_clamp (r, g, b, a ) { // USER rgba() fun
	r= Math.abs(r); g = Math.abs(g); b = Math.abs(b); a = Math.abs(a);
	if(r >1) r=1; if(g > 1) g = 1; if(b > 1) b = 1; if(a > 1) a = 1;
	return ((a * 255) << 24) | 
	((b * 255) << 16)  |
	((g * 255) << 8)   |
	((r * 255) & 0xff)  ;
}

// COLORS
/**
 * Converts an HSV color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
 * Assumes h, s, and v, and a  are contained in the set [0, 1] and
 * returns rgb integer.
 * returns alpha = 1
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  v       The value
 * @return  Array           The RGB representation
 */

function _hsv_clamp_to_rgb (h, s , v) {//  USER (hsv ..)
	h=Math.abs(h); s = Math.abs(s); v = Math.abs(v);
	if(h > 1) h = h - Math.floor(h);
	if(s > 1) s=1;
	if(v > 1) v=1;
	return _hsv_to_rgba (h, s , v , 1) ;
}

function _hsv_to_rgb (h,s,v) {
	return _hsv_to_rgba(h,s,v,1) ;
}

function _hsv_to_rgba (h, s, v ,a ){
    var r, g, b;

    var i = Math.floor(h * 6);
    var f = h * 6 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);

    switch(i % 6){
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }

    return ((a *255) << 24) | 
	((b * 255) << 16)  |
	((g * 255) << 8)   |
	((r * 255) & 0xff)  ;
} // _hsv_to_rgb

function _rgb_to_hsv (r, g, b) { // in: [0..1]**3
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, v = max;

    var d = max - min;
    s = max === 0 ? 0 : d / max;

    if(max == min){
        h = 0; // achromatic
    }else{
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h, s, v];
}

var _gray = function ( g ) {
	g = Math.max(0 , (Math.min (g , 1)));
	return _rgb (g,g,g) ;
}

// adjust gamma for h,s,v
// (plot-gamma [hgamma|null [sgamma|null [vgamma|null]]])
var _plot_gamma = function (top,argc) {
	var gamma = [GPlotter.hgamma , [ GPlotter.sgamma , [ GPlotter. vgamma, null]]];
	if(argc >= 1 && _stack[top] !== null) GPlotter.hgamma = gamma[0]= _stack[top];
	if(argc >= 2 && _stack[top+1] !== null) GPlotter.sgamma = gamma[1][0]= _stack[top+1];
	if(argc >= 3 && _stack[top+2] !== null) GPlotter.vgamma = gamma[1][1][0]= _stack[top+2];
	return gamma;
}

/*-------------------------------------------------------
data eries
- canonical format : #( {xvalue.yvalue} {xvalue.yvalue}  ...)
- time serie : xvalue = number seconds elapsed since 1970
---------------------------------------------------*/

function __ds_convert_date(date) {
var seconds ;
	if(typeof date === "number") return date ; // assumes seconds or any xvalue
	if(date instanceof Date) return Math.round(date.getTime()/1000); 
	if(typeof date === "string") {
			date =  __fr_to_date_string(date); // accept 1/6/2015
			seconds =  new Date(date) ; 
			seconds = Math.round(seconds.getTime()/1000); 
			if(!isNaN(seconds)) return seconds;
			}
	glisp_error(76 ,date,"time-serie:date") ;
}

// input {xvalue.yvalue} or Vector [xvalue, yvalue] or (xvalue yvalue rest)
// returns a NEW Pair {xvalue . yvalue}
// checks yvalue is a number : NYI NYI

function __ds_convert (ds_item) {
var val ;
	if(ds_item instanceof Vector)  
		return [ __ds_convert_date (ds_item.vector[0]) , ds_item.vector[1]] ; // { time.value}
	if(Array.isArray(ds_item))  {   
		val = ds_item[1];
		if(Array.isArray(val)) val = val[0]; // true list
		return  [ __ds_convert_date(ds_item[0]) ,val]  ;
		}
	glisp_error (87, ds_item, "data-serie:item");
}

// input: js array of {time.value} or Vector [time, value]
// return ts = NEW sorted canonical vector or raises error
// sets   ts.canonical = true ;
function __ds_from_jsarray(array) {
	var lg = array.length, i , item,  ds = [] ;
	
	var ds_sort = function(a,b) {
		return a[0] - b[0] ;
	}
	for(var i = 0 ; i < lg ; i++) 
		ds.push(__ds_convert(array[i])) ; // no conversion if numbers

	// sort me
	ds.sort(ds_sort);
	ds = new Vector(ds);
	ds._DS_ = true;
	return ds;
}

// accepts Vector of Vectors[2] or lists of {pairs} in input
// return NEW sorted normalized vector or raises error
// a ds  normalized vector must be READ-ONLY : NYI (modif in vector-set)

var _data_serie = function ( obj , caller) {
	if(obj instanceof Vector) {
						if(obj._DS_) return obj; // already done
						return __ds_from_jsarray (obj.vector);
						}
	if(isListNotNull(obj)) return __ds_from_jsarray(__list_to_array(obj)) ;
	glisp_error(87,obj,caller || "data-serie");
}


// linear interpolation if not found
// input jsarray : ds
function __ds_interpolate (ds, ifrom, ito , xvalue) {
var icut;
	if(ito < ifrom) return glisp_error(1,ds,"data-serie-get") ;
	if(ifrom === ito) return ds[ifrom][1];
	if(xvalue <= ds[ifrom][0]) return ds[ifrom][1] ;
	if(xvalue >= ds[ito][0]) return ds[ito][1];
	if(ito === ifrom+1) 
		return __linear( xvalue, ds[ifrom][0], ds[ito][0], ds[ifrom][1], ds[ito][1]) ;
	icut = Math.floor((ifrom+ito)/2);
	if(xvalue <= ds[icut][0]) return __ds_interpolate(ds,0,icut,xvalue);
	return __ds_interpolate(ds,icut,ito,xvalue);
}

// (define tt (data-serie '((100 100) (200 200) (500 500) (1000 1000) (0 0))))
// interpolating a data serie
// input : ss (normalized or not)

var  _data_serie_get  = function (ds , xvalue) {
	ds = _data_serie(ds); // normalize if needed
	xvalue = __ds_convert_date(xvalue);
	ds = ds.vector ;
	return __ds_interpolate(ds, 0, ds.length-1, xvalue) ;
}

// return ((xmin xmax) (yminymax))
var _data_serie_minmax  = function (ds) {
var i, lg, ymin = +Infinity, ymax = -Infinity, yvalue;
	ds = _data_serie(ds); // normalize if needed
	ds = ds.vector ;
	lg = ds.length;
	for(var i=0; i<lg; i++) {
			yvalue = ds[i][1] ;
			if(yvalue > ymax) ymax = yvalue;
			if(yvalue < ymin) ymin = yvalue ;
			}
	return [[ds[0][0] , [ ds[lg-1][0] , null]] , [[ymin,[ymax,null]] , null]] ;
}
var _data_serie_x  = function (ds , n) {
	ds = _data_serie(ds);
	return ds.vector[n][0];
	}
var _data_serie_y  = function (ds , n) {
	ds = _data_serie(ds);
	return ds.vector[n][1];
	}



/*-------------------------------------------------------
images
https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Using_images
http://www.html5rocks.com/en/tutorials/file/dndfiles/
---------------------------------------------------------*/

function boot_plotter() {
     	define_sysfun(new Sysfun ("plot.plot-init",_plot_init,0,0));
        define_sysfun(new Sysfun ("plot.plot-on",_plot_on,0,0));
        define_sysfun(new Sysfun ("plot.plot-off",_plot_off,0,0));
        define_sysfun(new Sysfun ("plot.plot-clear",_plot_clear,0,0));
        define_sysfun(new Sysfun ("plot.plot-undo",_plot_undo,0,0));
        define_sysfun(new Sysfun ("plot.plot-edit",__plot_save,0,0)); // active sliders
        define_sysfun(new Sysfun ("plot.plot-size",_plot_size,0,2)); // in io.js

        // define_sysfun(new Sysfun ("plot.plot-interval",_plot_interval,2,2));
        
       /* define_sysfun(new Sysfun ("plot.plot-list",_plot_list,1,1)); // (plot list ) [0..n]
        define_sysfun(new Sysfun ("plot.plot-vector",_plot_vector,1,1)); // (plot list ) [0..n] */

        define_sysfun(new Sysfun ("plot.plot-minmax",_plot_minmax,0,0)); // get NEW
        define_sysfun(new Sysfun ("plot.plot-x-minmax",_plot_x_minmax,1,1)); // sets
        define_sysfun(new Sysfun ("plot.plot-y-minmax",_plot_y_minmax,1,1));
        define_sysfun(new Sysfun ("plot.plot-color",_plot_color,1,1));
        define_sysfun(new Sysfun ("plot.plot-background",_plot_background,1,1));
        define_sysfun(new Sysfun ("plot.plot-fill-color",_plot_fill_color,1,1));
        define_sysfun(new Sysfun ("plot.plot-line-width",_plot_line_width,1,1));
        
// drawing
		// define_sysfun(new Sysfun ("plot.plot-path",_plot_path,3,4));
        define_sysfun(new Sysfun ("plot.plot-rect",_plot_rect,4,4)); // fill
        define_sysfun(new Sysfun ("plot.plot-font",_plot_font,1,1));
        define_sysfun(new Sysfun ("plot.plot-text",_plot_text,3,4)); // text x y [color]
        define_sysfun(new Sysfun ("plot.plot-axis",_plot_axis,0,3));
        define_sysfun(new Sysfun ("plot.plot-grid",_plot_grid,0,3));
       // define_sysfun(new Sysfun ("plot.plot-dot",_plot_dot,3,3));
        define_sysfun(new Sysfun ("plot.plot-circle",_plot_circle,3,3)); // (x,y r:pixels)
        define_sysfun(new Sysfun ("plot.plot-square",_plot_square,3,3)); // (x,y w:pixels)
        define_sysfun(new Sysfun ("plot.plot-segment",_plot_segment,4,4)); // (x,y ,x1,y1)
        define_sysfun(new Sysfun ("plot.plot-arc",_plot_arc,5,6)); 
        
        define_sysfun(new Sysfun ("plot.make-gradient",_make_gradient,4,4)); 
        define_sysfun(new Sysfun ("plot.make-circular-gradient",_make_circular_gradient,6,7)); 
        define_sysfun(new Sysfun ("plot.gradient-add-stop",_gradient_add_stop,3,3)); // (g,x,color)
        

// colors
 		define_sysfun(new Sysfun ("plot.rgb->list",_rgb_to_list,1,1));
        define_sysfun(new Sysfun ("plot.rgb",_rgb_clamp,3,3));
		define_sysfun(new Sysfun ("plot.rgba",_rgba_clamp,4,4));
		define_sysfun(new Sysfun ("plot.gray",_gray,1,1));
        define_sysfun(new Sysfun ("rgba-abs",_rgba_abs,4,4));
        //define_sysfun(new Sysfun ("plot.rgba-clamp",_rgba_clamp,4,4));
        define_sysfun(new Sysfun ("plot.hsv->rgb",_hsv_clamp_to_rgb,3,3));
        define_sysfun(new Sysfun ("plot.hsva->rgb",_hsv_to_rgba,4,4)); // DOC
        define_sysfun(new Sysfun ("plot.plot-gamma",_plot_gamma,0,3));
        
// curves
        define_sysfun(new Sysfun ("plot.plot-steps",_plot_steps,1,1));
        define_sysfun(new Sysfun ("plot.plot",_plot_draw,2,2)); // (plot f (xmin,xmax))

        define_sysfun(new Sysfun ("plot.plot-sequence",_plot_sequence,2,2)); // (plot u(n)) [0..n]
        define_sysfun(new Sysfun ("plot.plot-param",_plot_param,3,3));
        define_sysfun(new Sysfun ("plot.plot-polar",_plot_polar,3,3));
        define_sysfun(new Sysfun ("plot.plot-xy",_plot_xy,3,3));
        define_sysfun(new Sysfun ("plot.plot-dots",_plot_dots,2,2)); // (cloud , char)
        define_sysfun(new Sysfun ("plot.plot-z-arg",_plot_arg_z,3,3)); 
        define_sysfun(new Sysfun ("plot.plot-z-mod",_plot_mod_z,3,3)); 

        define_sysfun(new Sysfun ("plot.plot-rgb",_plot_rgb,3,3));
        define_sysfun(new Sysfun ("plot.plot-hilbert",_plot_hilbert,2,2)); // maps R^2 to N NEW
        define_sysfun(new Sysfun ("plot.plot-spiral",_plot_spiral,2,2)); // maps R^2 to N NEW NEW
 
        define_sysfun(new Sysfun ("plot.plot-animate",_plot_animate,1,1)); // (plot-animate sec)
        
// typed arrays
		// -> (width . height)
		define_sysfun(new Sysfun("plot.pixels-dim",_pixels_dim,0,0)) ; 
		define_sysfun(new Sysfun("plot.pixels->uint8-clamped-vector",_pixels_to_uint8,0,0)) ; 
		define_sysfun(new Sysfun("plot.pixels->uint32-vector",_pixels_to_uint32,0,0)) ; 
		define_sysfun(new Sysfun("plot.pixels->int32-vector",_pixels_to_int32,0,0)) ; 
		define_sysfun(new Sysfun("plot.vector->pixels",_vector_to_pixels,1,1)) ; 
		define_sysfun (new Sysfun("plot.pixels-map", _pixels_map, 2,2)); // (proc:2:2 vector)
		define_sysfun (new Sysfun("plot.make-region", _make_region, 4,4)); // (proc:3:3 vector x0 y0)
		define_sysfun (new Sysfun("plot.pixel-set!", _pixel_set,4,4)); // (vector x y  color)
		define_sysfun (new Sysfun("plot.pixel-ref", _pixel_ref,3,3)); // (vector x y)
		
// utilities
        define_sysfun(new Sysfun ("plot.s-curve",_s_curve,2,2));
        define_sysfun(new Sysfun ("plot.linear",_linear,3,5)); // (x,xmin,xmax, [ymin,ymax]) 0,1 
        define_sysfun(new Sysfun ("plot.smoothstep",_smoothstep,1,1));
        define_sysfun(new Sysfun ("plot.fminmax",_fminmax,2,2)); // (fminmax f xrange) -> yrange NEW
        
// time/data-series // DOC NYI
		 define_sysfun(new Sysfun ("plot.data-serie",_data_serie,1,1)); // normalizes
		 define_sysfun(new Sysfun ("plot.time-serie",_data_serie,1,1)); // converts & normalizes 
		 define_sysfun(new Sysfun ("plot.data-serie-minmax",_data_serie_minmax,1,1)); 
		 define_sysfun(new Sysfun ("plot.data-serie-get",_data_serie_get,2,2)); // interpolates
		 define_sysfun(new Sysfun ("plot.data-serie-x",_data_serie_x,2,2)); // n-th x
		 define_sysfun(new Sysfun ("plot.data-serie-y",_data_serie_y,2,2)); // n-th y

// serie [delta [interval]]
		  define_sysfun(new Sysfun ("plot.plot-time-serie",_plot_time_serie,1,3)); 

		
// internal
        define_sysfun(new Sysfun ("plot-variant",_plot_variant,1,1)); // internal
 		writeln("plot.lib V2.53","color:green") ;
        _LIB["plot.lib"] = true;
        
        _plot_on(); // atry to auto open
}

boot_plotter();
__cells_update_buttons();





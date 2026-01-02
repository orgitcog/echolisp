/*
plotting
 https://hacks.mozilla.org/2011/12/faster-canvas-pixel-manipulation-with-typed-arrays/
*/

/*----------------------
sliders
---------------------*/
function __s_value(num) {
	var slider = document.getElememntById('s' + num) ;
	return slider.value;
}

function __plot_slider(num, value) { // onchange
	switch(num) {
	case 0 : __time_slider(value); break;
	case 1 :
	case 2 : 
	case 3 : __hsv_slider(__s_value(0),__s_value(1),__s_value(2)); break;
}

function __time_slider(value) {
}
/*----------------------
plotter
----------------*/

var GPlotter = {
		status : false, // on-off
        canvas : null,
        context : null,
        fun : null, // list to draw
        tmin : 0,
        tmax : 1,
        xminmax : null, // user
        yminmax : null,
        xmin:-1, xmax:1,
        ymin:-1, ymax:1,
        steps : 500,
        strokeStyle : 'yellow' ,
        fillStyle : 'white' ,
        lineWidth : 1,
        font : "16px verdana" ,
        duration : 0 ,  // anim duration
        start : 0 , // anim start
        imgData : [] ,

	xunscale : function (x) {return map (x,0,this.canvas.height,this.xmin,this.xmax);},
    yunscale : function (y) {return map (y,0,this.canvas.height,this.ymax,this.ymin);},
    xscale : function (x) {return map (x,this.xmin,this.xmax,0,this.canvas.height);},
    yscale : function (y) {return map (y,this.ymax,this.ymin,0,this.canvas.height);},
    moveTo : function(x,y) {this.context.moveTo(this.xscale(x),this.yscale(y));},
    lineTo : function(x,y) {this.context.lineTo(this.xscale(x),this.yscale(y));},
    } ;

function _plot_init (width, height) { // boot time
    width = width || 408;
    height = height || 408;
    GPlotter.canvas   = document.getElementById("plotter");
    GPlotter.canvas.width=width;
    GPlotter.canvas.height=height;
    // change #output height itou NYI
    GPlotter.canvas.style.left = "100px"; // compute - NYI
    GPlotter.context = GPlotter.canvas.getContext('2d');
    GPlotter.context.lineWidth = GPlotter.lineWidth;
    GPlotter.context.strokeStyle = GPlotter.strokeStyle;
    GPlotter.context.fillStyle = GPlotter.fillStyle;
    GPlotter.canvas.addEventListener("mousemove",plot_event, false);
    GPlotter.imgData = [];
}

var __plot_save = function () {
	GPlotter.imgData.push(
	GPlotter.context.getImageData(0,0,GPlotter.canvas.width,GPlotter.canvas.height));
	return GPlotter.imgData.length;
}
var _plot_undo = function () {
	if(GPlotter.imgData.length === 0) return;
	GPlotter.context.putImageData(GPlotter.imgData[GPlotter.imgData.length-1],0,0);
	GPlotter.imgData.length -= 1 ;
	return GPlotter.imgData.length;
}

function plot_event (evt) {
		if(!GPlotter.status) return;
        var rect = GPlotter.canvas.getBoundingClientRect();
        var x = evt.clientX - rect.left;
        var y = evt.clientY - rect.top;
        x = GPlotter.xunscale(x);
        y = GPlotter.yunscale(y);
  		info("x:" + round100(x) + " y:" + round100(y));
      }

function plot_toggle() {
	if(GPlotter.status) _plot_off(); else _plot_on();
}
var _plot_on = function () {
	GPlotter.status = true;
    GPlotter.canvas.style.display = "" ;
    stdout.style.display = "none";
    return _true;
}
var _plot_off = function () {
	stdout = document.getElementById("stdout");
	GPlotter.status = false;
    GPlotter.canvas.style.display = "none" ;
    stdout.style.display = "";
    return _true;
    }


var _plot_clear = function () {
    GPlotter.canvas.width = GPlotter.canvas.width ;
    GPlotter.imgData = [];
    return _true;
}


var _plot_x_minmax = function (xminmax) {
        GPlotter.xminmax = xminmax; // null means 'auto'
        if(isListNotNull(xminmax)) 
        	{GPlotter.xmin = xminmax[0]; GPlotter.xmax = xminmax[1][0]; }
        	else GPlotter.xminmax = null; // (plot-x-minmax 'auto)
        return GPlotter.xminmax;
}
var _plot_y_minmax = function (yminmax) {
        GPlotter.yminmax = yminmax;
         if(isListNotNull(yminmax)) 
        	{GPlotter.ymin = yminmax[0]; GPlotter.ymax = yminmax[1][0]; }
            else GPlotter.yminmax = null; // (plot-x-minmax 'auto)
        return GPlotter.yminmax;
}

var _plot_steps = function (steps) {
        if(steps) GPlotter.steps = steps ;
        return GPlotter.steps;
}
var _plot_color = function (color) {
        if(color) GPlotter.strokeStyle = color ;
        return GPlotter.strokeStyle;
}
var _plot_fill = function (color) {
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

var _plot_axis = function (x, y , color , ingrid) { 
    var ctx = GPlotter.context;
    if(!ingrid) __plot_save();
     ctx.save();
     ctx.lineWidth = 1 ;
     if (!color) color = GPlotter.strokeStyle;
     ctx.strokeStyle = color ;
     		
     x = Math.round(GPlotter.xscale(x));
     y = Math.round(GPlotter.yscale(y));
     
    	ctx.beginPath();
    	ctx.moveTo(x,0);
    	ctx.lineTo(x,GPlotter.canvas.height);
    	ctx.closePath();
    	ctx.stroke();

    	ctx.beginPath();
       	ctx.moveTo(0,y);
        ctx.lineTo(GPlotter.canvas.width,y);
        ctx.closePath();
    	ctx.stroke();
    	
    ctx.fillStyle = color;
    if(! ingrid) ctx.fillRect(x-2,y-2,5,5);
    
	ctx.restore();
return [x, [y,null]] ; // dbg
}

var _plot_grid = function(xunit,yunit , color) {
    var i,j,x,y ;
    var xmin = GPlotter.xmin,xmax=GPlotter.xmax,ymin=GPlotter.ymin,ymax=GPlotter.ymax ;
    var width = GPlotter.canvas.width;
    var height = GPlotter.canvas.height;
    __plot_save();
    for(x=0;; x += xunit) {
    if(GPlotter.xscale(x) > width) break;
    for(y=0;; y += yunit) {
     	if(GPlotter.yscale(y) < 0 ) break;
    	if(x >= xmin || y >= ymin)
    	_plot_axis(x,y,color,true); // ingrid
//console.log("plot-axis",x,y);
    }}
    
    for(x=0;; x -= xunit) {
    if(GPlotter.xscale(x) < 0 ) break;
    for(y=0;; y -= yunit) {
    	if(GPlotter.yscale(y) > height ) break;
    	if(x <= xmax || y <= ymax)
    	_plot_axis(x,y,color,true); // ingrid
//console.log("plot-axis",x,y);
	}}
    return _true;
} // _plot_grid

var _plot_rect = function(x,y,x1,y1) { 
    var ctx = GPlotter.context;
    __plot_save();
    ctx.fillStyle = GPlotter.fillStyle;
    x = GPlotter.xscale(x);
    y = GPlotter.yscale(y);
    var w = GPlotter.xscale(x1) - x;
    var h = GPlotter.yscale(y1) - y;
    ctx.fillRect(x ,y , w , h);
    
	return _true;	
}

var _plot_text = function(text, x, y, color ) { 
	var ctx=GPlotter.context;
	__plot_save();
	x = GPlotter.xscale(x);
    y = GPlotter.yscale(y);

	ctx.save();
	ctx.font = GPlotter.font;
	if(color) ctx.fillStyle = color ;
			else ctx.fillStyle = GPlotter.fillStyle;
	ctx.fillText(text,x ,y );
	ctx.restore();
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

// frames/sec
function _plot_animate (fun , xminmax , duration) {
window.requestAnimationFrame = window.requestAnimationFrame 
	|| window.mozRequestAnimationFrame 
	|| window.webkitRequestAnimationFrame 
	|| window.msRequestAnimationFrame;

	var imgData=GPlotter.context.getImageData(0,0,GPlotter.canvas.width,GPlotter.canvas.height);

	__set_minmax(fun,xminmax,true); // sample x and t
	GPlotter.start = null;
	GPlotter.duration = duration; // msec

	function step (timestamp) {
		if(GPlotter.start === null) GPlotter.start = timestamp;
		var progress = (timestamp-GPlotter.start) / GPlotter.duration; // [0..1]
		GPlotter.context.putImageData(imgData,0,0);
		_plot_draw  (fun ,null , progress); 
		if(progress <=1)  requestAnimationFrame(step);
		} // step function
		
	 requestAnimationFrame(step);
	 var yminmax= [GPlotter.ymin, [GPlotter.ymax, null]];
	 xminmax = [GPlotter.xmin, [GPlotter.xmax, null]];
	 return [xminmax, [yminmax, null]];
}

// sets GPlotter xmin,xmax,ymin,ymax before drawing
//samples ximinmax interval and tminmax  [0 1] interval if any
function __set_minmax(fun, xminmax, tminmax) {
    var ymax = -Infinity ;
    var ymin = Infinity ;
	var i,x,y,dx, env = glisp.user;
	var t0 = 0, t1=0, dt = 2;
	
    var call = [fun, [null, [null, null] , null]] ; // (fun x [t])
	if(tminmax) {t1=1; dt = 0.01; } // 100 t steps

	   	GPlotter.xmin = xminmax[0];
    	GPlotter.xmax = xminmax[1][0];
    	dx = (GPlotter.xmax - GPlotter.xmin) / 100 ;
    	
   		if(GPlotter.yminmax === null)  {
   		for(t=t0; t<=t1; t+=dt) {
        	// auto ymin/max (100 steps to get ymin/max)
        	call[1][1][0]= t;
    		x = GPlotter.xmin;
    		for( i = 0 ; i <= 100; i++) {
        		call[1][0] = x;
       			y = __ffuncall(call,env);
       			if(typeof y === "number") {
        			if(y < ymin) ymin = y;
        			if(y > ymax) ymax = y ;
        			}
        			x += dx; 
    			}}
    			
    		GPlotter.ymin = ymin; // remember for animate
    		GPlotter.ymax = ymax;
    		} // yminmax
console.log("__setminmax",GPlotter.xmin,GPlotter.xmax,GPlotter.ymin,GPlotter.ymax) ;
}

// CURVES
// t is hidden param for animate
// xminmax === null --> animation


function _plot_draw (fun ,xminmax, t) { 
    var i,x,y,dx;
    if(!t) t = 0;
    
    var call = [fun, [null, [null, null] , null]] ; // (fun x [t])
    if(xminmax) __plot_save();

    call [1][1][0] = 0;  // t = 0 to get min-max
    
    if(xminmax) __set_minmax(fun,xminmax,false);
 	
        var ctx = GPlotter.context;
        ctx.lineWidth = GPlotter.lineWidth;
        ctx.strokeStyle = GPlotter.strokeStyle;
        ctx.beginPath();

        x = GPlotter.xmin;
        dx = (GPlotter.xmax - GPlotter.xmin) / GPlotter.steps ;
        var moved = false;
         call[1][1][0] = t;
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
    	return (xminmax) ? [GPlotter.ymin, [GPlotter.ymax, null]] : null ;
} // _draw

/*
var _plot_interval = function (tminmax) {
        GPlotter.tmin = tmin;
        GPlotter.tmax = tmax;
    }
*/

var _plot_param = function (xt, yt , tminmax) { // t in [tmin tmax]
    	var xmin= Infinity, ymin=Infinity, xmax = -Infinity, ymax = -Infinity;
        var i,x,y,t,dt ;
        tminmax = tminmax || [0, [1,null]] ;
        GPlotter.tmin = tminmax[0];
        GPlotter.tmax = tminmax[1][0];
        var dt = (GPlotter.tmax - GPlotter.tmin) / GPlotter.steps ;
        var callx = [xt, [null,null]] ;
        var cally = [yt, [null,null]] ;
        __plot_save();

        // compute mins,maxs
		if(GPlotter.xminmax === null || GPlotter.yminmax === null) {
        t = GPlotter.tmin;
        for( i =0; i <= GPlotter.steps; i++) {
            callx[1][0] = t;
            cally[1][0] = t;
            x = __ffuncall(callx,glisp.user);
            y = __ffuncall(cally,glisp.user);
            if(y < ymin) ymin = y;
            if(y > ymax) ymax = y ;
            if(x < xmin) xmin = x;
            if(x > xmax) xmax = x ;
            t += dt ;
        }
        if(GPlotter.xminmax === null) 
        	{GPlotter.xmin = xmin; GPlotter.xmax = xmax;}
        if(GPlotter.yminmax === null)
        	{GPlotter.ymin = ymin; GPlotter.ymax = ymax;}
        } // min/max auto compute

            var ctx = GPlotter.context;
            ctx.lineWidth = GPlotter.lineWidth;
            ctx.strokeStyle = GPlotter.strokeStyle;
            ctx.beginPath();
			var moved = false;
            t = GPlotter.tmin;
            for( i = 0 ; i <= GPlotter.steps; i++) {
                callx[1][0] = t;
                cally[1][0] = t;
                x = __funcall(callx,glisp.user);
                y = __funcall(cally,glisp.user);
				if(!moved) {
							GPlotter.moveTo(x,y);
							moved = true;
							}
                else GPlotter.lineTo(x,y);
            t+= dt ;
            }
            ctx.stroke();

    var xminmax = [GPlotter.xmin, [GPlotter.xmax, null]];
	var yminmax = [GPlotter.ymin, [GPlotter.ymax, null]];
	__plot_save();
    return [ xminmax, [yminmax, null]] ;
    } // plot_param

var _plot_polar = function (rt,at,tminmax) { // t in [tmin tmax]
    	var xmin= Infinity, ymin=Infinity, xmax = -Infinity, ymax = -Infinity;
        var i, x,y,t,dt, r, a ;
        var callr = [rt, [null,null]] ;
        var calla = [at, [null,null]] ;
        __plot_save();

		tminmax = tminmax || [0, [1,null]] ;
        GPlotter.tmin = tminmax[0] ; // compute min/max
        GPlotter.tmax = tminmax[1][0] ;
        dt = (GPlotter.tmax - GPlotter.tmin)   / GPlotter.steps ;
        
		if(GPlotter.xminmax === null || GPlotter.yminmax === null) {
        t = GPlotter.tmin;
        for( i =0; i <= GPlotter.steps; i++) {
            callr[1][0] = t;
            calla[1][0] = t;
            r = __funcall(callr,glisp.user);
            a = __funcall(calla,glisp.user);
            x = r * Math.cos(a);
            y = r * Math.sin(a);

            if(y < ymin) ymin = y;
            if(y > ymax) ymax = y ;
            if(x < xmin) xmin = x;
            if(x > xmax) xmax = x ;
            t += dt;
        }
        
        if(GPlotter.xminmax === null) 
        	{GPlotter.xmin = xmin; GPlotter.xmax = xmax;}
        if(GPlotter.yminmax === null)
        	{GPlotter.ymin = ymin; GPlotter.ymax = ymax;}
        } // min/max auto compute

			var moved = false ;
            var ctx = GPlotter.context;
            ctx.lineWidth = GPlotter.lineWidth;
            ctx.strokeStyle = GPlotter.strokeStyle;
            ctx.beginPath();

            t = GPlotter.tmin;
            for( i = 0; i <= GPlotter.steps; i++) {
                callr[1][0] = t;
                calla[1][0] = t;
                r = __ffuncall(callr,glisp.user);
                a = __ffuncall(calla,glisp.user);
                x = r * Math.cos(a);
                y = r * Math.sin(a);
                if(!moved) 
                	{GPlotter.moveTo(x,y); moved = true;}
                	else GPlotter.lineTo(x,y);
                t += dt; 
            }
            ctx.stroke();

	var xminmax = [GPlotter.xmin, [GPlotter.xmax, null]];
	var yminmax = [GPlotter.ymin, [GPlotter.ymax, null]];
    return [ xminmax, [yminmax, null]] ;
    } // plot_polar

// BIT-MAPS
// http://jsperf.com/canvas-pixel-manipulation/125

function _rgb (r, g, b ) { // in : [0..1]**3
	return (255 << 24) | // constant NYI
	((b * 255) << 16)  |
	((g * 255) << 8)   |
	((r * 255) & 0xff)  ;
}

// (rgbxy x y) (x,y) in [0..1]^2
function _plot_rgb (rgbxy)  { // (rgbxy x y) --> #[r g b a]
 	var canvasWidth  = GPlotter.canvas.width;
    var canvasHeight = GPlotter.canvas.height;
    var ctx = GPlotter.context;
    var imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    var buf = new ArrayBuffer(imageData.data.length);
    var buf8 = new Uint8ClampedArray(buf);
    var data32 = new Uint32Array(buf);
    var callrgb = [rgbxy , [ null, [ null , null]]] ;
     __plot_save();
   
    for (var y = 0; y < canvasHeight; ++y) {
    	callrgb[1][1][0] = y / canvasHeight;
        for (var x = 0; x < canvasWidth; ++x) {
        	callrgb[1][0] = x / canvasWidth;
            data32[y * canvasWidth + x] = __ffuncall(callrgb,glisp.user);
        }
    }
    imageData.data.set(buf8);
     ctx.putImageData(imageData, 0, 0);
     return canvasWidth * canvasHeight ; 
} // _plot_rgb

var _poly = function (x, a) { // (poly x '(a0 a1 ... an))
	var base  = _exact_to_inexact(x);
	var x = base ;
	var p = a[0] ;
	a = a[1];
		while(a) {
			 p += _exact_to_inexact(a[0]) * x ;
			 x *= base ;
			 a = a[1];
		}
	return p ;
}

var _poly_to_string = function (x , a) { // (poly_print 'x '( a0 ...a n))
	a = _reverse(a);
	var pp = '' , n = __length(a) -1;
	var first = true;
	while(a)  {
		var c = _exact_to_inexact(a[0]);
		if(c > 0 & first) pp += c;
		else if(c > 0) pp +=  ' +' + c;
		else if(c < 0) pp +=  ' ' + c;
		first = false ;
		if (c) {
			if(n === 1) pp += x.name;
			else if( n > 0) pp += x.name + '^' + n;
			}
		n = n - 1;
		a = a[1];
	}
	return pp;
}


function boot_plotter() {
	if(_plot_lib) return;
	_plot_lib = true;
    _plot_init();
    _plot_off();
     	define_sysfun(new Sysfun ("poly",_poly,2,2));
     	define_sysfun(new Sysfun ("poly->string",_poly_to_string,2,2));
     	define_sysfun(new Sysfun ("plot-init",_plot_init,2,2));
        define_sysfun(new Sysfun ("plot-on",_plot_on,0,0));
        define_sysfun(new Sysfun ("plot-off",_plot_off,0,0));
        // define_sysfun(new Sysfun ("plot-interval",_plot_interval,2,2));
        define_sysfun(new Sysfun ("plot-axis",_plot_axis,3,3));
        define_sysfun(new Sysfun ("plot-grid",_plot_grid,3,3));
        define_sysfun(new Sysfun ("plot",_plot_draw,2,2)); // (plot f (xmin,xmax))
        define_sysfun(new Sysfun ("plot-param",_plot_param,3,3));
        define_sysfun(new Sysfun ("plot-polar",_plot_polar,3,3));
        define_sysfun(new Sysfun ("plot-steps",_plot_steps,1,1));
        define_sysfun(new Sysfun ("plot-x-minmax",_plot_x_minmax,1,1));
        define_sysfun(new Sysfun ("plot-y-minmax",_plot_y_minmax,1,1));
        define_sysfun(new Sysfun ("plot-clear",_plot_clear,0,0));
        define_sysfun(new Sysfun ("plot-undo",_plot_undo,0,0));
        define_sysfun(new Sysfun ("plot-color",_plot_color,1,1));
        define_sysfun(new Sysfun ("plot-fill-color",_plot_fill,1,1));
        define_sysfun(new Sysfun ("plot-line-width",_plot_line_width,1,1));
        define_sysfun(new Sysfun ("plot-rect",_plot_rect,4,4));
        define_sysfun(new Sysfun ("plot-font",_plot_font,1,1));
        define_sysfun(new Sysfun ("plot-text",_plot_text,4,4));
        define_sysfun(new Sysfun ("rgb",_rgb,3,3));
        define_sysfun(new Sysfun ("plot-rgb",_plot_rgb,1,1));
        define_sysfun(new Sysfun ("plot-animate",_plot_animate,3,3));
}

boot_plotter();




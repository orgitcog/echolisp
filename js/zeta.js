
////////////
// COLORS
// http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
///////////////

// rem: no black - used for random colors
var colors = {"aliceblue":"#f0f8ff","antiquewhite":"#faebd7","aqua":"#00ffff","aquamarine":"#7fffd4","azure":"#f0ffff",
    "beige":"#f5f5dc","bisque":"#ffe4c4","blanchedalmond":"#ffebcd","blue":"#0000ff","blueviolet":"#8a2be2","brown":"#a52a2a","burlywood":"#deb887",
    "cadetblue":"#5f9ea0","chartreuse":"#7fff00","chocolate":"#d2691e","coral":"#ff7f50","cornflowerblue":"#6495ed","cornsilk":"#fff8dc","crimson":"#dc143c","cyan":"#00ffff",
    "darkblue":"#00008b","darkcyan":"#008b8b","darkgoldenrod":"#b8860b","darkgray":"#a9a9a9","darkgreen":"#006400","darkkhaki":"#bdb76b","darkmagenta":"#8b008b","darkolivegreen":"#556b2f",
    "darkorange":"#ff8c00","darkorchid":"#9932cc","darkred":"#8b0000","darksalmon":"#e9967a","darkseagreen":"#8fbc8f","darkslateblue":"#483d8b","darkslategray":"#2f4f4f","darkturquoise":"#00ced1",
    "darkviolet":"#9400d3","deeppink":"#ff1493","deepskyblue":"#00bfff","dimgray":"#696969","dodgerblue":"#1e90ff",
    "firebrick":"#b22222","floralwhite":"#fffaf0","forestgreen":"#228b22","fuchsia":"#ff00ff",
    "gainsboro":"#dcdcdc","ghostwhite":"#f8f8ff","gold":"#ffd700","goldenrod":"#daa520","gray":"#808080","green":"#008000","greenyellow":"#adff2f",
    "honeydew":"#f0fff0","hotpink":"#ff69b4",
    "indianred ":"#cd5c5c","indigo ":"#4b0082","ivory":"#fffff0","khaki":"#f0e68c",
    "lavender":"#e6e6fa","lavenderblush":"#fff0f5","lawngreen":"#7cfc00","lemonchiffon":"#fffacd","lightblue":"#add8e6","lightcoral":"#f08080","lightcyan":"#e0ffff","lightgoldenrodyellow":"#fafad2",
    "lightgrey":"#d3d3d3","lightgreen":"#90ee90","lightpink":"#ffb6c1","lightsalmon":"#ffa07a","lightseagreen":"#20b2aa","lightskyblue":"#87cefa","lightslategray":"#778899","lightsteelblue":"#b0c4de",
    "lightyellow":"#ffffe0","lime":"#00ff00","limegreen":"#32cd32","linen":"#faf0e6",
    "magenta":"#ff00ff","maroon":"#800000","mediumaquamarine":"#66cdaa","mediumblue":"#0000cd","mediumorchid":"#ba55d3","mediumpurple":"#9370d8","mediumseagreen":"#3cb371","mediumslateblue":"#7b68ee",
    "mediumspringgreen":"#00fa9a","mediumturquoise":"#48d1cc","mediumvioletred":"#c71585","midnightblue":"#191970","mintcream":"#f5fffa","mistyrose":"#ffe4e1","moccasin":"#ffe4b5",
    "navajowhite":"#ffdead","navy":"#000080",
    "oldlace":"#fdf5e6","olive":"#808000","olivedrab":"#6b8e23","orange":"#ffa500","orangered":"#ff4500","orchid":"#da70d6",
    "palegoldenrod":"#eee8aa","palegreen":"#98fb98","paleturquoise":"#afeeee","palevioletred":"#d87093","papayawhip":"#ffefd5","peachpuff":"#ffdab9","peru":"#cd853f","pink":"#ffc0cb","plum":"#dda0dd","powderblue":"#b0e0e6","purple":"#800080",
    "red":"#ff0000","rosybrown":"#bc8f8f","royalblue":"#4169e1",
    "saddlebrown":"#8b4513","salmon":"#fa8072","sandybrown":"#f4a460","seagreen":"#2e8b57","seashell":"#fff5ee","sienna":"#a0522d","silver":"#c0c0c0","skyblue":"#87ceeb","slateblue":"#6a5acd","slategray":"#708090","snow":"#fffafa","springgreen":"#00ff7f","steelblue":"#4682b4",
    "tan":"#d2b48c","teal":"#008080","thistle":"#d8bfd8","tomato":"#ff6347","turquoise":"#40e0d0",
    "violet":"#ee82ee",
    "wheat":"#f5deb3","white":"#ffffff","whitesmoke":"#f5f5f5",
    "yellow":"#ffff00","yellowgreen":"#9acd32"};

function colorNamed(color) { // returns #rrggbb
    color = color.toLowerCase();
    if (typeof colors[color] != 'undefined')  return colors[color];
    for(var cname in colors)
        if(cname.search(color) != -1) return colors[cname];
    return colorNamed(randcolor());
    }

function randcolor() { // returns a name
    var  idx = Math.floor(Object.keys(colors).length * Math.random());
    for(var cname in colors) if(idx-- === 0) return cname ;
    return 'red' ;
}

function rgb(hexacolor) { // #rrggbb to [r,g,b]
    var r = parseInt(hexacolor.substring(1,3),16) ;
    var g = parseInt(hexacolor.substring(3,5),16) ;
    var b = parseInt(hexacolor.substring(5,7),16) ;
    
    return [r,g,b] ;
}

function rgbToHex (rgbcolor) {
     var hex = rgbcolor[2] | rgbcolor[1] << 8 | rgbcolor[0] << 16;
     return '#' + hex.toString(16);
}

/**
 * http://mjijackson.com/about
 *
 * Converts an RGB color value to HSV. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and v in the set [0, 1].
 *
 * @param   Number  r       The red color value
 * @param   Number  g       The green color value
 * @param   Number  b       The blue color value
 * @return  Array           The HSV representation
 */

function rgbToHsv(r, g, b){
    r = r/255, g = g/255, b = b/255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, v = max;

    var d = max - min;
    s = max == 0 ? 0 : d / max;

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

/**
 * Converts an HSV color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
 * Assumes h, s, and v are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  v       The value
 * @return  Array           The RGB representation
 */
function hsvToRgb(h, s, v){
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

    return [(r * 255) | 0, (g * 255) | 0, (b * 255) | 0];
}
///////////
// USER hsvtorgb function
// in : h,s,v,a in [0,1]
// out [r,g,b,a] in 0.1
// uses global DCOLOR to adjust hue
//////////

function hsvtorgb(h,s,v,a) {
    var r,g,b;
    
    h= Math.abs(h); // precaution
    h += DCOLOR ; if (h > 1) h -=1 ;
    
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
    return [r,g,b,a];
}

function hsvToRgb01(h, s, v, info){ // returns [r,g,b,a=1 [,info]]
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
    if(info) return [r,g,b,1,info] ;
    return [r,g,b,1];
}



/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  l       The lightness
 * @return  Array           The RGB representation
 */
/*
function hslToRgb(h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [r * 255, g * 255, b * 255];
}
*/

/**
 * gradientrgb
 * returns gradient array[d] of [r,g,b]
 * g[0] = colorfrom , g[d-1] = colorto
 * http://stackoverflow.com/questions/2593832/how-to-interpolate-hue-values-in-hsv-colour-space  NYI
 */

 function gradientrgb(rgbfrom,rgbto,d) { // In rgbfrom[3]
    var g = [] ;
    var hsvfrom = rgbToHsv(rgbfrom[0],rgbfrom[1],rgbfrom[2]) ;
    var hsvto = rgbToHsv(rgbto[0],rgbto[1],rgbto[2]) ;
    var h,s,v;
    
    for(var i = 0; i<d; i++) {
        h = hsvfrom[0] + i * (hsvto[0] - hsvfrom[0]) / (d-1) ;
        s = hsvfrom[1] + i * (hsvto[1] - hsvfrom[1]) / (d-1) ;
        v = hsvfrom[2] + i * (hsvto[2] - hsvfrom[2]) / (d-1) ;
        g[i] = hsvToRgb(h,s,v);
    }
    return g;
 }
 
 function gradient(fromname,toname,d) {
    var g = new Array(d);
    var rgbfrom = rgb(colorNamed(fromname));
    var rgbto = rgb(colorNamed(toname));
    return gradientrgb(rgbfrom,rgbto,d);
 }
 
 function hsvgradient(rgbfrom,d) { // d is grad. dimension
    var g = [] ;
    var h,s,v;
    var hsvfrom = rgbToHsv(rgbfrom[0],rgbfrom[1],rgbfrom[2]) ;
    for(var i = 0; i< d; i++ ) {
        h = hsvfrom[0];
        s = hsvfrom[1];
        v = 0.5 + (d - i- 1) * 0.5 / (d-1);
        g[i] = hsvToRgb(h,s,v);
    }
    return g;
 }
 
 function adjustrgb(rgbfrom, d) { // d is adjust factor in [0.1]
    var h,s,v;
    var hsvfrom = rgbToHsv(rgbfrom[0],rgbfrom[1],rgbfrom[2]) ;
    h = hsvfrom[0] + d; if (h > 1) h -= 1;
    s = hsvfrom[1];
    v = hsvfrom[2];
    return hsvToRgb(h,s,v);
 }
 
 function complementary(hexacolor) { // in: #rrggbb .returns [r_,g_,b_] 
    var rgbcolor = rgb(hexacolor);
    var hsvcolor = rgbToHsv(rgbcolor[0],rgbcolor[1],rgbcolor[2]);

    hsvcolor[0] = 0.5 + hsvcolor[0];
    if(hsvcolor[0] > 1) hsvcolor[0] -= 1;
    return hsvToRgb(hsvcolor[0],hsvcolor[1],hsvcolor[2]);
 }
 
 function hexcomplement(hexacolor) { // in #rrggbb out:#RRGGBB
    return rgbToHex(complementary(hexacolor)) ;
 }
 
 /*
  *Color ContrastColor(Color color)
        {
            int d = 0;
            // Counting the perceptive luminance - human eye favors green color... 
            double a = 1 - ( 0.299 * color.R + 0.587 * color.G + 0.114 * color.B)/255
            if (a < 0.5)
                d = 0; // bright colors - black font
            else
                d = 255; // dark colors - white font
            return  Color.FromArgb(d, d, d);
        }
*/

////////////////////////////////////////////
// C O M P L E X
// http://w.american.edu/cas/mathstat/lcrone/ComplexPlot.html
// http://en.wikipedia.org/wiki/Domain_coloring
// http://www.mathematica-journal.com/issue/v7i2/articles/contents/thaller/html/
//
// theta(r,r0) = PI - 2 * Atan(r/r0); // returns [0..PI] because r > 0
// light (t) = 1 -t/PI ; li in [0.1] , t in [0, PI]
//
// hsl(r,a) = (a in 0..2PI) = atan2(y,x) + PI
//      r0 = 1
//      li = light(theta(r,r0))
//      hsl := li <= 0.5 [a/2*PI, 1, 2*li]
//      else hsl:= [a/2*PT, 2-2*li ,1]
///////////////////////////////////

var debug = false;
var zDisplay = false; // debug(mouse) display z

function isComplex(x) {
    return !!x.theta;
}

function Complex(r, i) {
	this.r = r || 0;
	this.i = i || 0;
}

Complex.dup = function (z) {
    return new Complex (z.r,z.i);
}
 
Complex.set = function(z,x,y) { // set(z,z1) or set(z,re,im) or set(z,re)
    if(isComplex(x)) {
        z.r = x.r;
        z.i = x.i;
    }
    else {
        z.r = x;
        z.i = y || 0;
    }
}

Complex.add = function (z,a) {
        z.r += a.r;
        z.i += a.i;
}

Complex.sub = function (z,a) {
        z.r -= a.r;
        z.i -= a.i;
}

Complex.mul = function (z,a) {
        var re  = z.r*a.r - z.i*a.i,  im = z.r*a.i + z.i*a.r;
        z.r = re; z.i = im;
}

Complex.addn = function() {
	var re = arguments[0].r, im = arguments[0].i;
 
	for(var i = 1, ilim = arguments.length; i < ilim; i += 1){
		re += arguments[i].r;
		im += arguments[i].i;
	}
        
        arguments[0].r = re; arguments[0].i = im;
}

Complex.subn = function() {
	var re = arguments[0].r, im = arguments[0].i;
 
	for(var i = 1, ilim = arguments.length; i < ilim; i += 1){
		re -= arguments[i].r;
	        im -= arguments[i].i;
	}
        arguments[0].r = re; arguments[0].i = im;
}
 
Complex.muln = function() {
	var re = arguments[0].r, im = arguments[0].i;
        var acc;
        
	for(var i = 1, ilim = arguments.length; i < ilim; i += 1) {
                acc = re;
		re = (re * arguments[i].r) - (im * arguments[i].i);
		im = (im * arguments[i].r) + (acc * arguments[i].i);
	}
        arguments[0].r = re; arguments[0].i = im;
}

var _zn = new Complex();
var _oz = new Complex();
var _qz = new Complex();

// poly(z) --> P(z) / Q(z)

Complex.poly = function (z, P , Q) { //  poly (z , P= [a0,a1,...an] [, Q = [d0,d1,d2,..]) (real coefficients)
   
    _zn.r = _oz.r = z.r ; // save
    _zn.i = _oz.i = z.i ;
    var acc;
    z.r = P[0]; // a0
    z.i = 0;
    
    for(var i = 1, ilim = P.length; i < ilim; i += 1) {
        z.r  += P[i] * _zn.r;
        z.i  += P[i] * _zn.i;
        acc = _zn.r ;
        _zn.r = acc*_oz.r - _zn.i*_oz.i;
        _zn.i = acc*_oz.i + _zn.i*_oz.r;
    }
    
     if (Q) {
         _qz.r = _oz.r ; _qz.i = _oz.i ;
        Complex.poly(_qz,Q) ;
        Complex.div(z,_qz);
    }
}

Complex.cpoly = function (z, P , Q) { //  cpoly (z  , P= [c0, c1, ..., cn] [, Q = [d0,d1,d2,..]) (complex coefficients)
    _zn.r = _oz.r = z.r ; // save
    _zn.i = _oz.i = z.i ;
    var acc;
    z.r = P[0].r; // c0
    z.i = P[1].i;
    
    for(var i = 1, ilim = P.length; i < ilim; i += 1) {
        z.r  += P[i].r * _zn.r - P[i].i * _zn.i;
        z.i  += P[i].i * _zn.r + P[i].r * _zn.i;
        acc = _zn.r ;
        _zn.r = acc*_oz.r - _zn.i*_oz.i;
        _zn.i = acc*_oz.i + _zn.i*_oz.r;
    }
    
     if (Q) {
        _qz.r = _oz.r ; _qz.i = _oz.i ;
        Complex.poly(_qz,Q) ;
        Complex.div(z,_qz);
    }
}

Complex.neg = function (z) {
	z.r = - z.r;
        z.i = - z.i;
}
 
Complex.inv = function(z) {
	var den = z.r*z.r + z.i*z.i;
	if(den) {
            z.r /= den;
            z.i /= den; z.i = - z.i ;
        }
}

Complex.div = function(z,dv) {
        var a = z.r, b= z.i, c= dv.r, d= dv.i;
        var denom = c*c + d*d ;
        if(denom) {
        z.r = (a*c + b*d) /denom;
        z.i = (b*c - a*d) /denom;
        }
}



Complex.pow = function(z,n) { // n in Z
    if(n === 0) {z.r = 1; z.i=0; return;}
    if(n === 1) return;
    if(n === 2) {Complex.mul(z,z); return; }
    if (n < 0) {
                Complex.pow(z,-n);
                Complex.inv(z);
                return;
    }
    if(n & 1) {
        var zt  = new Complex(z.r,z.i);
        Complex.pow(zt,n-1);
        Complex.mul(z,zt) ;
        return;
    }
    Complex.pow(z,n/2);
    Complex.mul(z,z);
}
/*
 // Ä(z)  =(z**2 -1)(z -2 -i)**2/(z**2 + 2 + 2i).
 
  function (x,y) {
  Complex.set(z1,z); // save
  Complex.subn(z,C2,I);
  Complex.mul(z,z);
  
  Complex.set(z2,z1);
  Complex.mul(z2,z2);
  Complex.sub(z2,C1);
  Complex.mul(z,z2);
 
  Complex.set(z2,z1);
  Complex.mul(z2,z2);
  Complex.addn(z2,C2,I,I);
 
  Complex.div(z,z2);
  return z.rgb();
  }
  
*/

Complex.exp = function(z) { // small z !!}
    var ex = Math.exp(z.r);
    z.r = cos(z.i) * ex;
    z.i = sin(z.i) * ex;
    }
    
//////////////
// G functions
//////////////////

    /*
     * http://w.american.edu/cas/mathstat/lcrone/GFunBase.html
     * G(z) = lim f^n(z/a^n)
     * f(0) = 0, and f '(0) = a. |a| > 1
     *
     * function () {
        if(init) {
        C.set(zc,0.9876,-1.4567);
        fz = function(z) {C.mul(z,z);C.add(z,zc); return z;}}
        C.G(z,fz,10);
        return z.rgb();
    }
     */
    
Complex.G = function (z,fz,iter) {
    iter = iter || 10 ;
    var re;
    
    for(var n = 0; n < iter ; n++) {
        Complex.set(z,fz(z));
        re= z.r;
        if(isNaN(re) || re === Infinity || re === -Infinity) break;
    }
}

Complex.fractal = function(z,zc,iter) { // iterate z*z + c
    iter = iter || 10 ;
    var acc, re = z.r, im=z.i;
    for(var n=0; n< iter; n++) {
         acc = re;
         re  = re*re - im*im;
         im =  2*im*acc;
         re += zc.r;
         if(isNaN(re) || re === Infinity || re === -Infinity) break;
         im += zc.i;
    }
    z.r = re;
    z.i = im;
}

Complex.nfractal = function(z,zc,power,iter) { // iterate z**power + c
    iter = iter || 10 ;
    power = power || 2;
    var  acc, re = z.r, im=z.i , _re = re, _im = im ;
    for(var n=0; n< iter; n++) {
        for(var p=1 ; p < power ; p++){
         acc = re; 
         re  = re*_re - im*_im;
         im =  acc*_im + im*_re;
        }
         
         re += zc.r;
         if(isNaN(re) || re === Infinity || re === -Infinity) break;
         im += zc.i;
    }
    z.r = re;
    z.i = im;
}

/*
 cos(a+bi)= cosa cosh b - i sina sinh b
 sin(a+bi)= sina cosh b + i cosa sinh b
 cosh x = (e**x + e**-x )/2
 sinh x = (e**x - e**-x)/2
 */

 Complex.cos = function(z) {
    var a = z.r, b = z.i , ex = Math.exp(b) , ex_ = Math.exp(-b) ;
    z.r = Math.cos(a) * (ex + ex_) / 2 ;
    z.i = - Math.sin(a) * (ex - ex_) / 2 ;
 }
 
 Complex.sin = function(z) {
    var a = z.r, b = z.i , ex = Math.exp(b) , ex_ = Math.exp(-b) ;
    z.r = Math.sin(a) * (ex + ex_) / 2 ;
    z.i = Math.cos(a) * (ex - ex_) / 2 ;
 }



Complex.log = function(z) {
    var n = z.r*z.r + z.i*z.i;
    if(n === 0) {z.i = z.r = 0; return;}
    z.i  = Math.atan2(z.i,z.r); // [-PI .. PI]
    z.r = Math.log(n) / 2;
}

Complex.sqrt = function(z) {
    var a = z.r, b = z.i;
    if(b === 0) {z.r = Math.sqrt(a) ; return;}
    var sq = Math.sqrt(a*a + b*b);
    z.r = Math.sqrt( (a + sq)  /2);
    z.i = Math.sqrt((sq - a)/2);
    if( b < 0) z.r = -z.r ; // principal
}

Complex.conj = function(z) {
	z.i = - z.i;
}
 
///////////////
// Z E T A
// http://www.mlb.co.jp/linux/science/yacas/documentation/Algochapter5.html
// http://citeseerx.ist.psu.edu/viewdoc/download;jsessionid=2BA041A60B9FDC7C99E032B3AD6CE5EC?doi=10.1.1.52.376&rep=rep1&type=pdf
// http://www.wolframalpha.com/input/?i=zeta%28+1%2F2+%2B+14.4+I%29
//
// Re(s) must be > - (n-1)
//////////////////

// constant
var LOG2 = Math.log(2); // ln(2)

// COUNTS
var zcalls = 0;
var zcuts = 0;
var zseqs = 0;

// GLOBS
var ZDX; // s = s+iy ;next s = (x +ZDX) + i y , ..
var zetaOneShot = true; // false if sequential compute
var zdebug = false;

// CACHES = all f(n) execpt JDX = f(n,ZDX)
var _zeta_n = 0;
var _zeta_dx = 0;

var SBIN;// Sigma C(k, n)
var JDX; // j ^ -dx
var LNJ; // log(1+j);
var EJN; // ei(j)
var ZEX_R,ZEX_I; // e(i) // (j+1)^s  
var TWOpowerN; // 2^n


function zinit (n) { // SIGMA C (n,k)  k = 0...n; SBIN(n) = 2^n
    
    TWOpowerN = Math.pow(2,n);
    zcalls = zcuts = zseqs = 0;
    
    function ej(j,n) {
    j = j || 0;
    var ret= -TWOpowerN ;
    if( j >= n) ret += SBIN[j-n];
    return (j & 1) ? -ret : ret ;
}

    SBIN = new Array(n+1);
    LNJ = new Array(2*n + 1);
    EJN = new Array(2*n + 1);
    JDX = new Array(2*n + 1);
    ZEX_R = new Array(2*n + 1); ZEX_I = new Array(2*n + 1);
    
    SBIN[0] = 1;
    var cbin = 1;
    for(var k=1;k<=n;k++) {
        cbin *= (n-k+1);
        cbin /= k;
        SBIN[k] = SBIN[k-1] + cbin;
    }
    
    for(var j= 0; j<= 2*n; j++) {
            JDX[j] = Math.pow(j,-ZDX) ; 
            LNJ[j] = Math.log(1+j);
            EJN[j] = ej(j,n);
        }
    
} // zinit

// e[j]:=(-1)^(j-1)*(Sum(k,0,j-n,n*(n-1)*..*(n-k+1) / k!  -2^n
var _zex = new Complex();
var _zeta = new Complex();

var s0_i,s0_r; // dbg
Complex.zeta = function (s, n , initrow) { // valid for Re(s) > 1-n
    n = n || 10 ; // error < 1 / 8^n
    zcalls++;
    
   // if(s.r<= 0.51  && s.r >= 0.49) n = 100;
    
    if(_zeta_n != n) { // cache init = f(n)
        _zeta_n = n ;
        zinit(n) ;
    }
    
    if(_zeta_dx != ZDX) { // new JDX needed
        _zeta_dx = ZDX;
         for(var j= 0; j<= 2*n; j++)
            JDX[j] = Math.pow(j,-ZDX) ; // j ^ -dx
    }
    
    _zex.r = _zex. i = 0;
    _zeta.r = _zeta.i = 0;
    var ejn,lnj ;
    
    if(initrow || zetaOneShot)
    {
    //  s0_i = s.i; s0_r= s.r; // dbg
        
    for (var j= 0 , jlim= 2*n; j < jlim; j++) {
        lnj = - LNJ[j] ; // Math.log(1+j);
        _zex.r = s.r * lnj; _zex.i = s.i * lnj;
        Complex.exp(_zex); // (j + 1) ^ s
       //  Complex.inv(_zex); // BEST power minus
        ejn = EJN[j] ; // ej(j,n);
        _zex.r *= ejn; _zex.i *= ejn;
        ZEX_R[j] = _zex.r, ZEX_I[j] = _zex.i;
        _zeta.r += _zex.r; _zeta.i += _zex.i;
    }}
    
    else{
    /* dbg
        var di = s.i - s0_i ;
        var dr = s.r - (s0_r + ZDX) ;
        
    if((di !=0)  || (Math.abs(dr) > 1.e-8)) alert("S " + s.r  +  " + " + s.i  + "*I    DZ= " + ZDX + "     dr= " + dr + " di= " + di + " *I" );
     s0_i = s.i; s0_r= s.r;
     */ // end dbg
     zseqs++; 
    for (var j= 0 , jlim= 2*n; j < jlim; j++) {
        ZEX_R[j] *= JDX[j+1];
        ZEX_I[j] *= JDX[j+1] ;
        _zeta.r += ZEX_R[j] ;
        _zeta.i  += ZEX_I[j] ;
if(zdebug)
if(zseqs <= 2) console.log("Z",j,"jdx",JDX[j+1],"DELTA ", ZEX_R[j],ZEX_I[j],"j term ",_zeta.r,_zeta.i, " at ",s.r,s.i)
  //      if(Math.abs (ZEX_R[j])  < 1.e-3) {zcuts++; break; }
    }}
    
    

    _zex.r = 1 - s.r; _zex.i = -s.i ;
    _zex.r *= LOG2; _zex.i *= LOG2;
    Complex.exp(_zex); // 2 ^ (1-s)
    _zex.r -= 1; // 2 ^ (1-s) - 1 ;
    _zex.r *= TWOpowerN; _zex.i *= TWOpowerN; // *= 2 ^ n
    Complex.inv(_zex);
    Complex.mul(_zeta,_zex);
    
if(zdebug)
if(zseqs <= 2) {
    console.log("FIRST TERM ",_zex.r,_zex.i);
    console.log("FINAL Z ",_zeta.r,_zeta.i," at ",s.r,s.i);
    }
    Complex.set(s,_zeta);
}

// PROTOTYPES
Complex.prototype.mod = function() {
	return Math.sqrt(this.r*this.r + this.i*this.i )
}

Complex.prototype.theta = function () {
    return Math.atan2(this.i,this.r) ;
}

Complex.prototype.rgb = function(vmin,smin, mod, eps, info) {
    mod = mod || 0;
    eps = eps || 0.01 ;
    smin = smin || 0 ; /* saturation smin = 1 : hide white */
    vmin = vmin || 0 ; /* value : vmin ==1 : hide black =  |z| < 1 */
    var  s=1, v= 1;
    
    var theta = Math.atan2(this.i,this.r)  / TWOPI  + 1 ; // hue in [-0.5 .. 0.5] + 1
    if(theta > 1) theta -= 1;
    
    var rho =  Math.sqrt(this.r*this.r + this.i*this.i ) ; 
    
    if(mod) {
        var dr = rho % mod;
        if(dr < eps) return [0,0,0,1- dr/eps] ;
    }
    
    if(rho > 1) {
        s = PI_2 - Math.atan(rho-1) ; s /= PI_2 ; // saturation --> 0 for large  z  (all white)
        s += smin - s*smin; // smin 1 : ignore |z| if |z| > 1 (theta only)
        } 
    else if (rho < 1) {
        v = rho ; // (0,0) --> v = 0 --> black
        v += vmin - v*vmin; // vmin = 1 : ignore |z| if [z] < 1
        } 

    if(zDisplay) info = info || this.toString(); // mouse : show z
    
    // rotate colors
    theta = theta + DCOLOR; if(theta > 1) theta -= 1 ;
    
    return hsvToRgb01 (theta, s, v, info) ; // r,g,b base [0,1]  & alpha = 1;
}

Complex.prototype.toString = function() {
        if(this.i === 0) return format(this.r);
        return format(this.r || '') +
            ((this.i > 0) ? "&nbsp;+&nbsp;" : "&nbsp;-&nbsp;") +
            format(Math.abs(this.i)) + "&nbsp;I" ;
}
 


///
// complex glob vars
/////
var _za = new Complex();
var _zb = new Complex();

// user visible read-only
var zpulse= new Complex(); // pulse + i*opulse
var gz = new Complex(); // ga + i*gb

// constants
var I = new Complex(0,1);
var _I = new Complex(0,-1);
var C1 = new Complex(1,0);
var C_1 = new Complex(-1,0);
var C2 = new Complex(2,0);
var C_2 = new Complex(-2,0);
var CTWOPI = new Complex(Math.PI*2,0);

// user visible registers
var z = new Complex(); // x + i*y
var za = new Complex();
var zb = new Complex();
var zc = new Complex();
var zd = new Complex();
var z0 = new Complex();
var z1 = new Complex();
var z2 = new Complex();
var z3 = new Complex();

////////////////////
// solving
///////////////////////////
var EPS = 1.e-6;

function isString(obj) {
	return !!obj.charAt;
}

function format(x,digits) {
    digits = digits || 3;
    if(Array.isArray(x)) {
        var text = '[&nbsp;' + format(x[0],2);
        for(var i = 1 ; i< x.length;i++) text +=  ',&nbsp;' + format(x[i],2) ;
        text += '&nbsp;]';
        return text;
    }
    
    if(x ==  '') return x;
    if(x == undefined) return 'undef';
    if(x ==  null) return 'null';
    if(isComplex(x)) return x.toString();
    if(isNaN(x)) return x ;
    if(Math.abs(x) < EPS) return 0;
    if(Math.floor(x) == x) return x;
    if(isString(x)) return x;
    
    return '' + x.toFixed(digits) ;
}

/**
* https://gist.github.com/3317728
* Searches the interval from <tt>lowerLimit</tt> to <tt>upperLimit</tt>
* for a root (i.e., zero) of the function <tt>func</tt> with respect to
* its first argument using Brent's method root-finding algorithm.
*
* @param {function} function for which the root is sought.
* @param {number} the lower point of the interval to be searched.
* @param {number} the upper point of the interval to be searched.
* @param {number} the desired accuracy (convergence tolerance).
* @param {number} the maximum number of iterations.
* @returns an estimate for the root within accuracy.
*/
// Translated from zeroin.c in http://www.netlib.org/c/brent.shar.
/*
var calls;
function uniroot ( func, lowerLimit, upperLimit,x, errorTol, maxIter) {
  var a = lowerLimit
    , b = upperLimit
    , c = a
    , fa = func(x,a) //// TRY if user ... NYI
    , fb = func(x,b)
    , fc = fa
    , s = 0
    , fs = 0
    , tol_act // Actual tolerance
    , new_step // Step at this iteration
    , prev_step // Distance from the last but one to the last approximation
    , p // Interpolation step is calculated in the form p/q; division is delayed until the last moment
    , q
    ;

  errorTol = errorTol || 0;
  maxIter = maxIter || 1000;

  while ( maxIter-- > 0 ) {
  
    prev_step = b - a;
   
    if ( Math.abs(fc) < Math.abs(fb) ) {
      // Swap data for b to be the best approximation
      a = b, b = c, c = a;
      fa = fb, fb = fc, fc = fa;
    }

    tol_act = 1e-15 * Math.abs(b) + errorTol / 2;
    new_step = ( c - b ) / 2;

    if ( Math.abs(new_step) <= tol_act || fb === 0 ) {
    if( Math.abs(fb) > 0.01) {
                console.log('root: ', format(b) ,'   fb:' , format(fb), '   x:' , format(x), '   calls:', calls);
                return null;
                }
      return b; // Acceptable approx. is found
    }

    // Decide if the interpolation can be tried
    if ( Math.abs(prev_step) >= tol_act && Math.abs(fa) > Math.abs(fb) ) {
      // If prev_step was large enough and was in true direction, Interpolatiom may be tried
      var t1, cb, t2;
      cb = c - b;
      if ( a === c ) { // If we have only two distinct points linear interpolation can only be applied
        t1 = fb / fa;
        p = cb * t1;
        q = 1.0 - t1;
      }
      else { // Quadric inverse interpolation
        q = fa / fc, t1 = fb / fc, t2 = fb / fa;
        p = t2 * (cb * q * (q - t1) - (b - a) * (t1 - 1));
        q = (q - 1) * (t1 - 1) * (t2 - 1);
      }

      if ( p > 0 ) {
        q = -q; // p was calculated with the opposite sign; make p positive
      }
      else {
        p = -p; // and assign possible minus to q
      }

      if ( p < ( 0.75 * cb * q - Math.abs( tol_act * q ) / 2 ) &&
           p < Math.abs( prev_step * q / 2 ) ) {
        // If (b + p / q) falls in [b,c] and isn't too large it is accepted
        new_step = p / q;
      }
 
      // If p/q is too large then the bissection procedure can reduce [b,c] range to more extent
    } // Decide

    if ( Math.abs( new_step ) < tol_act ) { // Adjust the step to be not less than tolerance
      new_step = ( new_step > 0 ) ? tol_act : -tol_act;
    }

    a = b, fa = fb; // Save the previous approx.
    b += new_step, fb = func(x,b); // Do step to a new approxim.

    if ( (fb > 0 && fc > 0) || (fb < 0 && fc < 0) ) {
      c = a, fc = fa; // Adjust c for it to have a sign opposite to that of b
    }
  } // while
  console.log("root: null   x:",x);
  return null;
} // uniroot
*/
/////////////////////////////////
// MATHS
/////////////////////

var abs = Math.abs;
var sin = Math.sin;
var cos = Math.cos;
var int = Math.floor;
var floor = Math.floor;
var tan = Math.tan;
var atan = Math.atan; // in [-PI/2, PI/2]
var atan2 = Math.atan2; // atan2(y,x) in [-PI,PI]
var exp = Math.exp;

/////////////
// CONSTANTS
/////////////////////

var LF = '\n' ;
var E = Math.E;
var PI = Math.PI;
var PI_2 = Math.PI/2;
var SQRT1_2 = Math.sqrt(0.5);
var SQRT2 = Math.sqrt(2);
var SQRT3 = Math.sqrt(3);
var TWOPI = 2* Math.PI;
var TWOPI_1 = 1/ TWOPI;
var PI2 = Math.PI*Math.PI;
var PHI = (1 + Math.sqrt(5))/2 ;
var LOG2 = Math.log(2) ; // ln(2)

//////////////
// random
//////////////////
var m_w = 42;    /* must not be zero */
var m_z = 666;    /* must not be zero */
 function rand_seed(s) {
    m_w = s & 65535;
    if(m_w <= 0) m_w = Math.floor(Math.random() * 65535);
    m_z = 666;
}
function irand() {
var u;
    m_z = 36969 * (m_z & 65535) + (m_z >> 16);
    m_w = 18000 * (m_w & 65535) + (m_w >> 16);
    u =  (m_z << 16) + m_w;  /* 31-bit > 0 result */
    u &= 0x7fffffff ;
    return u;
}

function irand_255 () {
    m_z = 36969 * (m_z & 65535) + (m_z >> 16);
    m_w = 18000 * (m_w & 65535) + (m_w >> 16);
    return ((m_z << 16) + m_w) & 0x000000ff ;  /* 8-bits > 0 result */
}

function qrand(mod) { // n/d in Q
    mod = mod || 20 ;
    var n =1,  d= 1;
    while ((n % d) == 0) {
        n = irand()%mod + 1;
        d = irand()%mod + 1;
    }
    return n/d ;
}

function irand_100()  {return irand() % 100;}
function irand_10000()  {return irand() % 10000;}
var rand = Math.random ;


  function zeta (s) { // s >= 2 and in N
    s= Math.floor(s);
    if(s < 1) return 0;
    if(s==1) return -0.5;
    if(s == 2) return PI2/6;
    if(s == 3) return 1.2020569031595942854;
    if(s== 4) return PI2*PI2/90;
    
    var z = 1 ;
    var steps = 10000;
    if(s > 10) steps = 100;
    for (var i=2;i<=steps;i++)  z += 1/ Math.pow(i,s);
 //   console.log('Z',s,z, Math.PI*Math.PI/6);
    return z;
  }
  
  var _isprime_n = -1; // cache
  var _isprime_val = 0;
  
  function isprime(n) {
    if(n < 0) n = -n ;
        n = n | 0 ; // floor
        if(n === _isprime_n) return _isprime_val;
        _isprime_n = n;
       
	if(n <= 7 ) return ( n===2 || n===3 || n===5 || n===7 ) ? _isprime_val = 1 : _isprime_val = 0;
         _isprime_val = 0;
	if(!(n&1)) return 0;
	if(n % 3 == 0) return 0;
	if(n % 5 == 0) return 0;
	var s = Math.floor(Math.sqrt(n));
	for(var d=7; d <= s; d+=6) {
		if(n % d == 0) return 0 ;
		if(n % (d+4) == 0) return 0;
	}
        _is_prime_val = 1;
	return  1;
}

var _nextprime_n = -1;
var _nextprime_val = 0;

    function nextprime(n) { // p > n
        if(n <= 1) return 2;
        n = n | 0 ;
        if(n === _nextprime_n) return _nextprime_val;
        _nextprime_n = n;
        if(!( n & 1)) n |= 1 ; else n += 2; 
        while(! isprime(n)) {n += 2; if(n <=0) return _nextprime_val = 0;} // OVERFLOW
        return _nextprime_val = n;
    } 
    
//////////////
// functions to plot an array
// interpolates between integer values
// array input format (1, ..., n2) numbers ;
//
// http://supercomputingblog.com/graphics/coding-bilinear-interpolation/
//////////////

 
 function interplot(x,y, a ) {
 var x1,x2,y1,y2,q11,q12,q21,q22,dx,dy,r1,r2,p;
 var dim2 = a.length;
 var dim = Math.floor(Math.sqrt(dim2)) ;
 
 x1 = Math.floor(x);
 y1 = Math.floor(y);
 if(x1<0) x1=0;
 if(y1<0) y1=0;
 if(x1>=dim-1) x1=dim-2;
 if(y1>=dim-1) y1=dim-2;
 x2=x1+1;
 y2=y1+1;
 
 
 dx=x2-x1;
 dy=y2-y1;
 
 q11 = a[x1+y1*dim];
 q12=  a[x1+y2*dim];
 q21 = a[x2+y1*dim];
 q22=  a[x2+y2*dim];
 if(dx === 0 || dy === 0) return q11 ; // a revoir
 				 r1 = (x2-x)*q11 + (x-x1)*q21;r1 /= dx; 
 				 r2 = (x2-x)*q12 + (x-x1)*q22; r2 /= dx;
 				 p = (y2 -y)*r1 + (y-y1)*r2;p/= dy;
  
 return p ;
 }
 
 /*
 function interplot(x,y, a ) {
 var x1,x2,y1,y2,q11,q12,q21,q22,dx,dy,r1,r2,p;
 var dim2 = a.length;
 var dim = Math.floor(Math.sqrt(dim2)) ;
 
 x1 = Math.round(x);
 y1 = Math.round(y);
 if(x1<0) x1=0;
 if(y1<0) y1=0;
 if(x1>=dim-1) x1=dim-1;
 if(y1>=dim-1) y1=dim-1;
  return a [x1 + y1*dim];
 }
 */

 


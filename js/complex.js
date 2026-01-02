/*
* GLisp (c) Georges Brougnard
*/

// http://docs.racket-lang.org/reference/generic-numbers.html#%28part._.Complex_.Numbers%29

/////////////////////
// COMPLEX
// { a= num, b = den !== 1 && > 0 }
////////////////////////

function isComplex( obj) { // restrictive
	return  obj instanceof Complex ;
}
function _complexp (obj) { // true math
	return (typeof obj === "number" || obj instanceof Integer ||
	 obj instanceof Rational || obj instanceof Complex)  ?  _true : _false;
}
function _realp (obj) { // true math
	return  (typeof obj === "number" || obj instanceof Integer ||
	obj instanceof Rational)  ? _true : _false;
}

function CError(z,msg) {
	return glisp_error(45,msg,z);
}

// returns a Complex, may-be rounded 
// Toooooo long - complex functions must return new Complex 
// use approx in Complex.toString() only

function Cnew (a , b) {
a = 0+a; b = 0+b;
	var ma = Math.abs(a), mb = Math.abs(b);
	if(Math.abs(Math.round(ma) - ma) < _MATH_PRECISION) a = Math.round(a) ; 
	if(Math.abs(Math.round(mb) - mb) < _MATH_PRECISION) b = Math.round(b) ; 
//	if(b === 0) return a;
	return new Complex (a,b);
} // C-inexact->exact


function Complex ( a, b) {
		this.a = a;
		this.b = b;
}
	Complex.prototype.toString = function() {
	
	function cround(a) { // --> a string
		if(_DECIMALS) {
		a=  a.toFixed(_DECIMALS) ; // a string
		a = a.replace(/0+$/g,'') ; // right trim zeroes
		a = a.replace(/\.$/,'') ;
		}
		return '' + a ;
		}
		
			var a=this.a, b= this.b ;
			if(isNaN(a) || isNaN(b)) return "NaN +iNaN" ;
			var ma = Math.abs(a), mb = Math.abs(b);
			if(Math.abs(Math.round(ma) - ma) < _MATH_PRECISION) a = Math.round(a) ; 
			if(Math.abs(Math.round(mb) - mb) < _MATH_PRECISION) b = Math.round(b) ; 
			var im = (b === 0) ? '+0' : 
				(b === 1) ? '+' : 
				(b === -1) ? '-' :
		    	(b > 0 ) ? '+' +cround(b) : cround(b) ;
			var re = (a === 0) ? '0' : cround(a);
			return re + im + "i" ;
			}
			
	Complex.prototype.valueOf = function() {return (this.b === 0) ? this.a :  this; }
	Complex.prototype.abs = function() {return Math.sqrt(this.a*this.a + this.b*this.b);} ;
	Complex.prototype.isZero = function() {return (this.a === 0) && (this.b === 0)} ;
	Complex.prototype.isPositive = function() {return (this.a >=0 && this.b >=0) } ; // ???
	Complex.prototype.isNegative = function() {return (this.a < 0 || this.b < 0) } ; // ???

	Complex.prototype.modulus = Complex.prototype.abs ;
	Complex.prototype.arg = function () {return Math.atan2 (this.b, this.a); };
	 
////////////////////////////////
//  C O M P L E X   methods
// i = JSInteger
// new fun to define : (conj z) (im z) (arg z) (re z) .. cf racket names NTYI
//////////////////////
	Complex.prototype.addInt = function(i) { return new Complex (this.a + i, this.b);};
	Complex.prototype.subInt = function(i) { return new Complex (this.a - i, this.b);};
	Complex.prototype.addIntX = function(i){ return new Complex (i -this.a, -this.b);};
	Complex.prototype.mulInt = function(i) { return new Complex (this.a * i, this.b * i);};
	Complex.prototype.divInt = function(i) { return new Complex (this.a / i, this.b / i);};
	Complex.prototype.modInt = function(i) { return new Complex (this.a % i, this.b % i);}; // ?
	Complex.prototype.modIntX = function(i){ return CError(this,"complex.modInt")}; // NYI
	

	Complex.prototype.neg = function() { return new Complex (-this.a,-this.b ) ;} ;
	Complex.prototype.inv = function() { 
						var den = (this.a*this.a + this.b*this.b);
						return new Complex ( this.a / den, - this.b / den) ;} ;	
	Complex.prototype.mulIntX = function(i) {  // i / z
						var mod = Math.sqrt(this.a*this.a + this.b*this.b);
						return new Complex (i * this.a / mod, - i * this.b / mod) ;} ;				
			
	Complex.prototype.sqrt = function() {
					if(this.b === 0) {
						if(this.a >= 0) return Math.sqrt(this.a) ;
						return new Complex(0, Math.sqrt(- this.a)) ;
					}
					var a = this.a, b = this.b ;
					var mod = Math.sqrt(a*a + b*b);
					var gamma = Math.sqrt ((a + mod) / 2);
					var delta = (b > 0) ? Math.sqrt ((mod-a) / 2) : - Math.sqrt ((mod -a) / 2);
					return new Complex(gamma, delta) ;
					};
							
///// comparisons
Complex.prototype.gt = function (q) { return CError(this,"complex.>")};
Complex.prototype.ge = function (q) { return CError(this,"complex.>=")};
Complex.prototype.lt = function (q) { return CError(this,"complex.<")};
Complex.prototype.le = function (q) { return CError(this,"complex.<=")};
			
// http://en.wikipedia.org/wiki/Exponentiation#Complex_exponents_with_base_e
Complex.prototype.pow = function (x) { 
				var mod,r,  t, theta ,c, d ;
				if(x instanceof Complex) { 
					 c = x.a; d = x.b;
					 r = Math.sqrt(this.a*this.a + this.b*this.b) ;
					 theta =  Math.atan2(this.b,this.a) ;
					 mod =  Math.pow(r, c) * Math.exp(- d * theta);
				     theta = theta   * c +  d * Math.log(r);
				     } 
				else {
				x = 0 + x ;
				mod = Math.pow((this.a*this.a + this.b*this.b) , x*0.5);
				theta =  Math.atan2(this.b,this.a)  * x ;
				}
				return new Complex (mod* Math.cos(theta), mod*Math.sin(theta)) ;
				} ;
				
Complex.prototype.exp= function () { 
					var mod = Math.exp(this.a);
					return  new Complex  (mod* Math.cos(this.b), mod*Math.sin(this.b)) ;
				} ;
					
//// two ops 
	Complex.prototype.numequal = function(z) { // '=' op
			if(z instanceof Complex) return (this.a === z.a && this.b === z.b)  ;
			if(this.b === 0) return this.a === z ;
			return false  ;};

	Complex.prototype.eq = function(q) { // same obj
			if(q instanceof Complex) return (this.a === q.a && this.b === q.b)  ;
			return false; };
	Complex.prototype.eqv = Complex.prototype.numequal ;
	Complex.prototype.equal = Complex.prototype.numequal ;

	Complex.prototype.add   = function(z) {
					if(z instanceof Complex) 
						return new Complex (this.a+z.a,this.b + z.b);
					return new Complex (this.a + z, this.b) ;
					};	
	Complex.prototype.sub   = function(z) {
					if(z instanceof Complex) 
						return new Complex (this.a-z.a,this.b - z.b);
					return new Complex (this.a - z, this.b) ;
					};
	Complex.prototype.mul   = function(z) {
					if(z instanceof Complex) 
						return new Complex (this.a*z.a - this.b*z.b,this.a*z.b + this.b*z.a);
					return new Complex (this.a * z, this.b * z) ;
					};
	Complex.prototype.div   = function(z) {
				if(z instanceof Complex) {
				var den = (z.a*z.a + z.b*z.b) ;
				return new Complex ((this.a*z.a+this.b*z.b)/den, (this.b*z.a - this.a*z.b)/den);
				}
				return new Complex (this.a / z, this.b / z) ;
				};
				

/*
 cosh x = (e**x + e**-x )/2
 sinh x = (e**x - e**-x)/2
 NYI */
/// Trigo
	
Complex.prototype.cos = function() {
    var a = this.a, b = this.b , ex = Math.exp(b) , ex_ = Math.exp(-b) ;
    return new Complex ( Math.cos(a) * (ex + ex_) / 2 , - Math.sin(a) * (ex - ex_) / 2) ;
 }
 
 Complex.prototype.sin = function() {
    var a = this.a, b = this.b , ex = Math.exp(b) , ex_ = Math.exp(-b) ;
    return new Complex ( Math.sin(a) * (ex + ex_) / 2 ,  Math.cos(a) * (ex - ex_) / 2) ;
 }
Complex.prototype.tan = function() {
    var a = this.a, b = this.b , ex = Math.exp(b) , ex_ = Math.exp(-b) ;
    var sa =  Math.sin(a) * (ex + ex_) / 2, sb =  Math.cos(a) * (ex - ex_) / 2;
    var ca =  Math.cos(a) * (ex + ex_) / 2, cb =  -Math.sin(a) * (ex - ex_) / 2;
    var den = (ca*ca + cb*cb) ;
	return new Complex ((sa*ca+sb*cb) / den ,(sb*ca-ca*sb) /den) ;
 }

Complex.prototype.log = function() {
    var n = this.a*this.a + this.b*this.b ;
    if(n === 0) return -Infinity ;
   	return new Complex ( Math.log(n) / 2 ,  Math.atan2(this.b,this.a)) ;  // [-PI .. PI]
}

Complex.prototype.sinh = function() { // NYI
	var z_ = new Complex(this.a,-this.b);
	var ex = this.exp(), ex_ = z_.exp();
	}

/* NYI !!!!
	modulo : function(x,y) {
				var a,b,c,d;
				if(isComplex(x)) {a = x[0]; b= x[1];}
				if(isComplex(y)) {c = y[0]; d= y[1];}
				if(isJSInteger(x)) {a=x; b=1;}
				if(isJSInteger(y)) {c=y; d=1;}
				if(a === undefined || c === undefined) return x % y ;
				return __qmodulo(a,b,c,d);
			}
	*/
	
Complex.pow  = function ( x, y) {
		if(isZero(y)) return 1;
		if(isZero(x)) return 0;
		if(x instanceof Complex) return x.pow(y);
		x = 0 + x ; // rational etc..
		if(isJSInteger(y) || (typeof y === "number" && x >=0 )) return Math.pow(x,y) ;
		x = new Complex(x,0);
		return x.pow(y) ;
		}
/*---------------
Sysfuns
----------------*/
function _new_complex (a,b) {return new Complex(a,b);} 
function _new_complex_polar(r,t) {return new Complex (r*Math.cos(t), r* Math.sin(t));}
function _real(x) {return (x instanceof Complex) ? x.a : x;}
function _imag(x) {return (x instanceof Complex) ? x.b : 0;}
function _magnitude(x) {return (x instanceof Complex) ?  
			Math.sqrt(x.a*x.a + x.b*x.b) : Math.abs(x);}
function _angle(x) {return (x instanceof Complex) ?  Math.atan2(x.b,x.a) : 0 ;}
function _conjugate (z) {return (z instanceof Complex) ? 
						new Complex (z.a, -z.b) : z ;}
		
function boot_complex () {
	system_constant("I", new Complex(0,1)) ;
	define_sysfun (new Sysfun ('make-rect', _new_complex ,2,2)) ; //always Complex
	define_sysfun (new Sysfun ('complex', _new_complex ,2,2)) ; //always Complex
	define_sysfun (new Sysfun ('make-polar', _new_complex_polar ,2,2)) ; //always Complex
	define_sysfun (new Sysfun ('polar', _new_complex_polar ,2,2)) ; //always Complex
	
	define_sysfun (new Sysfun ('real', _real ,1,1)) ; 
	define_sysfun (new Sysfun ('real-part', _real ,1,1)) ; 
	
	define_sysfun (new Sysfun ('imag', _imag ,1,1)) ; 
	define_sysfun (new Sysfun ('imag-part', _imag ,1,1)) ; 
	define_sysfun (new Sysfun ('magnitude', _magnitude ,1,1)) ; 
	define_sysfun (new Sysfun ('angle', _angle ,1,1)) ; 
	define_sysfun (new Sysfun ('conjugate', _conjugate ,1,1)) ; 
	}
	
// NYI isPositive ==> error

			
			 










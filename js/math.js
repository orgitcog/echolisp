/*-------------------
EchoLisp
math.js
(C) Jacques Tramu 2015
------------------------*/

// ECMA 6
Math.cbrt = Math.cbrt || function(x) {
  return x < 0 ? -Math.pow(-x, 1/3) : Math.pow(x, 1/3) ;
};


function map(a,amin,amax,omin,omax) {
	return omin + (a - amin) * (omax - omin) / (amax - amin) ;
}

function random(range) { // --> random Integer in [0..range[
return Math.floor(Math.random() * range) ;
}

function round10 (n)  { // 1 decimal
return Math.round(n*10) / 10 ;
}
function round100 (n)  { // 2 decimal
return Math.round(n*100) / 100 ;
}

function log2(x) {
  return Math.log(x) / Math.LN2;
}

function isJSInteger (nVal) { // small INTeger in Z
    return typeof nVal === "number" && isFinite(nVal) && nVal > -2000000001 && nVal < 2000000001 && Math.floor(nVal) === nVal;
    }

function isSmallInteger (nVal) { // POSITIVE small INT
    return typeof nVal === "number" && isFinite(nVal) && nVal >= 0 && nVal < 2000000001 && Math.floor(nVal) === nVal;
}

function isSmallSmallInteger (nVal) { // POSITIVE small small INT
    return typeof nVal === "number" && isFinite(nVal) && nVal >= 0 && nVal < 32000 && Math.floor(nVal) === nVal;
}

////////////////
// Big Integers (will be overrided by (lib 'bigint.lib)
/////////////////
function Integer(x) {
	this.bigint = x ;
	this.toString = function() {return '#' + x;}
	}

/*-------------------
// random and family
--------------------*/
	
function __random(n) { // to use internally
	if (n) return Math.floor(Math.random() * n) ;
	return Math.random();
}

function _random(top,argc) { //  (random [integer])  range : [0 ...b[
	if(argc === 0) return Math.random();
	var b = _stack[top];
	if(b === -1) return (Math.random() < 0.5) ?  - Math.random() : Math.random(); 
	if ((typeof b === "number") && (Math.floor(b) === b )) {
					 return  (b > 0) ?
					 	Math.floor( Math.random() * b) :
					    (Math.random() < 0.5) ?  
								- Math.floor( Math.random() * -b) :
								  Math.floor( Math.random() * -b) ;
					}
	
	if(b instanceof Integer) return  Integer.random(Integer.value(b));
	if(b instanceof Complex) return new Complex (b.a *Math.random() , b.b * Math.random())
	if(b instanceof Rational) 
				return Qnew(Math.floor(b.a *Math.random()) , Math.floor(b.b *Math.random())) ;
	return Math.random() * ( 0 + b) ;
}

function _random_prime(b) {
	if(isJSInteger(b)) return _next_prime (Math.floor( Math.random() * b)) ;
	else if (Integer.add) return Integer.randPrime(Integer.value(b)) ; // LIB here
	else return _random_prime(1000000000) ;
}

function _random_seed(obj) {
	Math.seedrandom(obj.toString()) ;
	return Math.random();
}


////////////////////////////
// Integer math
/////////////////////////

var _exactp = function (n) {
	return (isJSInteger(n) || (isRational(n)) || (n instanceof Integer)) ? _true : _false ;
}
var _inexactp = function (n) {
	return (_exactp(n) === _true)  ? _false : _true ;
}


function isSquare (n) { 
var s ;
	if(typeof n === "number") {
			if( n < 0) return false;
			s = Math.floor(Math.sqrt(n));
			return (n === s * s) ;
			}
	if(n.isNegative()) return false;
	if(n instanceof Rational) return isSquare(n.a) && isSquare(n.b) ;
	if(n instanceof Integer) {
			s = n.sqrt();
			return n.eq (s.mul(s));
			}
	return false;
}

function _squarep (n) {
	return (isSquare(n)) ? _true: _false;
	}

// may be need an intsqrt function - see Racket
function _sqrt(n) {
	if(typeof n === "number") {
			 if ( n >= 0) return Math.sqrt(n) ;
			 return new Complex (0, Math.sqrt(-n)) ;
			 }
	if(n instanceof Complex) return n.sqrt() ;
	if(n.isPositive()) return n.sqrt();
	return new Complex (0, n.abs().sqrt());
// error NYI
}

function _cbrt(n) {
	if(n instanceof Complex) return Complex.pow(n,1/3);
	return Math.cbrt(+ n);
}

/*----------------
 Math - Internal utilities
-------------------------*/
function __neg(x) { // used in (- n)
	if(typeof x === "number") return -x;
	if(x instanceof Integer)  return  Integer.neg(x);
	if(x instanceof Rational) return  Qnew(-x.a,x.b) ;
	if(x instanceof Complex)  return   new Complex (-x.a,-x.b) ;
	return glisp_error(22,x,"neg");
	}
	
function __inv(x) { // used in (/ n)
	if(isJSInteger(x)) return Qnew(1,x);
	if(typeof x === "number") return 1/x;
	if(x instanceof Integer)  return 1/x; // or small rational NYI
	if(x instanceof Rational) return  Qnew(x.b,x.a) ;
	if(x instanceof Complex) return   x.inv() ;
	return glisp_error(22,x,"inv");
	}
	
/*--------------------
1-OPERAND
-------------------------*/
var _fract = function (number) {
	if(typeof number === "number") return number - Math.floor(number);
	if(number instanceof Integer) return 0;
	if(number instanceof Rational) return (number.a < number.b) ?
					 number :  number.subInt(Math.floor(number)) ;
	return 0;
}

var _floor = function (number) {
	return Math.floor(_exact_to_inexact(number));
}
var _round = function (number) {
	return Math.round(_exact_to_inexact(number));
}
var _ceil = function (number) {
	return Math.ceil(_exact_to_inexact(number));
}
var _oddp = function (number) {
	if(isJSInteger(number)) return ( number & 1) ? _true: _false;
	if(number instanceof Integer) return number.odd() ? _true : _false;
	glisp_error(61,number,"odd?");
}
var _evenp = function(number) {
	if(isJSInteger(number)) return ( number & 1) ? _false: _true;
	if(number instanceof Integer) return number.even() ? _true : _false;
	glisp_error(61,number,"even?");
	}

var _abs = function (number) {
	if(typeof number === "number") return Math.abs(number);
	return number.abs();
}

var _1_add = function(number) {
	if(typeof number === "number") return number + 1;
	return number.addInt(1); 
}
var _1_sub = function(number) {
	if(typeof number === "number") return number - 1;
	return number.subInt(1);
}

var _exact_to_inexact  = function(n) { // long
	if(typeof n ==="number" || n instanceof Complex) return n;
	if(n instanceof Rational) return n.a / n.b;
	if(n instanceof Integer) return Integer.toFloat(n);
	return glisp_error(22,n,"math-lib"); 
}

var _inexact_to_exact  = function(n) {
	if(n instanceof Complex) return Cnew(n.a,n.b) ; // rounding
	if(typeof n ==="number" ) {
				if(Math.floor(n) === n) return n ;
				return __rationalize (n, 0.000001) ;
				}
	return n; // no type check !!!
}


/// compare
// hack for sorting anything
/*
if( ! String.prototype.gt) {
String.prototype.gt = function(b) {return (this > b.toString()) ? true: false;} ;
String.prototype.ge = function(b) {return (this >= b.toString()) ? true: false;} ;
String.prototype.lt = function(b) {return (this < b.toString()) ? true: false;} ;
String.prototype.le = function(b) {return (this <= b.toString()) ? true: false;} ;
}
*/

// raises TypeError: a.gt is not a function  
// b Integer NYI NYI NYI NYI
var _gt = function (a, b) { // returns symbol
	if(typeof a ==="number" && typeof b === "number") return ( a > b) ? _true : _false ;
	if(a instanceof Integer) return a.gt(b) ? _true : _false;
	return (+ a > + b) ? _true : _false ;
}

var _lt = function (a, b) { 
	if(typeof a ==="number" && typeof b === "number") return ( a < b) ? _true : _false ;
	if(a instanceof Integer) return a.lt(b) ? _true : _false;
	return (+ a < + b) ? _true : _false ;
}

var _ge = function (a,b) { 
	if(typeof a ==="number" && typeof b === "number") return ( a >= b) ? _true : _false ;
	if(a instanceof Integer) return a.ge(b) ? _true : _false;
	return ( + a >= + b) ? _true : _false ;
}
	
var _le = function (a,b) {
	if(typeof a ==="number" && typeof b === "number") return ( a <= b) ? _true : _false ;
	if(a instanceof Integer) return a.le(b) ? _true : _false;
	return ( + a <= + b) ? _true : _false ;
}

var _min_xx = function ( a , b) {
	return (_gt(a,b) === _true) ? b : a ;
	}
var _max_xx = function ( a , b) {
	return (_gt (b , a) === _true) ? b : a ;
	}



// any operand + JSInteger operand
// XI family = must implement run-time eror NYI

var _numequal_xi = function(x , i) {
	if(x === i) return _true;
	if(x instanceof Integer) return x.cmpInt(i) ? _false : _true;
	if(x instanceof Complex) return (x.b === 0 && x.a === i) ? _true : _false;
	// no p/q with q = 1 exists
	return _false;
	}


var _gt_xi = function(x , i) {
	if(typeof x === "number")  return (x > i) ? _true : _false;
	if(x instanceof Rational)  return (x.a/x.b > i )? _true : _false;
	if(x instanceof Integer)   return  (x.cmpInt(i) > 0) ? _true : _false ; 
	glisp_error(16,x,"'>'") ;
	}
var _lt_xi = function(x , i) {
	if(typeof x === "number") return (x <i) ? _true : _false;
	if(x instanceof Rational)  return (x.a/x.b < i )? _true : _false;
	if(x instanceof Integer)   return  (x.cmpInt(i) < 0) ? _true : _false ; 
	glisp_error(16,x,"'<'") ;
	}
var _ge_xi = function(x , i) {
	if(typeof x === "number") return (x >= i) ? _true : _false;
	if(x instanceof Rational)  return (x.a/x.b > i )? _true : _false;
	if(x instanceof Integer)   return  (x.cmpInt(i) >= 0) ? _true : _false ; 
	glisp_error(16,x,"'>='") ;
	}
var _le_xi = function(x , i) {
	if(typeof x === "number") return (x <= i) ? _true : _false;
	if(x instanceof Rational)  return (x.a/x.b <= i )? _true : _false;
	if(x instanceof Integer)   return  (x.cmpInt(i) <= 0) ? _true : _false ; 
	glisp_error(16,x,"'<='") ;
	}
		
var _add_xi = function(x, i) {
	if(typeof x === "number") return x + i;
	return x.addInt(i);
	// run time error here NYI
}

var _sub_xi = function(x, i) {
	if(typeof x === "number") return x - i;
	return x.subInt(i);
}
var _mul_xi = function(x, i) {
var m ;
	if(Integer.mul && isJSInteger(x)) {
			   m = x * i ;
			   if(isJSInteger(m)) return m;
			   return new Integer(x).mul(new Integer (i)) ;
			   }
	if(typeof x === "number") return x * i; // may be JSInteger ovflox here FIXED
	return x.mulInt(i);
}
var _div_xi = function(x, i) {
	if(isJSInteger(x)) return Qnew(x,i);
	if(typeof x === "number") return x / i;
	return x.divInt(i);
}
var _xdiv_xi = function(x, i) {

	if(typeof x === "number") return x / i;
	if(x instanceof Integer ) return x.toFloat() / i ;
	if(x instanceof Complex) return  x.divInt(i);
	return (0 + x) / i ;
}
var _modulo_xi = function(x, i) {
	if(typeof x === "number") {
			var m =  x % i;
			return (m < 0) ? m + i : m ;
			}
	return x.modInt(i);
}
var _quotient_xi = function(x, i) {
	if(typeof x === "number") return Math.floor( x / i) ;
	return _quotient_xx (x , i);
}

// ix family 
var _numequal_ix = function(i , x) {
	if(x === i) return _true;
	if(x instanceof Integer) return Integer.cmpInt(x,i) ? _false : _true ;
	// no p/q with q = 1 exits
	return _false;
	}

var _add_ix = function(i, x) {
	if(typeof x === "number") return x + i;
	return x.addInt(i);
}

var _mul_ix = function(i, x) { // fix int ovflow here NYI
	if(typeof x === "number") return x * i;
	return x.mulInt(i);
}

// 2-operands

var _numequal_xx = function(x, y) { // (= x y)
if(y === null) console.trace(x);
		if(typeof x === "number" && typeof y === "number") return (x === y) ? _true: _false;
		if(x instanceof Complex && y instanceof Complex) return   x.equal(y) ? _true: _false;
		return (x.valueOf() === y.valueOf()) ? _true: _false;
	}
	
var _not_numequal= function(x, y) { // (!= x y)
		if(typeof x === "number" && typeof y === "number") return (x === y) ? _false: _true;
		if(x instanceof Complex && y instanceof Complex) return   x.equal(y) ? _false: _true;
		return (x.valueOf() === y.valueOf()) ? _false: _true;
	}

var _add_xx = function(x, y) {
var m ;
	if(Integer.add && isJSInteger(x) && isJSInteger(y)) {
			   m = x + y ;
			   if(isJSInteger(m)) return m;
			   return new Integer(x).add(new Integer (y)) ;
			   }
	if(typeof x === "number") { 
			if (typeof y === "number") return x + y;
			return y.add(x); }
	if(y instanceof Complex) return y.add(x);
	if(x && x.add ) return x.add(y) ;
	glisp_error(22,x,"add") ; // a mettre partout NYI
}

var _sub_xx = function(x, y) {
		if(typeof x === "number") { 
			if (typeof y === "number") return x - y;
			return y.neg().add(x); } // -y + x
	if(y instanceof Complex) return y.neg().add(x) ; // best addX NYI
	if(x.sub )return x.sub(y) ;
	glisp_error(22,x,"sub") ; 
}

var _mul_xx = function(x, y) {
var m ;
	if(Integer.mul && isJSInteger(x) && isJSInteger(y)) {
			   m = x * y ;
			   if(isJSInteger(m)) return m;
			   return new Integer(x).mul(new Integer (y)) ;
			   }
	if(typeof x === "number") { 
			if (typeof y === "number") return x * y;
			return y.mul(x); }
	if(y instanceof Complex) return y.mul(x);
	if(x && x.mul) return x.mul(y) ;
	glisp_error(22,x,"mul") ;
}
// crash (/ #6 22/7 ) (/  22/7 #6) NYI
var _div_xx = function(x, y) { 
	if(isJSInteger(x) && isJSInteger(y)) return Qnew(x,y) ; // DANGER (f w) = 1/x NYI !!!
	if((typeof x === "number") && (typeof y === "number"))  return x / y;
	if(x instanceof Integer || y instanceof Integer) return Integer.div(x,y) ; // always an Integer
	if(x instanceof Complex) return x.div(y);
	if(x instanceof Rational) return x.div(y);
	if(y && y.inv) return y.div(x).inv();
	glisp_error(22,[x,[y,null]] ,"div") ;
}
var _xdiv_xx = function(x, y) { /// HERE - Float divide
	if(typeof x === "number"   &&  typeof y === "number")  return x / y;
	if(x instanceof Complex) return x.div(y);
	if(y instanceof Complex) return y.inv().mul(x);
	return ( 0 + x) / ( 0 + y) ;
}
var _modulo_xx = function(x, y) { 
	if(typeof x === "number" && typeof y === "number")  {
		var m = x %  y; 
		return (m < 0 ) ? m + y : m  ;
		}
	if(x  instanceof Integer || y instanceof Integer) return Integer.modulo(x , y); 
	if(isRational(x) || isRational(y)) return Rational.modulo(x,y);
	glisp_error(22,[x, [y,null]],"modulo");
}
var _quotient_xx = function(x, y) { // Integer divide quotient
	if(typeof x === "number" && typeof y === "number") return Math.floor( x / y) ;
	if(x  instanceof Integer ) return x.div(y) ; 
	if(y  instanceof Integer) return new Integer(x).div(y) ;
	glisp_error(61,[x, [y,null]],"quotient");
}

/*-----------------------------------
// M A T H   P R I M I T I V E S  n-Ary
//
// argv is stack[top ...top+nargs[
// # of passed args is argc
// implement big stack and increment by chunck (NYI)
---------------------------------*/

var _min = function (top,argc) { // argc = last - top
		var ret = _stack[top], last = top + argc ;
		if(ret instanceof Procrastinator) return ret.min();
		for(var i = top+1 ; i < last ; i++) 
			if(_lt (_stack[i],ret) === _true) ret = _stack[i];
		return ret;
} // _min
var _max = function (top,argc) { // argc = last - top
		var ret = _stack[top], last = top + argc ;
		if(ret instanceof Procrastinator) return ret.max();
		for(var i = top+1 ; i < last ; i++) 
			if(_gt (_stack[i],ret) === _true) ret = _stack[i];
		return ret;
} // _max

var _plus = function (top,argc) { // argc = last - top
		var s = 0, last = top + argc ;
		for(var i = top ; i < last ; i++) 
			s = _add_xx(_stack[i],s);
		return s;
	} // _plus

var _minus = function (top,argc) { // at least one arg 
		var s = _stack[top] , last = top + argc ; //  !!!!!! TOP !!!
		if(argc === 1) return __neg(s);
		for(var i = top + 1 ; i < last ; i++) 
			s = _sub_xx(s,_stack[i]);
		return s;
	} 
var _mult = function (top,argc) {
		var s = 1, last = top + argc ;
		for(var i = top ; i < last ; i++) 
			s = _mul_xx(_stack[i],s);
		return s;
	} 
var _div = function (top,argc) {
		var s = _stack[top] , last = top + argc , p = 1 ;
		if(argc === 1) return __inv(s);
		for(var i = top+1 ; i < last ; i++) 
			p  = _mul_xx(p,_stack[i]);
		return _div_xx(s,p);
	} 
var _xdiv = function (top,argc) {
		var s = _stack[top] , last = top + argc, p = 1 ;
		if(argc === 1) return _xdiv_xx(1,s);
		for(var i = top+1 ; i < last ; i++) 
			p  = _mul_xx(p,_stack[i]);
		return _xdiv_xx(s,p) ;
	} 
	

// TRIGO 
// TO OVERRIDE in mathlib NYI
var _asin = function(x) {return Math.asin(+x);}
var _acos = function(x) {return Math.acos(+x);}
var _atan = function(x) {return Math.atan(+x);}
var _atan2 = function(x,y) {return Math.atan2(+x,+y);}
var _sin = function(x) {if(x instanceof Complex) return x.sin(); return Math.sin(+x);}
var _cos = function(x) {if(x instanceof Complex) return x.cos(); return Math.cos(+x);}
var _tan = function(x) {if(x instanceof Complex) return x.tan(); return Math.tan(+x);}
var _log = function(x) {if(x instanceof Complex) return x.log(); return Math.log(+x);}
var _log2 = function(x) {return log2(+x);}
var _log10 = function(x) {return Math.log10(+x);}


var _exp = function(x) {
			if(x instanceof Complex) return x.exp();
			return Math.exp(+x);
			}
			
var _expt = function(x,y) { 
var p;
		if(x instanceof Complex || y instanceof Complex) return Complex.pow(x,y) ;
		if(isRational(x) && isJSInteger(y))  return x.pow(y); 
		if(x instanceof Integer) return x.pow(y);
		
		if(Integer.pow)
		if(isJSInteger(x))
		if(isSmallInteger(y)) { // y>=0
				p = Math.pow(x,y);
				if(isJSInteger(p)) return p;
				return Integer.pow(x,y); // lib loaded
				}
				
		x =  + x;
		
		// -27 ** 1/3
		if( typeof x === "number"
			&& x < 0
			&& y instanceof Rational
			&& y.a === 1
			&& (y.b & 1))  // odd
			return - Math.pow (-x, y) ;
	
		
		y =  + y ;
		if(	typeof x === "number"  
				&& typeof y === "number"
				&& (x >= 0 || isSmallInteger(y))) return Math.pow(x,y) ;
				
			
			
		
		return Complex.pow(x,y) ; // -3**-1.2
		}

////////////////////////////////
// primes and family
///////////////////////////

var _gcd_xx = function ( a, b) {
	if(isJSInteger(a) && isJSInteger(b)) return __gcd(a,b);
	if(a instanceof Integer || b instanceof Integer) return Integer.GCD(a,b);
	glisp_error(61,[a,[b,null]],"gcd");
}
var  _gcd  = function (top,argc) {
		var stop = top+argc ;
		var a = _stack[top++], b = _stack[top++] ; 
		var g = _gcd_xx(a,b);
		while(top < stop) {
			g = _gcd_xx(_stack[top++],g);
			if (g === 1) return 1;
			}
		return g;	
}
var _lcm = function(a,b) {
	if(a === 0 || b === 0) return 0;
	if(isJSInteger(a) && isJSInteger(b)) return  (a * b) / __gcd(a,b);
	if(a instanceof Integer || b instanceof Integer) return  _div_xx(_mul_xx(a,b) , _gcd_xx (a,b)) ;
	glisp_error(61,[a,[b,null]],"lcm");
	}

function _primes(n) {
if(!isJSInteger(n) || n > 10000) glisp_error(24,n,"primes");
		var primes = [2 , null] , last = primes, p = 2 ;
		while (n-- > 1) 
			last = (last[1] = [ (p = _next_prime(p))  ,null]) ;
		primes[TAG_SET] = true;
		return primes;
}

function _next_prime(n) {
	if(n instanceof Integer) return Integer.nextPrime(n);
	n = Math.floor(+ n) ;
	if(isJSInteger(n)) { // small ones only
		if(n <= 1) return 2;
		if(n & 1) n += 2 ; else n += 1;
		while(true) {
			if(isPrime(n)) return n;
			n += 2;
			}}	
	if(Integer.nextPrime) return Integer.nextPrime(Integer.value(n));
	glisp_error(24,n,"next-prime");
}

// test : isPrime(2000000000 + ...) NYI
// returns true/false
function isPrime(n) { 
	if(n instanceof Integer) return Integer.isPrime(n); // check negatives are OK NYI
	if(! (typeof n === "number")) glisp_error(48,n,"prime?") ;
	if(isJSInteger(n)) {
		if(n < 0) n = - n ;
		if(n <= 7 ) return ( n==2 || n==3 || n==5 || n==7 ) ;
		if(!(n&1)) return false;
		if(n % 3 == 0) return false;
		if(n % 5 == 0) return false;
		var s = Math.floor(Math.sqrt(n));
		for(var d=7; d <= s; d+=6) {
			if(n % d == 0) return false ;
			if(n % (d+4) == 0) return false;
			}
		return true;
		}
	if( Math.floor(n) === n && Integer.isPrime)
		return Integer.isPrime(new Integer (n)) ;
	glisp_error(75,n,"prime?"); // use bigint.lib
} // isPrime

//var _IS_PRIME = [];
function _primep(n) {
	// if(isJSInteger(n) && n >=0 && n < 10000 && _IS_PRIME[n] !== undefined) return _IS_PRIME[n];
	return isPrime(n) ? _true: _false ;
}


// returns n if prime, 0 if time-out , else least prime factor if JSInteger
// return 0 if _COMPUTING
var _CACHE_FACTOR_BUFFER = null; //  new ArrayBuffer(size*4);
var _FACTOR_ARRAY = null;  // array = new Int32Array(buffer);

function _factor(n) { // ->  prime <=n , or 1 if n <= 1 or 0 if error
var p , s, d;
	if(_COMPUTING) return 0;
	
	if(n instanceof Integer) {
		if(_numequal_xi(n,1) === _true) return 1;
		if(isZero(n)) return 1;
		p = Integer.rho(n,true); // 0 if time-sliced
		if(_numequal_xx (n,p) === _true) return p ;
		return isZero(p) ? 0 :  isPrime(p) ? p : _factor(p) ;
		}
	
	if(isJSInteger(n)) {
		if(n < 0) n = - n ;
		if(n <= 1) return 1;
		
		if(!(n&1)) return 2;
		if(n % 3 == 0) return 3;
		if(n % 5 == 0) return 5;
		
	s = Math.floor(Math.sqrt(n));
	
	for(d=7; d <= s; d+=6) {
		if(n % d == 0) return d ;
		if(n % (d+4) == 0) return (d+4);
		}
	return n; // prime
	}
	glisp_error(48,n,"factor");
} // factor

// return a list or null
function _prime_factors (n)  {
	var f, ret = [];
	if(isJSInteger(n)) {
	if(n <= 1) return null;
		while(true) {
			f = _factor(n) ;
			if(f <= 1) return null; // error here
			ret.push(f);
			if(f === n) return __array_to_list(ret);
			n /= f ;
			}}
	if(n instanceof Integer) {
		if(_le_xi(n,1) === _true) return null;
		while(true) {
			f = _factor(n);
			if(_le_xi(f,1) === _true) { // cannot complete
								ret.push(n);
								return __array_to_list(ret) ;
								}
			ret.push(f);
		    if (_numequal_xx(f,n) === _true) return __array_to_list(ret); // sort me NYI
			n = _div_xx (n, f);
			}}
		glisp_error(48,n,"prime-factors");
} // _prime_factors


function __powmod (base, exp, mod) {
	var ret = 1;
	base = base % mod ;
	while (exp > 0) {
	if( base * ret > 1e14 ) glisp_error(75,base*ret,"powmod : overflow") ;
		if(exp & 1) ret = ( ret * base)  % mod ;
		exp = exp >> 1 ;
		base = (base * base) % mod ;
	}
	return (ret < 0) ? ret + mod : ret ;
}
// bigint
var _powmod = function (base ,exp, mod) {
	return  Integer.powMod ? Integer.powMod(base, exp, mod) : __powmod(base,exp,mod); 
}

/*----------------------
shuffle
https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
-----------------------------*/
function __shuffle_array(n) { // -> random perm of [0.. n-1]
	var i, j , a = [] ;
	for(i=0; i<n ; i++) {
		j = __random(i+1);
		if(j !== i) a[i] = a[j] ;
	a[j] = i ;
	}
	return a ;
	}
	
var _shuffle = function (lst) {
if(notIsList(lst)) glisp_error(20,lst,"shuffle") ;
	var a = __list_to_array(lst);
	var s = __shuffle_array(a.length);
	lst = null;
	for(i=0;i<a.length;i++) lst = [a[s[i]], lst] ;
	return lst;
	}
	
/*------------------------------------
Combinatorics
-----------------------------------*/
var _Cnp = function (n , p) { // n! / p! (n-p)!
var num = 1, den = 1,  i ;
	if(! isSmallInteger(n)) glisp_error(48,n,"Cnp") ;
	if(! isSmallInteger(p)) glisp_error(48,p,"Cnp") ;
	if(p > n) return 0;
	if (p === 1) return n ;
	if (p === 0) return 1;
	// n! / (n-p) !
	for(i = n-p+1; i<= n; i++) num *= i;
	for(i = 2 ; i<=p ; i++) den *= i;
	if(Integer.Cnp &&  (! isSmallInteger(num) || ! isSmallInteger(den))) return Integer.Cnp(n,p) ;
	return num / den;
	}
	
var _Anp = function (n , p) { // n! /  (n-p)!
	var num = 1,  i ;
	if(! isSmallSmallInteger(n)) glisp_error(48,n,"Cnp") ;
	if(! isSmallSmallInteger(p)) glisp_error(48,p,"Cnp") ;
	if(p > n) return 0;
	if (p === 1) return n ;
	if (p === 0) return 1;
	// n! / (n-p) !
	for(i = n-p+1; i<= n; i++) num = _mul_xx(num,i) ;
	return num ; 
	}
	

var _factorial = function(n) {
	if(! isSmallSmallInteger(n)) glisp_error(48,n,"factorial") ;
	if(n <= 1) return 1;
	var i,f= 1 ;
	if(n < 12) {
				for(i = 2 ; i <= n ;i++) f *= i;
				return f;
				}
	if(Integer.factorial) return Integer.factorial(n) ;
	for(i = 2 ; i <= n ;i++) f *= i;
	return f;
}

/*---------------------
bitwise integer ops
---------------------------*/
/*
    (bitwise-and integer integer) -> integer 
    (bitwise-ior integer integer) -> integer 
    (bitwise-xor integer integer) -> integer 
    (bitwise-not integer) -> integer  
    (arithmetic-shift integer bit-count) -> integer  
    (bitwise-bit-set? integer bit )
    (bit-count integer) -> integer  // RFU
*/
var _logand = function (a,b) {
	return (a & b) ;
}
var _logor = function (a, b) {
	return (a  | b) ;
}
var _logxor = function (a ,b) {
	return (a ^ b) ;
}
var _lognot = function (a ) {
	return ( ~ a) ;
}
var _logshift = function (a, b) {
	return b < 0 ? a >> -b : a << b ;
}
var _log_bit_set = function (a, b) {
	return ((1 << b) & a) ? _true : _false ;
}

var _bit_count = function (x) {
	x &= 0xffffffff ;
    x -= ((x >> 1) & 0x55555555);
    x = (((x >> 2) & 0x33333333) + (x & 0x33333333));
    x = (((x >> 4) + x) & 0x0f0f0f0f);
    x += (x >> 8);
    x += (x >> 16);
    return x & 0x3f ;
}

const MultiplyDeBruijnBitPosition =
	 [ 0, 1, 28, 2, 29, 14, 24, 3, 30, 22, 20, 15, 25, 17, 4, 8,
	  31, 27, 13, 23, 21, 19, 16, 7, 26, 12, 18, 6, 11, 5, 10, 9
	];
	
var _bit_right  = function (x) {
	return  MultiplyDeBruijnBitPosition[((x & -x)  * 0x077CB531) >>> 27] ;
	}


	
	
/*------------------
MATHS BOOT
---------------------*/

function boot_maths () {
	
//CALCULUS
	system_constant('PI',3.14159265358979323846264338327950288419717);
	system_constant('-PI',-3.14159265358979323846264338327950288419717);
	system_constant('2PI',3.14159265358979323846264338327950288419717*2.0);
	system_constant('PI/2',3.14159265358979323846264338327950288419717/2.0);
	system_constant('E',2.7182818284590452353602874713526624977572470937);
	system_constant('LOG2',0.69314718055994530941723212145817656807550013436025);
	define_variable('epsilon',1.e-6);
	
	define_sysfun (new Sysfun('exact->inexact',_exact_to_inexact,1,1));
	define_sysfun (new Sysfun('inexact->exact',_inexact_to_exact,1,1));
	
// predicates
	define_sysfun (new Sysfun ('square?',   _squarep,1,1)) ;
	define_sysfun (new Sysfun ('prime?',   _primep,1,1)) ;
	define_sysfun (new Sysfun ('zero?',   _zerop,1,1)) ;
	define_sysfun (new Sysfun ('!zero?',   _not_zerop,1,1)) ;
	
// comparison
	define_sysfun (new Sysfun ('>',   _gt,2,2)) ; 
	define_sysfun (new Sysfun ('<',   _lt,2,2)) ; 
	define_sysfun (new Sysfun ('>=',   _ge,2,2)) ; 
	define_sysfun (new Sysfun ('<=',   _le,2,2)) ; 
	
// arity 0:n
	define_sysfun (new Sysfun ('+',   _plus,0)) ; 
	define_sysfun (new Sysfun ('-',   _minus,1)) ;  
	define_sysfun (new Sysfun ('*',  _mult, 0)) ; 
	define_sysfun (new Sysfun ('/',  _div, 1)) ; 
	define_sysfun (new Sysfun ('//',  _xdiv, 1)) ; 
	define_sysfun (new Sysfun ('min',  _min, 1)) ; 
	define_sysfun (new Sysfun ('max',  _max, 1)) ; 
	
// arity 1:1
	define_sysfun(new Sysfun ('1+', _1_add,1,1));
	define_sysfun(new Sysfun ('1-', _1_sub,1,1));
	define_sysfun(new Sysfun ('add1', _1_add,1,1));
	define_sysfun(new Sysfun ('sub1', _1_sub,1,1));

	define_sysfun (new Sysfun ('even?',  _evenp, 1,1)) ; 
	define_sysfun (new Sysfun ('odd?',  _oddp, 1,1)) ; 
	define_sysfun (new Sysfun ('sqrt',  _sqrt, 1,1)) ; 
	define_sysfun (new Sysfun ('cbrt',  _cbrt, 1,1)) ; // DOC NEW
	define_sysfun (new Sysfun ('abs',  _abs, 1,1)) ; 
	define_sysfun (new Sysfun ('floor',  _floor, 1,1)) ; 
	define_sysfun (new Sysfun ('ceil',  _ceil, 1,1)) ; 
	define_sysfun (new Sysfun ('round',  _round, 1,1)) ; 
	define_sysfun (new Sysfun ('num',  _num, 1,1)) ; 
	define_sysfun (new Sysfun ('den',  _den, 1,1)) ; 
	define_sysfun (new Sysfun ('fract',  _fract, 1,1)) ; 
	define_sysfun (new Sysfun ('powmod',  _powmod, 3,3)) ; 

// arity 2:2
	define_sysfun (new Sysfun ('=',   _numequal_xx,2,2)) ;
	define_sysfun (new Sysfun ('!=',   _not_numequal,2,2)) ;

	define_sysfun(new Sysfun ('_>_xi', _gt_xi,2,2,[isAny,isJSInteger]));
	define_sysfun(new Sysfun ('_<_xi', _lt_xi,2,2,[isAny,isJSInteger]));
	define_sysfun(new Sysfun ('_>=_xi', _ge_xi,2,2,[isAny,isJSInteger]));
	define_sysfun(new Sysfun ('_<=_xi', _le_xi,2,2,[isAny,isJSInteger]));

	define_sysfun(new Sysfun ('_=_xi', _numequal_xi,2,2,[isAny,isJSInteger]));
	define_sysfun(new Sysfun ('_=_ix', _numequal_ix,2,2,[isJSInteger,isAny]));

	
	define_sysfun(new Sysfun ('_+_xi', _add_xi,2,2,[isAny,isJSInteger]));
	define_sysfun(new Sysfun ('_-_xi', _sub_xi,2,2,[isAny,isJSInteger]));
	define_sysfun(new Sysfun ('_*_xi', _mul_xi,2,2,[isAny,isJSInteger]));
	define_sysfun(new Sysfun ('_/_xi', _div_xi,2,2,[isAny,isJSInteger]));
	define_sysfun(new Sysfun ('_//_xi', _xdiv_xi,2,2,[isAny,isJSInteger]));
	define_sysfun(new Sysfun ('_modulo_xi', _modulo_xi,2,2,[isAny,isJSInteger]));
	define_sysfun(new Sysfun ('_quotient_xi', _quotient_xi,2,2,[isAny,isJSInteger]));
	
	define_sysfun(new Sysfun ('_+_ix', _add_ix,2,2,[isJSInteger,isAny]));
	define_sysfun(new Sysfun ('_*_ix', _mul_ix,2,2,[isJSInteger,isAny]));

	define_sysfun(new Sysfun ('_+_xx', _add_xx,2,2,[isAny,isAny]));
	define_sysfun(new Sysfun ('_-_xx', _sub_xx,2,2,[isAny,isAny]));
	define_sysfun(new Sysfun ('_*_xx', _mul_xx,2,2,[isAny,isAny]));
	define_sysfun(new Sysfun ('_/_xx', _div_xx,2,2,[isAny,isAny]));
	define_sysfun(new Sysfun ('_//_xx', _xdiv_xx,2,2,[isAny,isAny]));
	define_sysfun(new Sysfun ('_min_xx', _min_xx,2,2,[isAny,isAny]));
	define_sysfun(new Sysfun ('_max_xx', _max_xx,2,2,[isAny,isAny]));
	
	define_sysfun (new Sysfun ('%',  _modulo_xx, 2,2)) ;
	define_sysfun (new Sysfun ('modulo',  _modulo_xx, 2,2)) ; 
	 
	define_sysfun (new Sysfun ('quotient',  _quotient_xx, 2,2)) ;  

//BIT-WISE
	define_sysfun(new Sysfun ('bitwise-and', _logand,2,2,[isJSInteger,isJSInteger]));
	define_sysfun(new Sysfun ('bitwise-not', _lognot,1,1,[isJSInteger]));
	define_sysfun(new Sysfun ('bitwise-ior', _logor,2,2,[isJSInteger,isJSInteger]));
	define_sysfun(new Sysfun ('bitwise-xor', _logxor,2,2,[isJSInteger,isJSInteger]));
	define_sysfun(new Sysfun ('bitwise-bit-set?', _log_bit_set,2,2,[isJSInteger,isJSInteger]));
	define_sysfun(new Sysfun ('arithmetic-shift', _logshift,2,2,[isJSInteger,isJSInteger]));
	define_sysfun(new Sysfun ('bit-count', _bit_count,1,1));
	define_sysfun(new Sysfun ('bit-right', _bit_right,1,1));
	
// TRIGO
	define_sysfun (new Sysfun ('asin',   _asin,1,1)) ; 
	define_sysfun (new Sysfun ('acos',   _acos,1,1)) ; 
	define_sysfun (new Sysfun ('atan',   _atan,1,1)) ; 
	define_sysfun (new Sysfun ('atan2',   _atan2,2,2)) ; 
	define_sysfun (new Sysfun ('sin',   _sin,1,1)) ; 
	define_sysfun (new Sysfun ('cos',   _cos,1,1)) ; 
	define_sysfun (new Sysfun ('tan',   _tan,1,1)) ; 
	define_sysfun (new Sysfun ('log',   _log,1,1)) ; 
	define_sysfun (new Sysfun ('log2',   _log2,1,1)) ;
	define_sysfun (new Sysfun ('log10',   _log10,1,1)) ; 
	define_sysfun (new Sysfun ('exp',   _exp,1,1)) ; 
	define_sysfun (new Sysfun ('^',   _expt,2,2)) ; 
	define_sysfun (new Sysfun ('expt',   _expt,2,2)) ; 

// RANDOM
	define_sysfun(new Sysfun ("random",_random,0,1));
	define_sysfun(new Sysfun ("random-seed",_random_seed,1,1));
	
// NUM theory
	define_sysfun(new Sysfun ("rationalize",_rationalize,1,2)); //  (rationalize x [epsilon])
	define_sysfun(new Sysfun ("factor",_factor,1,1));
	define_sysfun(new Sysfun ("prime-factors",_prime_factors,1,1));
	define_sysfun(new Sysfun ("random-prime",_random_prime,1,1));
	define_sysfun(new Sysfun ("next-prime",_next_prime,1,1));
	define_sysfun(new Sysfun ("primes",_primes,1,1));
	// http://osdir.com/ml/racket.development/2011-12/msg00030.html  (Rational GCD)
	define_sysfun(new Sysfun ("_gcd_xx",_gcd_xx,2,2,[isAny,isAny]));
	define_sysfun(new Sysfun ("gcd",_gcd,3)) ; // (gcd a b c ...)
	define_sysfun(new Sysfun ("lcm",_lcm,2,2)) ;
	
	define_sysfun(new Sysfun("Cnp",_Cnp,2,2)); // NEW
	define_sysfun(new Sysfun("Anp",_Anp,2,2));
	define_sysfun(new Sysfun ("!",_factorial,1,1)); 
	define_sysfun(new Sysfun ("factorial",_factorial,1,1)); 
	}
	


	
/*
* GLisp (c) Georges Brougnard
*/

///////////////
// utilities
/////////////////////

function __gcd(a, b) { // accepts __gcd(a,0) --> a
var t;
   if(a === 0 ) return b;
   if(b === 0)  return a ;
   if (a < 0) a = -a; if(b < 0) b = -b;
   if (b > a) {t = a; a = b; b = t;}
    while (true) {
        a %= b;
        if (a == 0) return b;
        b %= a;
        if (b == 0) return a;
    }
} // __gcd 


/////////////////////
// R A T I O N A L S
// { a= num, b = den !== 1 && > 0 }
////////////////////////

function isRational( obj) { // restrictive
	return  obj instanceof Rational ;
}
function _rationalp (obj) { // true math
	return (obj instanceof Integer || isJSInteger(obj) || obj instanceof Rational)  ?
		 _true : _false;
}


// returns a rational, or number
function Qnew(a , b) {
// console.log("qconstruct",a,b);
	
	if (a === 0) return 0;
	if (b == 0) {glisp_error(9,''+a+'/0',"rational"); return 0; }
	if( b < 0) {a = -a; b = -b;}
	if(Math.floor(a) !== a || Math.floor(b) !== b) return a/b ;
		var g = __gcd(a,b);
		a /= g;
		b /= g;
		if( b === 1) return a ;
		return new Rational(a,b) ; 
} // Qconstructor

function Rational ( a, b) {
		this.a = a;
		this.b = b;
}

////////////////////////////////
//  R A T I O N A L methods
//////////////////////
	Rational.prototype.toJSON = function() { // used in __hcode and ONLY in __hcode
		return '' + this.a + '/' + this.b ;
		}
		
	Rational.prototype.toString = function() {
	return '' + this.a + "/" + this.b ;
		}
	
	Rational.prototype.valueOf = function() {return this.a / this.b; };
	Rational.prototype.isZero = function () { return this.a  === 0 ; };
	Rational.prototype.isNegative = function () { return this.a  < 0; };
	Rational.prototype.isPositive = function () { return this.a >= 0; };
	Rational.prototype.abs = function() {if(this.a < 0) return Qnew(-this.a,this.b); return this;};
	Rational.prototype.addInt = function(i) { return Qnew (this.a+i*this.b,this.b);};
	Rational.prototype.subInt = function(i) { return Qnew (this.a-i*this.b,this.b);}; // q - i
	Rational.prototype.mulInt = function(i) { return Qnew (this.a*i,this.b);}; 
	Rational.prototype.divInt = function(i) { return Qnew (this.a,this.b*i);}; // q / i
	Rational.prototype.modInt = function(i) { return __qmodulo(this.a,this.b,i,1);}; // q % i
	Rational.prototype.modIntX = function(i) { return __qmodulo(i,1,this.a,this.b);}; //  i % q CHECK CALL INVERSE ARG NYI
	
	Rational.prototype.neg = function() { return new Rational (-this.a,this.b ) ;} ;
	Rational.prototype.inv = function() { return Qnew (this.b,this.a ) ;} ;				
	Rational.prototype.sqrt = function() {
						if(this.a < 0) return undefined; // QError best NYI
						if(isSquare(this.a) && isSquare(this.b))
							return Qnew(Math.sqrt(this.a),Math.sqrt(this.b)) ;
						return _sqrt(this.a/this.b);
						};
							
	Rational.prototype.nextPrime = function () {return _next_prime(this.a/this.b);} ;
	
///// comparisons
Rational.prototype.gt = function (q) { 
			if(isSmallInteger(q)) return (this.a > q*this.b  ) ;
			return (this.a/this.b > q); };
			
Rational.prototype.ge = function (q) { 
			if(isSmallInteger(q)) return (this.a >= q*this.b ) ;
			return (this.a/this.b >= q) ;};
			
Rational.prototype.lt = function (q) { 
			if(isSmallInteger(q)) return (this.a < q*this.b  );
			return (this.a/this.b < q) };
			
Rational.prototype.le = function (q) { 
			if(isSmallInteger(q)) return (this.a <= q*this.b );
			return (this.a/this.b <= q );};
			
Rational.prototype.pow = function (x) {
				var num , den ;
				if(x === 0) return 1;
				if(x === -1) return Qnew(this.b,this.a) ;
				if(x === 1) return this;
				if(isJSInteger(x) && x < 0 ) 
				 	{den = Math.pow(this.a,Math.abs(x)); num = Math.pow(this.b,Math.abs(x));}
				 	else { num = Math.pow(this.a,x); den = Math.pow(this.b,x);}
				 	
				 if(isJSInteger(num) && isJSInteger(den)) 
				 	 return new Rational(num,den);
				return num/den ;
				}
					
//// anything in input 

	Rational.prototype.numequal = function(q) { // '=' op
			if(q instanceof Rational) return (this.a === q.a && this.b === q.b)  ;
			return (this.a / this.b === q)  ;};

	Rational.prototype.eq = function(q) { // same obj
			if(q instanceof Rational) return (this.a === q.a && this.b === q.b)  ;
			return false; };
	Rational.prototype.eqv = Rational.prototype.numequal ;
	Rational.prototype.equal = Rational.prototype.numequal ;

	Rational.prototype.add   = function(b) {
					if(b instanceof Rational) return Qnew(this.a*b.b+this.b*b.a,this.b*b.b);
					if(isJSInteger(b)) return Qnew(this.a+b*this.b,this.b);
					return this.a/this.b + b ;};
			
	Rational.prototype.sub   = function(b) {
					if(b instanceof Rational) return Qnew(this.a*b.b-this.b*b.a,this.b*b.b);
					if(isJSInteger(b)) return Qnew(this.a-b*this.b,this.b);
					return this.a/this.b - b ;};
			
	Rational.prototype.mul    = function(b) {
					if(b instanceof Rational) return Qnew(this.a*b.a,this.b*b.b);
					if(isJSInteger(b)) return Qnew(this.a*b,this.b);
					return (this.a/this.b) * b ;};
	Rational.prototype.div    = function(b) {
					if(b instanceof Rational) return Qnew(this.a*b.b,this.b*b.a);
					if(isJSInteger(b)) return Qnew(this.a,this.b*b);
					return this.a/(this.b * b) ;};
		
	
// compute a/b mod c/d
function __qmodulo (a,b,c,d) {
 console.log("qmodulo",a,b,c,d);
	var p = a*d , q = b*c;
	if( p < q) return Qnew(a,b);
	return Qnew((p%q),b*d);
}
			
	Rational.modulo = function(x,y) {
				var a,b,c,d;
				if(isRational(x)) {a = x.a; b= x.b;}
				if(isRational(y)) {c = y.a; d= y.b;}
				if(isJSInteger(x)) {a=x; b=1;}
				if(isJSInteger(y)) {c=y; d=1;}
				if(a === undefined || c === undefined) return x % y ;
				return __qmodulo(a,b,c,d);
				}

// x : jsnumber
// http://en.wikipedia.org/wiki/Stern%E2%80%93Brocot_tree
function ___rationalize ( x , eps) {
	var loops = 100000;
	var a=0, b=1, c=1, d = 0,M, m, n; // median = m / n ;
		while(loops--) {
		m = a+c;
		n = b+d ;
		M = m / n ;
			if(Math.abs(M - x) < eps) {
//console.log("rationalize loops",100000-loops);
			return Qnew(m,n);
			}
			if(M < x) {a = m ; b = n; continue; }
			c = m; d = n ;
		}
//console.log("rationalize loops",100000-loops);
	return Qnew(m,n);
}

function __rationalize (x , eps) { // (rationalize x precision )
	var neg = false;
	if( x < 0) {neg = true; x = - x; }
	var ent = Math.floor(x);
	if(x === ent) return neg ? -x : x ;
	var q = ___rationalize(x - ent, eps);
	if (neg)
		return Qnew (-q.a - ent * q.b, q.b);
		else
		return Qnew (q.a + ent * q.b, q.b);
} // _rationalize


var _rationalize = function (top, argc) { // (rationalize x [precision] )
	var x = 0 + _stack[top++] ;
	var eps  = (argc > 1) ? 0 + _stack[top] : 0.0001 ;
	return __rationalize (x , eps);
} // _rationalize

var _num = function (q) {
	if(q instanceof Rational) return q.a;
	return 0 + q;
}
var _den = function (q) {
	if(q instanceof Rational) return q.b;
	return 1;
}
			





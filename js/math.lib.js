/*
EchoLisp math.lib
(C) G. Brougnard & Jacques Tramu & Simon Gallubert &  Echolalie 2015
*/

/*------------------
usual ops
-------------------------*/
function _mean (obj,env) {
	var m = 0 , lg = 0;
	if(obj === null) glisp_error(60,"","mean");
	if(isList(obj))  {
			while(obj) {m  += obj[0];lg++;obj=obj[1];}
			return m/lg ;
			}
	if(obj instanceof Vector) {
			obj = obj.vector;
			for(var k=0; k < obj.length ; k++) m +=  obj[k];
			if(obj.length === 0)  {glisp_error(9,"empty-vector","mean"); return 0;}
			return   m / obj.length ;
			}
	if(obj instanceof Procrastinator) return Procrastinator.g_mean(obj,env);
		
	glisp_error(143,obj,"mean");
}

// (sigma fun , nfrom, nto) in [nfrom nto] ; n not necessarily int
function _sigma (f , nfrom, nto, env) {
	f = checkProc(f,1,1,"Σ");
	var s = 0 , n,  fcall = [f , [ null, null]] ;
	for(n=nfrom; n<= nto; n++)  {
			fcall[1][0] = n;
			s = _add_xx (s , __ffuncall(fcall,env));
			}
	return s;
} // sigma

// 5 args : use stack
function _sigma_2 (top, argc,  env) {
	var f = checkProc(_stack[top++],2,2,"ΣΣ");
	var ifrom = _stack[top++];
	var ito = _stack[top++];
	var jfrom = _stack[top++];
	var jto= _stack[top];
	
	var s = 0 , i,j ,  fcall = [f , [ null, [null, null]]] ;
	for(i=ifrom;i<=ito;i++)  {
			fcall[1][0] = i;
			for(j=jfrom;j<=jto;j++)  {
				fcall[1][1][0] = j;
				s = _add_xx (s , __ffuncall(fcall,env));
			}}
	return s;
} // sigma_2

function _product (f , nfrom, nto, env) {
	f = checkProc(f,1,1,"Π");
	var p = 1 , n,  fcall = [f , [ null, null]] ;
	for(n=nfrom; n<= nto; n++)  {
			fcall[1][0] = n;
			p = _mul_xx (p , __ffuncall(fcall,env));
			}
	return p;
} // product

/*-----------------
primes
-----------------------*/
var _PI_N = // [n , # primes <= n]
[[0 , 0],
[ 1.0e+01  , 4  ],
[ 2.0e+01  , 8  ],
[ 3.0e+01  ,10  ],
[ 4.0e+01  ,12  ],
[ 5.0e+01  ,15  ],
[ 6.0e+01  ,17  ],
[ 7.0e+01  ,19  ],
[ 8.0e+01  ,22  ],
[ 9.0e+01  ,24  ],
[ 1.0e+02  ,25  ],
[ 2.0e+02  ,46  ],
[ 3.0e+02  ,62  ],
[ 4.0e+02  ,78  ],
[ 5.0e+02  ,95  ],
[ 6.0e+02  , 109  ],
[ 7.0e+02  , 125  ],
[ 8.0e+02  , 139  ],
[ 9.0e+02  , 154  ],
[ 1.0e+03  , 168  ],
[ 2.0e+03  , 303  ],
[ 3.0e+03  , 430  ],
[ 4.0e+03  , 550  ],
[ 5.0e+03  , 669  ],
[ 6.0e+03  , 783  ],
[ 7.0e+03  , 900  ],
[ 8.0e+03  ,1007  ],
[ 9.0e+03  ,1117  ],
[ 1.0e+04  ,1229  ],
[ 2.0e+04  ,2262  ],
[ 3.0e+04  ,3245  ],
[ 4.0e+04  ,4203  ],
[ 5.0e+04  ,5133  ],
[ 6.0e+04  ,6057  ],
[ 7.0e+04  ,6935  ],
[ 8.0e+04  ,7837  ],
[ 9.0e+04  ,8713  ],
[ 1.0e+05  ,9592  ],
[ 2.0e+05  , 17984  ],
[ 3.0e+05  , 25997  ],
[ 4.0e+05  , 33860  ],
[ 5.0e+05  , 41538  ],
[ 6.0e+05  , 49098  ],
[ 7.0e+05  , 56543  ],
[ 8.0e+05  , 63951  ],
[ 9.0e+05  , 71274  ],
[ 1.0e+06  , 78498  ],
[ 2.0e+06  ,  148933  ],
[ 3.0e+06  ,  216816  ],
[ 4.0e+06  ,  283146  ],
[ 5.0e+06  ,  348513  ],
[ 6.0e+06  ,  412849  ],
[ 7.0e+06  ,  476648  ],
[ 8.0e+06  ,  539777  ],
[ 9.0e+06  ,  602489  ],
[ 1.0e+07  ,  664579  ],
[ 2.0e+07  , 1270607  ],
[ 3.0e+07  , 1857859  ],
[ 4.0e+07  , 2433654  ],
[ 5.0e+07  , 3001134  ],
[ 6.0e+07  , 3562115  ],
[ 7.0e+07  , 4118064  ],
[ 8.0e+07  , 4669382  ],
[ 9.0e+07  , 5216954  ],
[ 1.0e+08  , 5761455  ],
[ 2.0e+08  , 11078937  ],
[ 3.0e+08  , 16252325  ],
[ 4.0e+08  , 21336326  ],
[ 5.0e+08  , 26355867  ],
[ 6.0e+08  , 31324703  ],
[ 7.0e+08  , 36252931  ],
[ 8.0e+08  , 41146179  ],
[ 9.0e+08  , 46009215  ],
[ 1.0e+09  , 50847534  ],
[ 2.0e+09  , 98222287  ],
[ 3.0e+09  ,144449537  ],
[ 4.0e+09  ,189961812  ],
[ 5.0e+09  ,234954223  ],
[ 6.0e+09  ,279545368  ],
[ 7.0e+09  ,323804352  ],
[ 8.0e+09  ,367783654  ],
[ 9.0e+09  ,411523195  ],
[ 1.0e+10  ,455052511  ],
[ 2.0e+10  ,882206716  ],
[ 3.0e+10  , 1300005926  ],
[ 4.0e+10  , 1711955433  ],
[ 5.0e+10  , 2119654578  ],
[ 6.0e+10  , 2524038155  ],
[ 7.0e+10  , 2925699539  ],
[ 8.0e+10  , 3325059246  ],
[ 9.0e+10  , 3722428991  ],
[ 1.0e+11  , 4118054813  ],
[ 2.0e+11  , 8007105059  ],
[ 3.0e+11  ,11818439135  ],
[ 4.0e+11  ,15581005657  ],
[ 5.0e+11  ,19308136142  ],
[ 6.0e+11  ,23007501786  ],
[ 7.0e+11  ,26684074310  ],
[ 8.0e+11  ,30341383527  ],
[ 9.0e+11  ,33981987586  ],
[ 1.0e+12  ,37607912018  ],
[ 2.0e+12  ,73301896139  ],
[ 3.0e+12 ,108340298703  ],
[ 4.0e+12 ,142966208126  ],
[ 5.0e+12 ,177291661649  ],
[ 6.0e+12 ,211381427039  ],
[ 7.0e+12 ,245277688804  ],
[ 8.0e+12 ,279010070811  ],
[ 9.0e+12 ,312600354108  ],
[ 1.0e+13 ,346065536839  ]] ;


function __pi_table_sort() {
	var sortf = function (a , b) {
		return (a[0] - b[0]) ;
		}
	_PI_N.sort(sortf) ;
}

function __nth_approx(n) {
	var ln = Math.log(n), lnln = Math.log(ln) ;
	var pn =
	n * (Math.log( n * ln) - 1) + ((n * (lnln - 2))/ ln) ;
	return Math.round(pn);
	
}
function __pi_approx (n) { // n >= 60184 --> ] interval [
	var ln = Math.log(n);
	return [ Math.floor (n / (ln -1)), [Math.ceil ( n / (ln - 1.1)), null]];
}
var _primes_pi = function (n) {
// look for slice [m <= n <p[
var m = -1, count;
	if(n === 2) return 1;
	if(n <   2) return 0;
	for(var i = 0 ; i < _PI_N.length; i++)
		if(_PI_N[i][0] > n) {
				 m = _PI_N[i-1][0]; 
				 count = _PI_N[i-1][1];
				 break;
				 }
	if(m === -1) return _false;
	if(m === n) return count;
	m = m+ 1; // odd
	while(m <= n) {
				if(isPrime (m)) count++;
				if((m -1) % 500000 === 0) _PI_N.push([m-1,count,"pi"]);
				m += 2;
				}
				
	_PI_N.push([m-1,count,"pi"]);
	__pi_table_sort();
	return count;
//	return  [n , [count, [__pi_approx(n) , null]]] ;
}

// https://primes.utm.edu/nthprime/index.php#nth
// test : (primes-pi 1000000000) (nth-prime &0)
// to do : boost isPrime, no dups in table, save/load table, timer NYI NYI NYI
var _nth_prime = function (n) {
var m = -1 , count, p ;
		if(n < 0) return 0;
		if(n < 5) return [1,2,3,5,7][n] ; //  nth(0) = 0
		
for(var i = 0 ; i < _PI_N.length; i++)
		if(_PI_N[i][1] >= n) {
				 m = _PI_N[i-1][0]; 
				 count = _PI_N[i-1][1] +1 ;
				 break;
				 }
		if(m === -1) return false;
		m = m + 1 ; // odd
		for(;;m+=2)
			if(isPrime(m)) { 
						    p = m ;
						    if(count >= n) break;
							count++ ;
							// if(count % 10000 === 0) _PI_N.push([p+1,count,"nth"]);
						 	}
			
	// _PI_N.push([p+1,n,"nth"]);
	__pi_table_sort();
	return p;

//	return [n, [p, [__nth_approx(n) , null]]] ;
// return __nth_approx(n);
}

/*---------------
in-primes stream
----------------------*/
function __in_primes(p) {
	var p = _next_prime(p);
	return [p,p]; // [value . state]
}
var _in_primes = function (n,env) {
	var p = _next_prime(n);
	return new Stream(p,__in_primes,null,p);
}

/*-------------
decomp
------------*/
// intp p[], a[] arrays ;  n= Product pi^ai
function __prime_decomp (n, /*into*/ p, a)  {
	var f,pf= 0,num=-1 ;
	if(_le_xi (n,1) === _true) return;
		while(true) {
			f = _factor(n) ;
			if(_le_xi (f,1) === _true) return; // error here
			if (_numequal_xx (f,pf) === _true) 
						a[num]++;
						else {
						p.push(f);
						a.push(1);
						num++;
						}
			if(_numequal_xx (f,n) === _true)  return ;
			n = _div_xx (n, f) ;
			pf = f ;
			}
	}
	
var _num_divisors = function (n) {
	var a = [], p = [], numdiv = 1, i;
	if(_numequal_xi(n, 1) === _true) return 0;
	__prime_decomp(n, p, a);
	for(i=0; i< a.length;i++)  numdiv *= (a[i] + 1 );
	return numdiv - 1; // exclude n
}

var _sum_divisors = function (n) {
	var a = [], p = [], num = 1,  den = 1 ,i;
	if(_numequal_xi(n, 1) === _true) return 0;
	if(_numequal_xi(n, 0) === _true) return 0;
	
	__prime_decomp(n, p, a);
	for(i=0; i< a.length;i++) {
			num = _mul_xx(num , _sub_xi (_expt (p[i],a[i]+1) ,1)) ;
			den = _mul_xx (den , _sub_xi (p[i] ,1)) ;
			}
	return _sub_xx (_div_xx(num,den), n) ;
}

var _divides_p = function (a ,b) {
	return isZero (_modulo_xx (a , b)) ? _true: _false;
}


/*---------------
polynoms
---------------------*/
function __poly_norm (a) { // normalize a = js array
	while (a.length > 1 && a[a.length-1] === 0) a.length-- ;
return a ;
}

var _poly_xx = function (x, a) { // (poly x '(a0 a1 ... an))
if(notIsList(a)) glisp_error(20,a,"poly");
	var p, exp  = 0 + x , s_a = a, x = exp ;
	p = 0 + a[0] ;
	a = a[1];
		while(a) {
			if(a[0] instanceof Complex) return __cpoly(x,s_a);
			 p +=  exp * (0 + a[0]);
			 exp *= x ;
			 a = a[1];
		}
	return p ;
}
var _poly = function(x,a,b) {
	var xb =  _poly_xx(x,b) ;
	if(xb === 0) return 0; // no execption NYI NYI
	return  _poly_xx(x,a) / xb ;
}

// Complex poly
var _cpoly_xx = function (z, a) { // (poly z '(a0 a1 ... an))
if(notIsList(a)) glisp_error(20,a,"cpoly");
var p,exp,expa;
	if(z instanceof Complex)
			exp  = new Complex(z.a,z.b)   ;
			else {
					z =   new Complex(0+z,0);
					exp = new Complex(0+z,0);
					}
	if(a[0] instanceof Complex) 
			p =          new Complex(a[0].a, a[0].b);
			else p  =    new Complex (0+a[0],0);
	a = a[1];
		while(a) { 
			if(a[0] instanceof Complex) {
				p.a = p.a + exp.a*a[0].a - exp.b * a[0].b ;
				p.b = p.b + exp.a*a[0].b + exp.b * a[0].a ;
			}
			else {
			 	p.a = p.a + exp.a*a[0];
			 	p.b = p.b + exp.b*a[0];
			 	}
			 expa = exp.a;
			 exp.a = z.a*exp.a - z.b * exp.b ;
			 exp.b = z.a*exp.b + z.b *expa ;
			 a = a[1];
		}
	return new Complex(p.a,p.b); 
}
var _cpoly = function(z ,a, b) { // div-0 NYI
	var zb = _cpoly_xx(z,b);
	if(isZero(zb)) return 0;
	var za = _cpoly_xx(z,a);
	
	if(za instanceof Complex) return za.div(zb); 
	if(zb instanceof Complex) return zb.inv().mul(za);
	return za / zb ;
}

/*----------------
poly ops
--------------------*/
var _poly_add = function (a , b) {
if(notIsList(a)) glisp_error(20,a,"poly-add");
if(!isListOrNull (b)) glisp_error(20,b,"poly-add");
	a = __list_to_array(a);
	if(b === null) return __array_to_list(a); // copy needed
	b = __list_to_array(b);
	var c = [] ;
	var lg = Math.max(a.length,b.length) , i;
	for(i = 0; i<lg; i++)
		c.push (_add_xx((a[i] || 0) , (b[i] || 0))) ;
	return __array_to_list(__poly_norm(c)) ;
}

var _poly_sub = function (a , b) {
if(notIsList(a)) glisp_error(20,a,"poly-add");
if(!isListOrNull (b)) glisp_error(20,b,"poly-add");
	a = __list_to_array(a);
	if(b === null) return __array_to_list(a); // copy needed
	b = __list_to_array(b);
	var c = [] ;
	var lg = Math.max(a.length,b.length) , i;
	for(i = 0; i<lg; i++)
		c.push( _sub_xx((a[i] || 0) , (b[i] || 0))) ;
	return __array_to_list(__poly_norm(c)) ;
}


var _poly_mul_k = function (a , k) {
if(notIsList(a)) glisp_error(20,a,"poly-mul");
	if(isZero(k)) return [0,null];
	a = __list_to_array(a);
	var c = [] ;
	var lg = a.length , i;
	for(i = 0; i<lg; i++)
		c.push ( _mul_xx(a[i],k)) ;
	return __array_to_list(__poly_norm(c)) ;
}

function __poly_shift (a , s) { // a new one
	var i, lg , c = [];
	a = __list_to_array(a);
	for(i=0;i<s;i++) c.push(0);
	c = c.concat(a) ;
	return __array_to_list(__poly_norm(c)) ;
	}
	

var _poly_mul = function (a , b) {
if(notIsList(a)) glisp_error(20,a,"poly-mul");
if(!isListOrNull (b)) glisp_error(20,b,"poly-mul");
if(__poly_null_p(b)) return [0,null];
if(__poly_null_p(a)) return [0,null];
	var k;
	var c = null , s= 0, t ;
	while(b) {
			 t = __poly_shift(a,s++);
			 t = _poly_mul_k(t,b[0]);
			 c = _poly_add(t,c);
			 b = b[1] ;
			 }
	return c ;
}
/*
function n / d:
  require d ≠ 0
  (q, r) ← (0, n)            # At each step n = d × q + r
  while r ≠ 0 AND degree(r) ≥ degree(d):
     t ← lead(r)/lead(d)     # Divide the leading terms
     (q, r) ← (q + t, r − (t * d))
  return (q, r)

*/
function __poly_null_p (a) {
	return (a[1] === null && isZero(a[0])) ;
}

var _poly_div = function (n,d) {
if(notIsList(n)) glisp_error(20,n,"poly-div");
if(notIsList(d)) glisp_error(20,d,"poly-div");
// test d = [0,null] NYI NYI NYI
	d = __list_to_array(d); __poly_norm(d) ;
	var deg_d = d.length-1;
	var lead_d = d[deg_d];
	var r  = __list_to_array(n); __poly_norm(r);
	var q = [];
	var i, c, t, deg_t ;
	var deg_r  = r.length - 1;
	var lead_r = r[deg_r];
	
	for( i=0; i< r.length; i++) q.push(0);
	while (lead_r && (deg_r >= deg_d)) {
		t = _div_xx(lead_r,lead_d) ;
		deg_t = deg_r - deg_d ;
		q[deg_t] = _add_xx ((q[deg_t] || 0) , t) ; // q+t
		
		c =[];
		for( i=0; i< d.length;i++) c.push(_mul_xx(d[i],t));
		for( i=0; i< deg_t;i++)    c = [0].concat(c);
		for( i=0; i <r.length;i++) r[i] = _sub_xx(r[i],c[i]);
		__poly_norm(r);
		deg_r  = r.length - 1;
	    lead_r = r[deg_r];
	}
	return [__array_to_list(__poly_norm(q)), [__array_to_list(r), null]] ;
}

var _poly_pow = function (a , p) { // assumes small p > 0 check NYI
if(notIsList(a)) glisp_error(20,a,"poly-pow");
	if( p <= 0) return [1,null];
	var c  = _poly_add(a,null) ; // copy
	while(--p) 
			 c = _poly_mul(c,a);
	return c ;
}


/*---------
-> string
----------------*/

var _poly_to_string_xx = function (x , a , html) { // (poly->string 'x '( a0 ...a n))
if(notIsList(a)) glisp_error(20,a,"poly->string");
var c, cstr;
	a = _reverse(a);
	var pp = '' , n = __length(a) -1;
	var first = true;
	while(a)  {
				if(a[0] instanceof Complex) { pp+= "+(" + a[0] + ")" ; c= 1;}
				else {
				c = 0 + a[0]; // convert to real
				cstr = glisp_tostring(a[0],"");
				if(c === 1) { if (n===0)  pp += '+1';
				   			else if (!first) pp += "+"; }
				   else if(c === -1) { if (n===0)  pp += '-1'; // low order = last
				   				      else  pp += "-"; }
				   else  if(c > 0) {  if(first) pp += cstr;
				   					 else pp += '+' + cstr ; }
				   else if (c < 0) pp += cstr;
				}
		
		if (c) {
			first = false;
			if(n === 1) pp += ' ' + x.name;
			if(n > 1) {
				if(html)
				pp += x.name + "<sup>" + n + "</sup>" ;
				else pp += ' ' + x.name + '^' + n;
				}
			pp += ' ';
			}
		n = n - 1;
		a = a[1];
	}
	return pp;
}

// var _poly_to_string = function (x , a, b) { // (poly_print 'x '( a0 ...a n))
var _poly_to_string = function(top, argc) {
	var x = _stack[top++];
	var a = _stack[top++];
	var b = (argc > 2) ? _stack[top] : null;
	var pa = _poly_to_string_xx(x, a);
	if( b === null) return pa ;
	var pb = _poly_to_string_xx(x, b);
	return pa + " / " + pb ;
	}
	
var _poly_to_html= function(top, argc) {
	var x = _stack[top++];
	var a = _stack[top++];
	var b = (argc > 2) ? _stack[top] : null;
	var pa = _poly_to_string_xx(x, a, true);
	if( b === null) return pa ;
	var pb = _poly_to_string_xx(x, b, true);
	return pa + " / " + pb ;
	}

/*-----------------
real root (only one)
------------------*/
var _root  = function ( fun, xmin, xmax ) {
var a = _exact_to_inexact(xmin)
,  b =  _exact_to_inexact(xmax)
, c = a
, funcall = [fun , [ null , null]] 
, fa  // = fun(a)
, fb // = fun(b)
, fc // = fa
, tol_act // Actual tolerance
, new_step // Step at this iteration
, prev_step // Distance from the last but one to the last approximation
, p // Interpolation step is calculated in the form p/q; division is delayed until the last moment
, q
, env = glisp.user
, maxIter
, _maxIter 
;
	fun = checkProc(fun,1,1,"root");
	funcall[0]= fun ;
	var eps =  _MATH_PRECISION; 
	maxIter =  _maxIter = 1000 ; 
	eps /= 2;
	funcall[1][0] = a; fa = fc = __ffuncall(funcall,env);
	funcall[1][0] = b; fb = __ffuncall(funcall,env);
 
while ( maxIter-- > 0 ) {
	prev_step = b - a;
	if ( Math.abs(fc) < Math.abs(fb) ) {
		// Swap data for b to be the best approximation
		a = b, b = c, c = a;
		fa = fb, fb = fc, fc = fa;
		}
 
	tol_act = 1e-15 * Math.abs(b) + eps ;
	new_step = ( c - b ) / 2;
 
 	if (Math.abs(fb) <= eps ) {
		// console.log('root:iter: ',_maxIter-maxIter);
		return b; // Acceptable approx. is found
	}
	if (Math.abs(fa) <= eps ) {
		// console.log('root:iter: ',_maxIter-maxIter);
		return a; // Acceptable approx. is found
	}
	if ( Math.abs(new_step) <= tol_act ) {
		// console.log('*** root:iter: ',_maxIter-maxIter);
		// if(Math.abs(fb) < 0.001) return b;
		return null; 
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
 
	a = b;
    fa = fb; // Save the previous approx.
	b += new_step;
	funcall[1][0] = b;
    fb = __ffuncall(funcall,env); // Do step to a new approxim.
 
	if ( (fb > 0 && fc > 0) || (fb < 0 && fc < 0) ) {
		c = a, fc = fa; // Adjust c for it to have a sign opposite to that of b
		}
	} // while
	return null;
} // uniroot

/*---------------------
all_roots
-------------------*/
var _roots  = function ( fun, xmin, xmax ) {
	var roots = [] ; // js array
	var root,start,end,intervals = [xmin,xmax];
	var eps = Math.max(0.0001,_MATH_PRECISION);
_root_loop :
	while (intervals.length) {
		end = intervals.pop();
		start = intervals.pop();
		try {
			root = _root(fun,start,end);
			} catch(e) { continue; }
			
			if(root !== null)
			for(var i=0; i< roots.length;i++) {
			if(Math.abs(roots[i]-root) < eps) continue _root_loop ;
			}
			
		if (root !== null) {
			roots.push(root) ;
			if(root-eps > start) {
				intervals.push(start);
				intervals.push(root-eps);
				}
			if(root+eps < end) {
				intervals.push(root+eps);
				intervals.push(end);
				}
			}
		}
	roots.sort(function(a, b){return a-b});
	return __array_to_list(roots);
}

/*--------------------
complex root
-----------------------*/
function __point_in_list(x,y,points,eps) {
	for(var i=0; i < points.length; i++) {
		var dx = x - points[i].a;
		var dy = y - points[i].b;
		if(dx*dx + dy*dy < eps) return true;
	}
	return false;
}

// input zfun = [fun , [z , null]] 
function ___croot(zfun,env,xmin,xmax,ymin,ymax,eps,steps,fbest,t0,croots) {
console.log("__croot", " x ", xmin,xmax," y ",ymin,ymax,"fbest: ", fbest) ;
	var modmin = +Infinity; // local min
	var z = zfun[1][0], x,y,x0,y0,modf, locsteps = 0 ; 
	var dx= (xmax-xmin)/steps, dy = (ymax-ymin)/steps;
	var eps2 = eps * eps * 100;
	var maxsteps = (steps+1)*(steps+1) ;
	
	// steps*steps iterations
	for(y=ymin; y<=ymax; y +=dy) {
		z.b = y;
		for(x=xmin; x<=xmax; x+=dx) {
		z.a = x;
		
		if(croots && __point_in_list(x,y,croots,dx*dy)) continue;
		fz = __ffuncall(zfun,env);
		modf = fz.a*fz.a + fz.b*fz.b ;
//if(modf < fbest) 
//console.log("croot x y modf eps2",x,y,modf,eps2);
		if(modf < eps2) return new Complex (x,y); // round |eps|
		if(modf < modmin) {modmin = modf ; x0 = x; y0 = y;} // best local min
		if(locsteps++ > maxsteps) break; // prevent infinite loop
	}}

	// 10 sec max or cannot improve
	if((Date.now() - t0) > 10000) {
	return null ;
		}
	
	if ((modmin >= fbest) || locsteps > maxsteps )  {
		if(! croots) { // single needed
		var msg = 
		("*croot-fail at x:" + x0 + " y:" + y0 + " |f|= " + modmin + " &epsilon; = " + eps);
		writeln(msg,"color:orange");
		}
	return null ; 
	}
	
	xmin= Math.max(x0-dx,xmin);
	xmax= Math.min(x0+dx,xmax);
	ymin= Math.max(y0-dy,ymin);
	ymax= Math.min(y0+dy,ymax);
   	return ___croot(zfun,env,xmin,xmax,ymin,ymax,eps,steps,modmin,t0,croots) ;
}

// function _croot(fun,zmin,zmax,steps) 
// steps to document
var __croot = function (top, argc,env,multiple) {
	var fun = _stack[top++];
	var zmin = _stack[top++];
	var zmax = _stack[top++];
	var steps = (argc > 3) ?  _stack[top] :  31 ; // prime must be !!! 
	steps = _next_prime(steps);
	if(steps > 100) steps = 101;
	
	fun = checkProc(fun,1,1,"croot");
	
	var xmin = (zmin instanceof Complex) ? zmin.a : 0 + zmin;
	var xmax = (zmax instanceof Complex) ? zmax.a : 0 + zmax;
	var ymin = (zmin instanceof Complex) ? zmin.b : 0 ;
	var ymax = (zmax instanceof Complex) ? zmax.b : 0 ;
	var zfun = [fun , [new Complex(0,0) , null]];
	var env = glisp.user; // dubious NYI NYI NYI 
	var eps = _MATH_PRECISION;
	
	if(xmin > xmax) {var t = xmin; xmin=xmax; xmax=t;}
	if(ymin > ymax) {var t = ymin; ymin=ymax; ymax=t;}
	if(xmin === xmax) xmax = xmin+1;
	if(ymin === ymax) ymax = ymin+1;
	
	if (! multiple)
	return ___croot(zfun,env,xmin,xmax,ymin,ymax,eps,steps, +Infinity, Date.now());
	
	var croot,croots = [];
	while (true) {
		croot = ___croot(zfun,env,xmin,xmax,ymin,ymax,eps,steps, +Infinity, Date.now(),croots) ;
		if(! croot) break;
		croots.push(croot);
		}
	return __array_to_list(croots);
}

var _croot = function (top, argc,env ) {
	return __croot(top,argc,env);
	}
var _croots = function (top, argc,env ) {
	return __croot(top,argc,env,true);
	}

/*-------------------------
adaptive integrate
---------------------------------*/
function __adaptive(fun,env,a,b,eps,S,fa,fb,fc,depth)  {
	var c = (a+b)/2  ;
	var h = b-a;
	var d =(a+c)/2;
	var e = (c+b)/2 ;
	var fd , fe ;
		fun[1][0] = d; fd = __ffuncall(fun,env);
		fun[1][0] = e; fe = __ffuncall(fun,env);
	var Sleft =  (h/12)*(fa + 4*fd + fc); 
	var Sright = (h/12)*(fc + 4*fe + fb);                                                          
	var S2 = Sleft + Sright;    
	if (depth <= 0 || Math.abs(S2 - S) <= eps ) 
		return S2  + (S2 - S)/15;                                                                        
		return   __adaptive(fun, env, a, c, eps/2, Sleft,  fa, fc, fd, depth-1) +                    
       	     __adaptive(fun, env, c, b, eps/2, Sright, fc, fb, fe, depth-1);    
}

/*-------------------------------
integrate
---------------------------------------*/
var _integrate = function (f,a,b) {
var depth =  100 ;
var eps = _MATH_PRECISION ;

a = _exact_to_inexact(a);
b = _exact_to_inexact(b);
checkProc(f,1,1);

var fun = [f , [ null , null]] ;
var env = glisp.user;
var c = (a+b)/2 ;
var h = b-a ;
var fa, fb, fc ;
	fun[1][0] = a; fa = __ffuncall(fun,env);
	fun[1][0] = b; fb = __ffuncall(fun,env);
	fun[1][0] = c; fc = __ffuncall(fun,env);
var S  = (h/6)*(fa + 4*fc + fb);   
var ret = __adaptive(fun,env,a,b,15*eps,S,fa,fb,fc,depth);
return ret;
}

	
/*---------------------------------
deriv
------------------------------*/
var _deriv = function(f,x)
{
x = 0 + x ;
var eps =  _MATH_PRECISION ;
var maxIter =  100 ;
var m = maxIter  ;
var d1,d2;
var h = eps  ;
var fx,fh,f2h,fh_,f2h_;
var env = glisp.user;
f = checkProc(f,1,1, "deriv") ;
var funcall = [f , [null,null]] ;

	funcall[1][0] = x ;    fx =  __ffuncall(funcall,env);
	funcall[1][0] = x + h; fh =  __ffuncall(funcall,env);
	funcall[1][0] = x + 2*h ;  f2h =  __ffuncall(funcall,env);
	funcall[1][0] = x - h ;    fh_ =  __ffuncall(funcall,env);
	funcall[1][0] = x - 2*h ;  f2h_ =  __ffuncall(funcall,env);
	
while(m--)
	{
	d1= (-3*fx +4*fh - f2h) /(2*h);
	d2= (-3*fx +4*fh_ -f2h_)/(-2*h);
	if(Math.abs(d1-d2) < eps) {
			// console.log("deriv:steps",maxIter-m,d1);
			return d1;
			}
	h /=2 ;
	f2h =  fh;
	f2h_ = fh_;
	funcall[1][0] = x + h;   fh  =  __ffuncall(funcall,env);
	funcall[1][0] = x - h;   fh_ =  __ffuncall(funcall,env);
	}
	
return null; // undef
} // deriv

/*---------------------
gamma (real)
gamma(0.5) = sqrt(PI)
-------------------------*/
var _gamma = function (x)  { // lanczos, thanks to rosetta code
x = _exact_to_inexact(x);
if (x instanceof Complex) return _cgamma(x);

if(! (typeof x === "number")) glisp_error(22,x,"&Gamma;") ;

	var p = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
		771.32342877765313, -176.61502916214059, 12.507343278686905,
		-0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
 
	var g = 7;
	if(x < 0.5) {
		return Math.PI / (Math.sin(Math.PI * x)*_gamma(1-x));
	}
 
	x -= 1;
	var a = p[0];
	var t = x+g+0.5;
	for(var i = 1; i < p.length; i++){
		a += p[i]/(x+i);
	}
	return Math.sqrt(2*Math.PI)*Math.pow(t, x+0.5)*Math.exp(-t)*a;
} // gamma

/*---------------------
cgamma (complex)
gamma(0.5) = sqrt(PI)
-------------------------*/
var _cgamma = function (x)  { // lanczos, thanks to rosetta code
/*
if(typeof x === "number") x = new Complex (0+x,0)
		else if (x instanceof Complex) { }
		else glisp_error(22,x,"cgamma") ;
*/
	var z = new Complex (0,0); // tmp variable
	var t = new Complex(0,0) ;
	var pi = new Complex (Math.PI,0) ;
	var one  = new Complex (1,0);
	var pix ; // PI * x
	
	var p = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
		771.32342877765313, -176.61502916214059, 12.507343278686905,
		-0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
 
	var g = 7;
	if(x.a < 0.5) {
		t = _cgamma(one.sub(x)) ;
		z = pi.mul(x);
		z = z.sin();
		z = z.mul(t);
		return pi.div(z);
	}
 
	x = x.sub(one);
	a = new Complex(p[0],0);
	g  += 0.5 ;
	t = x.add (new Complex (g,0)) ;
	
	for(var i = 1; i < p.length; i++){
		z = new Complex(p[i],0);
		z = z.div (x.add (new Complex (i , 0))) ; // optimize here
		a = a.add(z);
	}
	z.a = -t.a; z.b = -t.b ; // -t
	z = z.exp() ; // exp(-t)
	x.a += 0.5 ;
	t = t.pow(x);

	z = z.mul(t);
	z = z.mul(a);
	z = z.mul( new Complex (Math.sqrt(2 * Math.PI), 0)) ;
	return z;

} // cgamma


/*-----------------
gauss
----------------------*/
var _gnorm = 1./Math.sqrt(Math.PI*2) ;
/*----------------------
Gauss
------------------------------*/
var _normal = function(x,m,s)	{ // (x median ecart-type)
x = _exact_to_inexact(x);
m = _exact_to_inexact(m);
s = _exact_to_inexact(s);
	x = (x - m)/s ;
	x *= x;
return _gnorm /s  * Math.exp( - x  / 2) ;
} // normal

var _standard_normal = function(x)	{
	x = _exact_to_inexact(x);
	return _gnorm   * Math.exp( - (x*x)  / 2) ;
} 

/*------------------
BI-normal
(normal-2 x y r mx sx [my [sy]])
-----------------------*/
var _normal_2 = function (top,argc) {
var x = _stack[top++];
var y = _stack[top++];
var r = _stack[top++] ; // correlation in [-1 1]
var mx = _stack[top++];
var sx = _stack[top++];
var my = (argc > 5) ? _stack[top++] : mx ;
var sy = (argc > 6) ? _stack[top] : sx ;
var K = 1 /  ( 2 * Math.PI * sx * sy * Math.sqrt (1 - r*r)) ;
x = (x-mx)/sx;
y=  (y-my)/sy;
	return K * Math.exp ( -0.5 * ( x*x + y*y - 2*r*x*y)) ;
}


/*---------------------
PRECISION
----------------------*/

var _math_precision = function(top,argc) { 
	var prec = _stack[top];
	if(argc && prec  && (typeof prec === "number") && Math.abs(prec) < 1)
			_MATH_PRECISION  = Math.abs(prec) ;
console.log ("PREC", _stack[top], _MATH_PRECISION);
	if(_MATH_PRECISION < 1.e-15) _MATH_PRECISION = 1.e-15 ;
	return  _MATH_PRECISION ;
} 

var _math_approx = function (a , b) {
	return (a === b) ? _true :
		(Math.abs ((+ a) - (+ b)) <= _MATH_PRECISION) ? _true : _false ;
	}
/*-----------------
misc complex
------------------------*/
var _COMPLEX_ZERO = new Complex(0,0); // in complex.js NYI
var _Complex_Result = new Complex(0,0);
var _COMPLEX_INFINITY = 666666666 ;

// careful : returns a Glob ...
var _fractal  = function(z,zc,iter) { // iterate z*z + c
if(z === 0) z = new Complex(0,0);
if(!(z instanceof Complex)) glisp_error(66,z,"fractal");
if(!(zc instanceof Complex)) glisp_error(66,zc,"fractal");
    iter = iter || 10 ;
    var n, tmp, re = z.a, im=z.b, zc_r = zc.a, zc_im = zc.b ;
    for(n=0; n< iter; n++) {
//console.log("fractal",n,re,im);
         tmp = re;
         re  = re*re - im*im;
         im =  2*im*tmp;
         re += zc_r;
         im += zc_im;
         if(Math.abs(re) > 1000000 || Math.abs(im) > 1000000) return Infinity; // cutter
         if(isNaN(re) || re === Infinity || re === -Infinity) return Infinity; 
    }
  // return new Complex(re,im);
  _Complex_Result.a = re;
  _Complex_Result.b = im;
  return _Complex_Result;
}

// n may be any number type
var _fractal_p = function(z,zc,p,iter) { // iterate z**m + c
if(z === 0) z = new Complex(0,0);
if(!(z instanceof Complex)) glisp_error(66,z,"fractal-n");
if(!(zc instanceof Complex)) glisp_error(66,zc,"fractal-n");
    iter = iter || 10 ;
    var n, zpow = new Complex(z.a,z.b);
    for(n=0; n< iter; n++) {
    	zpow = zpow.pow(p);
    	zpow.a += zc.a;
    	zpow.b += zc.b;
		  
    if(Math.abs(zpow.a) > 1000000 || Math.abs(zpow.b) > 1000000) return Infinity; // cutter
    if(isNaN(zpow.a) || zpow.a === Infinity || zpow.a === -Infinity) return Infinity ; 
    }
  return zpow ;
}

/*
g_iterate

http://w.american.edu/cas/mathstat/lcrone/GFunBase.html
G(z) = lim f^n(z/a^n)
f(0) = 0, and f '(0) = a. |a| > 1
    
EX . f = az + + ...cn z**n / 1 + c1z + c2 z**2 + ...
EX :
 (define (f z) (// (* a (sin z)) (+ 1 z (* z z) )))
 (define a 0.35+1.32i)
 (define (f z) (cpoly z (list 0 a 1 -2 3) '(1 -2 3 )))
 (define (g z) (g-iterate f z a 10))
 (plot-z-mod g -4 -4)
 
 general:
 (define (f z) (cpoly z (list 0 a any...) (list 1 ... any ..)))
 we must have O(f(z)) = z
*/
// # of funcall : O(limit/limit/2)

var _g_iterate = function ( f , z , a , limit , env) {
if(!(z instanceof Complex)) glisp_error(66,z,"g-iterate");
if(!(a instanceof Complex)) glisp_error(66,a,"g-iterate");
checkProc(f,1,1);

	var n, m, an, fz, ofa, ofb ;
	var call = [f, [null, null]];
	ofa = _COMPLEX_INFINITY ; 
	ofb = _COMPLEX_INFINITY;
	limit = (limit < 2) ? 2 : limit;
//var calls = 0;
	for(n=1; n<= limit; n++) {
	an = a.pow(n);
	fz = z.div(an); // fz = az / a**n  (seed)
	m = n;
	while(m--) { // f(f(f( ... (z/a**n))
//calls++;
			call[1][0] = fz;
			fz = __ffuncall(call,env); // 
			// hack : long drawwing ops: cut quickly ..
			if(Math.abs(fz.a) > 10000) return fz; // NaN ;
			if(Math.abs(fz.b) > 10000) return fz; //NaN ;
			}
//		console.log("G-iterate",n,fz.a,fz.b,calls);
// hack small precision
 		if(Math.abs(fz.a - ofa) < 0.0001 && Math.abs(fz.b - ofb) < 0.0001) return fz;
		ofa = fz.a; 
		ofb = fz.b;
		} // n loop
	return fz;
	}
	
/*-------------
series : sigma (0..n) f(n) * x**n
cseries : sigma(0..n) f(n)* z**n ; f(n) real or complex
-----------------------*/
var _cserie = function (f ,az, n, env) { 
if(!(az instanceof Complex)) glisp_error(66,az,"cserie");
checkProc(f,1,1);
		var i, z = new Complex(az.a,az.b), fn, za;
		var osuma = _COMPLEX_INFINITY, osumb = _COMPLEX_INFINITY ;
		var call = [f, [0, null]];
		var sum = __ffuncall(call,env); // f(0)
		if(! (sum instanceof Complex)) sum = new Complex(sum,0);
		
		for(i = 1 ; i<= n ; i++) {
			call[1][0] = i;
			fn = __ffuncall(call,env);
			if(fn instanceof Complex) {
			sum.a += (fn.a*z.a - fn.b*z.b); // sum += z * f(n)
			sum.b += (fn.b*z.a + fn.a*z.b) ;
			}
			else {
					sum.a += fn *z.a ;
					sum.b += fn *z.b;
					}
			za = z.a;
			z.a = z.a*az.a - z.b*az.b; // z <- z* z
			z.b = za*az.b +  z.b*az.a;
			if(Math.abs(sum.a) > _COMPLEX_INFINITY) return sum;
			if(Math.abs(sum.b) > _COMPLEX_INFINITY) return sum;
			if(Math.abs(sum.a -osuma) < _MATH_PRECISION 
					&& Math.abs(sum.b - osumb) < _MATH_PRECISION) return sum;
			osuma = sum.a;
			osumb = sum.b;
			if(isNaN(sum.a)) return NaN ;
		}
	return sum;
}

var _serie = function (f , ax,  n, env) { // sigma f(n) *x **n
	f = checkProc(f,1,1,"serie");
	var call = [f, [0, null]]; 
	var sum = __ffuncall(call,env);
	var osum = +Infinity , i, x = ax, fn ;
	
	for(i = 1; i<= n ; i++) {
		call[1][0] = i ;
		fn = __ffuncall(call, env);
		sum += fn *x ;
		if(Math.abs(sum) === Infinity) return sum;
		if(Math.abs(sum - osum) < _MATH_PRECISION) return sum;
		x *= ax ;
		osum = sum ;
	}
	return sum;
}



/*-------------------------
continued fractions
K = (a0 , a1 ... an)
http://www.ionica.nl/wp-content/uploads/2012/09/SmeetsThesis.pdf
http://oeis.org/A003285/b003285.txt
------------------------*/

function __has_period (K , p) { // start with K[1]
	var l = 2 * p + 1 ;
	if(p <= 3) l = 7 ; // aaaaaa or ababab or abcabc is enough
	if(K.length < l) return false;
	for (var i = 1 ; i < l - p  ; i++)
		if (K[i] !== K[i+p]) return false;
	return true;
	}
	
	
function T (x) {//  CF operator
	return x === 0 ? 0 : (1 / x ) - Math.floor ( 1 / x) ;
	}
	
var _number_to_contfrac = function (top,argc) {
	var x = _stack[top++] ;
	var n = (argc === 1) ? 100 : _stack[top]; 
	var K = [] ,Ti , Tj ,T0,  a0 , an , an_1, tmp;
	if(isJSInteger(x)) return [x,null] ;
	if(x instanceof Rational) { // apply Euclide
		an_1 = (x.a > 0) ? x.a  : -x.a  ;
		an = x.b;
		while (n--) {
			q = Math.floor(an_1 / an) ;
			K.push(q) ;
			tmp = an;
			an = an_1 - q * an ;
			if( an === 0 || n-- === 0) break;
			an_1 = tmp;
			}
		K =  __array_to_list(K);
		K[TAG_CONTFRACT] = true;
		return K;
		} 
	// normalize
	if(! (typeof x === "number")) glisp_error(22,x,"number->contfrac");
	
	x = (x > 0) ? x  : -x ;
	a0 =  Math.floor(x); // int part of x
	K.push(a0) ;
    T0 = Ti = x - a0;
		while(n--) {
			an = Math.floor(1/Ti);
			K.push(an);
// Tj = Ti;
			Ti = T(Ti);
//		console.log("CONT",an,Math.abs(Ti-Tj),Ti);
			if(Ti < 1.e-9) break; 
			if(Ti === 0) break;
			}
		
// try to find period
	for( p = 1 ; p <= 6 ; p++)
		if(__has_period (K , p)) break;
		
	K =  __array_to_list(K);
	K[TAG_CONTFRACT] = true;
	
	if( p > 6) return K ; // period not found

	K[TAG_CIRCULAR] = p + 1 ;
	var next = K[1];
	var first = K[1];
	p--;
	while(p--) next = next[1]; 
	next[1] = first ;
	return K ;
	
	
} // to cont frac

var _convergents  = function (top , argc) {
	var K = _stack[top++] ;
	var n = (argc > 1) ? _stack[top] : 100 ;
	if(notIsList(K)) glisp_error(20,K,"convergent");
	var pn_1=0,pn_2=1,qn_1=1,qn_2=0,p,q,an, a0 = K[0], C = [];
	C.push(a0) ;
	K = K[1];
	
	while(K && n--) {
	an = K[0];
	p = an*pn_1 + pn_2;
	q = an*qn_1 + qn_2;
	if(!isJSInteger(p)) break;
	if(!isJSInteger(q)) break;
	C.push(new Rational(p+a0*q,q)) ;
	// C.push(a0 + p/q); // real
	pn_2= pn_1;qn_2=qn_1;
	if(Math.abs (p/q - pn_1/qn_1) < 1.e-10) break;
	if(p === pn_1 && q === qn_1) break;
	pn_1 =p; qn_1 = q;
	K = K[1];
	}
	return __array_to_list(C);
}

var _contfract_to_number  = function (K) {
	if(notIsList(K)) glisp_error(20,K,"contfract->number");
	var pn_1=0,pn_2=1,qn_1=1,qn_2=0,p,q,an, a0 = K[0];
	var n = 100;
	K = K[1];
	
	while(K && n--) {
	an = K[0];
	p = an*pn_1 + pn_2;
	q = an*qn_1 + qn_2;
	if(!isJSInteger(p)) break;
	if(!isJSInteger(q)) break;
	pn_2= pn_1;qn_2=qn_1;
	if(Math.abs (p/q - pn_1/qn_1) < 1.e-12) break;
	if(p === pn_1 && q === qn_1) break;
	pn_1 =p; qn_1 = q;
	K = K[1];
	}
	return a0 + p/q ;
}

/*----------------
GEOMETRY
--------------------------*/

var _distance = function (x,y,a,b) {
	x -= a;
	y -= b;
	return Math.sqrt (x*x + y*y) ;
}

var _in_interval_p = function (x,a,b) { // [  x  ]
	return ((x < a) || (x > b)) ? _false : _true;
}
var _in_open_interval_p = function (x,a,b) { // ]  x  [
	return ((x <= a) || (x >= b)) ? _false : _true;
}

// disk = vector #(x0 x0 R)
var _point_in_disk_p = function (x, y ,disk) {
	disk = disk.vector ;
	x -= disk[0];
	y -= disk[1];
	return (x*x + y*y <= disk[2]*disk[2] ) ? _true : _false;
	}
	
// d1 inside d2 ?
var _disk_in_disk_p = function (d1 , d2) {
	d1 = d1.vector ;
	d2 = d2.vector ;
	if( d1[2] > d2[2]) return _false;
	var x = d1[0]-d2[0];
	var y = d1[1]-d2[1];
	var r = d1[2]-d2[2] ;
	return (x*x+y*y) <= r*r ? _true : _false ;
}

// rect = #( top.x top.y w h)
var _rect_in_disk_p = function (rect, disk) {
	rect = rect.vector ;
	disk = disk.vector ;
	if(rect[0]  > disk[0] + disk[2]) return _false; // rect.left > disk.right
	if(rect[0]+ rect[2]  <  disk[0] - disk[2]) return _false; // rect.right < disk.left
	if(rect[1]  > disk[1] + disk[2]) return _false; // rect.top > disk.rightbottoù
	if(rect[1]+ rect[3]  <  disk[1] - disk[2]) return _false; // rect.bot < disk.top
	var r2 = disk[2]*disk[2];
	var x = rect[0] - disk[0];
	var y = rect[1] - disk[1];
	if (x*x + y*y > r2 ) return _false;
	x += rect[2]; ;
	if (x*x + y*y > r2 ) return _false;
	y += rect[3] ;
	if (x*x + y*y > r2 ) return _false;
	x -= rect[2];
	if (x*x + y*y > r2 ) return _false;
	return _true;
}

// rect = #( top.x top.y w h)
var _rect_disk_intersect_p = function (rect, disk) {
	rect = rect.vector ;
	disk = disk.vector ;
	if(rect[0]  > disk[0] + disk[2]) return _false; // rect.left > disk.right
	if(rect[0]+ rect[2]  <  disk[0] - disk[2]) return _false; // rect.right < disk.left
	if(rect[1]  > disk[1] + disk[2]) return _false; // rect.top > disk.rightbottom
	if(rect[1]+ rect[3]  <  disk[1] - disk[2]) return _false; // rect.bot < disk.top
	var r2 = disk[2]*disk[2];
	var x = rect[0] - disk[0];
	var y = rect[1] - disk[1];
	if (x*x + y*y <= r2 ) return _true;
	x += rect[2]; ;
	if (x*x + y*y <= r2 ) return _true;
	y += rect[3] ;
	if (x*x + y*y <= r2 ) return _true;
	x -= rect[2];
	if (x*x + y*y <= r2 ) return _true;
	return _false;
}
	
	
/*-------------------------
MATRIX and vectors
------------------------*/
/*-------------------------
dot-product operator : Sigma a_i * b_i
----------------*/ 
function __bad_mix(a , b , sender ) { // common check for the family
if(!(a instanceof Vector))
		glisp_error(65,a,sender) ;
if(!(b instanceof Vector))
		glisp_error(65,b,sender) ;
 if(a.length !== b.length) glisp_error(94, [a.length,[b.length,null]],sender) ;
}

//(a2b3 - a3b2, a3b1 - a1b3, a1b2 - a2b1)
function __array_cross_product ( a , b) {
	var v = [];
	v.push (_sub_xx (_mul_xx(a[1],b[2]) , _mul_xx(a[2],b[1])));
	v.push (_sub_xx (_mul_xx(a[2],b[0]) , _mul_xx(a[0],b[2])));
	v.push (_sub_xx (_mul_xx(a[0],b[1]) , _mul_xx(a[1],b[0])));
	return new Vector(v);
}

function __array_dot_product (a, b) {// js-arrays
	var al = a.length, s= 0, i;
	for(i=0;i<al;i++) s+= a[i]*b[i] ;
	return s;
	}
	
function __array_cdot_product (a, b ) {// js-arrays
	var al = a.length,  s = new Complex (0,0) , i;
	for(i=0;i<al;i++) 
				s = _add_xx(s,_mul_xx(a[i],b[i])) ;
	return s;
	}
	
function __array_cdot_product_conjugate (a, b ) {// js-arrays
	var al = a.length,  s = new Complex (0,0) , i;
	var ztmp = new Complex(0,0);
	for(i=0;i<al;i++) 
					 if(b[i] instanceof Complex) {
					 	ztmp.a =  b[i].a;
					 	ztmp.b = -b[i].b ;
					 	s = _add_xx(s,_mul_xx(a[i],ztmp)) ;
					 	}
					 	else s = _add_xx(s,_mul_xx(a[i],b[i])) ;
	return s;
	}
	
// distances
function __array_norm_1 (a , b) {
	var al = a.length, s= 0, i;
	for(i=0; i<al; i++) 
		s+= Math.abs(a[i]-b[i]);
	return s;
}
function __array_norm_2 (a , b) {
	var al = a.length, s= 0, i;
	for(i=0; i<al; i++) 
		s+=  (a[i]-b[i]) * (a[i]-b[i]) ;
	return Math.sqrt(s);
}
function __array_norm_p (a , b, p) {
	var al = a.length, s= 0, i;
	for(i=0; i<al; i++) 
		s+=  Math.pow  ( Math.abs (a[i]-b[i]) , p) ;
	return Math.pow(s, 1/p) ;
}
function __array_norm_inf (a , b) {
	var al = a.length, s = -Infinity, i;
	for(i=0; i<al; i++) 
		s = Math.max(s, Math.abs(a[i]-b[i])) ;
	return s;
}

/*
API
*/
var _pythagore = function (a , b) {
	return  Math.sqrt (a*a + b*b) ;
	}

var _dot_product = function (a , b) {
		__bad_mix(a,b,"dot-product");
		return __array_dot_product (a.vector , b.vector) ;
}
var _cross_product = function (a , b) {
		__bad_mix(a,b,"cross-product");
		return __array_cross_product (a.vector , b.vector) ;
}
var _cdot_product = function (a , b) {
		__bad_mix(a,b,"cdot-product");
		return __array_cdot_product (a.vector , b.vector) ;
}
var _cdot_product_conjugate = function (a , b) {
		__bad_mix(a,b,"cdot-product*");
		return __array_cdot_product_conjugate (a.vector , b.vector) ;
}

var _norm_1 = function (a , b) {
		__bad_mix(a,b,"norm-1");
		return __array_norm_1 (a.vector , b.vector) ;
}
var _norm_2 = function (a , b) {
		__bad_mix(a,b,"norm-2");
		return __array_norm_2 (a.vector , b.vector) ;
}
var _norm_p = function (a , b, p) {
		__bad_mix(a,b,"norm-p");
		return __array_norm_p (a.vector , b.vector , p) ;
}
var _norm_inf = function (a , b) {
		__bad_mix(a,b,"norm-inf");
		return __array_norm_inf (a.vector , b.vector) ;
}



/*------------------------------
decimal representation : implode/explode numbers
-------------------------------*/
var _number_to_list = function (n) {
	if(! isNumber(n)) glisp_error(103,n,"number->list");
	var arr = n.toString().split(""); // of chars
	for(var i=0; i< arr.length;i++) arr[i] =  + arr[i];
	return __array_to_list(arr);
	}
	
// list->number <list of chars|numbers>
var _list_to_number = function (list) {
	if(! isListNotNull(list)) glisp_error(20,list,"list->number") ;
	return glisp_number(__list_to_array(list).join(""));
}

/*-----------------------
Extended GCD
------------------------*/
/*def egcd(a, b):
    x,y, u,v = 0,1, 1,0
    while a != 0:
        q, r = b//a, b%a
        m, n = x-u*q, y-v*q
        b,a, x,y, u,v = a,r, u,v, m,n
    gcd = b
    return gcd, x, y*/
    
function __egcd (a, b) {
	var x=0,y=1,u=1,v=0,m,n,q,r ;
	while (a !== 0)  {
		q = Math.floor(b/a); r = b % a ;
		m = x-u*q; n =y - v*q ;
		b=a; a= r; x=u; y=v; u=m; v= n;
		}
	return [b, [x , [ y, null]]] ;
}

var _egcd = function ( a, b) {
	if(isJSInteger(a) && isJSInteger(b)) return __egcd(a,b);
	// if(a instanceof Integer || b instanceof Integer) return Integer.EGCD(a,b);
	glisp_error(61,[a,[b,null]],"egcd");
}

// input js arrays
// out x : x === a[i] mod (n[i])

function __chinese (a ,n) { 
	var N = 1 , k = Math.min (a.length, n.length), i, ni, x = 0 ;
	for(i=0;i<k;i++) N *= n[i];
	for(i=0;i<k;i++) {
		ni = N/n[i];
		egcd = __egcd(n[i],ni);
		if(egcd[0] !== 1) glisp_error (40,n[i],"mod[i] must be co-primes") ;
		x +=  (egcd[1][1][0] * ni) * a[i] ;
	}
	x = x % N ;
	return (x < 0) ? x + N : x ;
}

var _chinese = function (a ,m) {
	if(notIsList (a)) glisp_error(20,a,"crt-solve") ;
	if(notIsList (m)) glisp_error(20,m,"crt-solve") ;
	return __chinese (__list_to_array(a) , __list_to_array(m)) ;
}

var _BERNOULLI = [1, Qnew(1,2)];
/*----------------------
Bernoulli numbers
B/odd = 0
B1 = 1/2
---------------------*/
var _bernoulli = function (n) {
	if( (n < 0) || ! isJSInteger(n)) glisp_error(61,n,"bernoulli");
	if( n == 1) return _BERNOULLI[1];
	if( n & 0x1) return 0;
	if(_BERNOULLI[n] !== undefined) return _BERNOULLI[n] ;
	
	var m,j ,q;
	var A= [];
  	for (m=0; m <= n ; m++) {
  		A.push(new Rational (1, 1+ m));
  		for(j = m; j > 0; j--) {
  		
		if(A[j] === 0) q = A[j-1] ;
		else if( A[j-1] === 0) 
			q = Qnew(-A[j].a, A[j].b);
		else
  			q = A[j-1].sub(A[j]) ;
  			
  		if(q === 0) A[j-1] = 0 ;
  			else A[j-1] = Qnew (q.a * j, q.b) ;
  		}}
	return (_BERNOULLI[n] =  A[0]) ;
	}
	
/*
http://stackoverflow.com/questions/622287/area-of-intersection-between-circle-and-rectangle
(bugged)

(define R #( -2.598415801 1.0911132936962413 0.006792585428375 0.006720173471625))
(define C #( -1.4944608174 1.2077959613 1.1039549836) )
*/

var _rect_inter_disk = function (rect, disk) {
rect = rect.vector ;
disk = disk.vector;
var xc = disk[0];
var yc = disk[1];
var r = disk[2];
var d = [], a = [] ;
var area, i,j;
 d[0]  = (xc- rect[0]) / r; // left
 d[1]  = (yc - rect[1] + rect[3] ) / r;  // bottom
 d[2] =  (xc - rect[0] -rect[2]) / r; d[2]= -d[2] ;
 d[3] =  (yc - rect[1] ) / r ; d[3]= -d[3] ; // top
 
 d[4]= d[0];
 
// console.log ("d[i]",d);
 
 for(i = 0; i< 4 ; i++) if(d[i] <= -1) return 0;
 var inside= true;
 for(i= 0; i< 4; i++) if(d[i] < 1) inside = false;
 if(inside) return Math.PI * r * r ;
 
 for(i=0; i<4;i++)
 	if(d[i] <=0 && d[i+1] <= 0 && (d[i]*d[i] + d[i+1]*d[i+1] > 1)) return 0;
 	
 area = Math.PI * r * r ;
  
 	for(i = 0; i<4;i++) 
 		if (d[i] < 1 ) { 
 		 a[i] = Math.asin(d[i]) ;
 		 area -= (r * r / 2) * (Math.PI - 2 * a[i] - Math.sin (2 * a[i])) ;
 		}
 		
 	a[4] = a[0];
// console.log ("a[i]",a);
 		
 	for(i=0;i<4;i++) {
 		j = i + 1;
 	 	if(d[i] < 1 && d[j] < 1 && (d[i]*d[i] + d[j]*d[j] < 1)) 
		area += (r * r / 4) * (Math.PI - 2*a[i] - 2*a[j] - Math.sin(2*a[i]) - Math.sin(2*a[j]) + 
		4* Math.sin(a[i]) * Math.sin(a[j])) ;
 	}
 	
 	if (area < 0 || area > (rect[2]*rect[3])) return _false ;
 	return area ;
}

////////////
// BOOT
/////////

function boot_mathlib() {
// Maths funs
		define_sysfun(new Sysfun ("math.egcd",_egcd,2,2)); // -> (g a b) a*x + b*y = g
		//  x == a_i (mod m_i)
		define_sysfun(new Sysfun ("math.crt-solve",_chinese,2,2)); // in: (a_i) (m_i) lists
		define_sysfun(new Sysfun ("math.bernoulli",_bernoulli,1,1)); 
	
		define_sysfun(new Sysfun ("math.sigma",_sigma,3,3));
		define_sysfun(new Sysfun ("math.Σ",_sigma,3,3));
		define_sysfun(new Sysfun ("math.mean",_mean,1,1));
		define_sysfun(new Sysfun ("math.sigma-2",_sigma_2,5));
		define_sysfun(new Sysfun ("math.ΣΣ",_sigma_2,5));
		define_sysfun(new Sysfun ("math.product",_product,3,3));
		define_sysfun(new Sysfun ("math.Π",_product,3,3));
	
		define_sysfun(new Sysfun ("math.number->list",_number_to_list,1,1));
		define_sysfun(new Sysfun ("math.list->number",_list_to_number,1,1));
		
		define_sysfun(new Sysfun ("math.divides?",_divides_p,2,2)); 
		define_sysfun(new Sysfun ("math.num-divisors",_num_divisors,1,1)); // 1 if prime
		define_sysfun(new Sysfun ("math.sum-divisors",_sum_divisors,1,1)); // (proper div)
		define_sysfun(new Sysfun ("math.primes-pi",_primes_pi,1,1)); // # primes <= n
		define_sysfun(new Sysfun ("math.nth-prime",_nth_prime,1,1));
		define_sysfun(new Sysfun ("math.in-primes",_in_primes,1,1)); // stream
		
		define_sysfun(new Sysfun ("number->contfract",_number_to_contfrac,1,2));// PI -> K
		define_sysfun(new Sysfun ("contfract->number",_contfract_to_number,1,1));// K -> PI
		define_sysfun(new Sysfun ("convergents",_convergents,1,2)); // (conv K n)
		
		// best (poly 2:3) NYI
     	define_sysfun(new Sysfun ("math.poly",_poly,3,3)); // compute rational fract
     	// define_sysfun(new Sysfun ("math.poly?",_polyp,1,1)); 
     	define_sysfun(new Sysfun ("math.cpoly",_cpoly,3,3));
     	define_sysfun(new Sysfun ("_poly_xx",_poly_xx,2,2,[isAny,isAny]));
    	define_sysfun(new Sysfun ("_cpoly_xx",_cpoly_xx,2,2,[isAny,isAny]));
     	define_sysfun(new Sysfun ("math.poly->string",_poly_to_string,2,3));
     	// define_sysfun(new Sysfun ("_poly->string_xx",_poly_to_string_xx,2,2,[isAny,isAny]));
     	define_sysfun(new Sysfun ("math.poly->html",_poly_to_html,2,3));
     	define_sysfun(new Sysfun ("math.poly-add",_poly_add,2,2));
     	define_sysfun(new Sysfun ("math.poly-sub",_poly_sub,2,2));
     	define_sysfun(new Sysfun ("math.poly-mul",_poly_mul,2,2));
     	define_sysfun(new Sysfun ("math.poly-div",_poly_div,2,2));
     	define_sysfun(new Sysfun ("math.poly-pow",_poly_pow,2,2));
     	define_sysfun(new Sysfun ("math.poly-mul-k",_poly_mul_k,2,2));
     	
     	define_sysfun(new Sysfun ("math.root",_root,3,3));
     	define_sysfun(new Sysfun ("math.roots",_roots,3,3));
     	define_sysfun(new Sysfun ("math.croot",_croot,3,4)); // (croot zmin zmax [steps])
     	define_sysfun(new Sysfun ("math.croots",_croots,3,4)); // (croots zmin zmax [steps])

     	define_sysfun(new Sysfun ("math.integrate",_integrate,3,3));
     	define_sysfun(new Sysfun ("math.deriv",_deriv,2,2));
     	define_sysfun(new Sysfun ("math.normal",_normal,3,3)); // (normal m sigma)
     	// (normal x y r mx sigmax my sigmay)
     	define_sysfun(new Sysfun ("math.normal-2",_normal_2,5,7)); // undef arity if > 4 args ...
     	define_sysfun(new Sysfun ("math.standard-normal",_standard_normal,1,1));
     	define_sysfun(new Sysfun ("math.math-precision",_math_precision,0,1));
     	define_sysfun(new Sysfun ("math.~=",_math_approx,2,2));
     	define_sysfun(new Sysfun ("math.gamma",_gamma,1,1)); // gamma (z)
 
     	
     	define_sysfun(new Sysfun ("math.fractal",_fractal,3,3));
     	define_sysfun(new Sysfun ("math.fractal-p",_fractal_p,4,4));
     	define_sysfun(new Sysfun ("math.g-iterate",_g_iterate,4,4));
     	
     	define_sysfun(new Sysfun ("math.cserie",_cserie,3,3)); // (cserie fn z nmax)
     	define_sysfun(new Sysfun ("math.serie",_serie,3,3));
     	// define_sysfun(new Sysfun ("math.factorial",_factorial,1,1)); // OUT -> math.js
     	
     	define_sysfun(new Sysfun ("math.pythagore",_pythagore,2,2)); // sqrt(a*a + b*b)
     	define_sysfun(new Sysfun ("math.dot-product",_dot_product,2,2)); 
		define_sysfun(new Sysfun ("math.cdot-product",_cdot_product,2,2)); 
		define_sysfun(new Sysfun ("math.cross-product",_cross_product,2,2)); // NEW 2.30
		define_sysfun(new Sysfun ("math.cdot-product*",_cdot_product_conjugate,2,2)); // NEW 2.5
		

		define_sysfun(new Sysfun ("math.distance",_distance,4,4)); 
		define_sysfun(new Sysfun ("math.point-in-disk?",_point_in_disk_p,3,3)); 
		define_sysfun(new Sysfun ("math.disk-in-disk?",_disk_in_disk_p,2,2)); 
		define_sysfun(new Sysfun ("math.rect-in-disk?",_rect_in_disk_p,2,2)); 
		define_sysfun(new Sysfun ("math.rect-disk-intersect?",_rect_disk_intersect_p,2,2));
		define_sysfun(new Sysfun ("math.rect/disk-area",_rect_inter_disk,2,2));  
		
		define_sysfun(new Sysfun ("math.in-interval?",_in_interval_p,3,3)); 
		define_sysfun(new Sysfun ("math.in-open-interval?",_in_open_interval_p,3,3)); 
		define_sysfun(new Sysfun ("math.norm-1",_norm_1,2,2)); 
		define_sysfun(new Sysfun ("math.norm-2",_norm_2,2,2)); 
		define_sysfun(new Sysfun ("math.norm-p",_norm_p,3,3)); 
		define_sysfun(new Sysfun ("math.norm-inf",_norm_inf,2,2)); 
		
     	
     	_LIB["math.lib"] = true;
     	writeln("math.lib v1.14 ® EchoLisp","color:green");
     	}

boot_mathlib();

  
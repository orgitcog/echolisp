// https://gist.github.com/borgar/3317728
/*---------------
package globs
	_math.lib
-----*/
var __math_precision = 1.e-6 ;

/*-----------------
uniroot
------------------*/
var _root  = function ( fun, xmin, xmax, eps, maxIter ) {
var a = _exact_to_inexact(xmin)
,  b =  _exact_to_inexact(xmax)
, c = a
, funcall = [fun , [ null , null]] 
, fa  // = fun(a)
, fb // = fun(b)
, fc // = fa
//, s = 0
//, fs = 0
, tol_act // Actual tolerance
, new_step // Step at this iteration
, prev_step // Distance from the last but one to the last approximation
, p // Interpolation step is calculated in the form p/q; division is delayed until the last moment
, q
, env = glisp.user
, _maxIter 
;
 
	eps =  (eps || __math_precision); // default there
	eps = _exact_to_inexact(eps) ;
	maxIter =  _maxIter = (maxIter || 1000);
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
		console.log('root:iter: ',_maxIter-maxIter);
		return b; // Acceptable approx. is found
	}
	if (Math.abs(fa) <= eps ) {
		console.log('root:iter: ',_maxIter-maxIter);
		return a; // Acceptable approx. is found
	}
	if ( Math.abs(new_step) <= tol_act ) {
		console.log('*** root:iter: ',_maxIter-maxIter);
		if(Math.abs(fb) < 0.001) return b;
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
    fb = __funcall(funcall,env); // Do step to a new approxim.
 
	if ( (fb > 0 && fc > 0) || (fb < 0 && fc < 0) ) {
		c = a, fc = fa; // Adjust c for it to have a sign opposite to that of b
		}
	} // while
	return null;
} // uniroot

var _root_xxx = function ( fun, xmin, xmax ) {
	return _root(fun, xmin, xmax, 0,0);
}

/*-------------------------
adaptive integrate
---------------------------------*/

function __adaptive(funcall,env,a,b,eps,S,fa,fb,fc,depth)
{
if(depth === 100) console.log("Integrate",depth,eps,S,a,b,fa,fb,fc);
	var c = (a+b)/2  ;
	var h = b-a;
	var d =(a+c)/2;
	var e = (c+b)/2 ;
	var fd , fe ;
		funcall[1][0] = d; fd = __funcall(funcall,env);
		funcall[1][0] = e; fe = __funcall(funcall,env);
	var Sleft =  (h/12)*(fa + 4*fd + fc); 
	var Sright = (h/12)*(fc + 4*fe + fb);                                                          
	var S2 = Sleft + Sright;    
	if (depth <= 0 || Math.abs(S2 - S) <= eps ) return S2  + (S2 - S)/15;                                                                        

	return 
		__adaptive(funcall, env, a, c, eps/2, Sleft,  fa, fc, fd, depth-1) +                    
       	__adaptive(funcall, env, c, b, eps/2, Sright, fc, fb, fe, depth-1);    
}

/*-------------------------------
integrate
---------------------------------------*/
var _integrate = function (f,a,b,eps,depth) {
depth = depth || 100 ;
eps = eps || __math_precision ;

a = _exact_to_inexact(a);
b = _exact_to_inexact(b);
eps = _exact_to_inexact(eps);

var funcall = [f , [ null , null]] ;
var env = glisp.user;
var c = (a+b)/2 ;
var h = b-a ;
var fa, fb, fc ;
	funcall[1][0] = a; fa = __funcall(funcall,env);
	funcall[1][0] = b; fb = __funcall(funcall,env);
	funcall[1][0] = c; fc = __funcall(funcall,env);
var S  = (h/6)*(fa + 4*fc + fb);   
return __adaptive(funcall,env,a,b,15*eps,S,fa,fb,fc,depth);
}

var _integrate_xxx = function(f, a ,b) {
	return _integrate(f,a,b,0,0);
	}
	
/*---------------------------------
deriv
------------------------------*/
var _deriv = function(f,x,eps, maxIter)
{
x = _exact_to_inexact(x);
eps = _exact_to_inexact(eps);
eps = eps || __math_precision ;
maxIter = maxIter || 100 ;
var m = maxIter  ;
var d1,d2;
var h = eps  ;
var fx,fh,f2h,fh_,f2h_;
var env = glisp.user;
var funcall = [f , [null,null]] ;


	funcall[1][0] = x ;    fx =  __funcall(funcall,env);
	funcall[1][0] = x + h; fh =  __funcall(funcall,env);
	funcall[1][0] = x + 2*h ;  f2h =  __funcall(funcall,env);
	funcall[1][0] = x - h ;    fh_ =  __funcall(funcall,env);
	funcall[1][0] = x - 2*h ;  f2h_ =  __funcall(funcall,env);
	
while(m--)
	{
	d1= (-3*fx +4*fh - f2h) /(2*h);
	d2= (-3*fx +4*fh_ -f2h_)/(-2*h);
	if(Math.abs(d1-d2) < eps) {
			console.log("deriv:steps",maxIter-m,d1);
			return d1;
			}
	h /=2 ;
	f2h =  fh;
	f2h_ = fh_;
	funcall[1][0] = x + h;   fh  =  __funcall(funcall,env);
	funcall[1][0] = x - h;   fh_ =  __funcall(funcall,env);
	}
	
return null; // undef
} // deriv

var _deriv_xx = function (f, x) {
	return _deriv(f,x,0); // default prec
}

/*-----------------
gauss
----------------------*/
var _gnorm = 1./Math.sqrt(Math.PI*2) ;
/*----------------------
Gauss
------------------------------*/
var _normal = function(x,m,s)	{
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

var _math_precision = function(argc, argv) {
	if(argc && _stack[0] && typeof _stack[0] === "number" ) __math_precision = Math.abs(_stack[0]) ;
	return __math_precision ;
}

////////////
// BOOT
/////////

function boot_mathlib() {
		if(_mathlib) return;
		_mathlib = true; // GLOB
		
		define_sysfun(new Sysfun ("_root_xxx",_root_xxx,3,3,[isAny,isAny,isAny]));
     	define_sysfun(new Sysfun ("root",_root,4,4));
     	define_sysfun(new Sysfun ("_integrate_xxx",_integrate_xxx,3,3,[isAny,isAny,isAny]));
     	define_sysfun(new Sysfun ("integrate",_integrate,4,4));
     	define_sysfun(new Sysfun ("_deriv_xx",_deriv_xx,2,2,[isAny,isAny]));
     	define_sysfun(new Sysfun ("deriv",_deriv,3,3));
     	define_sysfun(new Sysfun ("normal",_normal,3,3));
     	define_sysfun(new Sysfun ("standard-normal",_standard_normal,1,1));
     	define_sysfun(new Sysfun ("math-precision",_math_precision,0,1));
     	}

boot_mathlib();

  
/**
 * @file GLisp - Vectors.
 * @copyright Jacques Tramu 2014
 * https://www.gnu.org/software/mit-scheme/documentation/mit-scheme-ref/Construction-of-Vectors.html
 */

/**
 * Vector
 * @class
 * @param {number} length
 * @returns : a Vector
 */
 
 function Vector (seed) { // (Vector length) or (Vector jsarray)
 	if(typeof seed === "number" ) {
 			this.vector = [];
 			for(var i=0;i<seed;i++) this.vector[i]=0;
 			}
 		else if (Array.isArray(seed))  
 				this.vector = seed.slice(0); // need a copy
 		else glisp_error(22,seed,"vector"); 
 	this.read_only = false; // rfu - cf time-series
 	this.index = 0; // cf sql.lib
 	this.buffer = null ; // typed vectors
 	this.type = "" ; // DBG RFU
 }
 
 // i not declared : ONE HOUR BOGUE
 Vector.prototype.toString = function () { // (recurse) 
 	var items = [] , vector = this.vector ,length = this.vector.length ,i  ;
 	for(i = 0; i < length ; i++)
 		items.push (glisp_tostring(vector[i],"")) ;
 	return "#" + this.type + "(" + items.join (" ") + ")" ;
 	}
 	
 Vector.prototype.toJSON = function () { // for HASH
 	return "👽" + JSON.stringify(this.vector) ;
 	}
 
 /**
 * js predicate 
 * @param {Object} obj
 * @returns : true|false
 */
 
 function isVector(obj) {
 	return (obj instanceof Vector);
 }
 
 /**
 * GLisp predicate 
 * @param {Object} obj
 * @returns : symbols #t | # f
 */
 
 function _vectorp(obj) {
 	return (obj instanceof Vector) ? _true:_false;
 }
 
 var _vector_empty_p = function (aVector) {
 if(! (aVector instanceof Vector)) glisp_error(65,aVector,"vector-empty?");
 return (aVector.vector.length === 0 ) ? _true : _false ;
 }
 
  /**
 * GLisp Vector constructor : (vector obj obj ...)
 * @param [{obj} ...] 
 * @returns  :aVector
 */
 
 function _vector(top, argc) {
 	var vector = [];
 	var aVector = new Vector(0);
 	var last = top + argc;
 	for(var i= top ; i < last ; i++) vector.push(_stack[i]);
 	aVector.vector = vector;
 	return aVector;
 }
 
var _list_to_vector = function (lst) {
	if(lst instanceof Procrastinator) lst = lst.toList(65536) ;
 	var v = new Vector(0);
 	v.vector = __list_to_array(lst);
 	return v;
 }
 
var _vector_to_list = function (aVector) {
   	if(! (aVector instanceof Vector)) glisp_error(65,aVector,"vector->list");
 	return __array_to_list(aVector.vector) ;
 }
 
var _vector_dup = function (aVector) {
   	if(! (aVector instanceof Vector)) glisp_error(65,aVector,"vector-dup");
 	return new Vector(aVector.vector) ;
 }
 
 function __copy_vector(aVector) {
 	var cop = [];
 	aVector = aVector.vector;
 	for(var i= 0; i < aVector.length; i++)
 		cop.push(_copy(aVector[i]));
 	return new Vector(cop);
 }
 		
 /***
 * procedure: vector-set! vector k object 
 *
 */
 // should check dim NYI NYI NYI
function _vector_set(aVector, k, obj) {
 	if(! (aVector instanceof Vector)) glisp_error(65,aVector,"vector-set");
 	aVector.vector[k] = obj;
 	return obj;
 }
function _vector_plus_equal(aVector, k, n) {
 	if(! (aVector instanceof Vector)) glisp_error(65,aVector,"vector+=");
 	if (k >= aVector.vector.length) glisp_error(42,k,"vector++") ;
 	return (aVector.vector[k] = _add_xx(aVector.vector[k],n));
 }
function _vector_mult_equal(aVector, k, n) {
 	if(! (aVector instanceof Vector)) glisp_error(65,aVector,"vector*=");
 	if (k >= aVector.vector.length) glisp_error(42,k,"vector*=") ;
 	return (aVector.vector[k] = _mul_xx(aVector.vector[k],n));
 }
function _vector_push(aVector,  obj) {
 	if(! (aVector instanceof Vector)) glisp_error(65,aVector,"vector-push");
 	aVector.vector.push(obj) ;
 	return obj;
 }
 
 // sorted or not
function _vector_remove_ref  (aVector,index) {
if(! (aVector instanceof Vector)) glisp_error(65,aVector,"vector-remove");
var val = aVector.vector[index] ;
	if(val !== undefined) {
		aVector.vector.splice(index,1);
		return val;
		}
	return _false;
	}

 
  /***
 * procedure: vector-ref vector k 
 *
 */
 function _vector_ref(aVector, k) {
 var val ;
 	if(! (aVector instanceof Vector)) glisp_error(65,aVector,"vector-ref");
 	val=  aVector.vector[k] ;
 	return (val === undefined) ? glisp_error(42,k,"vector-ref") : val ;
 }
 
function _vector_pop(aVector) {
 var val ;
 	if(! (aVector instanceof Vector)) glisp_error(65,aVector,"vector-pop");
 	val =  aVector.vector.pop() ;
 	return (val === undefined) ? _false  : val ;
 }
 
function _vector_shift(aVector) {
 var val ;
 	if(! (aVector instanceof Vector)) glisp_error(65,aVector,"vector-shift");
 	val =  aVector.vector.shift() ;
 	return (val === undefined) ? _false  : val ;
 }
 

//@ http://jsfromhell.com/array/rotate [v1.0]
__rotate = function(a /*array*/, p /* integer, positive integer rotate to the right, negative to the left... */){ //v1.0
var l,p,i,x ;
    for( l = a.length, p = (Math.abs(p) >= l && (p %= l), p < 0 && (p += l), p), i, x;
     p; 
     p = (Math.ceil(l / p) - 1) * p - l + (l = p))
     for(i = l; i > p; x = a[--i], a[i] = a[i - p], a[i - p] = x);
     return a;
};

// in place , p in Z
function _vector_rotate(aVector, p) {
 	if(! (aVector instanceof Vector)) glisp_error(65,aVector,"vector-swap!");
	__rotate(aVector.vector,p);
	return aVector;
}


 
function _vector_swap(aVector, i, j) {
 var tmp ;
 	if(! (aVector instanceof Vector)) glisp_error(65,aVector,"vector-swap!");
 	tmp =  aVector.vector[i] ;
 	aVector.vector[i] = aVector.vector[j] ;
 	aVector.vector[j] = tmp;
 	return (tmp === undefined) ? glisp_error(42,i,"vector-swap!") : tmp ;
 }
 

 
 var _subvector = function (top,argc) { // (sub v start [end])
 	var aVector = _stack[top++];
 	if(! (aVector instanceof Vector)) glisp_error(65,aVector,"subvector");
 	var vector = aVector.vector;
 	var length = vector.length , i;

 	var start = _stack[top++];
 	var end = (argc > 2) ? _stack[top] : vector.length ;
 	var vsub = new Vector(0);
 	var sub = vsub.vector; // []
 	for(i = start; i < end && i < length; i++)
 		sub.push(vector[i]);
 	return vsub;
 	}
 
 
  /**
 * GLisp Vector constructor : (make_vector k [fill])
 * @param {integer} length
 * @param [{obj}] fill
 * @returns  :aVector
 */
 
 
// function _make_vector (length, fill) {
var _make_vector = function (top,argc) { // (make-vector length [filler])
	var length = _stack[top++]  ;
	var aVector = new Vector(0);
	// checks anywhere NYI
    var fill = (argc > 1) ? _stack[top] : 0;
 	var vector = []; 
 		for(var i=0 ; i < length ; i++)  vector[i] = fill;
 	aVector.vector = vector
 	return aVector;
 	}
 	
var _vector_length = function (aVector) {
  	if(!( aVector instanceof Vector)) glisp_error(65,aVector,"vector-length");
	return aVector.vector.length;
 }
 
var _vector_fill = function (aVector,val) {
  	if(! (aVector instanceof Vector)) glisp_error(65,aVector,"vector-fill");
  	var vector = aVector.vector , length = vector.length, i;
	 for( i=0 ; i < length ; i++)  vector[i] = val;
 	return aVector;
 }
 
// a new one
var _vector_append = function (aVector, bVector) {
  	if(!( aVector instanceof Vector)) glisp_error(65,aVector,"vector-append");
  	if(!( bVector instanceof Vector)) glisp_error(65,bVector,"vector-append");
	var nVector = new Vector(0);
	nVector.vector = aVector.vector.concat(bVector.vector) ;
	return nVector ;
 }
 	
/**
 * GLisp Vector constructor : (make_initialized_vector length fun()...)
 * @param {integer} length
 * @param [Lambda] lambda:1:1 
 * @returns  :aVector
 */
 // must use funcall NYI eg (make-ini.. 6 sin)
var _make_initialized_vector  = function (length, fun , env) {
 	var vector=[] ;
 	var aVector = new Vector(0);
 	fun = checkProc(fun,1,1,"build-vector");
 	var call = [fun, [null,null]], i;
 	
 	for( i=0 ; i < length ; i++) {
 		call[1][0] = i;
		vector[i] = __ffuncall(call,env) ;
	 } // lambda[1]

	aVector.vector= vector;
 	return aVector;
 }
 
 /**
 * vector-map (vector-map lambda:n()... v1 .. vn )
 * @param {Vector_i} aVector
 * @param {Lambda} lambda:1:n
 * @returns  :aVector
 */
 
// var _vector_map  = function (fun, vect, vect, vect ,env) {
// all vects must be same length (8 max)
var _vector_map= function (top, argc, env) {
var proc, vector1, a, arg, call , i, length ;
var vmap,map;

	proc = _stack[top] ;
	vector1 = _stack[top+1];
// check proc NYI
  	if(! (vector1 instanceof Vector)) glisp_error(65,vector1,"vector-map");
  	
  	// build the call (proc + argc-1 args)
 	var call = null ;
 	for( a=0; a < argc;a++) call = [null , call];
 	call[0] = proc;
 	length = vector1.vector.length ;
 	vmap = new Vector(length);
 	map = vmap.vector; // [length]
 	
 	// dereference (safe) and check the stack of provided vectors
 	for(a=1 ; a < argc ; a++)
 		_stack[top+a] = _stack[top+a].vector;

 	for( i=0 ; i < length ; i++) { // resulting vector length
 		arg = call[1];
		for( a = 1 ; a < argc ; a++) { // argc-1 vectors to map
			arg[0] = _stack[top+a][i];
			arg = arg[1];
		}
		map[i] =  __ffuncall(call,env);
	 } // i loop
	return vmap;
 } // _vector_map
 
var _vector_for_each = function (top, argc,env) { //  (for-each proc vector)
	var proc, vector1, a, arg, call , i, length ;

	proc = _stack[top] ;
	vector1 = _stack[top+1];
// check proc NYI
  	if(! (vector1 instanceof Vector)) glisp_error(65,vector1,"vector-for-each");
  	
  	// build the call (proc + argc-1 args)
 	var call = null ;
 	for( a=0; a < argc;a++) call = [null , call];
 	call[0] = proc;
 	length = vector1.vector.length ;
 	
 	// dereference (safe) and check the stack of provided vectors
 	for(a=1 ; a < argc ; a++)
 		_stack[top+a] = _stack[top+a].vector;

 	for( i=0 ; i < length ; i++) { // resulting vector length
 		arg = call[1];
		for( a = 1 ; a < argc ; a++) { // argc-1 vectors to map
			arg[0] = _stack[top+a][i];
			arg = arg[1];
		}
		 __ffuncall(call,env); // side effect only
	 } // i loop
	return __void;
}

function _vector_for_each_2  (proc, aVector, env) {
	var fcall = [proc, [null , null]];
	var vector = aVector.vector;
 	var length = vector.length, i ;
	for( i=0 ; i < length ; i++) { 
			fcall[1][0] = vector[i];
			__ffuncall(fcall,env) ;
			}
return __void ;
}

 
var _vector_filter  = function (fun, aVector,env) {
  	if(!( aVector instanceof Vector)) glisp_error(65,aVector,"vector-filter");
 	var call = [fun, [null, null]];
 	var vmap = new Vector(0);
 	var map = vmap.vector; // []
 	var length = aVector.vector.length , i;
 	var vector = aVector.vector;
 	
 	for( i=0 ; i < length ; i++) {
//		glisp_trace(param + ":" + i,lambda[1][0],'vector_map');
		call[1][0] = vector[i];
		if( __funcall(call,env) !== _false) map.push(vector[i]) ;
	 } 
	return vmap;
 } // _vector_filter
 
// O(n) index search - equal? pred
// (vector-index needle V [start])

var _vector_index = function (top,argc) {
	var val = _stack[top++];
	var aVector = _stack[top++];
	if(! (aVector instanceof Vector)) glisp_error(65,aVector,"vector-index");
	var vector = aVector.vector;
	var length = vector.length;
	var start = (argc > 2) ? checkIntegerRange(_stack[top],0,length-1,"vector-index") : 0 ;
	var i;

 	for( i=start ; i < length ; i++) 
		if(__equal(val, vector[i])) return i;		

	return _false ;
 } // _vector_index
 
/*-----------------------------
ES6
In ES6, Array.find() and Array.findIndex() are provided as built-in methods. 
--------------------------------*/

// (vector-search pred V [start])
var _vector_search = function (top,argc,env) {
	var proc = checkProc (_stack[top++],1,1,"vector-search");
	var aVector = _stack[top++];
	if(! (aVector instanceof Vector)) glisp_error(65,aVector,"vector-search");
	var vector = aVector.vector;
	var length = vector.length;
	var start = (argc > 2) ? checkIntegerRange(_stack[top],0,length-1,"vector-search") : 0 ;
	var call = [proc, [null , null]] ;
	var i;

 	for( i=start ; i < length ; i++) {
 		call[1][0] = vector[i];
		if(__ffuncall(call,env) !== _false)  return i;	
		}	

	return _false ;
 } // _vector_search
 
 /*-------------
 permutation (in place)
 -----------------------*/
 var _PERM_TMP = null;
 
 var _vector_permute = function (aVector, aPerm) {
	if(! (aVector instanceof Vector)) glisp_error(65,aVector,"vector-permute!");
	if(! (aPerm instanceof Vector)) glisp_error(65,aVector,"vector-permute!");
	var i, perm = aPerm.vector, source = aVector.vector , length = perm.length;
	
	 if(_PERM_TMP === null || _PERM_TMP.length < length) _PERM_TMP = new Array(length*2) ;
	 for (i = 0; i< length; i++) _PERM_TMP[i] = source[perm[i]] ;
	 for (i = 0; i< length; i++) source[i] = _PERM_TMP[i];
	 return aVector;
 }
 

 
/*------------------
SORTED VECTORS
-------------------------*/
// bin-search 
var _vector_search_star  = function (val, aVector) {
  	if(! (aVector instanceof Vector)) glisp_error(65,aVector,"vector-search");
	var a = aVector.vector;
  	var mid, lo = 0, hi = a.length, vref;
 
  while (hi > lo) {
    mid   =  (hi + lo) >>> 1 ; //  (hi + lo) / 2 >>> 0;
    vref =  a[mid] ;
    if(vref === val) return mid ;
    else if (vref > val) 
    	{ hi = mid ; } 
    else 
    	{lo = mid + 1; } 
  	} // while
  return _false ;
  } // search
  
// ZZZ : assumes sorted <
var _vector_insert = function (aVector,val) {
  	if(! (aVector instanceof Vector)) glisp_error(65,aVector,"vector-insert");
	var a = aVector.vector;
    var index   = a.length, i,j, temp;
    
    a.push(val);
    while (index > 0) {
         i = index, j = --index;
        // if (compare(array[i], array[j]) < 0) 
        if(a[i] < a[j]) {
                    var temp = a[i];
                    a[i] = a[j];
                    a[j] = temp;
                }
		else if(a[i] === a[j]) return _false; // but done !!! BOGUE NYI NYI
		else break;
		}
	return val;
	}
	
	
var _vector_remove = function (aVector,val) {
	var index = _vector_search_star(val,aVector);
	if(index === _false) return _false;
	aVector.vector.splice(index,1);
	return val;
	}

// array items must be lists for _sort_fields
// sorts on fields 0 ... numf-1
// sorts ascending arr in place
 function __array_sort_fields (numf ,arr) { // in place
 var i ;
// check everybody is a list
 	for(i=0; i< arr.length;i++) 
 		if(notIsList(arr[i])) glisp_error(20,arr[i],"sort-fields");
 	
 	function jssort ( a, b) {
 		var j;
 		for(j=0;j<numf;j++,a =a[1],b=b[1]) {
 			if(a[0] === b[0]) continue; // eq?
 			if(a[0] < b[0]) return -1;
 			else  return 1;
 			a = a[1];
 			b = b[1];
 			}
 		return 0;
 		}

 	arr.sort(jssort) ;
 }

 // http://s48.org/1.1/manual/s48manual_54.html
 // proc must be a < comparison proc, not a <=
 // we should code = by (and (not ( < a b)) (not (< b a)))
 // could use _set_cmp function if sortf === _lt NYI
 
 function __array_sort (sortf ,arr, env) { // in place
 env = env || glisp.user;
  	var call = [sortf, [null , [null, null]]] ;
  	var arg1 = call[1];
  	var arg2 = call[1][1];
 	function jssort ( a, b) { // closure on env && call
 		if(a === b) return 0; // eq?
 		arg1[0] = a;
 		arg2[0] = b;
 		if(__ffuncall(call,env) === _false) return 1;
 		return -1;
 		}
 	arr.sort(jssort) ;
 }
 

 // sorts in place
 var _vector_sort_I = function (sortf, aVector) { // vector-sort!
  	if(! (aVector instanceof Vector)) glisp_error(65,aVector,"vector-sort!");
  	sortf = checkProc(sortf,2,2,"vector-sort!") ;
 	__array_sort(sortf,aVector.vector); 
 	return aVector;
 }
 

 //////////////////////
 // primitives
 /////////////////////
 function boot_vector () {
 	define_sysfun (new Sysfun('vector?', _vectorp, 1,1));
	define_sysfun (new Sysfun('vector', _vector, 0)); // 0..n args
	define_sysfun (new Sysfun('vector-empty?', _vector_empty_p, 1,1)); 
	define_sysfun (new Sysfun('vector-length', _vector_length, 1,1)); 
	define_sysfun (new Sysfun('vector-fill!', _vector_fill,2,2)); 
	define_sysfun (new Sysfun('subvector', _subvector,2,3)); // (sub start [end])

	define_sysfun (new Sysfun('list->vector',_list_to_vector, 1,1)); 
	define_sysfun (new Sysfun('vector->list',_vector_to_list, 1,1)); 
	define_sysfun (new Sysfun('make-vector',_make_vector, 1,2)); 
	define_sysfun (new Sysfun('vector-dup',_vector_dup, 1,1)); 

	define_sysfun (new Sysfun('vector-set!',_vector_set,3,3)); // (set V idx val)
	define_sysfun (new Sysfun('vector-ref',_vector_ref,2,2)); 
	define_sysfun (new Sysfun('vector+=',_vector_plus_equal,3,3)); 
	define_sysfun (new Sysfun('vector*=',_vector_mult_equal,3,3)); 
	define_sysfun (new Sysfun('vector-swap!',_vector_swap,3,3)); 
	define_sysfun (new Sysfun('vector-rotate!',_vector_rotate,2,2)); // DOC NEW
	// DOC !!!!
	define_sysfun (new Sysfun('vector-remove-ref!', _vector_remove_ref, 2,2, [isVector,isAny])); 

	define_sysfun (new Sysfun('vector-push',_vector_push,2,2)); // (push V val)
	define_sysfun (new Sysfun('vector-pop',_vector_pop,1,1));
	define_sysfun (new Sysfun('vector-shift',_vector_shift,1,1));
	define_sysfun (new Sysfun('vector-permute!',_vector_permute,2,2)); // in place
	define_sysfun (new Sysfun('make-initialized-vector', _make_initialized_vector, 2,2));
	define_sysfun (new Sysfun('build-vector', _make_initialized_vector, 2,2));
	define_sysfun (new Sysfun('vector-append', _vector_append, 2,2)); // NEW DOC


	define_sysfun (new Sysfun('vector-map', _vector_map, 2,undefined, [isLambda,isVector]));
	//define_sysfun (new Sysfun('vector-fold', _vector_fold, 3,3));
	
	define_sysfun (new Sysfun('vector-filter', _vector_filter, 2,2, [isLambda,isVector]));
	define_sysfun (new Sysfun('vector-index', _vector_index, 2,3, [isAny,isVector])); // --> idx
	define_sysfun (new Sysfun('vector-search', _vector_search, 2,3, [isLambda,isVector]));

// sorted
	define_sysfun (new Sysfun('vector-sort!', _vector_sort_I, 2,2, [isLambda,isVector]));
	define_sysfun (new Sysfun('vector-search*', _vector_search_star, 2,2, [isAny,isVector]));
	// #f if dup
// DOC !!!!! NYI NEW
	define_sysfun (new Sysfun('vector-insert*', _vector_insert, 2,2, [isVector,isAny])); 
	define_sysfun (new Sysfun('vector-remove*', _vector_remove, 2,2, [isVector,isAny])); 
	
} // boot vector
 


 	
 
 
 
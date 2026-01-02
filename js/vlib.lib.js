/**
 * EchoLisp
 * @file vlib.lib
 * véloces vectors
 * @copyright Jacques Tramu 2016
**/

 /*
 TYPED VECTORS and BIT vectors
 
 https://developer.mozilla.org/fr/docs/Web/JavaScript/Tableaux_typ%C3%A9s
 https://developer.mozilla.org/en-US/Add-ons/Code_snippets/StringView
 
 !!!! !!!!  !!!!! Array.isArray() renverra false lorsqu'elle utilisée sur un tableau typé.
 Init at 0 by default
 */
 
var __make_typed_vector = function (top, argc, TypedArray, bytes, type) { 
	var length = _stack[top++]  ;
	if(! isSmallInteger(length)) glisp_error(61,length,"typed-vector");
    var fill = (argc > 1) ? _stack[top] : 0;
    var buffer = new ArrayBuffer (length * bytes);
    var aVector = new Vector(0) ;
    aVector.vector = new TypedArray (buffer);
    aVector.buffer = buffer;
    aVector.type = type ; // string info
    
 		if (fill !== 0) for(var i=0 ; i < length ; i++) 
 						aVector.vector[i] = fill;
 	return aVector;
 	}
 	
 var _make_uint8_vector = function (top, argc) {
 		return __make_typed_vector(top,argc, Uint8Array , 1 , "uint8")
 }
  var _make_uint8_clamped_vector = function (top, argc) {
 		return __make_typed_vector(top,argc, Uint8ClampedArray, 1, "uint8-clamped")
 }
  var _make_int32_vector = function (top, argc) {
 		return __make_typed_vector(top,argc, Int32Array, 4 , "int32")
 }
  var _make_uint32_vector = function (top, argc) {
 		return __make_typed_vector(top,argc, Uint32Array , 4 , "uint32")
 }
  var _make_float32_vector = function (top, argc) {
 		return __make_typed_vector(top,argc, Float32Array, 4 , "float32")
 }
  var _make_float64_vector = function (top, argc) {
 		return __make_typed_vector(top,argc, Float64Array, 8 , "float64")
 }
 
 /*--------------------------
 bit-vectors
 ---------------------------------*/
var _BB = []; // set bits = 1 << b bits
var _XBB = []; // not _BB
var _MBB = [] ; // masks = _ONES << b bits
var _ONES  = 0xffffffff ;

function __init_bit_vectors()  {
	var i , k = 1;
	for( i= 0; i < 32; i++) { _BB.push(k); k *= 2; }
	for( i= 0; i < 32; i++)  _XBB.push( _ONES ^ _BB[i]) ; 
	_MBB[0] = _ONES;
	for( i=1; i< 32; i++) _MBB[i] = _MBB[i-1] << 1;
// console.log("MBB",_MBB);
}

function __make_bit_vector(n, init) {
	var length = (n >> 5) + 1 ; 
//console.log("BIT-V",n,length);
	var bytes = 4 ;
    var buffer = new ArrayBuffer (length * bytes);
    var aVector = new Vector(0) ;
    aVector.vector = new Uint32Array (buffer);
    aVector.buffer = buffer;
    aVector.type = "uint32" ; // dbg info
    if(init) // 0 is default
     for(var i=0 ; i < length ; i++)  aVector.vector[i] = init;
 	return aVector;
}

var _make_bit_vector = function (n) {
	n = checkInteger (n, "make-bit-vector");
	return __make_bit_vector(n,0);
	}
var _make_bit_vector_1 = function (n) {
	n = checkInteger (n, "make-bit-vector");
	return __make_bit_vector(n,_ONES);
	}
	
// sets if (proc) -> not false
var _make_initialized_bit_vector  = function (n, proc , env) {
 	var aVector =  __make_bit_vector(n, 0) ;
 	proc = checkProc(proc,1,1,"build-bit-vector");
 	var call = [proc, [null,null]], b,n,k, vector = aVector.vector ;
 	
 	for( b=0; b < n  ; b++) {
 		call[1][0] = b;
		if( __ffuncall(call,env)  !== _false) {
				k = b >> 5 ;
				vector[k] |= _BB[b - (k << 5)] ;
		}
	 } // lambda[1]

 	return aVector;
 }
 
 
var _bit_vector_ref = function (v , b) {
  	if(! (v instanceof Vector)) glisp_error(65,v,"bit-vector-ref");
	v = v.vector;
	var n = b >> 5 ;
	b -= (n << 5)  ;
	return (v[n] & _BB[b]) ? _true : _false;
}
var _bit_vector_set = function (v , b , value) {
  	if(! (v instanceof Vector)) glisp_error(65,v,"bit-vector-set");
	v = v.vector;
	var n = b >> 5 ;
	b -= (n << 5)  ;
	if(value === _false) v[n] &= _XBB[b] ; else v[n] |= _BB[b] ;
	return value; 
}
var _bit_vector_toggle = function (v , b ) {
	v = v.vector;
	var n = b >> 5 ;
	b -= (n << 5)  ;
	if ( v[n] & _BB[b] )  v[n] &= _XBB[b] ; else v[n] |= _BB[b] ;
	return (v[n] & _BB[b]) ? _true : _false; 
}

var _bit_vector_scan_1 = function (v , s) { // scan from s included
  	if(! (v instanceof Vector)) glisp_error(65,v,"bit-vector-scan");
	v = v.vector;
	var n = v.length  ;
	var i = s >> 5;
	s -= (i << 5);
	var mask = _MBB[s];
		
	if(v[i] & mask) {
		b = _bit_right(v[i] & mask);
		return (i << 5) + b;
	}
	i++ ;
	for (; i < n ; i++) {
		if(v[i] === 0) continue;
		b = _bit_right(v[i]);
		return (i << 5) + b;
		}
	return _false;
}

var _bit_vector_scan_0 = function (v , s) { // scan from s included
  	if(! (v instanceof Vector)) glisp_error(65,v,"bit-vector-scan");
	v = v.vector;
	var n = v.length  ;
	var i = s >> 5;
	s -= (i << 5);
	var mask = _MBB[s];
	var vi = v[i] ^ _ONES ;
		
	if(vi & mask) {
		b = _bit_right(vi & mask);
		return (i << 5) + b;
	}
	i++ ;
	for (; i < n ; i++) {
		vi = v[i] ^ _ONES ;
		if(vi === 0) continue;
		b = _bit_right(vi);
		return (i << 5) + b;
		}
	return _false;
}

// # of bits set, b <=n
var _bit_vector_count = function (v ,b) {
  	if(! (v instanceof Vector)) glisp_error(65,v,"bit-vector-count");
	v = v.vector;
	var n = v.length , i, j ;
	var ct = 0;
	j = b >> 5 ;
	for( i=0 ; (i < n) && (i < j) ; i++) 
		ct += _bit_count(v[i]) ;
		
	// last
	b -= (j << 5);
	for( i=0; i <= b ; i++)
		if( _BB[i] & v[j]) ct++;
	return ct;
}

// b such as bit-count-1(b) == n
var _bit_vector_xcount = function(v , n) {
  	if(! (v instanceof Vector)) glisp_error(65,v,"bit-vector-xcount");
  	v = v.vector;
  	var vl = v.length , b , i ;
  	var ct;
  		for( i=0 ; i < vl ; i++) {
				ct  = _bit_count(v[i]) ;
				if((n - ct) <= 0 ) break;
				n -= ct ;
				}
	// last
	for(b=0; b<32; b++) {
		if(_BB[b] & v[i]) n--;
		if(n <= 0) return (i << 5) + b ;
		}
	return _false;
	}
	
var _bit_vector_take = function (v , n) {
	var ret = [], p = 0;
	while (n--) {
		p = _bit_vector_scan_1 (v , p) ;
		if(p === _false) break;
		ret.push(p++);
		}
	return __array_to_list(ret) ;
}



/*-----------------------
 API
-------------------------*/

function boot_vlib () {
 	define_sysfun (new Sysfun('vlib.make-uint8-vector', _make_uint8_vector, 1,2));
 	define_sysfun (new Sysfun('vlib.make-uint8-clamped-vector', _make_uint8_clamped_vector, 1,2));
 	define_sysfun (new Sysfun('vlib.make-int32-vector', _make_int32_vector, 1,2));
 	define_sysfun (new Sysfun('vlib.make-uint32-vector', _make_uint32_vector, 1,2));
 	define_sysfun (new Sysfun('vlib.make-float32-vector', _make_float32_vector, 1,2));
 	define_sysfun (new Sysfun('vlib.make-float64-vector', _make_float64_vector, 1,2));
 	
 	__init_bit_vectors();
 	define_sysfun (new Sysfun('vlib.make-bit-vector', _make_bit_vector, 1,1));
 	define_sysfun (new Sysfun('vlib.make-bit-vector-1', _make_bit_vector_1, 1,1));
 	define_sysfun (new Sysfun('vlib.build-bit-vector', _make_initialized_bit_vector, 2,2)); 
 	define_sysfun (new Sysfun('vlib.bit-vector-set!', _bit_vector_set, 3,3));
 	define_sysfun (new Sysfun('vlib.bit-vector-ref', _bit_vector_ref, 2,2));
 	define_sysfun (new Sysfun('vlib.bit-vector-toggle', _bit_vector_toggle, 2,2));
 	define_sysfun (new Sysfun('vlib.bit-vector-scan-0', _bit_vector_scan_0, 2,2));
	define_sysfun (new Sysfun('vlib.bit-vector-scan-1', _bit_vector_scan_1, 2,2));
	
	define_sysfun (new Sysfun('vlib.bit-vector-count', _bit_vector_count, 2,2));
	define_sysfun (new Sysfun('vlib.bit-vector-xcount', _bit_vector_xcount, 2,2));
	define_sysfun (new Sysfun('vlib.bit-vector-take', _bit_vector_take, 2,2));


	_LIB["vlib.lib"] = true;
     writeln("🚲 vlib.lib V1.2","color:green") ;
	}
	
boot_vlib();

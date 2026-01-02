/*
Hash library
(C) G. Brougnard & Echolalie 2015
symbol.hash = { hash(key_1) : (key_1.value_1) , hash(key_2) : (key_2.value_2) ,, ...}

// functions names borrowed from :
http://docs.racket-lang.org/reference/hashtables.html#%28def._%28%28quote._~23~25kernel%29._make-hash%29%29
*/

function __hash (str) {
        var hash = 5381, i, c;
        var length = str.length;
        for (i = 0; i < length; i++) {
            c = str.charCodeAt(i);
            hash = ((hash << 5) + hash) + c; /* hash * 33 + c */
        }
        return hash;
    }
    
var _hash = function (obj) {
    return  (__hash (__hcode (obj))) & 0xffffff ;
}

/*
utils
var _prop_val_to_list = function (obj) 
function __prop_to_keys  (obj) 
*/

// obj = number|string|symb | list/cons of [number|string|symb]
// toJSON() proto  to implement in Vector,Symbol (DONE) , Complex at least
// toJSON() MUST NOT BE USED elsewhere from here (method jsonify is used in lisp->json)
// rem H('abc) != H("abc")
// "123" and 123  have diff H values

function __hcode(obj) { // --> str
	if(typeof obj === "string") return  obj;
	if(obj instanceof Symbol) return obj.name;
	if(typeof obj === "number") return '#' + obj;
	if(typeof obj === "function") return  obj.glfun.name ;
	if(Array.isArray(obj)) // a list : shorten it
			return JSON.stringify(__list_or_cons_to_array(obj)) ;
	return JSON.stringify(obj);
}

/*-------------
Hash objects
-------------------*/

function Hash () {
	this.hash = {} ; // format { hash-code : (key . val), ... }
	this.cache = null;
}

Hash.prototype.toString = function () {
	return  "#hash:"  + this.count();
}

Hash.prototype.count = function () {
var hash = this.hash, count= 0;
	for(var code in hash)
		 if (hash.hasOwnProperty(code) && hash[code] !== undefined) count++;
	return count;
}

Hash.prototype.toList = function (n) {
	return __array_to_list(__hash_to_array(this,n));
}

/*---------------
hash API
----------------------*/
var _make_hash = function () {
	return new Hash();
	}
	
var _hash_p = function (obj) {
	return (obj instanceof Hash) ? _true : _false;
	}
	
var _hash_count = function (hash) { 
	if(! (hash instanceof Hash)) glisp_error(123,hash,"hash-clear");
	return hash.count();
}
	
var _hash_clear = function (hash) { 
	if(! (hash instanceof Hash)) glisp_error(123,hash,"hash-clear");
	hash.hash = {} ;
	return hash ;
}

var _hash_set = function (hash, key, value) {
	if(! (hash instanceof Hash)) glisp_error(123,hash,"hash-set");
	if(key instanceof Vector ) key = new Vector (key.vector); // needs a dup
	hash.hash[__hcode(key)] = [key, value];
	return value ;
}
var _hash_remove = function (hash, key) {
	if(! (hash instanceof Hash)) glisp_error(123,hash,"hash-remove");
	hash.hash[__hcode(key)] = undefined;
	return hash;
}

var _hash_ref = function (hash, key) {
	if(! (hash instanceof Hash)) glisp_error(123,hash,"hash-ref");
	var value = hash.hash[__hcode(key)] ;
	return (value === undefined) ? _false : value[1] ;
}

var _hash_has_key = function (hash, key) {
	if(! (hash instanceof Hash)) glisp_error(123,hash,"hash-has_key?");
	var value = hash.hash[__hcode(key)] ;
	return (value === undefined) ? _false : _true ;
}

function __quickIsProc (obj) {
	if(obj instanceof Symbol && obj.fval) return obj.fval;
	if (typeof obj === "function") return obj ;
	if(isLambda(obj)) return obj;
	return false;
}

var _hash_ref_set = function (self,env) {
self = self[1];
	var hash = __eval (self[0],env); self = self[1];
	var key = __eval (self[0],env);  self = self[1];
	var expr = self[0] ;
	var code,value,arg; 
	
	if(! (hash instanceof Hash)) glisp_error(123,hash,"hash-ref");
	_CONTEXT = "hash-ref" ; // useful before hairy __funcall
	hash = hash.hash ;
	code = __hcode(key);
	value =  hash[code] ;
	if (value === undefined)  {
				proc = __quickIsProc(expr) ;
				if (proc) {
					 arg = Array.isArray(key) ? key : [key, null] ;
					 value = __ffuncall([proc, arg], env);
					 }
				else value = __eval(expr,env) ;
				hash[code] = [key , value];
				return value ;
				}
	return value[1];
}

var _hash_to_list = function (hash) {
	if(! (hash instanceof Hash)) glisp_error(123,hash,"hash->list");
	return __array_to_list(__hash_to_array(hash));
}

// internal : used in (for ((h H)) ...) && hash-make-index
function __hash_to_array (hash, limit) {
	limit = limit || 666666 ;
	hash= hash.hash ;
	var ret = [] , count = 0 ;
	var kval;
	for(var code in hash) 
		 if (hash.hasOwnProperty(code)) {
		 	 kval = hash[code] ;
		 	if(kval !== undefined)  ret.push(hash[code]) ;
		 	 if(--limit <=  0) break;
		 	 }
	return ret ;
}

function _hash_get_key (hash, value) { // returns first hit
if (! (hash instanceof Hash)) glisp_error(123,hash,"hash-get-key");
	hash= hash.hash ;
	var kval;
	for(var code in hash) 
		 if (hash.hasOwnProperty(code)) {
		 	 kval = hash[code] ;
		 	 if (__equal(kval[1],value)) return kval[0];
		 	 }
	return _false ;
}

function _hash_get_keys (hash, value) { // return all
if (! (hash instanceof Hash)) glisp_error(123,hash,"hash-get-key");
	hash= hash.hash ;
	var kval, ret = [] ;
	for(var code in hash) 
		 if (hash.hasOwnProperty(code)) {
		 	 kval = hash[code] ;
		 	 if (__equal(kval[1],value)) ret.push( kval[0]);
		 	 }
	return __array_to_list (ret);
}


var _list_to_hash = function (list , hash) {
	if (! (hash instanceof Hash)) glisp_error(123,hash,"list->hash");
	if (notIsList (list)) glisp_error(20,list,"list->hash");
	var hashes = hash.hash ;
	var keyval ;
	while(list) {
		keyval = list[0];
		if(! Array.isArray(keyval) || (keyval[1] === undefined))
					glisp_error(124,keyval,"list->hash");
		hashes[__hcode(keyval[0])] = keyval ;
		list = list[1];
	}
	return hash;
}

var _hash_keys = function (hash) {
	if (! (hash instanceof Hash)) glisp_error(123,hash,"hash-keys");
	hash =hash.hash;
	var code, ret= [];
		for(code in hash) 
		 if (hash.hasOwnProperty(code)) 
		 	    ret.push(hash[code][0]);
	return __array_to_list(ret);
}

var _hash_values = function (hash) {
	if (! (hash instanceof Hash)) glisp_error(123,hash,"hash-values");
	hash =hash.hash;
	var code, ret= [];
		for(code in hash) 
		 if (hash.hasOwnProperty(code)) 
		 	ret.push(hash[code][1]);
	return __array_to_list(ret);
}

// map proc (key value)
var _hash_map = function (hash, proc, env) {
	if(! (hash instanceof Hash)) glisp_error(123,hash,"hash-map");
	hash= hash.hash ;
	var ret = [] , keyval;
	proc = checkProc(proc,2,2,"hash-map");
	_CONTEXT = "hash-map" ;
	var call = [proc, [null ,[null , null]]] ;
		for(var code in hash) 
		 if (hash.hasOwnProperty(code)) {
		 	keyval = hash[code];
		 	call[1][0] = keyval[0] ;
		 	call[1][1][0] = keyval[1] ;
		 	ret.push(__ffuncall(call, env));
		 }
	return __array_to_list(ret);
}

var _hash_for_each = function (hash, proc, env) {
	if(! (hash instanceof Hash)) glisp_error(123,hash,"hash-for-each");
	proc = checkProc(proc,2,2,"hash-for-each");
	hash= hash.hash ;
	var  keyval;
	var call = [proc, [null ,[null , null]]] ;
	
		for(var code in hash) 
		 if (hash.hasOwnProperty(code)) {
		 	keyval = hash[code];
		 	call[1][0] = keyval[0] ;
		 	call[1][1][0] = keyval[1] ;
		 	__ffuncall(call, env) ;
		 }
	return __void;
}

var _hash_code = function (obj) {
	return __hcode(obj);
}

/*-----------------
iteration
compile me NYI NYI
-----------------------*/
var _hash_make_index = function (hash) { // -> count or #f
	if(! (hash instanceof Hash)) glisp_error(123,hash,"hash-make-index");
	hash.cache = __hash_to_array(hash);
	return hash.cache.length || _false;
}

var _hash_index_key = function (hash , index) {
	if(! (hash instanceof Hash)) glisp_error(123,hash,"hash-index_key");
	var cache = hash.cache;
	if(cache === null) glisp_error(125,hash,"hash-index-key");
	if (index >= cache.length) glisp_error(42,index,"hash-index-key");
	return cache[index][0];
}

var _hash_index_value = function (hash , index) {
	if(! (hash instanceof Hash)) glisp_error(123,hash,"hash-index-value");
	var cache = hash.cache;
	if(cache === null) glisp_error(125,hash,"hash-index-value");
	if (index >= cache.length) glisp_error(42,index,"hash-index-value");
	return cache[index][1];
}

/*
(define H (make-hash))
(list->hash '((a . 45) (b . 675) (c . "bol")) H)
(hash-for-each H writeln)  
(define (wh k v) (writeln k '--> v) v)
(hash-map H wh)
*/

/*---------------
hash library
-------------*/

function hash_boot() {
		define_sysfun (new Sysfun('hash.make-hash', _make_hash,0,0)); // new hash 
		define_sysfun (new Sysfun('hash.hash?', _hash_p,1,1)); // predicate
		define_sysfun (new Sysfun('hash.hash', _hash,1,1)); // object -> [0...2^32-1]
		
		define_sysfun (new Sysfun('hash.hash-clear!', _hash_clear,1,1)); // (hash)
		define_sysfun (new Sysfun('hash.hash-count', _hash_count,1,1)); // (hash)
		define_sysfun (new Sysfun('hash.hash-set', _hash_set,3,3)); // (hash key value) -> val
		define_sysfun (new Sysfun('hash.hash-has-key?', _hash_has_key,2,2)); // (hash key)
		define_sysfun (new Sysfun('hash.hash-ref', _hash_ref,2,2)); // (hash key )
		define_sysfun (new Sysfun('hash.hash-get-key', _hash_get_key,2,2)); // (hash value )
		define_sysfun (new Sysfun('hash.hash-get-keys', _hash_get_keys,2,2)); // (hash value )
		define_special (new Sysfun('hash.hash-ref!', _hash_ref_set,3,3)); // (hash key to-eval )
		define_sysfun (new Sysfun('hash.hash-remove!', _hash_remove,2,2)); // (hash key)
		define_sysfun (new Sysfun('hash.hash-map', _hash_map,2,2)); // (hash proc:2:2)
		define_sysfun (new Sysfun('hash.hash-for-each', _hash_for_each,2,2)); // (hash proc:2:2)
		define_sysfun (new Sysfun('hash.hash->list', _hash_to_list,1,1)); // (hash)
		define_sysfun (new Sysfun('hash.list->hash', _list_to_hash,2,2)); // (list hash)
		
		define_sysfun (new Sysfun('hash.hash-keys', _hash_keys,1,1)); // -> list
		define_sysfun (new Sysfun('hash.hash-values', _hash_values,1,1)); // -> list
		
	define_sysfun (new Sysfun('hash.hash-make-index', _hash_make_index,1,1)); // (hash )
	define_sysfun (new Sysfun('hash.hash-index-value', _hash_index_value,2,2)); // (hash index)
	define_sysfun (new Sysfun('hash.hash-index-key', _hash_index_key,2,2)); // (hash index)

// internal
		define_sysfun (new Sysfun('hash-code', _hash_code,1,1));  // (key) -> string
		
		if(_LIB["types.lib"]) define_type ("Hash",null,_hash_p,true);
		
		_LIB["hash.lib"] = true;
		writeln("hash.lib v1.3 ® EchoLisp","color:green");
		}
		
hash_boot();

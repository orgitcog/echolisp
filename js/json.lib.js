/*
JSON API
vocabulary : 
JSObject  = something imported from JSON string
JSObject  = encapsulates javascript object 
*/

/*
JSObject class 
*/
function JSObject ( obj) {
	this.obj = obj ;
}

JSObject.prototype.toString = function () {
	return "#[jsObject]" ;
	}
	

/*----------------
predicate
------------------*/
var _jsonp = function (obj) {
	return (obj instanceof JSObject) ? _true : _false;
}


// checks plist well formed - accepts ( a . val) or ( a val ..) as pair
// needs the reverse NYI
var _lisp_plist_to_JSObject = function (plist) {
 var pair,key,value, obj = {} ;
 	if(notIsList(plist)) glisp_error(91,plist,"make-json");
 	while(plist) {
 		pair = plist[0];
 		if(! Array.isArray(pair)) glisp_error(91,pair,"make-json");
 		key = nameToString(pair[0],"make-json");
 		if(Array.isArray(pair[1])) // (key value)
 				value = pair[1][0];
 			else
 				value = pair[1] ; // (key . value )
 		obj[key] = __lisp_to_json(value,"make-json") ;
 		plist = plist[1];
 		}
 	return new JSObject(obj);
 }
 
// DEPRECATED
var _JSObject_to_lisp_plist = function (jsObject) {
var lst = null , keys , key, val ,lg , i, obj;
	if(!(jsObject instanceof JSObject)) glisp_error(88,jsObject,"json->plist") ;
	obj = jsObject.obj;
	keys = Object.keys(obj);
	lg  = keys.length ;
		for(i=0; i< lg; i++) {
			key =keys[i] ;
			val = __json_to_lisp (obj[key],"json->plist") ;
		  	lst = [[key , [ val , null]] , lst] ;
		  	}
	return _reverse (lst) ;
}

var _JSObject_to_hash = function (jsObject) {
	if(! _LIB["hash.lib"]) glisp_error(70,"hash.lib","json->hash");
	if(!(jsObject instanceof JSObject)) glisp_error(88,jsObject,"json->hash") ;
	
	var hash = new Hash();
	var  keys , key, val ,lg , i, obj;
	
	obj = jsObject.obj;
	keys = Object.keys(obj);
	lg =  keys.length ;
		for(i=0; i< lg; i++) {
			key =keys[i] ;
			val = __json_to_lisp (obj[key],"json->hash") ;
		  	hash.hash[__hcode(key)] = [key, val];
		  	}
	return hash ;
}

var _JSObject_to_lisp_struct = function (jsObject, meta) {
	if(!(jsObject instanceof JSObject)) glisp_error(88,jsObject,"json->struct") ;
	if(!(meta instanceof MetaStruct)) glisp_error(134,jsObject,"json->struct") ;
	var keys = meta.slots, i , key, val, slots = [] ; // js array
	obj = jsObject.obj;
	
	for (i=0; i< keys.length; i++) {
			key = keys[i];
			val = obj[key];
			if(val === undefined) glisp_error(92,key,"json->struct:missing json key");
			slots.push (__json_to_lisp (val,"json->struct")) ;
		  	}
	return new Struct(meta, slots);
}
 

var _lisp_to_JSObject = function ( globject, env) {
	return new JSObject (__lisp_to_json(globject, "")) ;
}
	
var _JSObject_to_lisp = function ( jsObject , env) {
	if(!(jsObject instanceof JSObject)) glisp_error(88,jsObject,"json->lisp") ;
	return __json_to_lisp (jsObject.obj, "" ) ;
}
	
	
/*
json-import from JSON-string to Lisp object
*/
var _json_string_to_lisp = function (str) {
	var obj ;
	if(! (typeof str === "string")) glisp_error(51,str,"json-import") ;
	try {
	return __json_to_lisp (JSON.parse(str),"json-parse");
	}
	catch(err) {
	writeln("JSON error: " + err.name + " : " + err.message,"color:orange") ;
	return _false ;
	}
}

var _json_string_to_JSObject = function (str) {
	var obj ;
	if(! (typeof str === "string")) glisp_error(51,str,"string->json") ;
	try {
	return new JSObject(JSON.parse(str));
	}
	catch(err) {
	writeln("JSON error: " + err.name + " : " + err.message,"color:orange") ;
	return _false ;
	}
}

/* -------------
get all keys and subkeys into list of names type
-----------------------*/
// (json-types (json-import "{ \"name\" : 6777 , \"array\" : [ 1, 2,33] , \"age\" : { \"foo\" : 6777 , \"gee\" : true } }")) 

function __js_types (obj) {
	var lst = null , keys , name , val ,lg , i ,_instanceof ;
	if((obj === false) || (obj === true)) return _boolp ;
	if(typeof obj === "number") return _numberp;
	if(typeof obj === "string") return _stringp;
	if(obj === null) return _nullp;
	if(Array.isArray(obj)) return _vectorp;
	
	if(typeof obj === "object" ) {
		_instanceof = obj._instanceof ;
		if(_instanceof)
		switch (_instanceof) {
					case "Rational" : return _rationalp;
					case "Complex" : return complexp ;
					case "Symbol" : return _symbolp ;
					case "List" : return _pairp ;
					default : glisp_error(89,_instanceof,"json-types");
					}
	
		keys = Object.keys(obj) ;
		lg = keys.length ;
		for(var i = 0 ; i < lg; i++) {
			name = keys[i] ;
			val = obj[name];
			lst = [[name , [__js_types(val) , null]] , lst] ;
			}
		return _reverse (lst );
		} 
	return "json-unknown-type" ;
}


/* -------------
get all keys  into list of names
-----------------------*/

function __js_keys (obj) {
	var lst = null , keys = Object.keys(obj) , lg = keys.length , i ;
	for(var i = 0 ; i < lg; i++) {
		lst = [keys[i] , lst] ;
	}
	return _reverse (lst );
}

// first level keys
var _json_keys = function (jsObject) {
	if(!(jsObject instanceof JSObject)) glisp_error(88,jsObject,"json-keys") ;
	return __js_keys (jsObject.obj) ;
}

var _json_types = function (jsObject) {
	if(!(jsObject instanceof JSObject)) glisp_error(88,jsObject,"json-types") ;
	return __js_types (jsObject.obj) ;
}

/*
(json-get jsObject key)
return raw data or JSObject or Vector
*/

var _json_get = function (jsObject , key) {
	if(!(jsObject instanceof JSObject)) glisp_error(88,jsObject,"json-get") ;
	var val, keys, lg,i;
	
	if(Array.isArray(jsObject.obj)) {
			if (!isJSInteger (key)) glisp_error(61,key,"json-get") ;
			val  = jsObject.obj[key] ;
			return __json_to_lisp (val , key);
			}
			
		key = nameToString(key,"json-get") ;
		
		// composite key = name.other.another
		if(key.indexOf(".") !== -1) {
			keys = key.split(".");
			lg = keys.length ;
			val = jsObject.obj[keys[0]] ;
			if(val === undefined)  glisp_error(92,keys[0],"json-get") ;
			for(i= 1; i < lg ; i++) {
				val = val[keys[i]] ;
				if(val === undefined)  glisp_error(92,keys[i],"json-get") ;
				}
			} // composite key
			
			else
			val = jsObject.obj[key] ;
//console.log("GET VAL",val);
	return __json_to_lisp (val , key);
}

/*
(json-put jsObject key val)
change, or add new key
return #t
*/

var _json_put = function (jsObject , key , val) {
	var  keys, lg,i;
	
	val = __lisp_to_json (val , "json-put") ;
	if(jsObject instanceof  Vector) {
			if (!isJSInteger (key)) glisp_error(61,key,"json-put") ;
			jsObject.vector[key]  = val ;
			return _true;
			}
			
		if(!(jsObject instanceof JSObject)) glisp_error(88,jsObject,"json-put") ;
		key = nameToString(key,"json-put") ;
		
		// composite key = name.other.another
		if(key.indexOf(".") !== -1) {
			keys = key.split(".");
			lg = keys.length ;
			obj = jsObject.obj[keys[0]] ;
			if(obj === undefined) glisp_error(92,keys[0],"json-put") ;
			for(i= 1; i < lg -1 ; i++) {
				obj = obj[keys[i]] ;
				if(obj === undefined) glisp_error(92,keys[i],"json-put") ;
				}
			obj[keys[lg-1]] = val;
			return _true;
			} // composite key
		
		jsObject.obj[key] = val ;
	return _true;
} // json put

/*--------------
export-json (serialize)
---------------------------*/
var _lisp_to_json_string = function (obj) {
	try {
		return _JSObject_to_string (_lisp_to_JSObject (obj)) ;
		}
	catch(err) {
	writeln("JSON error: " + err.name + " : " + err.message,"color:orange") ;
	return _false ;
	}}


/* 
JSOBject -> string
*/
var _JSObject_to_string = function  (jsObject) {
	if(jsObject instanceof  Vector)    return JSON.stringify(jsObject.vector);
	if(!(jsObject instanceof JSObject)) glisp_error(88,jsObject,"json->string") ;
	return JSON.stringify(jsObject.obj);
}

function boot_json() { 
 	define_sysfun(new Sysfun ("json.json?",_jsonp,1,1));
 	// dyslexie
 	define_sysfun(new Sysfun ("json.import-json",_json_string_to_lisp,1,1));
 	define_sysfun(new Sysfun ("json.json-export",_lisp_to_json_string,1,1));

 	define_sysfun(new Sysfun ("json.json-import",_json_string_to_lisp,1,1));
 	// serialize
 	define_sysfun(new Sysfun ("json.export-json",_lisp_to_json_string,1,1));

// js objects
 	define_sysfun(new Sysfun ("json.make-json",_lisp_plist_to_JSObject,1,1));
 	define_sysfun(new Sysfun ("json.json->plist",_JSObject_to_lisp_plist,1,1)); // deprecated
 	define_sysfun(new Sysfun ("json.json->hash",_JSObject_to_hash,1,1));
 	define_sysfun(new Sysfun ("json.json->struct",_JSObject_to_lisp_struct,2,2)); // (obj Meta)
 	define_sysfun(new Sysfun ("json.json-keys",_json_keys,1,1));
 	define_sysfun(new Sysfun ("json.json-types",_json_types,1,1));
 	define_sysfun(new Sysfun ("json.json-get",_json_get,2,2));
 	define_sysfun(new Sysfun ("json.json-put",_json_put,3,3));
 	
// internal
 	define_sysfun(new Sysfun ("json.string->json",_json_string_to_JSObject,1,1));
 	define_sysfun(new Sysfun ("json.json->string",_JSObject_to_string,1,1));
 	
 	define_sysfun(new Sysfun ("json.lisp->json",_lisp_to_JSObject,1,1));
 	define_sysfun(new Sysfun ("json.json->lisp",_JSObject_to_lisp,1,1));
 	
 	
  _LIB["json.lib"] = true;
  writeln("json.lib v1.3 ® EchoLisp","color:green");
 }
 
 boot_json();
/*
JSON API
vocabulary : jsobj = EchoLisp jason object

jsobj  === javascript object (but not an array !!!) , but may include (js) arrays

*/

/*
json? -> js object
*/
var _json_p = function (obj) {
	return (typeof obj === "object")
		   && ! (Array.isArray (obj))
		   && ! (obj instanceof Symbol)
		   && ! (obj instanceof Formal)
		   && ! (obj instanceof Stream)  && ! (obj instanceof NumStream)
		   && ! (obj instanceof Struct)
		   && ! (obj instanceof MetaStruct)
		   && ! (obj instanceof GLEnv)
		   && ! (obj instanceof Promise)
		   && ! (obj instanceof Box)
		   && ! (obj instanceof Date)
		   && ! (obj instanceof File) ? _true : _false ;
}

/*
json-import string
*/

var _json_import = function (str) {
	var obj ;
	if(! (typeof str === "string")) glisp_error(xx,str,"string->json") ;
	try {
	obj = JSON.parse(str);
	if( array.isArray(obj)) return new Vector(obj);
	return obj ; // json obj, or null,number,string..
	}
	catch(err) {
	writelen("JSON error: " + err.name + " : " + err.message,"color:orange") ;
	return _false ;
	}
}

/*
(json-get jsobj key)
	get value 
		translates js array -> Vector
		translates false,true
		
(json-get-date jsobj key) -> (date (json-get jsobj key))
*/
var _json_get = function (obj , key) {
	key = nameToString(key,"json-get") ;
}

function boot_json() { 
 	define_sysfun(new Sysfun ("json.json?",_json_p,1,1));
 	define_sysfun(new Sysfun ("json.json-import",_json_import,1,1));
 	define_sysfun(new Sysfun ("json.json-get",_json_get,2,2));
  _LIB["json.lib"] = true;
 }
 
 boot_timer();
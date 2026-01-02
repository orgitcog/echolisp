/*-----------------------
local data base
--------------------------------*/



const _KEY_LOCAL_DB = "ECHO_LOCAL_DB";
var _LOCAL_DB = null; // always in memory and up to date
var _LOCAL_VERBOSE = false;

function __local_error(msg, obj) {
	 obj =  (obj) ?  glisp_tostring(obj," : ") : "" ;
	 writeln("📕 local-db: " + msg  + obj, "color:red");
	 return null;
}
function __local_warning(msg, obj) {
	 obj =  (obj) ? glisp_tostring(obj," : ") : "" ;
	 writeln("📙 local-db: " + msg  + obj, "color:#cc6633");
}
function __local_message(msg, obj) {
	 obj =  (obj) ? glisp_tostring(obj," : ") : "" ;
	 writeln("📗 local-db: " + msg + " " + obj, "color:green");
}

/*--------------------------------
NO LISP - NO LISP  -
-----------------------------------------*/
function __local_save_db () {
		localStorage.setObj (_KEY_LOCAL_DB,_LOCAL_DB);
		}
		
/*-------------
DB root object
---------------------*/

// create
// sets  new {_LOCAL_DB} if needed
function __local_create_db () {
	_LOCAL_DB = localStorage.getObj(_KEY_LOCAL_DB);
	if( _LOCAL_DB === null) {
		_LOCAL_DB = {version : -3 , stores : []  };
		__local_make_store("system");
		__local_make_store("user");
		__local_make_store("words");
		__local_make_store("reader");
		__local_make_store("info");
		__local_save_db () ;
		__local_message("create db");
		}
		else
		if(! __store_p ("info")) __local_make_store("info") ; // 2.8 upgrade
	__local_message("db.version: " + _LOCAL_DB.version);
	__local_save_db();
}

function __store_p(name) { // predicate
	return (_LOCAL_DB.stores.indexOf(name) >= 0 );
}

// A store is an array of [values] + index =  array of [keys]
// values are json.stringified jsObjects
// these jsObjects are glisp_jsonify of lisp objects

// returns name or false
function __local_make_store(name,verbose) {
	if(__store_p (name)) {
			if(verbose) __local_warning("store already exists",name);
			return false;
			}
	localStorage.setObj("STORE_" + name, []);
	localStorage.setObj("STORE_IDX_" + name, []);
	localStorage.setObj("STORE_AUTO_" + name, 1);
	_LOCAL_DB.stores.push(name);
	_LOCAL_DB.version++ ;
	__local_save_db () ;
	return name;
}

function __local_autoincrement(store, numkey) {
	var autoname = "STORE_AUTO_" + store ;
	var auto = localStorage.getObj(autoname);
	if(auto === null) auto = 1;
	auto = Math.max(auto,numkey) ;
	localStorage.setObj(autoname,auto+1);
	return numkey || auto;
}

// returns name or false
function __local_delete_store(name) {
	if(! __store_p (name)) return false;
	localStorage.removeItem("STORE_" + name);
	localStorage.removeItem("STORE_IDX_" + name);
	_LOCAL_DB.stores.splice(_LOCAL_DB.stores.indexOf(name),1);
	_LOCAL_DB.version++ ;
	__local_save_db();
	return name;
	}
	
// local_delete a (key value)
function __local_delete(key, store) {
var     indexes,items,numitems,i;
	if(! __store_p (store)) return __local_error("local-delete:unknown store",store);
		items = localStorage.getObj("STORE_" + store); 
		indexes = localStorage.getObj("STORE_IDX_" + store);
		numitems = items.length;
	
		for(i=0;i<numitems;i++) 
			if(indexes[i] === key) {
				items.splice(i,1);
				indexes.splice(i,1);
				localStorage.setObj("STORE_" + store, items);
				localStorage.setObj("STORE_IDX_" + store, indexes);
				return true;
				}
		return __local_warning("delete:unknown key",key) ;
	}

	
// put replaces if found
// returns key or null
// __local_add is adding = true
function __local_put(key,obj,store,adding) {
var     indexes,items,numitems,i;
		if(! __store_p (store)) return __local_error("local-put:unknown store",store);
		// // BRINGS back the whole store in MEMORY !!!
		items = localStorage.getObj("STORE_" + store); 
		indexes = localStorage.getObj("STORE_IDX_" + store);
		numitems = items.length;
	
		for(i=0;i<numitems;i++) 
			if(indexes[i] === key) {
			 	if(adding) {
			 			__local_error("add:duplicate key",key);
			 			return null;
			 			}
			 items[i] = obj; break;
			 }
	
		if(i >= numitems)  { indexes.push(key) ; items.push (obj); }
// console.log("local-put",i,numitems,key,obj);
	localStorage.setObj("STORE_" + store, items);
	localStorage.setObj("STORE_IDX_" + store, indexes);
	return key;
}

// returns jsObject or undefined
function __local_get(key,store) {
var     indexes,items,numitems,i;
		if (! __store_p (store)) {
					 __local_error("local-get:unknown store",store);
					 return undefined;
					 }
		items = localStorage.getObj("STORE_" + store);
		indexes = localStorage.getObj("STORE_IDX_" + store);
		numitems = items.length;
		for(i=0;i<numitems;i++) {
			if(indexes[i] === key) return  items[i] ; 
		}
	if(_LOCAL_VERBOSE)
		__local_error("Undefined key",store +"." + key);
	return undefined ;
}

// returns a js array , may be empty
function __local_keys(store) { 
var indexes ;
	if (! __store_p (store)) {
			 __local_error("local-symbols:unknown store",store);
			 return [] ;
			 }
	indexes  = localStorage.getObj("STORE_IDX_" + store);
	return indexes ;
}

/*--------------------
INTERMEDIATE LEVEL
--------------------------*/
/*----------------
_local_get_value (is mute)
input : name string [, store]
returns : null or value (unjsonified) - may return a Definition...
----------------------*/

//function _local_get_value (key,store) {
var _local_get_value = function (top, argc) {
var key = _stack[top++] ;
var store = (argc > 1) ? nameToString(_stack[top],"local-get-value (store)") : "user" ;
var value;

	if(! isSmallInteger(key)) key =   nameToString(key,"local-get-value");
	value = __local_get(key,store);
	
  	if(value === undefined) return null ;
	return  glisp_unjsonify(value);
}

/*-------------------
_local_put_value (key, value [store]
return null or key
---------------------------*/
var _local_put_value = function (top, argc) {
var key = _stack[top++] ;
var value = _stack[top++];
var store = (argc > 2) ? nameToString(_stack[top],"local-put-value") : "user" ;

	if (isSmallInteger (key)) key = __local_autoincrement (store,key) ;
	else
		key = nameToString(key,"local-put-value");
	if(key === "auto" || key === "#:auto")
	   key = __local_autoincrement (store,0) ;
	
	value = glisp_jsonify(value);
	return __local_put(key,value,store); // returns key or null
}
/*-------------------
_local_add_value (key, value [store]
return null or key
---------------------------*/
var _local_add_value = function (top, argc) {
var key = _stack[top++] ;
var value = _stack[top++];
var store = (argc > 2) ? nameToString(_stack[top],"local-add-value") : "user" ;

	if (isSmallInteger (key))
		key = __local_autoincrement (store,key) ;
	else
		key = nameToString(key,"local-add-value");
	if(key === "auto" || key === "#:auto")
	   key = __local_autoincrement (store,0) ;
	
	value = glisp_jsonify(value);
	return __local_put(key,value,store,true); // returns key or null
}

/*-------------------
local-delete (store is mandatory)
---------------------*/
var _local_delete = function(key, store) {
	store = nameToString(store,"local-delete") ;
	if(! isSmallInteger(key))
			key = nameToString(key,"local-delete") ;
	return __local_delete(key,store) ? _true : _false; 
}


/*--------------------
LISP part
----------------------------*/
var _local_keys = function (top,argc) {
	var store = (argc === 1) ? nameToString(_stack[top]) : "user" ;
	var keys = __local_keys(store).splice(0) ;
	keys.sort (__set_cmp);
	return __array_to_list(keys) ;
}

var _local_symbol_p = function (name) {
	name = nameToString(name,"local-symbol?");
	var store =  packName(name) || "user" ;
	var key = simpleName(name) ;
	var keys = __local_keys(store) ;
	return  (keys.indexOf(key) < 0) ? _false : _true;
}

// (local-stores [search-string])
var _local_stores = function (top,argc) {
if(argc === 0)
	return __array_to_list(_LOCAL_DB.stores) ;
var str = nameToString(_stack[top],"local-stores");
var i, stores = [];
	for(i= 0; i < _LOCAL_DB.stores.length; i++)
		if(_LOCAL_DB.stores[i].indexOf(str) >= 0) stores.push(_LOCAL_DB.stores[i]);
	return __array_to_list(stores) ;
}

// put SYMB value into local store
// returns null  if op failed
// returns symb if OK, else null

var _local_add = function(symb,env) {
	return _local_put(symb,env,true);
}
var _local_put = function (symb,env, checkadd) {
var key, idef, store  ;
	if(!(symb instanceof Symbol)) glisp_error(35,symb,"local-put");
	var store =  packName(symb.name) || "user" ;
	key = simpleName(symb.name) ;
	
	if(checkadd && __local_keys(store).indexOf(key) >= 0)
		glisp_error(100,key,"local-add") ;
	
	// compute object value (get its string if function) 
	// null is ok
	idef = glisp_find_def(symb) ; // a Definition object
	if(idef) {
			 value = idef; 
			 }
		else
			{
			value =  glisp.user.get (symb.name) ;
			if(value === undefined)  glisp_error(17,symb,"local-put");
			}
			
		value =  glisp_jsonify(value); 
		return __local_put(key,value,store) ? symb : null ;
} // local-put

// _local_get (symb [ success [ error]])
// returns NULL if unknown

var _local_get = function (top, argc , env) {
var symb = _stack[top++] ;
var onsuccess = (argc > 1) ? _stack[top++] : null ;
var onerror = (argc > 2) ?  _stack[top] : null;
	if(!(symb instanceof Symbol)) glisp_error(35,symb,"local-get");
	// check proc here NYI NYI NYI
	return _local_get_symb(symb,onsuccess,onerror,env); // or null
	}

// input symbol or name
// creates symbol
// SETS! symbol to value or null
// returns value or null
// does also work for procs 

function _local_get_symb  (name,onsuccess_proc,onerror_proc,env) { 
var symb,store,key ,value, space = glisp.user ;
	name = nameToString(name,"local-get-symb");
	store =  packName(name) || "user" ;
	key = simpleName(name);
	value = __local_get(key,store);
	symb = new Symbol(name);
// .log("local-get",onsuccess_proc,onerror_proc);
  		if(value === undefined) {
			if (_LOCAL_VERBOSE)  __local_warning("local-get:unknown symbol: " + name);
			if(onerror_proc) 
  			__ffuncall([onerror_proc, [symb, [ _false ,null]]], env);
  			space.set(name,null);
			return null;
	 		 }
	 		 
	 	value = glisp_unjsonify(value);
	 	if (value instanceof Definition) {
	 		 __compile_db_definition (value , store) 
	 		value = symb;
	 		}
	 	else
  			space.set(name,value); // bind
  		
  	if(onsuccess_proc) 
  			__ffuncall([onsuccess_proc, [symb , [value, null]]], env);
  	return  value;
}


/*-----------------------
_local_put_proc
input proc name or symb
returns name or null
-----------------------------*/
function _local_put_proc(name) {
		name = nameToString(name,"local-put-proc");
		var store = packName(name) || "user" ;
		var key = simpleName(name);
		var aDefinition = glisp_find_def(name) ;
		if(! aDefinition) return null;
		aDefinition = glisp_jsonify(aDefinition);
console.log("put-proc",name,aDefinition);
		return __local_put(key,aDefinition,store); // name or null
}

/*-----------------------
_local_get_proc
input proc name or symb
returns  compiled proc symbol or null
side effect : push this def in glisp.defs
-----------------------------*/

function _local_get_proc(name) {
		name = nameToString(name,"local-get-proc");
		var store = packName(name) || "user" ;
		var key = simpleName(name);
		var aDefinition = __local_get (key,store) ;
		if(! aDefinition) return null;
		aDefinition = glisp_unjsonify(aDefinition);
		if(! (aDefinition instanceof Definition)) return null;
		return  __compile_db_definition (aDefinition , store) ; // a symb
}


var _local_make_store = function (store) {
	store = nameToString(store,"make-store");
	return __local_make_store(store,true) || _false ; // verbose
}
var _local_delete_store = function (store) {
	store = nameToString(store,"delete-store");
	if(["user","system","words","reader","info","notebook"].indexOf(store) >= 0) {
		__local_warning("Cannot delete: " + store);
		return _false;
	}
	return __local_delete_store(store) || _false;
}

var _local_verbose = function (top, argc) {
	if(argc > 0)
		_LOCAL_VERBOSE = ( _stack[top] === _false ) ? false : true;
	return (_LOCAL_VERBOSE) ?  _true : _false ;
}


/*------------------
PACKAGES
(save-package name)
(load-package name)
--------------------------*/

var _save_package = function (store) {
var i,name,symb,symbs = _Symbols.length, qualif  ;
var saved = [];
	store = nameToString(store,"save-package");
	if(["user","system","words","reader","info"].indexOf(store) >= 0) {
		__local_warning("Cannot save: " + store);
		return null;
	}
	qualif = store + '.' ;
	__local_make_store(store,false); // mute
	
	for(i=0;i<symbs;i++) {
		symb = _Symbols[i] ;
		name = symb.name;
		if(!(name.indexOf(qualif) === 0)) continue;
		
		if (glisp.user.get(name) !== undefined && symb.fval === null) { // a symb
			_local_put(symb);
			saved.push(symb);
			}
		else if (_local_put_proc(symb)) { // aproc
				saved.push(symb);
				}
	}
	return __array_to_list(saved);
}

var _load_package = function (store) {
var i, keys, numkeys, symb ,symbs = [], qualif ;
	store = nameToString(store,"load-package");
	if(["user","system","words","reader","info"].indexOf(store) >= 0) {
		__local_warning("Cannot load: " + store);
		return null;
	}
	qualif = store + '.' ;
	keys = __local_keys(store) ; // js array of strings
	if(!keys || keys.length === 0) return null;
	
	numkeys = keys.length;
	for(i=0;i< numkeys;i++) {
		symb = new Symbol(qualif+keys[i]);
		if( _local_get_proc(symb) || _local_get_symb(symb))
			symbs.push(symb);
		}
	return __array_to_list(symbs);
}

function boot_local() {
	define_sysfun(new Sysfun('local-verbose', _local_verbose, 0,1)); 
	define_sysfun(new Sysfun('local-keys', _local_keys, 0,1)); 
	define_sysfun(new Sysfun('local-symbol?',_local_symbol_p, 1,1)); // (local-symbol? 'foo.gee)
	define_sysfun(new Sysfun('local-stores', _local_stores, 0,1)); 
	define_sysfun(new Sysfun('local-make-store', _local_make_store, 1,1)); 
	define_sysfun(new Sysfun('local-delete-store!', _local_delete_store, 1,1)); 

	// local_put,get use qualified symbols [store.]name
	define_sysfun(new Sysfun('local-put', _local_put, 1,1)); // (put 'symbol) or qualified symbol
	define_sysfun(new Sysfun('local-add', _local_add, 1,1)); // (add 'symbol) or qualified symbol
	define_sysfun(new Sysfun('local-get', _local_get, 1,3)); // (get 'symbol [success [error])
	
	// save store.* symbs
	define_sysfun(new Sysfun('save-package', _save_package, 1,1)); // (store)
	define_sysfun(new Sysfun('load-package', _load_package, 1,1));  
	
	// medium level
	define_sysfun(new Sysfun('local-put-value', _local_put_value, 2,3)); // (key,val[,store) -> key
	define_sysfun(new Sysfun('local-add-value', _local_add_value, 2,3)); // (key,val[,store) -> key
	define_sysfun(new Sysfun('local-get-value', _local_get_value, 1,2)); // (key,[store])
	define_sysfun(new Sysfun('local-delete', _local_delete, 2,2)); // (key,store)
	}

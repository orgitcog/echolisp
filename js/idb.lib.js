/*
IndexDB EchoLisp API
https://developer.mozilla.org/fr/docs/IndexedDB/Using_IndexedDB
http://www.html5rocks.com/en/tutorials/es6/promises/ <=== PROMISES in JS
http://davidwalsh.name/es6-generators <=== GENERATORS

database : https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase
http://www.w3.org/TR/IndexedDB/  see 3.1.13 key generator
https://developer.mozilla.org/en-US/docs/Web/API/IDBKeyRange  Keys Range

http://stackoverflow.com/questions/10471759/inserting-large-quantities-in-indexeddbs-objectstore-blocks-ui
*/
const _ECHO_LIB_IDB_VERSION = "1.1" ;

function __db_check(db,sender) {
	sender = sender || "indexed-db";
	if(!db) glisp_error(96,null,sender);
}

// 
function __db_message(msg, jsobject, force) {
jsobject = jsobject || null;
	if( _DB_VERBOSE || force) {
	writeln("💾 IDB: " + msg,"color:green") ;
	console.log("EchoLisp.IDB ",msg,jsobject);
	}
	return __void;
}

function __db_warning(msg, jsobject) {
jsobject = jsobject || null;
	writeln("💾 IDB: " + msg,"color:orange") ;
	console.log("EchoLisp.IDB ",msg,jsobject);
	return __void;
}

/*
 default event handlers
*/
// event.target.error.name may be better
function __db_error (event) {
var errorCode = 
(event.target.error) ?  event.target.error.name :
(event.target.errorCode) ? event.target.errorCode : "operation cancelled" ;
	console.log("EchoLisp.IDB error", errorCode);
	writeln("💾 IDB error " + (errorCode || "") ,"color:orange");
}

function __db_abort (event) {
var errorCode = 
(event.target.error) ?  event.target.error.name :
(event.target.errorCode) ? event.target.errorCode : "operation aborted" ;
	console.log("EchoLisp.IDB abort",errorCode);
	writeln("💾 IDB error " + (errorCode || "") ,"color:red");
}

function __db_success (event) {
	console.log("EchoLisp.IDB",event,event.result);
}


/*--------------
open db
Principles of use :
	- only one db (except for tests)
	- default store is "user"
	- user can add store(s)
-----------------*/
var _DB = null;
var _ECHO_DB  = "ECHOLISP" ;
var _DB_VERBOSE = false;

/*
__db_open : used to :
- open a DB
- create a DB (version = 1)
- add/delete objectStore
*/

function __db_open(name, version, store, force_delete) {
console.log("__db_open",name,version);
	if(version) 
		request = indexedDB.open(name, version);
		else request = indexedDB.open(name);
	
	request.onabort = __db_abort ;
	request.onerror = __db_error ;
	
	request.onsuccess = function(event) {
	var db = event.target.result;
  		_DB = db;
  		db.onerror = __db_error;
  		db.onsuccess = __db_success;
  		db.onabort = __db_abort;
  		__db_message("db-open: " + db.name + ":" + db.version, false, true); // force
	};
	
	request.onupgradeneeded = function(event) {
	var db = event.target.result;
	var objectStore;
	if(db.version === 1) { 
		if( name === _ECHO_DB) { // creation
  		objectStore = db.createObjectStore("system"); // out-of-line keys
		objectStore.add(_ECHO_LIB_IDB_VERSION,"version") ; // EchoLisp  library version
		objectStore = db.createObjectStore("words",{autoIncrement:true});
		} 
		objectStore = db.createObjectStore("user", {autoIncrement:true});
		__db_message("db-create: " + name + ":" + db.version,false,true);
		_DB = db;
  		} // version 1
  	else if (store) {
  		if(force_delete) {
  		 	db.deleteObjectStore(store);
  		 	__db_message("db-delete-store: "  + store,false,true);
  		}
  		else {
  		objectStore = db.createObjectStore(store, {autoIncrement:true});
  		__db_message("db-make-store: " + name + ":" + store,false,true);
  		}
  		_DB = db;
  		} // store
  	} // upgradeneeded
  return _true;
} // OPEN DB

/*--------------------
get all keys in a store
----------------------------*/
function __db_all_keys(store, onsuccess , env)  {
var request ;
store = store || "user" ;
	var keys = [];
	__db_check(_DB);
	
	var transaction = _DB.transaction([store]);
	transaction.oncomplete = function(event) {
  		__db_message ("db-keys:transaction completed " + store);
		};
	transaction.onerror = __db_error ;
	transaction.onabort = __db_abort ; 
	
	objectStore = transaction.objectStore(store);
  	request = objectStore.openCursor(); 
  	request.onerror = __db_error ;
  	
  	request.onsuccess = function(event) {
  	var cursor = event.target.result;
  	if (cursor) {
//console.log("DB.KEY",cursor.key) ;
    		keys.push(cursor.key);
    		cursor.continue();
  			}
  		else { // cursor null here
    		keys = __array_to_list(keys) ;
			__ffuncall([onsuccess, [keys, null]], env);
  			}
  		}
  	return _true;
} // all keys

/*
get all values for a key range
https://developer.mozilla.org/fr/docs/Web/API/IDBKeyRange
*/

/*--------------------
key-range [from to] or upper-bound
( ... to) (from ... ) (from to)
------------------------*/
var _db_get_range = function  (top , argc ,env ) {
var from,to,store,objectStore,request,keyRangeValue,values = []  ;
from = _stack[top++];
to =  _stack[top++] ;

store = nameToString(_stack[top++]);
var onsuccess =  _stack[top++] ;
var onerror =  (argc > 4) ? _stack[top++] : null;
	if(! isSmallInteger(from)) from = nameToString(from,"db-get-range");
	if(! isSmallInteger(to))   to = nameToString(to,"db-get-range");

	if   (from === "...") keyRangeValue = IDBKeyRange.upperBound(to);
	else if(to === "...") keyRangeValue = IDBKeyRange.lowerBound(from);
	else  keyRangeValue = IDBKeyRange.bound(from,to);

	__db_check(_DB);
	
	// check stores exists
	if(! _DB.objectStoreNames.contains(store)) {
		__db_warning("db-get-range: unknown store: " + store);
		return _true;
	}
	
	var transaction = _DB.transaction([store]);
	transaction.oncomplete = function(event) {
  		__db_message ("db-keys:transaction completed --> " + store);
		};
	transaction.onerror = __db_error ;
	transaction.onabort = __db_abort ; 
	
	objectStore = transaction.objectStore(store);
  	request = objectStore.openCursor(keyRangeValue); 
  	 	request.onerror = function(event) {
  		if(onerror)
  			__ffuncall([onerror, [ [from,[to ,null]]  ,null]], env);
  		else
  		__db_warning("db-range: cannot find: [" + from + " " + to + "] in store: " + store) ;
  	}
  	
  	request.onsuccess = function(event) {
  	var cursor = event.target.result;
  	if (cursor) {
    		values.push(cursor.value);
    		cursor.continue();
  			}
  		else { // cursor null here
    		values = __array_to_list(values) ;
			__ffuncall([onsuccess, [values, null]], env);
  			}
  		}
  	return _true;
} // _db_get_range

/*--------------------
(db-select selector (key value) store onsuccess [onerror])
------------------------*/
var _db_select = function  (top , argc ,env ) {
var objectStore,request,value,values = []  ;
var selector = _stack[top++];
var store = nameToString(_stack[top++],"db_select");
var onsuccess =  _stack[top++] ;
var onerror =  (argc > 3) ? _stack[top] : null;
checkProc(selector,2,2,"db-select");
checkProc(onsuccess,1,1,"db-select");

	__db_check(_DB);
	
	// check stores exists
	if(! _DB.objectStoreNames.contains(store)) {
		__db_warning("db-select: unknown store: " + store);
		return _true;
	}
	
	var transaction = _DB.transaction([store]);
	transaction.oncomplete = function(event) {
  		__db_message ("db-select:transaction completed: " + store);
		};
	transaction.onerror = __db_error ;
	transaction.onabort = __db_abort ; 
	
	objectStore = transaction.objectStore(store);
  	request = objectStore.openCursor(); 
  	 	request.onerror = function(event) {
  		if(onerror)
  			__ffuncall([onerror, [ store, null]] ,env);
  		else
  		__db_warning("db-select:error: " +  store) ;
  	}
  	
  	request.onsuccess = function(event) {
  	var cursor = event.target.result;
  	if (cursor) {
  			value = glisp_unjsonify(cursor.value);
    		if(__ffuncall([selector, [cursor.key , [value , null]]] , env) !== _false )
    			values.push(value);
    		cursor.continue();
  			}
  		else { // cursor null here
    		values = __array_to_list(values) ;
			__ffuncall([onsuccess, [values, null]], env);
  			}
  		}
  	return _true;
} // _db_select

/*--------------------
(db-select-count selector (key value) store onsuccess [onerror])
------------------------*/
var _db_select_count = function  (top , argc ,env ) {
var objectStore,request,value,count = 0  ;
var selector = _stack[top++];
var store = nameToString(_stack[top++],"db_select_count");
var onsuccess =  _stack[top++] ;
var onerror =  (argc > 3) ? _stack[top] : null;
checkProc(selector,2,2,"db-select");
checkProc(onsuccess,1,1,"db-select");

	__db_check(_DB);
	
	// check stores exists
	if(! _DB.objectStoreNames.contains(store)) {
		__db_warning("db-select-count: unknown store: " + store);
		return _true;
	}
	
	var transaction = _DB.transaction([store]);
	transaction.oncomplete = function(event) {
  		__db_message ("db-select-count:transaction completed: " + store);
		};
	transaction.onerror = __db_error ;
	transaction.onabort = __db_abort ; 
	
	objectStore = transaction.objectStore(store);
  	request = objectStore.openCursor(); 
  	 	request.onerror = function(event) {
  		if(onerror)
  			__ffuncall([onerror, [ store, null]] ,env);
  		else
  		__db_warning("db-select-count:error: " +  store) ;
  	}
  	
  	request.onsuccess = function(event) {
  	var cursor = event.target.result;
  	if (cursor) {
  			value = glisp_unjsonify(cursor.value);
    		if(__ffuncall([selector, [cursor.key , [value , null]]] , env) !== _false ) count++;
    		cursor.continue();
  			}
  		else { // cursor null here
			__ffuncall([onsuccess, [count, null]], env);
  			}
  		}
  	return _true;
} // _db_select_count

/*------------------
adding symbs: a lisp symb value - key = symbol name
----------------------*/
function __db_put (symb ,onsuccess , onerror, env ) {
var value,objectStore,request,name,key ,idef,store;
	store =  packName(symb.name) || "user" ;
	key = simpleName(symb.name) ;
	
	// compute object value (get its string if function) 
	// null is ok
	idef = glisp_find_def(symb) ; // a Definition object
	if(idef) 
			{
			value = idef; // 
			value = glisp_jsonify(value); // instanceOf Definition
			}
		else
			{
			value =  glisp.user.get (symb.name) ;
			if(value === undefined)  glisp_error(17,symb,"db-put");
			value = glisp_jsonify(value);
			}
	
	__db_check(_DB);
	// check stores exists 
	
	if(! _DB.objectStoreNames.contains(store)) {
		__db_warning("db-put:unknown store: " + store);
		return _true;
	}
	
	var transaction = _DB.transaction([store], "readwrite");
	// Do something when all the data is added to the database.
	transaction.oncomplete = function(event) {
  		__db_message ("db-put: " + symb.name + " - transaction completed" );
		};
	transaction.onerror = __db_error ;
	
	objectStore = transaction.objectStore(store);
  	request = objectStore.put(value,key); // replaces old value
  	
  	request.onsuccess = function(event) {
  		if(onsuccess) 
  			__ffuncall([onsuccess,  [symb, null]], env);
  		else
  		__db_message("db-put: " + symb);
  		};
  	request.onerror = function(event) {
  		if(onerror) 
  			__ffuncall([onerror,  [ symb, null]], env);
  		else
  		__db_message("db-put:error: " + event.target.result);
  		};
  		
  	return symb;
} // put (symb)

/*------------------
getting symbs: a lisp symb value - key = symbol name
symb is the receiver
always returns #t
----------------------*/
function __db_get (symb, onsuccess, onerror, env) {
var name,store,value,objectStore,request,symb,key ;

	name = symb.name;
	store = packName(name) || "user" ;
	key = simpleName(name);
	
	// if(! _DB) __db_open(_ECHO_DB) ;
	__db_check(_DB);
	
	// check stores exists
	if(! _DB.objectStoreNames.contains(store)) {
		__db_warning("db-get: unknown store: " + store);
		return _true;
	}

	var transaction = _DB.transaction([store]);
	// Do something when all the data is added to the database.
	transaction.oncomplete = function(event) {
  		__db_message ("db-get: transaction completed --> " + name);
		};
	transaction.onerror = __db_error ;
	transaction.onabort = __db_error ; // undef error message
	
	objectStore = transaction.objectStore(store);
  	request = objectStore.get(key);
  	
  	request.onerror = function(event) {
  		if(onerror)
  			__ffuncall([onerror, [ event.target.errorCode ,null]], env); // ???
  		else
  		  	__db_warning("db-get: cannot find: "+ name + "in store: " + store) ;
  	}
  	
  	request.onsuccess = function(event) {
  	var value;
  		// __db_message("DB:got: " + name);
  		value = event.target.result ;
  		if(value === undefined) {
			if(onerror)
  			__ffuncall([onerror, [ symb ,null]], env);
  			else
  			__db_warning("db-get:unknown symbol: " + name);
			return ;
	 		}
	 	value = glisp_unjsonify(value); // db {object} to lisp object
	 	if (value instanceof Definition) {
	 		 __compile_db_definition ( value , store) ;
	 		}
  		else {
  			glisp.user.set(name,value); // global ...
  			}
  // user success proc
  		if(onsuccess) 
  			__ffuncall([onsuccess,  [value, null]], env);
  		else
  			__db_message(store+ "[" + key + "] : " + glisp_message(value,""),false,true);
  
  		} // on success
  	return symb;
} // get (symb)

/*---------------------
_db_put_values imin imax key-proc|#:auto value-proc [store [oncomplete [onerror]]]
range [imin ... imax]
------------------------------*/
function _db_put_values (top, argc , env ) { 
var i,key,value,store,objectStore,request ;
var oncomplete,onerror ;
var imin = _stack[top++];
var imax = _stack[top++];
var keyproc = _stack[top++];
var valueproc = _stack[top++];
store = (argc > 4) ? nameToString(_stack[top++]) : "user" ;
oncomplete = (argc > 5) ?  _stack[top++] : null ;
onerror =  (argc > 6) ? _stack[top++] : null;
var kmin = null, kmax = null; // final range
	
	__db_check(_DB);
	// check stores exists 
	
	if(! _DB.objectStoreNames.contains(store)) {
		__db_error("db-put-range:unknown store: " + store);
		return _true;
	}
	
	if(keyproc instanceof Symbol) keyproc = keyproc.name;
	if(keyproc === "#:auto" ) keyproc = null ; // autoincrement
	
	var transaction = _DB.transaction([store], "readwrite");
	// Do something when all the data is added to the database.
	transaction.oncomplete = function(event) {
	if(oncomplete)
		__ffuncall([oncomplete , [[kmin,[kmax,null]] , null]], env) ;
		else
  		__db_message ("db-put-range: " + kmin +'-'+ kmax + " : transaction completed",true,true);
		};
	transaction.onerror = __db_error ;
	
	objectStore = transaction.objectStore(store);

	// requests loop
	for(i=imin;i<=imax;i++) {
		value = __ffuncall ([valueproc, [i, null]] , env);
		if(keyproc)  key =   __ffuncall ([keyproc, [i, null]] , env);
		value = glisp_jsonify(value);
	
  		request = (keyproc === null) 	?
  			objectStore.put(value) : objectStore.put(value,key); // replaces old value
  	
  		request.onerror = function(event) {
  			// if(onerror) __ffuncall([onerror, [ key , null]], env);
  			};
  		
  	// get generated key
  		request.onsuccess = function(event) {
  			key = event.target.result;
  			kmin = (kmin === null) ? key :  (key < kmin) ? key : kmin ;
  			kmax = (kmax === null) ? key :  (key > kmax) ? key : kmax ;
  			};
  	} // i-loop
  		
  	return _true;
} // put_range


function _db_put_value (top, argc , env ) {
var key,value,store,objectStore,request ;
key = _stack[top++];
key = (typeof key === "number") ? key : nameToString(key,"db-put-value");
value = _stack[top++];
store = (argc > 2) ? nameToString(_stack[top++]) : "user" ;
var onsuccess =  (argc > 3) ? _stack[top++] : null;
var onerror =  (argc > 4) ? _stack[top++] : null;
var oncomplete = (argc > 5) ? _stack[top] : null;

	
	// check allowed not lambda etc..in jsonify...
	
	__db_check(_DB);
	// check stores exists 
	
	if(! _DB.objectStoreNames.contains(store)) {
		__db_error("db-put-value:unknown store: " + store);
		return _true;
	}
	
	var transaction = _DB.transaction([store], "readwrite");
	// Do something when all the data is added to the database.
	transaction.oncomplete = function(event) {
  		if(oncomplete) __ffuncall([onsuccess, [event.target.result, null]], env);
  		else
  		__db_message ("db-put: " + key + " - transaction completed" );
		};
	transaction.onerror = __db_error ;
	
	objectStore = transaction.objectStore(store);

	// auto increment
	value = glisp_jsonify(value);
	key = (key instanceof Symbol) ? key.name : key ;
  	request = (key === "#:auto" ) 	?
  			objectStore.put(value) : objectStore.put(value,key); // replaces old value
  	
  	request.onerror = function(event) {
  		if(onerror) __ffuncall([onerror, [ key , null]], env);
  		};
  	// get generated key & pass it to onsuccess
  	request.onsuccess = function(event) {
  		if(onsuccess) __ffuncall([onsuccess, [event.target.result, null]], env);
  		};
  		
  	return _true;
} // put_value

/*---------------------
add-value
------------------------------*/
function _db_add_value (top, argc , env ) {
var key,value,store,objectStore,request ;
key = _stack[top++];
key = (typeof key === "number") ? key : nameToString(key,"db-add-value");
value = _stack[top++];
store = (argc > 2) ? nameToString(_stack[top++]) : "user" ;
var onsuccess =  (argc > 3) ? _stack[top++] : null;
var onerror =  (argc > 4) ? _stack[top++] : null;

	
	// check allowed not lambda etc..in jsonify...
	
	__db_check(_DB);
	// check stores exists 
	
	if(! _DB.objectStoreNames.contains(store)) {
		__db_error("db-add-value:unknown store: " + store);
		return _true;
	}
	
	var transaction = _DB.transaction([store], "readwrite");
	// Do something when all the data is added to the database.
	transaction.oncomplete = function(event) {
  		__db_message ("db-add: " + key + " - transaction completed" );
		};
	transaction.onerror = __db_error ;
	
	objectStore = transaction.objectStore(store);

  	// auto increment
  	value = glisp_jsonify(value);
  	key = (key instanceof Symbol) ? key.name : key ;
  	request = ( key === "#:auto") 	?
  			objectStore.add(value) : objectStore.add(value,key); // replaces old value
  	
  	request.onerror = function(event) {
  		if(onerror) __ffuncall([onerror,  [  key , null]], env);
  		else
  		__db_warning("db-add:cannot add: " + key);
  		};
  	request.onsuccess = function(event) {
  		if(onsuccess) __ffuncall([onsuccess, [event.target.result, null]], env);
  		};
  		
  	return _true;
} // add_value

function _db_get_value (top,argc,env) {
var key,value,store,objectStore,request ;
key = _stack[top++];
key = (typeof key === "number") ? key : nameToString(key,"db-get-value");
store = nameToString(_stack[top++] );
var onsuccess =  _stack[top++] ;
var onerror =  (argc > 3) ? _stack[top++] : null;

	__db_check(_DB);
	
	// check stores exists
	if(! _DB.objectStoreNames.contains(store)) {
		__db_warning("db-get: unknown store: " + store);
		return _true;
	}

	var transaction = _DB.transaction([store]);
	// Do something when all the data is added to the database.
	transaction.oncomplete = function(event) {
  		__db_message ("db-get-value: transaction completed --> " + key);
		};
	transaction.onerror = __db_error ;
	transaction.onabort = __db_error ; // undef error message
	
	objectStore = transaction.objectStore(store);
  	request = objectStore.get(key);
  	
  	request.onerror = function(event) {
  		if(onerror)
  			__ffuncall([onerror, [ key ,null]], env);
  			else
  			 __db_warning("db-get: cannot find: " + key + "in store: " + store) ;
  	}
  	
  	request.onsuccess = function(event) {
  	var value;
  		// __db_message("DB:got: " + name);
  		value = event.target.result ;
  		if(value === undefined) {
			if(onerror)
  				__ffuncall([onerror, [key ,null]], env);
  				else
  				__db_warning("db-get:unknown key: " + key);
			return ;
	 		}
	 	value = glisp_unjsonify(value); // db {object} to lisp object
  		__ffuncall([onsuccess, [value, null]], env);
  		} // on success
  	return _true;
} // get-value

function _db_delete (top,argc,env) {
var key,value,store,objectStore,request ;
key = _stack[top++];
key = (typeof key === "number") ? key : nameToString(key,"db-delete");
store =  nameToString(_stack[top++]) ;
var onsuccess =  _stack[top++] ;
var onerror =  (argc > 3) ? _stack[top++] : null;

	__db_check(_DB);
	
	// check stores exists
	if(! _DB.objectStoreNames.contains(store)) {
		__db_warning("db-delete: unknown store: " + store);
		return _true;
	}

	var transaction = _DB.transaction([store],"readwrite");
	// Do something when all the data is added to the database.
	transaction.oncomplete = function(event) {
  		__db_message ("db-delete: transaction completed --> " + key);
		};
	transaction.onerror = __db_error ;
	transaction.onabort = __db_error ; // undef error message
	
	objectStore = transaction.objectStore(store);
  	request = objectStore.delete(key);
  	
  	request.onerror = function(event) {
  		if(onerror)
  			__ffuncall([onerror, [ key ,null]], env);
  			else
  			 __db_warning("db-delete: cannot delete: "+ key + "in store: " + store) ;
  	}
  	
  	request.onsuccess = function(event) {
  		if (onsuccess)
  			__ffuncall([onsuccess, [key, null]], env);
  		} // on success
  	return _true;
} // db-delete
	

/*-------------------
API
--------------------------*/

var _db_delete_db = function (top,argc) {
var name = nameToString(_stack[top++]);
var force = (argc > 1) ? true : false; // user hidden

	if ((_DB && _DB.name === name) || (!force && name === _ECHO_DB )){
		__db_warning("cannot delete open db: " + name);
		return __void;
	}
	var DBDeleteRequest = window.indexedDB.deleteDatabase(name);
	DBDeleteRequest.onabort = function(event) {
  		__db_abort("Error deleting database.");
	};
	
	DBDeleteRequest.onerror = function(event) {
  		__db_error("Error deleting database.");
	};
 
	DBDeleteRequest.onsuccess = function(event) {
  		__db_message("Database deleted successfully",false,true);
	};
	return _true;
	}

var _db_create = function(name) {
	if(_DB) _db_close(); // only one IDB _db_close();
	name= nameToString(name);
	__db_open(name,1);
	return _true;
}

var _db_open= function(name) {
	name= nameToString(name);
	if(_DB && _DB.name !== name) {
		__db_warning("db-open:cannot open " + name,false,true);
		return __void;
	}
	__db_open(name);
	return _true;
}

var _db_close = function () {
	__db_check(_DB,"db-close");
	 _DB.close();
	_DB = null;
	return _true;
}

var _db_getversion = function () {
	__db_check(_DB);
	return _DB.version ;
}

var _db_getname = function () {
	__db_check(_DB);
	return _DB.name ;
}
var _db_stores = function () {
	__db_check(_DB);
	console.log("IDB.stores",_DB.objectStoreNames); // StringList Deprecated object?
	return __array_to_list(_DB.objectStoreNames);
}

var _db_put = function (top,argc,env) {
var symb = _stack[top++] ;
var onsuccess = (argc > 1) ? _stack[top++] : null ;
var onerror = (argc > 2) ? _stack[top] : null ;
	if(!( symb instanceof Symbol)) glisp_error(35,symb,"db-put");
	__db_put(symb,onsuccess,onerror,env);
	return _true;
	}

// binds symb if success
var _db_get = function (top, argc , env) {
var symb = _stack[top++] ;
var onsuccess = (argc > 1) ? _stack[top++] : null ;
var onerror = (argc > 2) ? _stack[top] : null ;
	if(! symb instanceof Symbol) glisp_error(35,symb,"db-get");
	if(onsuccess) checkProc(onsuccess,1,1);
	if(onerror) checkProc(onerror,1,1);
	__db_get(symb,onsuccess,onerror,env);
	return _true;
	}
	
var _db_make_store = function (store) {
	var name =  _DB.name;
	var version = _DB.version+1;
	store = nameToString(store,"make-store");
	if(_DB.objectStoreNames.contains(store)) {
		__db_warning("db-make-store: " + store + " already exists");
		return _false;
		}
		
	function doclose() {
	_db_close();
	}
	function reopen() {
	__db_open(name,version,store);
	}
	// _db_close();
	//__db_open(name,version,store);
	setTimeout(doclose, 1000);
	setTimeout(reopen,2000);
	return _true;
}

var _db_delete_store = function (store) { 
	var name =  _DB.name;
	var version = _DB.version+1;
	store = nameToString(store,"delete-store");
	__db_check(_DB);
	if(! _DB.objectStoreNames.contains(store)) {
		__db_warning("db-delete-store: " + store + " does not exist");
		return _false;
		}
	if(["user","system","words"].indexOf(store) >= 0) {
		__db_warning("Cannot delete: " + store);
		return _false;
	}
	function doclose() {
	_db_close();
	}
	function reopen() {
	__db_open(name,version,store,true); // force delete
	}
	// _db_close();
	//__db_open(name,version,store);
	setTimeout(doclose, 1000);
	setTimeout(reopen,2000);
	return _true;
	return _true;
}

//receiver is onsuccess proc
var _db_keys = function (store, onsuccess, env) {
	store = nameToString(store,"db-keys");
	checkProc(onsuccess,1,1,"db-keys");
	// check stores exists
	__db_check(_DB);
	if(! _DB.objectStoreNames.contains(store)) 
		__db_warning("Unknown store: " + store);
		else __db_all_keys(store,onsuccess, env);
	return _true ;
}

var _db_verbose = function (top, argc) {
	if(argc > 0)
		_DB_VERBOSE = ( _stack[top] === _false ) ? false : true;
	return (_DB_VERBOSE) ?  _true : _false ;
}


////////////
// BOOT
/////////

function boot_idblib() {

	if (!window.indexedDB) {
	writeln("💾  IndexedDB not supported by your browser", "color:orange");
	return;
	}
	
	// not user visible
	define_sysfun(new Sysfun ("db-create",_db_create,1,1)); // any becomes current
	define_sysfun(new Sysfun ("db-open",_db_open,1,1)); // current version
	define_sysfun(new Sysfun ("db-close",_db_close,0,0)); // current
	// ( delete name [force]) any but not current
	define_sysfun(new Sysfun ("db-delete-db!",_db_delete_db,1,2)); 
	define_sysfun(new Sysfun ("db-version",_db_getversion,0,0));
	define_sysfun(new Sysfun ("db-name",_db_getname,0,0));
	
	// user visible
	define_sysfun(new Sysfun ("idb.db-verbose",_db_verbose,0,1)); 
	define_sysfun(new Sysfun ("idb.db-stores",_db_stores,0,0)); 
	define_sysfun(new Sysfun ("idb.db-keys",_db_keys,2,2));  // (store onsuccess)
	define_sysfun(new Sysfun ("idb.db-make-store",_db_make_store,1,1)); // in current db
	define_sysfun(new Sysfun ("idb.db-delete-store!",_db_delete_store,1,1)); // in current db
	
	// ( db-put store.symbol  [onsucess [onerror]])
	define_sysfun(new Sysfun ("idb.db-put",_db_put,1,3)); 
	// (db-get store.symbol [onsuccess [onerror]] ) // sets symb to null if failure
	define_sysfun(new Sysfun ("idb.db-get",_db_get,1,3)); 

	
	// medium level
	// (put/add key|auto val store [success [error]]])
	define_sysfun(new Sysfun('idb.db-put-value', _db_put_value, 2,5)); 
	define_sysfun(new Sysfun('idb.db-add-value', _db_add_value, 2,5)); 
	
	// (get-value key store success [error]]])
	define_sysfun(new Sysfun('idb.db-get-value', _db_get_value, 3,4)); 
	// (get-range from|... to|... store success [error])
	define_sysfun(new Sysfun('idb.db-get-range', _db_get_range, 4,5)); 
	
	//(db-select selector (key value) store onsuccess [onerror])
	define_sysfun(new Sysfun('idb.db-select', _db_select, 3,4)); 
	
	//(db-select-count selector (key value) store onsuccess [onerror])
	define_sysfun(new Sysfun('idb.db-select-count', _db_select_count, 3,4)); 
	
	
	// (put-values  imin imax key-proc|#:auto value-proc store oncomplete onerror)
	define_sysfun(new Sysfun('idb.db-put-values', _db_put_values, 5, 7)); 
	
	// (db-delete key store [ success [ error]])
	define_sysfun(new Sysfun('idb.db-delete', _db_delete, 2,4)); 
	
	
	_LIB["idb.lib"] = true;
	__db_open(_ECHO_DB) ;
	}
	
boot_idblib();

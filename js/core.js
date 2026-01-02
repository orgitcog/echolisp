/*
* Glisp (C) Echolalie & G.Brougnard
* Core primitives
* http://www.gigamonkeys.com/book/object-reorientation-generic-functions.html
*/

/*
U T I L S
*/
function assert(condition, message) {
    if (!condition) {
        message = message || "Assertion failed";
        if (typeof Error !== "undefined") {
            throw new Error(message);
        }
        throw message; // Fallback
    }
}

/*
isSomething : js function, returns any or false
_somethingp : predicate, returns _true (#t) or _false (#f) GLisp objects
*/

/// JS TYPES

if(!Array.isArray) {
  Array.isArray = function(arg) {
    return Object.prototype.toString.call(arg) === '[object Array]';
  };
}

function isQuoteSymbol(obj) { // used in compile only
	return isSymbol(obj) && 
	(obj.name === "'"  || obj.name === "`" || obj.name === ",@" || obj.name === "," || obj.name === "@");
	}
	
function isAny(obj) {return true;}

// Extended lISTS
// functional (#fun ....)
const TAG_ENV = 2 ; // lambda list
const TAG_CLOSURE = 3 ;
const TAG_CLOSING = 4;
const TAG_COMPILED = 5 ; // true|undefined
const TAG_LAMBDA_DEF = 6;

const TAG_MARK = 17 ; // (mark sublist )
const TAG_COMPOSE_ARGS = 7;
const TAG_CIRCULAR = 8 ;
const TAG_COMPOSE = 9;
const TAG_SYNTAX = 10 ;
const TAG_CONTFRACT = 11 ;
const TAG_SET = 12 ;
const TAG_TREE = 13 ;
const TAG_BIN_TREE = 14;
const TAG_GRAPH = 15;

const TAG_REMEMBER = 16;
const TAG_BLOCK = 18 ;


/// GLISP TYPES & predicates
// 
function isInteger( obj) {
	return (obj instanceof Integer || isJSInteger(obj)) ;
}

function isNumber (obj) {
	return (typeof obj === "number"  
		|| (obj instanceof Complex) 
		|| (obj instanceof Integer) 
		|| (obj instanceof Rational)) ;
}

function _integerp (obj) {
	return (obj instanceof Integer || isJSInteger(obj)) ? _true : _false;
}

function _numberp (obj) {
	return (typeof obj === "number"  
			|| (obj instanceof Rational) 
			|| (obj instanceof Integer) 
			|| obj instanceof Complex) ?
			_true : _false  ;
}

function isRational(obj) {
	return obj instanceof Rational ;
	}

function isZero(obj) {
	if(typeof obj === "number") return (obj === 0) ;
	return  obj.isZero() ;
}

function isPositive( obj) {
		if(typeof obj === "number")  return (obj >= 0);
		return obj.isPositive();
}
function isNegative( obj) {
		if(typeof obj === "number")  return (obj < 0);
		return ! obj.isPositive();
}
function _positivep (obj) {
		if(typeof obj === "number")  return (obj >= 0) ? _true : _false ;
		if(_numberp(obj) === _false) return _false;
		return obj.isPositive() ? _true: _false ;
}

function _spositivep (obj) { // star-positive : obj > 0
		if(typeof obj === "number")  return (obj > 0) ? _true : _false ;
		if(_numberp(obj) === _false) return _false;
		return obj.isZero() ? _false :  obj.isPositive() ? _true: _false ;
}
function _negativep (obj) {
		if(typeof obj === "number")  return (obj >= 0) ? _false : _true ;
		if(_numberp(obj) === _false) return _false;
		return obj.isPositive() ? _false: _true ;
}

function _zerop(obj) {
	if(_numberp(obj) === _false) return _false;
	return isZero (obj)  ? _true: _false;
}
function _not_zerop(obj) {
	if(_numberp(obj) === _false) return _false;
	return isZero (obj)  ? _false: _true;
}

// Procs -
// NYI : KO for optional proc args , or rest

function isUserProcSymb(symb) {
	if((symb instanceof Symbol) && symb.fval)  return true;
	return false;
}

function isProc(obj) { // -> false or [min, maxarity]
var sysproc = null ;
	if(isXLambda(obj))  return lambda_arity(obj);
	if (typeof obj === "function" ) {
						sysproc = obj.glfun ;
						return [sysproc.minarity, sysproc.maxarity];
						}
	if (isSymbol(obj))	{
			if(typeof obj.fval === "function") {
				 		sysproc = obj.fval.glfun  ; // js fun
				 		return [sysproc.minarity, sysproc.maxarity];
						}
			if( obj.fval && obj.fval !== obj  ) return isProc (obj.fval) ;
			} // symbol
			
	return false;
}

var _procedurep = function (obj) {
	return isProc(obj) ?_true  : _false;
}

// checks functions types - not passed args 
// returns Lambda  or sysfun or symbol.fval
// usage : proc = checkProc(proc,min,max,sender)
// usage : proc = checkProc(proc,argc,argc,sender) when argc args are passed

function checkProc(proc, expected_min, expected_max, sender) { // --> glisp_error
var arity = isProc(proc)  ;
sender = sender || "check-proc" ; // each check Proc must have a sender NYI
	if(proc instanceof Formal) return proc;
	// if(_GENERICS && proc instanceof Generic) return proc;
	if(! arity ) glisp_error (73 , proc, sender) ;
	
	if(arity  && (expected_min!==undefined) &&  arity[1] && arity[1] <  expected_min) 
		glisp_error(74,proc, sender) ;
	if(arity  && (expected_max!==undefined) &&  arity[0] && arity[0] >  expected_max) 
		glisp_error(74,proc, sender) ;
	return isSymbol(proc) ? proc.fval : proc;
}

// checks number 
// returns a js number
function checkNumber (n, sender) {
sender = sender || "check-number" ;
	if(typeof n === "number") {}
	else if(n instanceof Rational) {n = 0+n;}
	else if(n instanceof Integer)  {n = 0+n;}
	else glisp_error(103,n,sender);
	return n;
}
// checks number & limit for an  integer number
function checkIntegerRange (n, nmin, nmax ,sender) {
sender = sender || "check-range" ;
	n = Math.floor(checkNumber(n,sender));
	if(n < nmin || n > nmax) glisp_error(102,n,sender + " [" + nmin + "..." + nmax + "]");
	return n;
}
function checkInteger (n,sender) {
sender = sender || "check-integer" ;
	if (n === _KWD_ALL) return 65536 ;
	if(isJSInteger(n)) return n ;
	glisp_error(61,n,sender);
}

// Symbols
function isSymbol(obj) {
	return obj instanceof Symbol;
}
function _symbolp (symb) {
		return (symb instanceof Symbol) ? _true:_false; 
}

function isSymbolOrFormal(obj) {
	return obj instanceof Symbol || obj instanceof Formal ; 
}
function isQualified(name) {
	return name.indexOf(".") >= 0;
	}
	
function packName(name) { // returns null of pack Name
//  if(name === undefined) console.trace("packname",name);
	if(name.indexOf(".") === -1) return null;
    return name.split('.')[0];
}

function simpleName(name) { // remove pack name
	var r = name.split('.');
	return r[r.length-1];
}
	
// Lists
// isQuote(quote foo) ---> true
function isConstant(obj) {
	return (isSymbol(obj) && obj.constant) ;
}
function isAutoeval(obj) {
	return (isSymbol(obj) && obj.autoeval) ; // test me before constant
}


function isQuote(obj) { // compiled expr
	return (isListNotNull(obj) && obj[0] === _quote );
}
function isUnquote(obj) { // compiled expr
	return (isListNotNull(obj) && obj[0] === _unquote );
}
function isUnquote_splicing(obj) { // compiled expr
	return (isListNotNull(obj) && obj[0] === _unquote_splicing );
}
function isQuasiQuote(obj) { // compiled expr
	return (isListNotNull(obj) && obj[0] === _quasiquote );
}
function isMacroEval(obj) { // compiled expr
	return (isListNotNull(obj) && obj[0] === _macro_eval );
}
function isAssocProcCall(list) {
	return (isListNotNull(list) && (list[0] === _assoc_proc_call)) ;
}


function isPairSeparator(obj) {
	return isSymbol(obj) && obj.name === "." ;
	}
function isString (obj) {
	return typeof obj === "string" ;
	}
	
function isList (list) { 
		return  Array.isArray(list) ; 
		}

function isListOrNull (list) { // (list? obj) true for null
		return  (list === null) || (Array.isArray(list));
		}

function isListNotNull (list) { // (pair? obj)  null -> false
		return Array.isArray(list) ;
		}
		
function notIsList (list) { // null -> false
	return ! isTrueList(list) ;
}

function isTrueList( cell) { // (a . b) --> false
	return isListNotNull (cell) &&   isListOrNull (cell[1]) ;
}

function isTruePair( cell) { //  ( a . b) --> true
	return isListNotNull (cell) &&  ! isListOrNull (cell[1]) ;
}

function isListOrSymbol (obj) {
	return isList(obj) || obj instanceof Symbol ;
	}
	
function isMacroCall(list) {
		return isListNotNull(list) && list[0].macro ;
		}
function isValues(list) {
		return isListNotNull(list) && 
		(list[0] === _values 
		|| (isSymbol(list[0]) && list[0].name === "values")) ;
}
function isDefine(list) {
		return isListNotNull(list) && 
		(list[0] === _define 
		|| (isSymbol(list[0]) && list[0].name === "define")) ;
}
function isDefineValues(list) {
		return isListNotNull(list) && 
		(list[0] === _define_values 
		|| (isSymbol(list[0]) && list[0].name === "define-values")) ;
}
function isDefineMethod(list) {
		return _GENERICS && isListNotNull(list) && 
		(list[0] === _define_method 
		|| (isSymbol(list[0]) && list[0].name === "define-method")) ;
}
function isCase(list) {
		return isListNotNull(list) && 
		(list[0] === _case 
		|| (isSymbol(list[0]) && list[0].name === "case")) ;
}
function isDefineConstant(list) {
		return isListNotNull(list) && 
		(list[0] === _define_constant
		|| (isSymbol(list[0]) && list[0].name === "define-constant")) ;
}
function isDefineFunction(list) { // text things which are in (definitions)
		return (isDefine(list) && list[1] && isList (list[1][0])) 
			|| isDefineSyntax(list) 
			|| isDefineMethod(list)
			|| isDefineConstant(list) ; 
}
function isDefineSyntax(list) {
		return isListNotNull(list) && 
		(list[0] === _define_syntax_rule
		|| list[0] === _define_syntax
		|| list[0] === _define_syntax_id
		|| (isSymbol(list[0]) && list[0].name.indexOf("define-syntax") === 0)); 
}
function isDefineMacro(list) {
		return isListNotNull(list) && 
		_LIB["match.lib"] &&
		(list[0] === _define_macro
		|| (isSymbol(list[0]) && list[0].name === "define-macro")) ;
}

		
function isLambda(list) { // compiled or not
		return isListNotNull(list) 
				&& list[0] && 
				(list[0] === _lambda || list[0].name === "lambda" || list[0].name === "λ");
		}
		
function isDelay(list) { // compiled or not
		return isListNotNull(list) 
				&& list[0] && (list[0] === _delay || list[0].name === "delay");
		}
function isStreamCons(list) { // compiled or not
		return isListNotNull(list) 
				&& list[0] && (list[0] === _stream_cons || list[0].name === "stream-cons");
		}
		
function isLambdaTailCall(list) { // compiled 
		return isListNotNull(list) && (list[0] === _lambda_tail_call) ;
		}
function isFLambda(list) { // compiled or not
		return isListNotNull(list) && list[0] 
				&& (list[0] === _flambda || list[0].name === "flambda") ;
		}
function isXLambda (list) { // lambda or flambda
		return isLambda(list) || isFLambda(list) ;
		}
		
function isLet(list) { // not compiled
		return isListNotNull(list) && list[0] && list[0].name === "let" ;
		}
function isLets(list) { 
		return isListNotNull(list) && list[0] && list[0].name === "let*" ;
		}
function isLetrec(list) {
		return isListNotNull(list) && list[0] && list[0].name === "letrec" ;
		}

// even if lib's are not here
function isTree (root) {
return isListNotNull(root) && root[TAG_TREE];
	}
function isGraph (graph) {
return isListNotNull(graph) &&  graph[TAG_GRAPH] ;
	}
	
// AutoRef 
var _AUTO_COUNT = 0;
function __autoref(form,depth) {
	if(_AUTO_COUNT > 10000) return true;
	if(depth > 100) return true;
	if(! (Array.isArray(form))) return false ;
	if(form[TAG_CIRCULAR]) return true;
	if(form[TAG_GRAPH]) return true;
	while(form) {
		_AUTO_COUNT++;
		if(_AUTO_COUNT > 10000) return true;
		if(__autoref(form[0],1+depth)) return true;
		form = form[1];
		}
	return false;
}

function isAutoRef (form ) {
	if(! (Array.isArray(form))) return false ;
	_AUTO_COUNT= 0;
	return __autoref(form,0) ;
	}
	

var _circular_p = function (form) {
	return (isAutoRef(form)) ? _true: _false ;
}
	
	

//////////////
// lists internal functions assume list is a well formed one or null
// list --> [ item_0 ,[ item_1, [ .... [last ,null]]]]
/////////////
function __jsmapc (jsfun,list) {
var cell = list;
		while(cell) { jsfun(cell[0]); cell = cell[1];}
		return list;
		} // jsmapc (returns same list)
		
function __jsmaparray (jsfun,arr) {
var length = arr.length, i;
	for(i=0;i<length;i++) arr[i] = jsfun(arr[i]);
	return arr;
	} // jsmaparray (returns same array)
	
// append item (long)
// returns list
function __snoc(item,list) { 
	if(list === null) return [item , null] ;
	var cell = list;
	while(cell[1]) cell = cell[1];
	cell[1] = [ item, null] ;
	return list;
	}
	
function __length(list) {
if(list === null) return 0;
	var lg = 1;
	while(isListNotNull(list[1])) {list = list[1]; lg++ ;  }
	return lg;
}

// array to list (ordered)
function __array_to_list (anArray) { // at depth === 0
		var lg = anArray.length,i;
		var ret = null;
		for(i= lg-1;i >=0; i--) ret = [anArray[i],ret];
		return ret;
	} // listify
	
// array to set (unordered, ignore undef)
function __array_to_set (anArray) {
	var aSet = null;
	var i, length= anArray.length;
	for(i=0; i < length; i++) {
		if(anArray[i] === undefined) continue;
		aSet = [anArray[i], aSet];
		}
	if(aSet) aSet[TAG_SET]= true;
	return aSet;
	}

// list to js array
function __list_to_array(list) {
	var a = [];
	while(isListNotNull(list)) { a.push(list[0]) ;list = list[1]; }
	return a ;
}

// special for __hcode only
function __list_or_cons_to_array(list) {
	var a = [];
	while(isListNotNull(list)) { a.push(list[0]) ;list = list[1]; }
		if(list) { // a cons
				 a.push(".");
				 a.push(list);
				 }
	return a ;
}
	
function __copy_0 (list) { // at depth === 0
if(list === null) return null;
if(notIsList(list)) return list;
	var cop = [null,null];
	var next = cop ;
	while(list) {
				next[0] = list[0];
				if(list[1] === null) return cop;
				list = list[1];
				next[1] = [null, null];
				next = next[1];				
				}
} // __copy_0

function __copy_list (list) { // at depth n
if(list === null) return null;
if(notIsList(list)) return list;
	var self = list ;
	var cop = [null,null];
	var next = cop ;
	if(list[TAG_CIRCULAR]) cop[TAG_CIRCULAR] = true;
	if(list[TAG_MARK]) return list[TAG_MARK] ; // deep auto ref
	list[TAG_MARK] = cop ;
	while(list) {
				next[0] = __copy_list (list[0]);
				if(list[1] === null) return cop;
				if(list[1] === self) { next[1] = cop; return cop; }
				list = list[1];
				if(list[TAG_MARK])   {next[1] = list[TAG_MARK]; return cop ;}
				next[1] = [null, null];
				next = next[1];				
				}
	self[TAG_MARK] = undefined;
} // __copy_list

// vectors etc NYI
var _copy = function (obj) {
	if(isListOrNull(obj)) return __copy_list(obj);
	if(obj instanceof Vector) return __copy_vector(obj);
	if (_LIB["struct.lib"] && (obj instanceof Struct)) return __copy_struct(obj);
	// sequence & Stream NYI NYI NYI : easy
	return obj ;
}

// make a copy of list (not null)
// other may be anything
function __append_2 (list, other) { 
if(other === null) return list;
if(! Array.isArray(other)) other = [other,null]; 
if(list === null) return other;
if(list instanceof Procrastinator) return Procrastinator.g_append(list,other,glisp.user);

if(notIsList (list)) glisp_error(20,list,"append");

	var copy = [null,null];
	var next = copy ;
	while(list) {
				next[0] = list[0];
				if(list[1] === null) { next[1] = other; return copy;}
				list = list[1];
				next[1] = [null, null];
				next = next[1];				
				}
} // __append_2

// other is listified if not a list
// modifies list and returns it
function __listify_1 (obj) {
	if(isListOrNull(obj)) return obj;
	return [obj, null];
}
function __nconc_2 (list , other) {
	var next = list;
	if(list === null) return __listify_1 (other);
	while(next) {
		if(next[1] === null) {next[1] = __listify_1(other); return list ;}
		next = next[1] ;
	}
}



//////////////////////////
// O B J E C T S 
// run-time uses : Symbols, GLenvironments , 
// and JS objects : tagged js functions, strings, numbers, and arrays (lists)
// and null (special object)
//////////////////////

/*---------------------------------------
RULES
	 - all symbs are created with pack = null
	 - all symbs have simple name or qualified name
	 - two different symbs have two different names
	 
	 functions symbs :
	 - functions loaded from file have nothing special unless (package 'foo) in file RFU
	 - functions imported by (restore-def or db-get) 
	 		will have their name qualified : with the store name 'user', etc...
	 - functions may be saved with (save-def pack.foo) (db-put pack.foo)
	 
	 symbol creation = symbol search
	 	by name
	 	by qualified.name 
------------------------------*/
	 
function Symbol(name,constant, autoeval, formal) { // autoeval implies read_only
if(autoeval !== true) autoeval = false;
if(constant !== true) constant = false;

	if(! formal) {
		var clone = glisp_look_symbol(name) ;
		if(clone) return clone;
		}

	this.name = name;
	this.pack =  glisp.pack ; // 'system' or null or #:package

	this.autoeval = autoeval;
	this.constant = constant; // true for #t,#f, ... struct setters/getters
	this.value = undefined; // RFU
	this.fval = null; // (define (f x) .. ) !!! in user env
	this.plist = {}; // p-list object
	this.remember = false; //  (remember 'f)
	this.syntax = null; // (syntax-rule[s] ...)
	this.sysfun = null;
	this.signature = null; // iff procedure 
	this.type = null; // typed (RFU)
	if(formal)   { // value bound to a formal in upper block
				this.formal = formal;
				// glisp_trace(local,this,"Symbol (local)");
				return this; // ===> not in _Symbols[] list <=====
				}
	_Symbols.push(this);
	
} // Symbol

Symbol.prototype.toString = function () {
	if(this.syntax) return '#syntax:' + this.name;
	// if(this.formal) return  this.formal.name + ":" + this.name ; // DBG
	// if(this.pack) return this.pack + "." + this.name ;
	return this.name; 
	}
	
// used in __hcode and only in __hcode
// not used in JSON.lib
Symbol.prototype.toJSON = function () {
	return this.name; 
	}

	
// hacks for list sort NYI NYI NYI
// Symbol.prototype.gt = function(b) {return (this.name > b.toString()) ? true: false;} ;


function Formal(name,index,lambda) {  // all must be different objects
	this.name = name;
	this.index = index ;
	this.fval = _undefined; //   for named (let foo ..)
	this.lambda = lambda ;  // pointer to referrer 
	this.clone = false;  // or symb  :free variable in inner block
	this.defvalue = undefined;
	this.type = null; // or a Type from fun.signature
} // Formal

Formal.prototype.toString = function () {
	var name_val =  "_" + this.name ;
	if(this.type) name_val = this.type.name + ':' + name_val;
	return name_val ;
}


// signature = array of predicates (number,string,array (form),Vector, Symbol, any)
function __arity_to_string (min, max) { // may be undef values
return 		(min === undefined) ? ":n" :
		    (min === max) ? ':' + min :
		    (max === undefined) ?  ':' + min + ':n' :
		    ':' + min +':' + max ;
}

// input fname = [lib.]name
function Sysfun(fname,jsfun,minarity,maxarity,sign,redefine) { // Sysfun('+',_plus,0,undefined)

	if(redefine) {
		var redef = glisp_look_sysfun(simpleName(fname)) ;
		if(redef)  { 
					// writeln ("*redef: " + simpleName(fname));
					redef.jsfun = jsfun ;
					jsfun.glname =  '' + fname + redef.arity() ; 
					jsfun.glfun = redef;
					jsfun.arity =  ( minarity === maxarity) ? minarity : undefined ; 
					return redef ;
					}
		}
		
	this.lib = packName(fname); // or null - ex plot.plot-xy
	this.name = simpleName(fname);   // a string
	this.jsfun = jsfun; // js function
	this.minarity = minarity;
	this.maxarity = maxarity ;
	this.macro = false; // not used 
	this.inline = redefine || false ; // (inline ..) or lib re-load for debug
	this.sign = sign || [] ; // signature to check args types
	_Sysfuns.push(this);
	
if(! jsfun) glisp_error(1,fname,"Sysfun:jsfun");
	// JS functions properties
	jsfun.glname =  '' + fname + this.arity() ; // to show it, eg cons:2
	jsfun.glfun = this; // isProc? or run-time checktypes (after evlis or args)
	jsfun.arity =  ( minarity === maxarity) ? minarity : undefined ; // a number
	} // Sysfun
	
Sysfun.prototype.arity = function () { // -> string
			return __arity_to_string(this.minarity,this.maxarity) ;
		    } 
		   
Sysfun.prototype.checkarity = function(argc, args) {
	var fname = '#[' + this.name + this.arity() + "]" ;
		if(this.maxarity !== undefined  && argc > this.maxarity)  // wrong # of args
			return glisp_error(14,args || "",fname);  // too many
		if(this.minarity !== undefined  && argc < this.minarity)  // missing
			return glisp_error(15,args || "",fname); 
		return true;
		}
		
// static type checking : eg. special forms
// or any _sysfun provided param value is terminal (NYI : see compile)
Sysfun.prototype.checktypes = function(argv) { // arg0 has index 0
	var fname = '#[' + this.name  + "]" ;
	var i = 0, arg ;
		while(argv !== null) {
		arg = argv[0];		
		if(this.sign[i] && ! this.sign[i](arg))  // incorrect type
        // glisp_trace(arg,this.sign[i],"checktype KO");
		// return glisp_error(16,arg,fname); 
		i++;
		argv= argv[1];
		}
	return true;
	}  // check type
		
// returns true is all args types defined and exact match
// matchers are isFoo predicate or isAny
Sysfun.prototype.matchtypes = function(argv) { // arg0 has index 0
	var i = 0, arg ;
		while(argv !== null) {
		arg = argv[0];	
		if(! this.sign[i]) return false; // undef type	
		if(! this.sign[i](arg))  return false;
		i++;
		argv= argv[1];
		}
	return (i === this.minarity) && (i === this.maxarity); 
	}  // match type

		
Sysfun.prototype.toString = function() {
		if(this.macro)
		return '#[Macro '  + this.name + "]" ;
		return '#[Sysfun ' + this.name + "]" ;
	}
	
Sysfun.lib = function (lib) {  // -> all functions in lib
	var i,procs = [];
	lib = nameToString(lib);
	lib = lib.replace(".lib","");
	for ( i=0; i < _Sysfuns.length; i++)
		if(_Sysfuns[i].lib === lib) procs.push(_Sysfuns[i].name);
	procs.sort();
	return new Vector(procs) ;
}

var _lib_functions = function (lib) {
	writeln (glisp_message (Sysfun.lib(lib)), _STYLE.plist["store"]) ;
	return __void;
}
	
	
////////////////////////
//  Run-time JS OBJECTS
///////////////////

var glisp = {
			time : 0,
			ncycle: 0,
			stopped : false,
			error : 0,
			env : null, /* global */
			user : null, /* user env */
			gensym : 1000 , /*start counter */
			pack : null , /* import only */
			doc : false ,
// user
			autocomplete : 40, // frequency msec
			max_cycles : 100, // ???
			greek : true ,
			results : [], // stack of evaluated things
			defs : []  // array of definitions (source strings)
			}; 
			
			
function glisp_init () {
		 glisp.time = Date.now(); // msec - start
		 glisp.cycles = 0;
		 glisp.stopped = 0;
		 glisp.error = 0;
		 glisp.results= [] ;
		 glisp.defs = [] ;
		 glisp.pack = null;
		  _top =0 ; // a top level rep  itou NYI
		  _topblock = 0;
		  _blocks= [0];
		
		 glisp_boot();
		 // prefs here NYI
		
} // glisp_init

//////////
// ENV objects
/////////////
/**
 *  GLEnv
 * @constructor
 * assert anyLambda[TAG_ENV].lambda = anyLambda
 */
var _env_id = 0;
function GLenv (parent,name, lambda) {
	this.name = name + (_env_id < 2 ? '' : _env_id) ;
	this.parent = parent ; // null for global
	this.lambda = lambda ; // (or undef) : cross-ref with a lambda
	this.alist = {} ; // mimic assoc list (name . value)
	 // _GLenvs.push(this); // DBG only NYI NYI 
	_env_id++;
return this;
} // Envt

GLenv.prototype.get = function(key) { // no distinguish between unbound and unassigned here
	var value = this.alist[key];
	var parent = this;
	while  (value === undefined  && (parent = parent.parent))  // == 15 mnibogue
		value = parent.alist[key];
	return value;
	} // get
	
GLenv.prototype.set = function(key,value) {
		if(!key) return glisp_error(18,value,'env.set');
		this.alist[key] = value;
	}
	
	// may be unbound !!
	// so, in case of unassigned error, check unBound
GLenv.prototype.isAssigned = function(key) { // (define x) x --> unassigned
		return this.get(key) !== undefined ;
		}
		
	// (set! x 8) Ok
	// returns an Environment || null
GLenv.prototype.isBound = function(key) { // (set! y 3) -> unbound
		if(this.alist.hasOwnProperty(key)) return this;
		else return (this.parent && this.parent.isBound(key)) ;
		} // isBound 

GLenv.prototype.toString = function() {
	return '#|'+this.name+'|' ; // degug (shorter)
	// return "#[Env " + this.name  + ']'  ; // + this.alist.toString() ;
	}
	
GLenv.prototype.save = function () {  // alist -> {object }
	var obj = {};
	var alist = this.alist;
	for(var key in alist)
		 if (alist.hasOwnProperty(key))  obj[key] = alist[key];
	return obj;
}
GLenv.prototype.restore = function (obj) {  //  {object } -> alist
	this.alist = obj;
}
GLenv.prototype.merge = function (env) { // bindings(env) into this.
	var alist = env.alist;
	for(var key in alist)
	 	if (alist.hasOwnProperty(key))  this.set(key,alist[key]);
}


	

///////////////////////////
// C O M P I L E
////////////////////
	
// compile a form (_values a b c ) as returned by parse()
// makes chirurgy
// check arity
// must return input form

function glisp_compile(parent,form,env) { // parent[0] = form || null
env = env || glisp.user ;
if(parent && parent[0] !== form) glisp_error(1,form,"compile - bad arg") ;

/*
	if(parent === null)
	if (isValues(form)) {  // from reader
		var exprs = form[1];
		while(exprs) {
//if(isQuote(exprs[0])) alert("quote");
					exprs[0] = glisp_compile(exprs,exprs[0],env);
					exprs= exprs[1];
					}
		return form;
		}
		else glisp_error(1,form,"compile - bad values") ;
*/

// the special forms will call compile, if needed
	if(isDefine(form) 
	|| isDefineConstant(form) 
	|| isDefineSyntax(form) 
	|| isDefineMacro(form) 
	|| isDefineMethod(form)) {
			form[0] = sysfun(form[0].name).jsfun; // resolve the define symbol
			// error here define-gee NYI NYI
			glisp_trace(form,env,"define-->");
			return form ;
		}

	form = glisp_syntax_id_expand(form);
// writeln(glisp_tostring ( form,"ANALYZE0 ")) ;
	if(glisp_syntax_expand(parent, form, env)) {
			form = parent[0];
			if(_DEBUG & _DEBUG_SYNTAX) writeln(glisp_tostring(form,"syntax :: "));
			}
 // writeln(glisp_tostring ( form,"ANALYZE-EXPANDED ")) ;
	form = glex_analyze(form,env);
 // writeln(glisp_tostring ( form,"RESOLVING ")) ;
	form = glex_resolve(form,env); 
	form = glex_compose(form);
	if(_DEBUG & _DEBUG_COMPILE)  
			writeln(glisp_tostring(form,"COMPILED :: "));
	return form ;
	}
	
// (... "." x) -> ( ... . x )
function glisp_pair (form) { 
//var sform = form // dbg
	var values = form ; // save
	var prev = null ;
	if(isGraph(form)) return;
	if(isTruePair(form)) return;
	if(isAutoRef(form)) return;
	
	if(isListNotNull(form))
		while(form) {
		var item  = form[0] ;
		var next  = form[1];

	// internal error
	if(item === undefined)  glisp_error(13, form, 'compile:pair' ); // null
	if(isListNotNull(item))  glisp_pair(item);
	else if(isPairSeparator(item)) 
				{ // chirurgy
					if(next === null || prev === null)  // misplaced
								glisp_error(25,values,"compile:pair"); 
					prev[1] = next[0];
					return ;
					}
	prev = form;
	form = next; 
	} // while next
//	console.log("dot",sform);
} // pair

// chirurgy - returns nothing
function glisp_quote (form) { 
	var self = form ;
	var trans = 
	{ "@" : "macro-eval" , "'" : "quote", "`" : "quasiquote" , ",@" : "unquote-splicing" , "," : "unquote"} ;
	var values = form ;
	
	// if(isAutoRef(form)) return;
	
	if(isListNotNull(form))
	while(form) {
	var item  = form[0] ;
	var next  = form[1];
	// internal error
	if(item === undefined)  glisp_error(13, form, 'compile[1]' ); // null
	
	if(isListNotNull(item))  glisp_quote(item);
	else if(isQuoteSymbol(item)) // or unquote, quasiquote, ..
				{ // chirurgy
				if(!isAutoRef(next)) 
				    glisp_quote(next);
					if(next === null)  glisp_error(21,item.name,"compile-quote"); 
					var jsfun = glisp_look_sysfun(trans[item.name]);
					if( ! jsfun) glisp_error(1,item.name,"compile-quote");
					jsfun = jsfun.jsfun;
					var jsfun = glisp_look_sysfun(trans[item.name]).jsfun ;
					
					form[0] = [jsfun , [next[0], null]];
					form[1] = next[1];
					next = form[1];
					}
	if(isTruePair(form)) return;
	form = next; 
	if(form === self) break;
	} // while form
} // quote


// glisp_matcher_fun
// input : fname
// is there a _fname_xx function ?
// careful : FIRST ONE is chosen. So, more discriminant first in _Sysfuns.

function glisp_matcher_fun(args,fname) {
	var candidates = glisp_matcher_sysfuns("_" + fname + "_") ; 
	for(var i = 0; i < candidates.length ; i++) {
// console.log("matcher:candidate",candidates[i]);
	 var gFun = glisp_look_sysfun(candidates[i]);
	 // assert(gFun)
	 if(gFun.matchtypes(args))  return gFun ;
	}
	return null;
} // glisp_matcher_fun

// http://www.scheme.com/tspl2d/binding.html
// (define (f list) (list list)) : must work 2.9.9
// sysfun : is symb a sysfun ?

function glex_replace_formal_1(body,symb,formal,sysfun,exclude) {
var item;
var argc = 0;
		exclude = __for_vars(body,exclude);
// if(exclude.length > 0) writeln (glisp_message (__array_to_list(exclude),"exclude")) ;
		while(body) {
		item = body[0];
		if(item === symb) {
						if((argc ===  0) &&  sysfun) { } // 2.9.9
						else if (exclude.indexOf(symb.name) >= 0) { } // 2.55
						else body[0] =  formal ; 
						}
		else if(isQuote(item)) { } // added in 2.9.9
		else if(isMacroEval(item)) { } // added in 2.95
		else if(isLambda(item))  { } // inner lambda --> block+1
		else if(isDefine(item))  { } 
		else if(isDefineMethod(item))  { } 
		else if(isDelay (item)) { }
		else if(isStreamCons(item)) { }
		else if(isDefineConstant(item))  { }
		else if(isListNotNull(item)) 
			glex_replace_formal_1(item,symb,formal,sysfun,exclude);
		body = body[1];
		argc++;
		if(notIsList (body)) break; // ( a . b) case NYI
		}	
} // glex_replace_formal

function glex_replace_formal(body,symb,formal) {
		var sysfun =  glisp_look_sysfun(symb.name) ? true : false;
		glex_replace_formal_1(body,symb,formal,sysfun,[])
		}


// returns true iff symb with formal.name found in inner block
function glex_make_closure_1(aLambda,body,formal,exclude) {
var item, symb;
		exclude = __for_vars(body,exclude);
		while(body) {
		item = body[0];
		if(isSymbol(item) && item.name === formal.name) {
		 		if (exclude.indexOf(item.name) >= 0) { } // flag body as NO-REPLACE NYI NYI NYI NYI
		 		else {
					aLambda[TAG_CLOSING] = true;
					return item ; 
					}}
					
		else if(isQuote(item)) { } // 2.97
		else if(isDefine(item))  { } 
		else if(isDefineMethod(item))  { } 
		else if(isDefineConstant(item))  { }
		else if(isListNotNull(item))  // lambda's inside
			if((symb = glex_make_closure_1(aLambda,item,formal,exclude))) return symb;
		body = body[1];
		if(notIsList (body)) break; // ( a . b) case NYI
		}		
return false ;
} // glex_make_closure

// formal.clone <--> clone.formal
function glex_make_closure(aLambda,body,formal) {
	var symb =  glex_make_closure_1 (aLambda,body,formal,[]);
	if( !symb) return false;
	var clone = new Symbol(symb.name,false,false,formal) ;
	glex_replace(body,symb,clone,[]);
	return clone;
}

// replace symbols by anything
// input = form  === listNotNull
// exclude only used by make_closure : for_vars

function glex_replace(form,symb,any,exclude) {
if(notIsList(form)) return;
if (exclude ) exclude = __for_vars(form,exclude);
		while(form) {
		if (form[0] === symb) {
			if (! exclude || exclude.indexOf(symb.name) === -1)
				form[0] = any ;
				}
		else 
			glex_replace(form[0],symb,any,exclude);
		form = form[1];
		if(notIsList (form)) break; // ( a . b) case NYI
		}		
} // glex_replace

function lambda_set_env(aLambda, env) {
	aLambda[TAG_ENV] = env ;
	env.lambda = aLambda ; // NEW
}
function lambda_get_env(aLambda) {
	return aLambda[TAG_ENV];
}

function lambda_arity (aLambda) { // -> [min, max]
var formal,minarity = 0 , maxarity = 0 ;
	if(! isXLambda(aLambda)) return undefined;
	var formals = aLambda[1][0];
	if( formals === null) return [0,0];
	if(! isList (formals)) return [0 , 999 ]; // (lambda x (...)
	while(formals) {
		formal = formals[0] ;
		maxarity++;
		if (formal.defvalue === undefined) minarity++ ;
		formals = formals[1];
		if(formals === null) return [minarity,maxarity] ;
		
		if(! isList(formals)) return [minarity , 999];
	}
}


//////////////
// glex_lambda
// input expr --> (lambda( u) (lambda ( x y) (+ x y u)))
// get a stack index for each formal param
// analyzes body (included lambda ..), then 
// replaces symbols reference u by formal references  _u (stack references)
// return nothing
//////////////////

// ((lambda (x y) ( + x ((lambda (u) (+ u y) )x))) 56 79)
var _formal_id = 0; // ident for hygienic macros
function glex_lambda(aLambda,env) { // assert(isXLambda(aLambda))
glisp_trace(aLambda,env,"glex_lambda->");
			var formals = aLambda[1][0]; // lambda x or lambda( x y . z) 
			var body =    aLambda[1][1] ;
			var formal,param,defvalue;
			var argc = 0;
			var names = [] ;
			// var syntax = aLambda[TAG_SYNTAX] , formal_name ; // comes from syntax ?
// glisp_trace(aLambda,formals,"glex_lambda");
if(aLambda[TAG_ENV]) {
			glisp_trace(aLambda,aLambda[2],"*glex-lambda : env already exists");
			return;
			}
			var newenv =   new GLenv(env,"L", aLambda); // empty now, will be used for closure
			lambda_set_env(aLambda,newenv) ; // lambda[2] = its env !!!
			glex_analyze(body,newenv); // depth first mandatory (lexical binding : last wins)


			if(formals === null) return; 
			if(formals instanceof Formal) {
					glisp_trace(aLambda,formals,"glex-lambda dup");
					return;
					}

			// if(syntax) _formal_id++;
// ( lambda x ...)
			if(formals instanceof Symbol ) {  
			param = formals;
			// formal_name = syntax ? param.name + "_" + formal_id : param.name;
			formal = new Formal(param.name,argc,aLambda) ;
			glex_replace_formal(body,param,formal); // block#0 starter
			formal.clone = glex_make_closure(aLambda,body,formal); // or false
			aLambda[1][0] = formal;
			return;
			}
			
// (lambda ( x y z (t [default])) default default is null
			while(formals) {
			// if(syntax) _formal_id++;
					param = formals[0] ;
					
					defvalue = undefined;
					if(isListNotNull(param)) {
							// defvalue = __eval(param[1][0], env); 2.9.10
							defvalue = param[1] ? param[1][0] : null; // to be eval at call time
							param = param[0];
							}
							
 					if(param instanceof Formal) return ; // already done
					if(! (param instanceof Symbol)) 
						return glisp_error(33,param,"lambda-params") ;
					var index = names.indexOf(param.name); 
					if(index === -1) names.push(param.name);
						else return glisp_error(30,param.name,"lambda") ; // dup name
								
					// formal_name = syntax ?  param.name + "_" + _formal_id : param.name;
					formal = new Formal(param.name,argc,aLambda) ;
					formal.defvalue = defvalue;
// console.log("FORMAL",formal);
					
					glex_replace_formal(body,param,formal); // block#0 starter
					formal.clone = glex_make_closure(aLambda,body,formal);

					formals[0] = formal; // replace
					if(formals[1] === null) return;
					if(formals[1] instanceof Symbol) break; // x y z . t
					formals = formals[1];
					argc++;
					if(!isList (formals)) return ;
					}
// (lamabda (x y z (t default) . rest)
			param = formals[1];
			// formal_name = syntax ? param.name + "_" + _formal_id : param.name;
			formal = new Formal(param.name,argc+1,aLambda) ;
			glex_replace_formal(body,param,formal); 
			formal.clone = glex_make_closure(aLambda,body,formal);

			formals[1] = formal;
			return;
} // glex_lambda

////////////////
// glex_tail_position
// could be smart . eg (if (e) a=tail b=tail)
// gets last of last of..last: fundef or formal fundef
// see http://people.csail.mit.edu/jaffer/r5rs_5.html
// input : target = lambda
// input : expr = body
//////

function glex_tail_position (target,expr,env) { // assert (isListNotNull(expr))
//glisp_trace(target,"","tail-target",true);
//glisp_trace(expr,"","tail-body",true);

	var call, last = expr, fun ;
	while(last) { 
	
	// go inside to see other lambda (eg named-let) see rosetta-fib
		if(isListNotNull(last[0])) {
			call = last[0][0] ;
			if(isLambda(call)) glex_tail_position(call, call[1][1],env);
			}
		
		if(last[1] === null) break;
		last = last[1] ;
		}
	if(! last) return;
	
	call = last[0];
	if(isListNotNull(call)) {
		 	fun = call[0] ;

			if(fun === _if )  glex_tail_position (target,call,env); // best split then else NYI
			if(fun === _begin )  glex_tail_position (target,call,env);
			// if(fun === _letrec)  glex_tail_position (target,call,env); // ??? 
			if(fun === _when)  glex_tail_position (target,call,env);
			if(fun === _unless)  glex_tail_position (target,call,env);
			if(fun === _cond)  glex_tail_position (target,call,env);
			if(fun === _else) glex_tail_position (target,call,env);
			if(fun === _while) glex_tail_position (target,call,env);
			// etc .. NYI
// if(fun instanceof Formal) glisp_trace(fun,fun.fval,"FORMAL",true);

		if((fun  === target)
		|| ((fun instanceof Symbol) &&  env.get(fun.name) === target)
		|| ((fun instanceof Formal) &&  (fun.fval === target))) {
			last[0] = [_lambda_tail_call , call[1]] ;
//glisp_trace(last[0],"TAIL_CALL!","glex",true);
			return;
			}
	} // last
}

////////////////
// glex_tail_call
// input --> (lambda (...) body)
// look in body
// replaces lambda by _lambda_tail_call
/////////////////////
function glex_tail_call (lambda,env) { // assert(isLambda(expr))
//return ; /////////////////// DBG 
env = env || glisp.user ;
	var body = lambda[1][1];
	glex_tail_position(lambda,body,env);
	
} // glex_tail_call


////////////////
// glex_let
// http://docs.racket-lang.org/reference/let.html
// input -> (let [proc_id] ((id val-expr) ...) body ...+)
// output -> ((lambda (id ...) body..) val-expr .. valexpr_n)
// let : names must be different (checked in lambda ? check it NYI)
//  Ex : http://www.ccs.neu.edu/home/dorai/t-y-scheme/t-y-scheme-Z-H-8.html
/////////////

function glex_let(expr) { 
	// assert expr[0] = let ;
//glisp_trace(expr,"glex_let","IN");
	var next = expr[1];
	var procid = null;
	if(isSymbol(next[0])) { procid =  next[0]; next = next[1] ;}
	var inits = next[0];
	var body = next[1];
	var id_val,val,id;
	// split inits into two lists
	var ids = null;
	var vals = null;
	
	if(body === null) glisp_error(50,expr,"let");
		while(inits) {
			 id_val = inits[0];
			 if(notIsList(id_val)) glisp_error(34,expr,"let");
			 id = id_val[0];
			 val = id_val[1] ? id_val[1][0] : null ; // (let ((a)) ..)
			if(ids === null) ids = [id,null]; else __snoc(id,ids);
			if(vals === null) vals = [val,null]; else __snoc(val,vals);
		inits = inits[1];
		}
	var lambda = [_lambda, [ ids , body ]] ;
	
	if(procid)  {
					var procform = new Formal(procid.name,0,lambda); 
					procform.fval = lambda; // autoeval &foo_0_0
					glex_replace(body,procid,procform) ;
					}
	if(expr[TAG_SYNTAX]) lambda[TAG_SYNTAX] = true; // propagate letts etc NYI NYI
//glisp_trace([lambda , vals] ,"glex_let","OUT");
	return [lambda , vals] ;
} // glex_let

////////////////
// glex_lets
// http://docs.racket-lang.org/reference/let.html
// input -> (let* ((id val-expr) ...) body ...+)
// output -> ((lambda (id) ((lambda(id2)..val_n val-1...)..body ) valexpr_n)
/////////////

function glex_lets(expr) { 
	// assert expr[0] = lest ;
//glisp_trace(expr,"glex_let*","IN");
	var  id_val, id, val ;
	var next = expr[1];
	var inits = next[0];
	var body = next[1];
	// split inits into two lists (reverse order)
	var ids = null;
	var vals = null;
	if(body === null) glisp_error(50,expr,"let*");
		while(inits) {
			id_val = inits[0];
			if(notIsList(id_val)) glisp_error(34,expr,"let*");
			id = id_val[0];
			val = id_val[1] ? id_val[1][0] : null ; // (let* ((a)) ..)
			ids = [id , ids] ;
			vals = [val, vals];
		inits = inits[1];
		}

	// build the lambda's
	while(ids) {
	body = [[_lambda ,[[ids[0],null], body]],      [vals[0],null]] ;
	body = [body, null];
	ids = ids[1];
	vals = vals[1];
	}
//glisp_trace(body ,"glex_lets","OUT");
	return body[0] ;
} // glex_lets

////////////////
// glex_letrec
// input -> (letrec  ((id val)* ...) body ...+)
// output -> (let ((id "undef")(...)  (set! id val)* ....body )
/////////////
// (letrec ((f (lambda(x) (if (zero? x) 1  (* x (f (1- x))))))) (f 3))  <== TEST  
function glex_letrec(expr) { 
	// assert expr[0] = letrec ;
	var id_val,id,val ;
	var next = expr[1];
	var linits = inits = next[0];
	var body = next[1];
	
	// build the (set! id value ) list 
	// must detect at run-time (l-bindings) undef value NYI
	var sets = null;
	while(inits) {
	var set = [_setq , inits[0]] ;
	if(sets === null) sets = [set,null]; else __snoc(set,sets);
	inits = inits[1];
	}
	body = __nconc_2(sets,body);

	inits = null ;
	//new init list
	while(linits) {
		id_val = linits[0];
		id = id_val[0] ;
		id_val = [id, [id.name + "-undefined", null]];
		if(inits === null) inits = [id_val,null]; else __snoc(id_val,inits) ;
		linits = linits[1] ;
		}
/*
var ret = 	 [new Symbol("let") , [inits ,  body]];
glisp_trace(ret,"letrec","out");
return ret;
*/
	 return [new Symbol("let") , [inits ,  body]];
	
} // glex_letrec


/////////////
// __glex_case
// flag datum list
/////////////

function __glex_case (expr) {
var clause;
		expr = expr[1] ; // skip case
		expr = expr[1] ; // skip key
		while (expr) {
			  clause = expr[0][0];
			  if(isListNotNull(clause)) clause[TAG_MARK] = "DATUM" ;
			  expr = expr[1];
		}
}

/////////////
// __glex_analyze
// sets formal parameters via glex_lambda, transforms (patch) let[*] into lambda
/////////////

function __glex_analyze(expr,env) { 
var lambdaCall, s_expr = expr ;
if(isAutoRef(expr)) return expr;
if(!(env instanceof GLenv)) glisp_error(1,expr,"analyze - missing env") ;
if(expr === null)         		return null;
if(notIsList(expr)) 			return expr;
if(isDefine(expr))       		return expr; // later
if(isDefineMethod(expr))       	return expr; // later
if(isDefineConstant(expr))      return expr; // later
if(isCase (expr)) __glex_case(expr); // mark (datum ..) as datum list
// __glex_for : (for ((lis 6)) NYI NYI

		if(expr[0] === null) return expr ; // (()) case
		if(isLetrec(expr)) expr = glex_letrec(expr);

		if(isLet(expr))  { 
							lambdaCall = glex_let(expr); 
						 	glex_lambda(lambdaCall[0],env); // (lambda () ...)
						 	__glex_analyze(lambdaCall[1],env); // args values
						 	return lambdaCall ;
						 }
		if(isLets(expr))  { 
							lambdaCall = glex_lets(expr); 
						 	glex_lambda(lambdaCall[0],env); // (lambda () ...)
						 	__glex_analyze(lambdaCall[1],env); // args values
						 	return lambdaCall ;
						 }
		else if(isXLambda(expr)) { // expr --> (lambda () ...)
				glex_lambda(expr,env) ; // will launch body analyze
				return expr;
				}
		else  while(expr) {
				expr[0] = __glex_analyze(expr[0],env);
				expr = expr[1];
				}
		return s_expr;
} // __glex_analyze

/*
 return new expr
*/

function glex_analyze(expr,env) { // parent --> list of exprs
if(! env) glisp_error(1,expr,"lex-analyze->missing env");
if(notIsList(expr)) return expr;
glisp_trace(expr,env,"analyze-->");

	return   __glex_analyze(expr,env);
	
}


// resolve :
// replaces (car (== Symbol) foo) by (_car (js function) foo)
// input : (values form_1 ... form_n)
// resolves in place : returns nothing
// replaces _plus by _plus_xx etc .. 
// replaces constants
// resolves immediate NYI
// (vector-map lambda_1()... v ) NYI : nth position (hint : use signature)
// returns form

function glex_resolve (form,env, checkarity) { 
if(checkarity === undefined) checkarity = true;
	var gFun,item,next,argc,args,arity;
	var i,lg,vector;
	
	function expected(name,arity) {
	var max = (arity[1] === undefined) ? "∞" : (arity[1] === 999) ? "∞" : arity[1] ;
		return name + ":" +  arity[0]  + ":" + max ;
		}
	
	if(isAutoRef(form)) return form;
	if(isAutoeval(form)) return form;
	if(isConstant(form)) return env.get(form.name) ; // PI --> 3.14

	if (isSymbol(form))
	if(! form.formal) { // top level ->sin
			gFun = glisp_look_sysfun(form.name); // LOOONG NYI NYI NYI
			if(gFun) return gFun.jsfun ;
			return form;
			}
			
	if(form instanceof Vector) { // resolve constants inside
	vector = form.vector;
	lg = vector.length;
	for(var i=0;i<lg;i++)
		if(isConstant(vector[i])) vector[i] = env.get(vector[i].name) ;
	return form;
	}


	if(isListNotNull(form)) {
// writeln (glisp_tostring (form, "resolve "));
	if(form[TAG_SET]) return form;
	if(form[TAG_MARK] === "DATUM") return form;
	if(isDefine(form)) return form; // later
	if(isDefineMethod(form)) return form; // later
	if(isDefineConstant(form)) return form; // later
	// if(form[0] === _inline) return form ;
	
	item = form[0]; // first
	if(item === undefined)  glisp_error(13, form, 'compile:resolve' ); // null

	if(item === _quote)     return form;
	if(item === _quasiquote) return form;
	if(item === _define_macro) return form ;
	
	if (isSymbol(item) && (! item.formal))   { // (car ... )
	args = form[1];
	argc = __length(args);

//  system Function call ?
		  if (checkarity)
		  	gFun = glisp_matcher_fun(args,item.name) ||  // look by '_name_'
		  			  glisp_look_sysfun(item.name); // or by 'name'
		  	else
		  	 gFun = glisp_look_sysfun(item.name); //  by 'name'
		  			 
		  if(gFun)  {
		 			form[0] = gFun.jsfun ; // patch : replace by jsfunction
		 			if(checkarity ){ 
		 				gFun.checkarity(argc, args) ;
		 				gFun.checktypes(args);
		 			}}
		 			
		 	else if(_GENERICS && _GENERICS[item.name]) { // METHOD call ?
		 	form[0] = _GENERICS[item.name];
		 	}
		 		
		 else if(checkarity && item.fval && isXLambda (item.fval)) {
		 	arity = lambda_arity(item.fval) ;
		 	argc = __length(args);
		 	if( argc < arity[0])
		 		glisp_error(15,args,expected(item.name,arity));
		 	 if((arity[1] !== undefined) && argc > arity[1])
		 	   	glisp_error(14,args,expected(item.name,arity));
			 }
		} // first is  symb
		 			
		if(form[0] === _pipeline)   checkarity = false ;
		if(form[0] === _pipeline_last) checkarity = false ;
		
		next = form ;
			while(next) {
			item = next[0] ;
			next[0] = glex_resolve(item,env, checkarity);
			next   = next[1];
			}
			
		if(form[0] === _pipeline)      glex_pipeline(form); // macro-expand it
		if(form[0] === _pipeline_last) glex_pipeline(form,true); // last
		} // form = list
// if(isListNotNull(form)) glisp_trace(form,env,"<--resolve");
	return form;
} // resolve

/*
glex_compose : gain : 20%
find (#[sin] (#[cos] (#[abs] (#[_+_xi] a _b))) ) 
add tags :   (*tag[COMPOSE]*= [+ abs cos sin]  *tag[COMPOSE_CALL*]= (a _b))
*/
function glex_is_compose_call (form, compound) {
	if(notIsList(form)) return false;	
	var op = form[0];
	if(typeof op !== "function") return false;
	if(op.special) return false;
	if(form.length <= 1 || !form[1]) return false;

			if (op.glfun.minarity === 1 
				&& op.glfun.maxarity === 1 // implies arity = 1
				&& glex_is_compose_call (form[1][0] , compound)) {
			compound.push(op);
			return true;
			}
	// last ( arity == 1 || 2)
			if ((op.glfun.minarity == op.glfun.maxarity)  && op.glfun.maxarity <=2 ) {
			compound.push(form[1]); // --> list of args
			compound.push(op); 
			return true;
			}
	return false;
}

function glex_compose_1 (expr) {
var compound = [];
		if(notIsList(expr)) return false; 
		if(isXLambda(expr)) return false; // go inside
		if(glex_is_compose_call(expr,compound) &&  compound.length > 2) {
							expr[TAG_COMPOSE_ARGS] = compound[0]; // glisp list
							expr[TAG_COMPOSE] = compound.slice(1); // js array
//glisp_trace(expr,"","compose-call !!");
//console.log(glisp_tostring(expr,'compose: '));
						return true;
		}
		return false;
}

/*-------------
glex_compose: returns form with compose TAGS
-------------------*/
function glex_compose (form) {
var next = form , expr ;
	if(notIsList(form)) return form;
	if(isAutoRef(form)) return form ;
	if(form[TAG_COMPOSE]) return form; // already done
	if (glex_compose_1 (form)) return form;
	
	while(next) {
		expr = next[0];
		if (!glex_compose_1 (expr)) 
				glex_compose(expr) ; // go deeper
		next=next[1];
		}
	return form;
}

/*---------------------
http://clojuredocs.org/clojure.core/-%3E%3E
glex_pipeline (_pipeline x f (g  a)h)
returns macro-expanded form = ( _apply_pipeline  x ( (f null) (g null a) ..))
--------------------------*/
var _pipeline = function(self,env) {
	return self; // dummy
}
var _pipeline_last = function(self,env) {
	return self; // dummy
}
// special ( _apply_pipe x (funs))
var _apply_pipeline = function ( self, env) {
	var calls , call, jscall,  x ,  last;
	self = self[1]; 
	x = __eval(self[0],env);
	calls = self[1][0];
	
	while(calls) {
		jscall  = calls[0]; // (fun  [args])
		if(jscall.length === 2) // (sin _)
			call  = [jscall[0],[x,null]] ; // easy - could re-use it NYI
			
		else {
		call = [jscall[0], null] ;
		last = call;
			for(i = 1; i< jscall.length;i++) {
			if(jscall[i] === _placeholder) 
				last[1] = [x,null];
				else last[1] = [__eval(jscall[i],env), null] ;
			last = last[1];
			}
		} 
// writeln (glisp_message (call,' ->> call ')) ;
		x = __ffuncall (call, env);
		calls = calls[1];
	}
	return x ;
}


// in : (_pipe x f g h ...)
// out :(_apply_pipe x (f g h...)) js-arrays
// bugged (define (opcomp f g ) (lambda(x) (-> x f g)))
function glex_pipeline (form, last) {
	var calls = form[1][1] , funlist =calls, call, jscall,  placeholder, argc, argv ;
	form[0] = _apply_pipeline  ;
	
	while(calls) {
		call = calls[0];
		if (notIsList(call)) {
				call = checkProc(call,1,1,"->") ;
				calls[0] = [call, _placeholder]  ; // (f x)
				}
		else {
			 argc = 0 ;
			 args = call[1] ;
			 jscall = [];
			 placeholder = false;
			 	while (args) {
			 	arg = args[0];
			 	if(arg === _placeholder) placeholder = true;
			 	jscall.push(arg) ;
			 	args= args[1];
			 	argc++;
			 	}
			if(placeholder === false) {
				argc++;
				if(last) jscall.push(_placeholder);
				else
				jscall = [_placeholder].concat(jscall) ;
				}
			 jscall = [call[0]].concat(jscall);
			 jscall[0] = checkProc(jscall[0],argc,argc,"->") ;
			 calls[0] = jscall ;
			} // list
		calls = calls[1];
		} // while
	form[1][1] = [funlist , null];
	return form;
}


///////// D E F I N E ///////
// http://www.scheme.com/tspl2d/binding.html
// (define (f x)  ...)
/////////////////

var _undefine = function(self,env) {
	var form = self[1];
	var item = form[0]; // symb
	if(! isSymbol (item)) return glisp_error(86,item,"undefine");
	if(item.readonly) return glisp_error(19,item,"undefine");
	env.set(item.name,undefined);
	item.fval = undefined;
	glisp_push_def(item,null);
	return item;
}

// add (symb null) to list of formals param symbs
// do nothing if already here as optional
// NYI NYI : formals = ( x y .rest)
function __add_symb_to_formals(symb,formals) {
	while (formals) {
		if (Array.isArray(formals[0]) && formals[0][0] === symb) return ;
		last = formals ;
		formals = formals[1];
		if(formals && notIsList(formals)) glisp_error(1,formals,"compile-args") ;
		}
	last[1] = [[symb,[null,null]],null] ;
}

function __inner_define_values_1 (define ,  lambda_1) {
	var items = define[1][0], item;
	var formals = lambda_1[0];
	
	if(notIsList (items)) glisp_error(20,item,"define-values") ;
	while (items) {
		item = items[0] ;
		if (! (item instanceof Symbol))  glisp_error(23,item,"define-values") ;
		if(formals)
		 	__add_symb_to_formals(item,formals);
			else lambda_1[0] = [[item,[null,null]],null] ;
		items = items[1];
		}
	}

// in : (define symb expr) or (define (fun x) expr ..)
// out : (set!  symb expr) and add (symb null) to formals = lambda[1][0]
// rem : dup names are detected later

function __inner_define_1 (define ,  lambda_1) {
	var item = define[1][0];
	var rest = define[1][1];
	var formals = lambda_1[0];
	
	if(rest === null) glisp_error(67,item,"define") ;
	
	if (item instanceof Symbol) { // (set! symb val)
		define[0] = _setq ;
		if(formals)
		 	__add_symb_to_formals(item,formals);
			else lambda_1[0] = [[item,[null,null]],null] ;
		return ;
		}
		
	if(isList(item)) {
		var fsymb = item[0]; // (set! fsymb (lambda () ...))
		if(!isSymbol (fsymb))  glisp_error(27,fsymb,"define");
		var lambda = [_lambda, [item[1], rest]] ;
		
		if(formals)
			__add_symb_to_formals(fsymb,formals) ;
			else lambda_1[0] = [[fsymb,[null,null]],null] ;
		define[0] = _setq ;
		define[1] = [fsymb , [lambda , null]] ;
		}
	}
	
// in: formals = ( x y z ..) or null
// in : formals = null : must set lambda[1]
// in formals = ( x y . rest) : NYI : easy

function __inner_define(form, lambda_1) {
	while(form) {
		if(isDefine(form[0])) 
			__inner_define_1(form[0], lambda_1);
		else if (Array.isArray(form[0])) // go inside
			__inner_define(form[0], lambda_1) ;
		form = form[1] ;
		}
}

function __inner_define_values(form, lambda_1) {
	while(form) {
		if(isDefineValues(form[0])) 
			__inner_define_values_1(form[0], lambda_1);
		else if (Array.isArray(form[0])) // go inside
			__inner_define_values(form[0], lambda_1) ;
		form = form[1] ;
		}
}


// rem: cannot (define ..) a formal 
var _define = function (self,env,flambda) { // form --> ( [type] [ a | (f x y)]  body ...)
//glisp_trace ("DEFINE", env ,"", true);
	var form = self[1];
	var item = form[0]; // symb
	var body = form[1];
	var lambda, value, coresysfun ;
	
	if (isList(item)) { // (define (f a . r)) 
		var fsymb = item[0]; // function name 
		
		if(!isSymbol (fsymb))  glisp_error(27,fsymb,"define");
		
// forbidden redef
		corefun = sysfun(fsymb.name);
		if(corefun) {
			glisp_error(19,fsymb,"define");
			}
		else if(fsymb.constant)
			  glisp_error(19,fsymb,"define"); // eg : struct getter/setter
		
		_CONTEXT = fsymb ;
		
// packages a descendre 
		if(fsymb.pack && fsymb.pack !== "system" && packName (fsymb.name) !== fsymb.pack)
			fsymb.name = fsymb.pack + '.' + fsymb.name ;
// end packages

		var formals =  item[1];
		if(flambda)
			lambda = [_flambda, [formals, body]] ;
			else
			lambda = [_lambda, [formals, body]] ;
			
		// define inside ?
		__inner_define(body,lambda[1]) ; // formals = lambda[1][0]
		__inner_define_values(body,lambda[1]) ; // formals = lambda[1][0]
		
		fsymb.signature = null;
		if(_LIB["types.lib"]) { // should not RE-do if method NYI NYI
			var tn = __split_types(formals) ; 
			fsymb.signature = tn.types;
			lambda[1][0] = tn.names;
			method_resolve_dot_refs(body,tn.names,tn.types) ;
			}
		
		else if(_LIB["struct.lib"]) // resolve dot.refs for struct args cat:fido 
			glex_resolve_dot_refs (body , formals); // remove types
		
		// lambda_set_env(lambda,env); will be set by compile
		
		//glisp.user.set(fsymb.name,lambda); // NO !!  : use _setq  NYI NYI NYI NYI NYI
		glisp.user.set(fsymb.name,lambda); 
		lambda[TAG_LAMBDA_DEF] = fsymb; // used for _CONTEXT
		fsymb.fval = lambda; // top level def only 
		fsymb.sysfun = null ; // not enough . Must remove form sysfuns NYI
		
		glisp_compile([lambda,null],lambda,env); 
		glex_tail_call(lambda,env);
		fsymb.macro = fsymb.syntax = false;
		
		if(fsymb.signature)  // will trigger type-check
			 __install_signature(fsymb,lambda,fsymb.signature);
		return fsymb; // symb
		} // end define function

// (define x <expr>)
// assert(isSymbol(item)) 
// loading pack must work
	
	if(!isSymbol (item))  glisp_error(27,item,"define");
	if(item.constant && glisp.env.isBound (item.name))  glisp_error(19,item,"define");
	
// package
		if(item.pack && item.pack !== "system" && packName (item.name) !== item.pack)
			item.name = item.pack + '.' + item.name ;
// end package

	// rem - what if (set! f 6) ? fval ?
	if(body === null) glisp_error(67,item,"define");
	if(body[1]) glisp_error(126,item,"define"); // trap (define f (x y) expr)
	
	_CONTEXT = item;
	glisp_compile(body,body[0],env);
	value = __eval(body[0],env);
	
	if(typeof value === "function" || isXLambda(value)) item.fval = value; // (define f sin)
	env.set(item.name,value) ; 
	return item; // symbol
	}  // define
	
var _define_constant = function (self,env) { // form -->(a expr) NEW
	var form = self[1];
	var item = form[0]; // symb
	var rest = form[1];
		
	if(!isSymbol (item)) glisp_error(27,item,"define-constant");
	if(item.constant && glisp.env.isBound (item.name)) glisp_error(19,item,"define-constant");
	
// package
		if(item.pack && item.pack !== "system" && packName (item.name) !== item.pack)
			item.name = item.pack + '.' + item.name ;
// end package
			
	glisp_compile(rest,rest[0],env);
	value = __eval(rest[0],env);
	if(typeof value === "function" || isXLambda(value)) item.fval = value; // (define f sin)
	glisp.user.set(item.name,value) ; 
	item.constant = true;
	return item; // symbol
	}  // define_constant
	
var _define_global = function (symb, value) { // evals its args
			if(!isSymbol (symb)) glisp_error(27,symb,"define-global");
			if(typeof value === "function" || isXLambda(value)) symb.fval = value; 
			glisp.user.set(symb.name,value) ; 
			return symb;
}


	
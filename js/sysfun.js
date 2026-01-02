///
// UTILITIES
////

var _Sysfuns = [] ; // array of Sysfun objects  with arity, info, ...
var _Symbols = [] ; // array of Symbols objects
var _GLenvs =  [];  // dbg only
var _Formals = []; // not used ???
var _Keywords = []; // #abc autoeval symbs
var _STYLE;
var _CALENDAR;

// language symbols : autoeval, constant
var _true,_false,_right_arrow, // =>
_ellipsis, _trace,__void,_else,_undefined,_range_sep,_kons_sep,_question_mark,_placeholder,
 _pipe_op , _vertical_bar , _esperluette ; // ->

// remember it in _sysfuns
// bind symbol to jsfun
// creates Symbol for f-name

function define_sysfun(aSysfun,env) { // env is optional
env = env || glisp.env;
	env.set(aSysfun.name,aSysfun.jsfun);
	var symb = new Symbol(aSysfun.name);
	symb.sysfun = aSysfun;
	symb.constant= true;
	symb.fval = aSysfun.jsfun;
	return aSysfun ;
}

//////////////////////
// inline
///////////////////////////////////
// expr string to function
// ailleurs 
function _rgba (r, g, b, a ) { // in : [0..1]**4
	a = a || 0 ;
	return ((a * 255) << 24) | 
	((b * 255) << 16)  |
	((g * 255) << 8)   |
	((r * 255) & 0xff)  ;
}
function __hsl (h , s , l) {
	h = Math.min(1,Math.max(h,0)) ;
	s = Math.min(1,Math.max(s,0)) ;
	l = Math.min(1,Math.max(l,0)) ;
	return [h,s,l];
	}

var _INLINE_FUNS = ["E","PI","SQRT2", "acos","asin","atan","atan2","ceil","floor","max","min","random","sin","cos","tan","log","pow",
"exp","round","sqrt","cbrt","abs"];
var _INLINE_TRADS = 
	[["isprime","isPrime"], 
	["factor","_factor"],
	["nextprime","_next_prime"],
	["issquare","isSquare"],
	["fract","_fract"],
	["gcd","__gcd"],
	["lcm","_lcm"],
	["rgb","_rgba"],
	["hsl","__hsl"],
	["map","map"],
	["smoothstep","_smoothstep"] ,
	["scurve","_s_curve"] ,
	["lerp","_lerp"] ,
	["qlerp","_qlerp"], // see 3d.lib
	["xlerp","_xlerp"],
	["factorial","_factorial"],
	["powmod","__powmod"]];

// check return inside NYI
function __inline_expression (expr,argnames,sender) {
sender = sender ||"inline" ;
	var jsfun = null ;
	var uexpr = expr;
	var args = argnames.length ;
	if(expr.indexOf("return") === -1) glisp_error(154,expr,"inline");
	
	try {
		for(f = 0; f< _INLINE_FUNS.length;f++) {
		expr = expr.replace
			(new RegExp("([^a-zA-Z])"+ _INLINE_FUNS[f],"g"),"$1Math." +_INLINE_FUNS[f]);
			}
		for(f = 0; f< _INLINE_TRADS.length;f++) {
		expr = expr.replace
			(new RegExp("([^a-zA-Z])"+ _INLINE_TRADS[f][0],"g"),"$1" + _INLINE_TRADS[f][1]);
			}
			
		expr = expr.replace("**","^");
		expr = expr.replace(/([_a-zA-Z0-9\.]+) *\^ *([+-]*[_a-zA-Z0-9\.]+)?/g,"Math.pow($1,$2)");
		/*
		expr = expr.replace(/x *\^ *([+-]*[0-9\.]+)?/g,"Math.pow(x,$1)");
		expr = expr.replace(/y *\^ *([+-]*[0-9\.]+)?/g,"Math.pow(y,$1)");
		expr = expr.replace(/z *\^ *([+-]*[0-9\.]+)?/g,"Math.pow(z,$1)");
		expr = expr.replace(/t *\^ *([+-]*[0-9\.]+)?/g,"Math.pow(t,$1)");
		expr = expr.replace(/(\(.*\))? *\^ *([+-]*[0-9\.]+)?/g,"Math.pow($1,$2)");
		*/
		
		if(args === 0)
			jsfun = new Function ( expr);
		if(args === 1)
			jsfun = new Function (argnames[0], expr);
		else if(args === 2)
			jsfun = new Function (argnames[0],argnames[1], expr);
		else if(args === 3)
			jsfun = new Function (argnames[0],argnames[1],argnames[2], expr);
		else if(args === 4)
			jsfun = new Function (argnames[0],argnames[1],argnames[2],argnames[3], expr); 
		else if(args === 5)
		jsfun = new Function (argnames[0],argnames[1],argnames[2],argnames[3], argnames[4], expr); 

		else
			writeln(sender 	+ "inline-def : too many inline function arguments", "color:red") ;
			
		jsfun.inline = true;	
		writeln(sender + " : "  +  expr, "color:green");  // debug
		}
		catch (err) {
		writeln(sender + " : "  +  uexpr, "color:brown");
		writeln(sender + " : "  +  expr, "color:red");
		writeln("⛔️  " + err.name + ' : ' + err.message  ,_STYLE.plist["jserror"]);
		}
	return jsfun ;
}

// (inline (f x y ..) "jsstring")
// prevent redefining lisp functions NYI NYI NYI NYI NYI
var _inline = function(self, env) {
	self = self[1];
	var call = self[0]; // (f x y z) or jsfun already here
	
	if(notIsList(call)) glisp_error(20,call,"inline") ;
	
	var  argnames = __list_to_array(call[1]);
	var numargs = argnames.length ;
	for(var i=0; i < argnames.length;i++) argnames[i] =  argnames[i].name ;
	
	var body = self[1][0];
	var fname = nameToString(call[0],"inline");
	if(typeof body !== "string") glisp_error(51,body,"inline");
	
	var jsfun = __inline_expression(body,argnames);
	if(jsfun === null) return _false;
	
	// true := redef allowed
	var sysfun = define_sysfun (new Sysfun (fname, jsfun,numargs,numargs,[],true));
	sysfun.inline = body  ; // without substitutions
	return fname ; 
	}


function define_special(aSysfun,env) { // special form (let, ...)
 	define_sysfun(aSysfun,env) ;
	aSysfun.jsfun.special = true; // js hack 
}

function define_sysmacro(aSysfun,env) { // env is optional
env = env || glisp.env;
	env.set(aSysfun.name,aSysfun.jsfun);
	aSysfun.macro = true;
}

function bind_symbol(aSymbol,value,env) { 
env = env || glisp.env;
	env.set(aSymbol.name,value);
}

function define_variable(name,obj, env) { // returns the symbol object
env = env || glisp.env;
	var symb = new Symbol(name);
	env.set(name,obj);
	return symb;
}

function system_constant(name,obj, env) { 
// console.log("CONSTANT",name,obj);
env = glisp.env;
	var symb = new Symbol(name,true);
	env.set(name,obj);
	return symb;
}

function define_keyword(name) { // not bound, but autoeval
	var symb = new Symbol(name,true,true); 
	_Keywords.push(symb);
	return symb;
}

// returns a GLenv object
function glisp_look_glenv(name) {
for(var i=0;i < _GLenvs.length;i++)
		if(_GLenvs[i].name === name) return _GLenvs[i];
	return null;
}

// returns a Sysfun object
function glisp_look_sysfun(name) {
for(var i=0;i < _Sysfuns.length;i++)
		if(_Sysfuns[i].name === name) return _Sysfuns[i];
	return null;
}

// returns a keyword symb
// look by string or symb
function glisp_look_keyword(name) {
name = nameToString(name);
for(var i=0;i < _Keywords.length;i++)
		if(_Keywords[i].name === name) return _Keywords[i];
	return null;
}

// returns a Symbol object
// looks for qualified name
// importing fundefs will pass qualified names

function glisp_look_symbol(name) {
var snum = _Symbols.length;

	for(var i=snum-1; i >=0  ;i--) 
			if(_Symbols[i].name === name) return _Symbols[i] ; 

	return null;
} 



// returns a VECTOR of matchers (strings)
// returns only functions & defined symbols (bound)
// all : displays functions arity 

function glisp_matcher_symbols(regexp,env, all) {
env = env || glisp.env ; 
//console.log("match",regexp,env);
var name, matches = [];
for(var i=0;i < _Sysfuns.length;i++) {
	    name = _Sysfuns[i].name ;
	    //if(name.indexOf("_x") !== -1) continue; // discard internal funs
	    if(name.indexOf("_ix") !== -1) continue; 
	    if(name.indexOf("_xi") !== -1) continue; 
		if(!regexp.test(name)) continue;
		if(!all && name.indexOf("_") >= 0) continue;

		name = name.replace("_xxx",""); // REGEXP NYI
		name = name.replace("_xx","");
		name = name.replace("_x","");
		name = name.replace("_","");
		
	    if(all) { // enhanced
	    		name +=  _Sysfuns[i].arity() + '&nbsp;' ;
	    		if(_Sysfuns[i].jsfun.special) name = "&#x1F440; " + name;
	    		}
	    matches.push(name);
		}
		
for(var i=0;i < _Symbols.length;i++) {
	    name = _Symbols[i].name;
	    if(typeof (_Symbols[i].fval) === "function") continue; 
	    /// OUT if(sysfun(name)) continue; // Looooooong .
		if(regexp.test(name)  && env.get(name) && matches.indexOf(name) === -1) 
			matches.push(name);
		}
	matches.sort();
	return  new Vector(matches);
} // match_symbol

// returns AN ARRAY of prefix matchers (strings)
function glisp_matcher_sysfuns (prefix ) {
	var matches = [];
	for(var i=0;i < _Sysfuns.length;i++) {
	    name = _Sysfuns[i].name;
		if(name.indexOf(prefix) === 0) matches.push(name);
		}
	return matches;
}

		
//////////////////////
// ENV's
//////////////////////////
var _envp = function(obj) {
	return (obj instanceof GLenv) ? _true : _false ;
}

// returns --> a NEW assoc list (GLisp format)
var _environment_bindings = function(env) { 
	if(env === null) return null;
	if(! (env instanceof GLenv)) glisp_error(59,env,"env-bindings"); 
	return _prop_val_to_list (env.alist); 
} // _env_bindings

var _environment_parent = function(env) {
	if(!(env instanceof GLenv)) glisp_error(59,env,"env-parent"); 
	return env.parent ;
	}
	
var _environment = function (obj,env) { // -->returns obj env or null
console.log("closure",obj);
	if(isXLambda(obj)) return obj[TAG_ENV] || null ;
	if(isSymbol(obj) && obj.fval) return _closure (obj.fval);
	if(obj instanceof Formal && obj.env) return  obj.env ;
	if(obj instanceof Symbol && env.isBound(obj.name)) return env.isBound(obj.name) ;
	return null;
	}
	
// (define ( f u) (write "F" u (bound? u)) (lambda (x) (write "L" u (bound? u)) (+ u x)))
// (f 100) 7)
var _boundp = function (obj,env) 
	{	
	// if(obj instanceof Formal) return  obj.env ||  _false;
	if(obj instanceof Symbol) return env.isBound(obj.name) || _false ; 
	return _false;
	}

var _environment_new = function (alist) {
	var newenv = new GLenv(glisp.user,"E");
	newenv.alist =  _list_to_prop_val(alist,true);  // no stringify value
console.log("ENV NEW",newenv.alist);
	return newenv ;
	}
	
var _environment_current = function(self,env) { // special
	return env;
}



/////////////////////////
// T Y P E S
/////////////////////
/*
> (list? '( 6 7))
#t
> (list? '(6 . 7))
#f
> (pair? '( 6 . 7))
#t
> (pair? '( 6 7))
#t
> (list? '())
#t
> (pair? '())
#f
> 
*/

var _pairp = function (obj) {
	return (isListNotNull(obj)) ? _true : _false; 
}
var _listp = function (obj) {
	return ((obj === null) || (isTrueList(obj))) ? _true : _false; 
}
var _nullp = function (obj) {
	return (obj === null) ? _true : _false ;
}
var _not_nullp = function (obj) {
	return (obj === null) ? _false : _true ;
}
var _boolp = function(obj) {
	return ((obj === _true) || (obj === _false)) ? _true : _false ;
}
	
//////////////////////////
// IMPLEMENTATION
//////////////////////
// __eqv NYI
// check (equal () ())

function __vequal( a, b) { // best a prototype NYI
		if(a.length !== b.length) return false;
		for(var i = 0; i< a.length; i++)
			if(! __equal(a[i],b[i])) return false;
		return true;
}

function __veqv( a, b) { // numerical vectors
		if(a.length !== b.length) return false;
		for(var i = 0; i< a.length; i++)
			if(a[i] !== b[i]) return false;
		return true;
}

function __equal(a,b) { // return false/true
		if(a === b) return true;
		if(a === null || b === null) return false;
		if(isListNotNull(a) && isListNotNull(b)) {
			if(a[TAG_CIRCULAR] || b[TAG_CIRCULAR]) return false; // NYI
			return __equal(a[0],b[0]) && __equal(a[1],b[1]) ;
			}
		if(a instanceof Vector && b instanceof Vector)
			return __vequal (a.vector, b.vector);
		if(a instanceof Struct && b instanceof Struct)
			return  (a.meta === b.meta) && __vequal(a.fields,b.fields) ;
		return (_numequal_xx(a,b) === _false) ? false : true; 
}
var _not = function (obj) { // returns #f / #t
	if(obj === _false) return _true;
	return _false;
}
var _eq = function (a, b) { // returns #f / #t
	if(a === b) return _true;
	return _false;
}
var _not_eq = function (a, b) { // returns #f / #t
	if(a === b) return _false;
	return _true;
}
var _eqv = function (a, b) { // returns #f / #t
	if(a === b) return _true;
	/*
	// (eqv 'list list)
	if((typeof a === "function") && (b instanceof Symbol) && (a.glfun.name === b.name)) 
				return _true; 
	if((typeof b === "function") && (a instanceof Symbol) && (b.glfun.name === a.name)) 
				return _true; 
   */
	if(a instanceof Vector && b instanceof Vector) 
			return __veqv  (a.vector, b.vector) ? _true : _false ;
	return _numequal_xx(a,b) ;
}
var _equal = function (a, b) { // returns #f / #t
	if(__equal(a,b)) return _true;
	return _false;
}
var _not_equal = function (a, b) { // returns #f / #t
	if(__equal(a,b)) return _false;
	return _true;
}

/*------------------------
logical
---------------------------*/

var _xor = function(a,b) { // not special
	return (a === _false && b === _false) ? _false :
	      (a !== _false && b !== _false) ? _false : _true;
	      }


var _and_xx  = function (self,env) { // special
	self = self[1];
	var a = __eval(self[0],env);
	var b = self[1][0];
	return (a === _false) ? _false : ((b = __eval(b,env)) === _false) ? _false : b;
	}
	
var _or_xx  = function (self,env) {
	self = self[1];
	var a = __eval(self[0],env);
	var b = self[1][0];
	return (a !== _false) ? a : __eval(b,env)  ;
	}
	
var _or_star  = function (self,env) {
	self = self[1];
	var a = __eval(self[0],env);
	var b = self[1][0];
	return (a !== _false &&  a !== null && a !== 0 && a !== "") ? a : __eval(b,env)  ; 
	}


var _and = function(self,env) { // special
		var exprs = self[1] , ret = _true;
		while(exprs) {
		if((ret = __eval(exprs[0],env)) === _false) return _false;
		exprs = exprs[1];
		}
		return ret ; // last
}
var _or = function(self,env) { // special
		var exprs = self[1] , ret = _false;
		while(exprs) {
		if((ret = __eval(exprs[0],env)) !== _false) return ret ;
		exprs = exprs[1];
		}
		return _false ;
}


////////////////
// search
////////////////
var _member = function (k, list) {
	if(list === null) return _false;
	if(notIsList(list)) return glisp_error(20,list,"member") ;
	while(list) {
		if(_equal (list[0],k) === _true) return list;
		list = list[1];
	}
	return _false;
}

var _member_star = function(k , list) {
	var inside ;
	if(list === null || notIsList(list)) return _false;
	while(list) {
			if(_equal (list[0],k) === _true) return list;
			inside = _member_star (k,list[0]);
			if(inside !== _false) return inside;
			list = list[1];
	}
	return _false;
}

// index returns #f if not found
var _list_index = function (k, list) {
var idx = 0;
	if(list === null) return -1;
	if(notIsList(list)) return glisp_error(20,list,"member") ;
	while(list) {
		if(_equal (list[0],k) === _true) return idx;
		list = list[1];
		idx++;
	}
	return _false;
}
var _memq = function (k, list) {
	if(list === null) return _false;
	if(notIsList(list)) return glisp_error(20,list,"memq") ;
	while(list) {
		if(list[0] === k ) return list;
		list = list[1];
	}
	return _false;
}
var _memv = function (k, list) {
	if(list === null) return _false;
	if(notIsList(list)) return glisp_error(20,list,"memv") ;
	while(list) {
		if(_eqv (list[0],k) === _true) return list;
		list = list[1];
	}
	return _false;
}



/////////////////////////////
// L I S T S    P R I M I T I V E S
// http://docs.racket-lang.org/reference/pairs.html
///////////////////

var _gensym = function () {
		return new Symbol("#:g" + __new_id()) ; 							// (++glisp.gensym)) ;
}
var _make_symbol = function (name) { // return name_i
	name = nameToString(name,"make-symbol");
	var sym = glisp_look_symbol(name);
	var ns = 0 ;
	if (!sym) return new Symbol(name);
	
	while (sym) { // already here ?
		ns++;
		sym = glisp_look_symbol(name  + "_" + ns);
		}
	return new Symbol(name  + "_" + ns);
}

var _cons = function(car,list) {
		return [car , list];
		}
		
var _length = function(list) { 
					if(list === null) return 0;
					if(list instanceof Procrastinator) return list.length() ;
					if(notIsList(list))  glisp_error(20,list,"length");
					if(list[TAG_CIRCULAR]) return +Infinity;
					return __length(list);
					}
					
var _car = function(list) { // same as _first
					if(list instanceof Procrastinator) return list.head() ;
					if(! Array.isArray (list))  glisp_error(20,list,"first, aka car");
					return list[0];
					}
					
var _cdr = function(list) {
					if(! Array.isArray (list)) glisp_error(20,list,"rest, aka cdr");
					 return list[1];
					 }
var _set_car = function(list, obj) { 
					if(! Array.isArray(list)) glisp_error(20,list,"set-car!");
					list[0] = obj;
					return list;
					}
					
var _set_cdr = function(list,obj) {
					if(! Array.isArray(list)) return glisp_error(20,list,"set-cdr!");
					 list[1] = obj ;
					 return list;
					 }
			
// error : TypeError: list[0][..] is undefined (firefox) trap me NYI 
var _caar = function(list) { return list[0][0];}
var _cadr = function(list) { return list[1][0];}
var _cdar = function(list) { return list[0][1];} 
var _cddr = function(list) { return list[1][1];} 

var _caaar =function(list) { return list[0][0][0];}
var _caadr =function(list) { return list[1][0][0];}
var _cadar =function(list) { return list[0][1][0];}
var _caddr =function(list) { return list[1][1][0];}
var _cdaar =function(list) { return list[0][0][1];}
var _cdadr =function(list) { return list[1][0][1];}
var _cddar =function(list) { return list[0][1][1];}
var _cdddr =function(list) { return list[1][1][1];}


var _list_ref = function  (list, pos) { 
			if(list instanceof Procrastinator) list = _procrastinator_to_list(list) ; 
			if(notIsList(list))  glisp_error(20,list,"list-ref");
			var last = list, _pos = pos ;
				while(last) { // pairs  bugged NYI
				if(!isListOrNull(last))  glisp_error(42,_pos,"list-ref");
				if(pos-- <= 0 ) return last[0];
				last = last[1];
				}
		return glisp_error(42,_pos,"list-ref");
		} // _list_ref
		
var _list_tail = function  (list, pos) { 
			if(list instanceof Procrastinator) list = _procrastinator_to_list(list) ; // trunc may be
			if(notIsList(list)) return glisp_error(20,list,"list-tail");
			if(pos < 0) pos = __length(list) + pos ; // NEW
			var last = list, _pos = pos ;
				while(last) { // pairs  bugged NYI
				if(!isListOrNull(last))  glisp_error(42,_pos,"list-tail");
				if(pos-- <= 0 ) return last;
				last = last[1];
				}
		return glisp_error(42,_pos,"list-tail");
		} // _list_tail
		
var _sublist = function  (list, start, end) { // --> a coy [start ..end[
			if(list instanceof Procrastinator) list = _procrastinator_to_list(list) ; 
			if(notIsList(list)) return glisp_error(20,list,"sublist");
			var next = list, _start = start,  ret = null , lg = end - start;
			if(lg < 0)  glisp_error(42,end,"sublist");
				while(start--) { 
								next = next[1];
								if(next === null) glisp_error(42,_start,"sublist");
								}
				while (next && lg--) {
									ret = [next[0],ret];
									next = next[1];
									}
				return _reverse(ret);
		} 
		
// polymorh take
// objects which repond to 'toList' 

var _state = function (obj) {
	if(typeof obj === "object" && obj.state)  return obj.state();
	glisp_error(12,obj,"state");
	}
	
var _set_state = function (top,argc) {
	var obj = _stack[top++];
	var state = (argc > 1) ? _stack[top] : undefined ; // to init
	if(typeof obj === "object" && obj.set_state)  return obj.state(state);
	glisp_error(12,obj,"set-state!");
	}

// compat feature (take n obj) may be better
var _take = function (obj, n,env) {
/*	if(!(env instanceof GLenv)) {
				glisp_error(1,obj,"take - missing env") ;
				}
*/

	if(n === _KWD_ALL) n = 65536 ;
	if(! isSmallInteger(n)) { var tmp = obj ; obj = n ; n = tmp; }
	
	if(obj === null) return null;
	if(! isSmallInteger(n)) glisp_error(61,n,"(take obj number-of-items)") ;
	
	if (isProc(obj)) {
		var proc = checkProc(obj,1,1,"take");
		proc = [proc,[null,null]];
		var ret = [];
		for(var i =0; i< n ; i++) {
					proc[1][0] = i;
					ret.push(__ffuncall(proc,env));
					}
		 return __array_to_list(ret);
		 }
	else if(isList(obj)) {
		var ret = [];
		var is_a_set = obj[TAG_SET] ;
		while (n-- && obj) { ret.push(obj[0]) ; obj=obj[1]; }
		ret = __array_to_list(ret);
		if(is_a_set) ret[TAG_SET] = true;
		return ret;
		}
	else if(typeof obj === "string")
		return obj.substr(0,n) ;
	else if (obj instanceof Vector)
		return new Vector(obj.vector.slice(0,n)) ;
	else if (obj instanceof Stream || obj instanceof NumStream) // ugly NYI
		return Stream.toList(obj,n) ;
	else if (obj instanceof Procrastinator)
		return obj.toList(n);
	
	return glisp_error(12,obj,"take");
}

var _drop = function (obj, n) {
	if(! isSmallInteger(n)) { var tmp = obj ; obj = n ; n = tmp; }
	if(! isSmallSmallInteger(n)) glisp_error(61,n,"(drop obj number-of-items)") ;
	if(isList(obj)) {
	var is_a_set = obj[TAG_SET] ;
	while (n-- && obj) { obj=obj[1]; }
		if(obj === null) return null;
		if(is_a_set) obj[TAG_SET] = true;
		return obj;
		}
	else if(typeof obj === "string")
		return obj.substr(n) ;
	else if (obj instanceof Vector)
		return new Vector(obj.vector.slice(n)) ;
	/*
	else if (obj instanceof Stream || obj instanceof NumStream) //  NYI
		return Stream.toList(obj,n) ;
	*/
	else if (obj instanceof Procrastinator)
		return obj.drop(n);
		
	return glisp_error(12,obj,"drop");
}

var _last = function  (list) { 
			if(list instanceof Procrastinator) return list.last();
			if(notIsList(list))  glisp_error(20,list,"last");
			if(list[TAG_CIRCULAR]) glisp_error(80,list[0],"last");
			var last = list ;
				while(last) { // pairs  bugged NYI
				if(!isListOrNull(last))  glisp_error(20,list,"last");
				if(last[1] === null) return last[0];
				last = last[1];
				}
		} // _last


var _list = function(top,argc) {
		if(argc === 0) return null;
		var l = [null,null], next = l,  last = top + argc ;
		for(var i = top ; i < last ; i++) {
			next[0] = _stack[i];
			if( i === last - 1) return l ;
			next[1] = [null,null];
			next = next[1];
		}
		return l;
	} // _list
	
var __make_circular = function (lst) {
	var self = lst, argc = 0;
	while(lst) {
			argc++;
			if(lst[1] === null) break;
			lst = lst[1];
			}
	lst[1] = self;
	self[TAG_CIRCULAR] = argc;
}

var _circular_list = function(top,argc) {
		if(argc === 0) return null;
		var lst = [null,null], next = lst,  last = top + argc ;
		for(var i = top ; i < last ; i++) {
			next[0] = _stack[i];
			if( i === last - 1)  break;
			next[1] = [null,null];
			next = next[1];
		}
	next[1] = lst ;
	lst[TAG_CIRCULAR] = argc ; // pattern length 
	return lst;
} // circular-list

var _make_list = function (length , obj) { // NEW DOC
	if(! isSmallInteger(length))  glisp_error(22,length,"make-list");
	var lst = [obj,null];
	while(--length) lst = [obj, lst];
	return lst;
}

var _append = function(top,argc) {
	if(argc === 0) return null;
	if(argc === 1) return _stack[top] ;
	if(argc === 2) return __append_2(_stack[top],_stack[top+1]);
	if(_stack[top] === null) return _append(top+1,argc-1) ;
	
	var last = top+argc ;
	var list = _stack[last-1];
		for(var i = last-2 ; i >= top ; i--) {
		//	if(!isListOrNull (_stack[i]))  glisp_error(20,_stack[i],"append");
			list = __append_2 (_stack[i],list) ;
			}
	list[TAG_SET] = undefined;
	return list;
}

var _nconc = function(top,argc) {
	if(argc === 0) return null;
	if(argc === 1) return _stack[top] ;
	if(_stack[top] === null) return _nconc(top+1,argc-1) ;
	var last = top+argc ;
	var list = _stack[top];
		for(var i = top+1 ; i < last ; i++) {
			// if(!isListOrNull (_stack[i])) return glisp_error(20,_stack[i],"nconc");
			list = __nconc_2 (list,_stack[i]) ;
			}
	return list;
}

var _reverse = function (list) { // (reverse null) is OK
	if(!isListOrNull(list)) return glisp_error(20,list,"reverse");
	var rev = null ;
		while(list) {
			rev = [list[0],rev];
			list = list[1];
			}
	return rev;
} // reverse

// (sortf a b) -> #t|#f
var _list_sort = function (sortf, list , env) {
	if(list === null) return null;
	if(notIsList(list)) glisp_error(20,list,"list-sort");
	sortf = checkProc(sortf,2,2,"list-sort");
	var arr = __list_to_array(list);
	__array_sort(sortf,arr,env);
	return __array_to_list(arr);
	}
	
var _list_sort_fields = function (numf , list) {
	if(notIsList(list)) glisp_error(20,list,"sort/fields");
	var arr = __list_to_array(list);
	__array_sort_fields(numf,arr);
	return __array_to_list(arr);
	}
	
// in  jsarray ((7 7) (8 8 8) (7) (1) ( 8 8))
// out jsarray ((7 7 7) (1) (8 8 8 8 8))
// // may be O(n^2)
function __group_merge(arr, proc , env) {
	var i,j,gi,gj,same,length = arr.length;
	var ret = [];
	var call =  [proc,[null,[null,null]]] ;
	
	for (i = 0; i < length-1;i++) {
	gi = arr[i];
	if(gi === undefined) continue;
	gi = gi[0];
		for(j=i+1;j<length;j++) {
		gj = arr[j];
		if(gj === undefined) continue;
		gj= gj[0];
		
		same = (proc === null)  ? gi === gj :
		(call[1][0] = gi , call[1][1][0] = gj , __ffuncall(call,env) !== _false) ;
		
		if(same) { // merge
				arr[i] = arr[i].concat(arr[j]);
				arr[j] = undefined;
				}
		}} // i, j
		for(i=0; i< length; i++)
			if(arr[i] !== undefined) ret.push(arr[i]);
	return ret;
}
	
// (group '( 6 6 7 8 8  7 7 7)) → ((6 6) (7 ) (8 8 ) (7 7 7))
// in, out : groups =js arrays
// uses _equal
var _list_group_1 = function (list, proc, env) {
	var ret = [], group = [], item = undefined , call = [proc,[null,[null,null]]] , diff ;
	while(list) {
	
		diff = (item === undefined ) ? false : 
		      (proc === null) ?  !  __equal(item ,list[0]) : // bogue !=
		      (call[1][0] = item , call[1][1][0] = list[0] , __ffuncall(call,env) === _false) ;
		      
		if( diff ) {
					ret.push(group);
					group = [] ;
					}
					
		 group.push (list[0]) ; // eq?
		 item = list[0] ;
	list = list[1];
	}
	if(group.length) ret.push(group) ;
	return ret;
}

var _list_group = function (top,argc,env) {
	var list = _stack[top++] ;
	if(notIsList(list))  glisp_error(20,list,"group");
	var proc = (argc > 1) ? checkProc(_stack[top],2,2,"group") : null;
	
	return  __array_to_list (__jsmaparray (__array_to_list , (_list_group_1(list,proc,env))));
}

var _list_group_merge = function (top,argc,env) {
	var list = _stack[top++] ;
	if(notIsList(list))  glisp_error(20,list,"group");
	var proc = (argc > 1) ? checkProc(_stack[top],2,2,"group*") : null;
	
	return  __array_to_list 
	 (__jsmaparray (__array_to_list, (__group_merge (_list_group_1(list,proc,env), proc,env))));
}

// (define L' [[1] 2 [[3 4] 5] [[[]]] [[[6]]] 7 8 []])
var __list_flatten_1 = function (list) {
	var ret = [], sub ;
	while(list) {
		if(isListNotNull(list[0])) 
				ret  = ret.concat ( __list_flatten_1(list[0]));
			else if (list[0] !== null)
				ret.push(list[0]);
		list = list[1];
		}
	return ret ;
	}
	
var _list_flatten = function (list) {
	if(notIsList(list))  glisp_error(20,list,"flatten");
	return __array_to_list(__list_flatten_1(list));
}
	
// uses eq? predicate O(n)
var _list_swap = function (list , u , v) {
var upos = null, vpos = null, c_list = list;
	if(notIsList(list)) return glisp_error(20,list,"list-swap!");
	if(u === v) return list;
	while (list) {
		if(list[0] === u) upos = list;
		if(list[0] === v) vpos = list;
		if(upos && vpos) break;
		list = list[1];
		}
	if(upos === null || vpos === null) glisp_error(117,[u ,[v,null]],"list-swap!");
	upos[0]=v;
	vpos[0]=u;
	return c_list;
	}
	
var _list_swap_ref = function (list , i , j) {
var tmp, s_list = list , ilist= null, jlist = null;
	if(notIsList(list)) return glisp_error(20,list,"list-swap-ref!");
	if(i === j) return list;
	while(list  && ((ilist === null) || (jlist === null))) {
		if(i-- === 0) ilist = list;
		if(j-- === 0) jlist = list;
		list = list[1];
	}
	if(ilist === null || jlist === null ) glisp_error(24,0,"list-swap-ref!") ;
	tmp = ilist[0]; ilist[0] = jlist[0] ; jlist[0] = tmp;
	return s_list ;
	}
	
	
/*----------------
S E T S
have TAG_SET = true (only for print info)
---------------*/

function __check_set(a,sender) {
		if ((a === null) || (Array.isArray(a) && a[TAG_SET])) return ;
		glisp_error(95,a,sender);
}

// input : sets items to compare : sets or lists
function __subset_cmp(a,b) {
var rc ;
	if(a[TAG_SET] && ! b[TAG_SET]) return 1;
	if(b[TAG_SET] && ! a[TAG_SET]) return -1;
	while (a && b) {
		if((!Array.isArray(a)) || (! Array.isArray(b))) return __set_cmp(a,b);
		
		rc = __set_cmp(a[0],b[0]); if(rc) return rc;
		a = a[1];
		b = b[1];
	}
	if(a === null && b === null) return 0;
	if(a === null) return -1;
	return 1;
}

// input : a,b two set items to compare (may-be sets or lists)
// ordering : null < number < string = symb < set
// out : 0 or < 0 or > 0
// functions NYI
function __set_cmp  (a,b) { // used to sort and sets ops : union, ...
		if(a === b) return 0;
		if(a === null) return -1;
		if(b === null) return 1;
		if(typeof a === "number" || a instanceof Rational) {
				if (typeof b === "number"  || b instanceof Rational) return a - b ;
				return -1 ;
				}
		if(typeof b === "number" || b instanceof Rational) return  1;
		if(a instanceof Symbol) a= a.name;
		if(b instanceof Symbol) b= b.name;
		if(typeof a === "string" && typeof b === "string") 
				 return  (a === b) ? 0 : (a > b) ? 1 : -1 ;
		if(typeof a === "string" ) return -1 ;
		if(typeof b === "string" ) return 1 ;
		if(Array.isArray(a) && Array.isArray(b)) return __subset_cmp(a,b);
		if(Array.isArray(a)) return 1;
		if(Array.isArray(b)) return -1;
		return (0 + a) - ( 0 + b) ; // big ints
		// BigInt NYI
		}
		
var _set_p = function (set1) { // predicate
if(set1 === null) return _true;
if(notIsList(set1)) return _false;
if(set1[TAG_SET]) return _true;
	return _false;
}

// input : set1 : glisp list
// makes sets of subsets inside
function __set_sort ( a , b)  
		{ return - __set_cmp ( a , b); } // -> 0 or > 0 or < 0

var _make_set = function (set1) {
var i, a;
	if(set1 === null) return null;
	if(notIsList(set1)) return set1; //  glisp_error(20,set1,"make-set");
	if(set1[TAG_SET]) return set1;

// leave inside items as is
/*
	var cset1 = set1;
	while(cset1) {
		cset1[0] = _make_set(cset1[0]) ;
		cset1= cset1[1];
	}
*/
	
	a = __list_to_array(set1);
	a.sort(__set_sort); // sort inverse
	// remove dups
	for( i = a.length; i >=1; i--) 
		if(__set_cmp(a[i],a[i-1]) === 0) a[i] = undefined;
	return __array_to_set(a); // inverse, and sets TAG_SET
}

var _set_equal_p = function (set1, set2) {
	__check_set(set1,"set-equal");
	__check_set(set2,"set-equal");
	return (__subset_cmp(set1,set2) === 0 ) ? _true : _false; 
}

var _set_intersectp = function (set1,set2) { // (set-intersect? s1 s2)
	if(set1=== null || set2=== null) return null;
	__check_set(set1,"set-∩");
	__check_set(set2,"set-∩");
	var	rc ;

	while(set1 && set2) {
		rc = __set_cmp(set1[0],set2[0]);
		if(rc === 0) return _true;
		else if(rc > 0 ) set2=set2[1];
		else set1= set1[1];
		}
	return _false;
	}
	
	
var _set_intersect = function (set1,set2) { // (set-intersect s1 s2)
	if(set1=== null || set2=== null) return null;
	__check_set(set1,"set-∩");
	__check_set(set2,"set-∩");
var ret = [] , rc ;

	while(set1 && set2) {
		rc = __set_cmp(set1[0],set2[0]);
		if(rc === 0) { ret.push (set1[0]) ; set1=set1[1];set2=set2[1];}
		else if(rc > 0) set2=set2[1];
		else set1= set1[1];
		}
		
	ret = __array_to_list(ret);
	if(ret) ret[TAG_SET] = true;
	return ret ; 
	}
	
var _set_subset_p = function (set1,set2) { // (set-subset? s1 s2) : s2 in s1 ?
	__check_set(set1,"set-∩");
	__check_set(set2,"set-∩");
var  rc ;

	while(set1 && set2) {
		rc = __set_cmp(set1[0],set2[0]);
		if(rc === 0) { set1=set1[1];set2=set2[1];}
		else if(rc > 0) return _false ;
		else set1= set1[1];
		}

	return (set2 === null) ?  _true  : _false ;
	}
	
// all in s1 not in s2
var _set_substract = function (set1,set2) { // (set-substract s1 s2)
	__check_set(set1,"set-∖");
	__check_set(set2,"set-∖");
	if(set1 === null) return null;
	if(set2 === null) return set1;
	var rc, ret = null;
	
		while(set1 && set2) {
		rc = __set_cmp(set1[0],set2[0]);
		if(rc === 0) {set1=set1[1];set2=set2[1];}
		else if(rc > 0) set2=set2[1];
		else {ret = [set1[0],ret]; set1 = set1[1];}
		}
		
	while(set1) { ret = [set1[0],ret]; set1= set1[1]; }
	ret = _reverse(ret);
	if(ret) ret[TAG_SET] = true;
	return ret ; 
	}
	
var _set_union = function (set1,set2) { // (set-union s1 s2)
	__check_set(set1,"set-∪");
	__check_set(set2,"set-∪");
	if(set1 === null) return set2;
	if(set2 === null) return set1;
	var rc, ret = null;
	
		while(set1 && set2) {
		rc = __set_cmp(set1[0],set2[0]);
		if(rc === 0) {ret = [set1[0],ret]; set1=set1[1];set2=set2[1];}
		else if(rc > 0) {ret = [set2[0],ret]; set2=set2[1]}
		else {ret = [set1[0],ret]; set1 = set1[1];}
		}
	if(set1) while(set1) { ret = [set1[0],ret]; set1= set1[1]; }
	if(set2) while(set2) { ret = [set2[0],ret]; set2= set2[1]; }
	
	ret = _reverse(ret);
	if(ret) ret[TAG_SET] = true;
	return ret ; 
	}
	
// does not return a set
var _set_product = function (set1,set2) { // (set-products1 s2)
	__check_set(set1,"set-*");
	__check_set(set2,"set-*");
	if(set1 === null) return null;
	if(set2 === null) return null;
	var rc, s_set2 = set2 , ret = [] ;
		while(set1 ) {
		set2 = s_set2 ;
			while(set2) {
			ret.push( [set1[0],set2[0]]) ; // cons
			set2= set2[1];
			}
		set1= set1[1];
		}
	ret = __array_to_list(ret);
	return ret ; 
	}
	
// symetric difference : exactly members of one of set_i ⊖

var _set_sym_diff = function (set1,set2) { // (set-union s1 s2)
	__check_set(set1,"set-⊖");
	__check_set(set2,"set-⊖");
	if(set1 === null) return set2;
	if(set2 === null) return set1;
	var rc, ret = null;
	
		while(set1 && set2) {
		rc = __set_cmp(set1[0],set2[0]);
		if(rc === 0) { set1=set1[1];set2=set2[1];}
		else if(rc > 0 ) {ret = [set2[0],ret]; set2=set2[1]}
		else {ret = [set1[0],ret]; set1 = set1[1];}
		}
	if(set1) while(set1) { ret = [set1[0],ret]; set1= set1[1]; }
	if(set2) while(set2) { ret = [set2[0],ret]; set2= set2[1]; }
	
	ret = _reverse(ret);
	if(ret) ret[TAG_SET] = true;
	return ret ; 
	}
	
/*----------------
stacks
----------------------*/
var _pop = function (symb) {
	if(! (symb instanceof Symbol)) glisp_error(23,symb,"pop");
	if(symb.stack === undefined) return _false;
	var value = symb.stack.pop();
	return (value === undefined) ? _false : value;
}
var _set_stack_empty = function (symb) { // stack creation
	if(! (symb instanceof Symbol)) glisp_error(23,symb,"set-stack-empty!");
	symb.stack = [] ;
	return symb ;
}
var _stack_to_list = function (symb) {
	if(! (symb instanceof Symbol)) glisp_error(23,symb,"stack");
	if(symb.stack === undefined) return null;
	return __array_to_list(symb.stack) ;
}
var _list_to_stack = function (list ,symb) {
	if(! isListOrNull (list)) glisp_error(20,list,"list->stack");
	if(! (symb instanceof Symbol)) glisp_error(23,symb,"list->stack");
	symb.stack = (list === null) ? [] : __list_to_array(list) ;
	return symb  ;
}
var _push = function (symb, value) {
	if(! (symb instanceof Symbol)) glisp_error(23,symb,"push");
	if(symb.stack === undefined) symb.stack = [];
	symb.stack.push(value) ;
	return value;
}
var _stack_empty = function (symb) { // predicate
	if(! (symb instanceof Symbol)) glisp_error(23,symb,"stack-empty");
	return (symb.stack === undefined || symb.stack === null || symb.stack.length === 0) ? 
			_true : _false ;
	}
var _stack_top = function (symb) {
	if(! (symb instanceof Symbol)) glisp_error(23,symb,"stack-top");
	if (symb.stack === undefined || symb.stack === null || symb.stack.length === 0)  return _false;
	return symb.stack[symb.stack.length-1];
	}
	
var _stack_length = function (symb) {
	if(! (symb instanceof Symbol)) glisp_error(23,symb,"stack-length");
	if (symb.stack === undefined || symb.stack === null ) return 0;
	return symb.stack.length;
	}
	
var _stack_swap = function (symb) {
	if(! (symb instanceof Symbol)) glisp_error(23,symb,"stack-swap");
	if (symb.stack === undefined || symb.stack === null || symb.stack.length <= 1)  return _false;
	var tmp =  symb.stack[symb.stack.length-2];
	symb.stack[symb.stack.length-2] = symb.stack[symb.stack.length-1];
	symb.stack[symb.stack.length-1] = tmp;
	return tmp; // new top
	}

/*---------------------
symbol info
------------------*/
// get/sets info - 
// 2.9 : NEW NYI info is stored in local-db
var _info = function (top,argc) {
	var symb = _stack[top++];
	if(!isSymbol( symb)) return symb ;
	if(argc === 1)  {
					var syminfo = __local_get (symb.name, "info");
					return syminfo || _false ;
					}
	__local_put(symb.name,_stack[top], "info") ;
	return symb;
}
		
///////////////////
// p-lists
///////////////////////

var _putprop = function (symb, val, key) { // order : careful
			if(! (symb instanceof Symbol))  glisp_error(35,symb,"putprop");
			key = nameToString(key,"putprop");
			symb.plist[key] = val;
			return val;
			}
var _getprop = function (symb,  key) {
			if(! (symb instanceof Symbol))  glisp_error(35,symb,"getprop");
			key = nameToString(key,"getprop");
			var val = symb.plist[key] ;
			return (val === undefined) ? _false : val;
			}
var _remprop = function (symb,  key) {
			if(! (symb instanceof Symbol))  glisp_error(35,symb,"remprop");
			key = nameToString(key,"remprop");
			var val = symb.plist[key] ;
			symb.plist[key] = undefined;
			return (val === undefined) ? _false : _true;
			}
			
// from p-list to (key key...)
var _plist_keys = function (symb) {
	if(! (symb instanceof Symbol))  glisp_error(35,symb,"plist-keys");
	return __prop_to_keys (symb.plist) ;
}

// from p-list to ((key val) ...)
var _symbol_plist = function (symb) {
		if(! (symb instanceof Symbol))  glisp_error(35,symb,"symbol-plist");
		return _prop_val_to_list (symb.plist);
	}
	
// from ((key val) ..) to p-list
var _set_plist = function (symb , list) {
var kval,plist;
	if(! (symb instanceof Symbol))  glisp_error(35,symb,"symbol-plist");
	if( ! isListOrNull(list)) glisp_error(20,list,"set-plist!");
	symb.plist = _list_to_prop_val(list, true); // no stringify value
	return symb;
}
	
/////////////////////
// alists
////////////////////////////
var _alistp = function(alist) {
	if(! isListOrNull (alist)) return _false;
	while(alist) {
		if(notIsList(alist [0])) return _false;
		alist = alist[1];
	}
	return _true;
}

var _assq  = function (obj, alist) { // eq?
	if(! isListOrNull (alist)) return _false;
		while(alist) {
		if(notIsList(alist [0])) return _null; // not a list best error NYI
		if(alist[0][0] === obj) return alist[0] ;
		alist = alist[1];
	}
	return _false;
}

var _assv = function (obj, alist) { // eqv? 
	if(! isListOrNull (alist)) return _false;
		while(alist) {
		if(notIsList(alist [0])) return null; // not a list best error NYI
		if(alist[0][0] === obj) return alist[0] ;
		alist = alist[1];
	}
	return _false;
}

var _assoc = function (obj, alist) { // equal?
	if(! isListOrNull (alist)) return _false;
		while(alist) {
		if(notIsList(alist [0])) return null; // not a list best error NYI
		if(__equal(alist[0][0] , obj)) return alist[0] ;
		alist = alist[1];
	}
	return _false;
}

// -> (lambda ( key alist) (_assoc_proc_call key alist pred sel))
var _association_procedure = function (predicate, selector) {
checkProc(predicate,2,2,"assoc-predocate");
checkProc(selector,1,1,"assoc-selector");
var key = _gensym();
var alist = _gensym();
	var call = [_assoc_proc_call , [key, [alist , [ predicate , [selector , null]]]]] ;
	var lambda = [_lambda , [[key ,[alist,null]] , [ call, null]]] ;
	glex_lambda(lambda);
	return lambda;
}

// Another example is a “reverse association” procedure:
// (define rassv (association-procedure eqv? cdr))
     
var  _assoc_proc_call = function (key,alist,predicate,selector,env) {
var testcall, selectcall, item  ;

	if(! isListOrNull (alist)) return _false;
	var testcall =   [predicate, [null, [key ,null]]];
	var selectcall = [selector , [null , null]] ; // --> item to compare
		while(alist) {
		if(notIsList(alist [0])) return _false; // not a list best error NYI
		selectcall[1][0] = alist[0];
		item = __ffuncall(selectcall,env);
		testcall[1][0] = item ;
		if(__ffuncall (testcall, env) === _true) return alist[0];
		alist = alist[1];
	}
	return _false;
}

///////////////////
// M A P P I N G
// uses __ffuncall : no arg eval
/////////////////////

var _apply = function (proc, list, env) {
		return __ffuncall ([proc, list], env);
}

// _apply_curry = function(proc , args_1 , tail_1 , args_2) {
var _apply_curry= function (self, env) {
self = self[1];
		var proc = self[0]; self= self[1];
		var args_1 = self[0]; self = self[1];
		var tail_1 = self[0]; self = self[1];
		var args_2 = __eval(self[0],env);
		
		tail_1[1] = args_2; // concatenates
		return __ffuncall ([proc , args_1], env);
		}
		
// _apply_rcurry = function(proc , args_1 , args_2) {
var _apply_rcurry = function (self, env) {
self = self[1];
		var proc = self[0]; self= self[1];
		var args_1 = self[0]; self = self[1];
		var args_2 = __eval(self[0],env);
		var args  = __append_2(args_2, args_1); // nconc KO
		return __ffuncall ([proc , args], env);
		}
	
		
// return (lambda x (_apply_curry proc first:(v1 ..vn) tail:(vn) x) )
// return (lambda x (_apply_rcurry proc first:(v1 ..vn)  x) )
// (curry proc v1 ... vn)

var _curry_1 = function (self,method,env) {
	self = self[1];
	var proc = self[0];
	// formal ??
		if(isSymbol(proc)) proc = proc.fval ;
		if(Array.isArray(proc)) proc = __eval(proc,env) ;

	var vals = self[1];
	var args = [0,null];
	var first = args;
	var tail ;
	var argc = 0;
		while (vals) { // at least one
			argc++;
			args[0] = __eval(vals[0],env) ;
			tail = args;
			vals = vals[1];
			if(vals === null) break ;
			args[1]= [ 0, null] ;
			args = args[1];
		}
	// check argc > 0 NYI
	checkProc(proc,argc,undefined,"curry");
		
	args = __array_to_list(args);
	var x = _gensym();
	var call =  (method === _apply_curry) ? 
			[method , [ proc, [first, [tail ,[x , null]]]]] :
			[method , [ proc, [first, [x , null]]]] ;
			
	var lambda = [_lambda ,  [ x , [ call, null]]];
	glex_lambda(lambda);
	return lambda;
}

var _curry = function (self,env) {
	return _curry_1(self,_apply_curry,env);
}
var _rcurry = function (self,env) {
	return _curry_1(self,_apply_rcurry,env);
}



var _for_each = function (top, argc,env) {
		var proc,list1,list2 = null;
		proc = _stack[top++];
		list1 = _stack[top++];
		if(list1 === null) return __void;
		
		if(list1 instanceof Vector) return _vector_for_each (top-2,argc,env) ;
		if(argc > 2) list2 = _stack[top++];
		if(list1 instanceof Procrastinator) return Procrastinator.g_for_each (proc,list1,list2,env);
		
		if(argc > 3) glisp_error(38,"","for-each:4:n");
		if(notIsList(list1)) glisp_error(20,list1,"for-each");
		if(list2 && notIsList(list2)) glisp_error(20,list2,"for-each");
		
		return (argc === 2) ?
				 _for_each_2 (proc,list1,env) :
				 _for_each_3(proc,list1,list2,env);
}

function _for_each_2  (proc, list, env) {
	proc = checkProc(proc,1,1,"for-each");
	var fcall = [proc, [null , null]];
	while(list) {
			fcall[1][0] = list[0];
			__ffuncall(fcall,env) ;
			list = list[1];
			}
return __void ;
}

function _for_each_3 (proc, list1, list2,  env) {
	proc = checkProc(proc,2,2,"for-each");
	var fcall = [proc, [null , [null , null]]];
	while(list1 && list2) {
			fcall[1][0] = list1[0];
			fcall[1][1][0] = list2[0];
			__ffuncall(fcall,env);
			list1 = list1[1];
			list2 = list2[1];
			}
return __void;
}

// (filter pred list)
var _filter = function (pred, list, env) {
	if(list === null) return null;
	pred = checkProc(pred,1,1,"filter");
	
	if(list instanceof Procrastinator) return Procrastinator.g_filter(pred,list,env);
	if(notIsList(list)) glisp_error(20,list,"filter");
	
	var fcall = [pred, [null , null]];
	var ret = [];
	while(list) {
			fcall[1][0] = list[0];
			if( __ffuncall(fcall,env)  !== _false)  ret.push(list[0]);
			list = list[1];
			}
return __array_to_list(ret);
}

var _filter_count = function (pred, list, env) {
if(list === null) return 0;
if(notIsList(list)) glisp_error(20,list,"filte-countr");
// if(!isProc(pred,1,1)) glisp_error(xx,pred,"filter"); // arity checker NYI
	var fcall = [pred, [null , null]];
	var ret = 0 ;
	while(list) {
			fcall[1][0] = list[0];
			if( __ffuncall(fcall,env) !==  _false)  ret++ ;
			list = list[1];
			}
return ret ;
}

//(maplist proc list)
var _maplist = function (proc , list , env) { 
if(list === null) return null;
if(notIsList(list)) glisp_error(20,list,"maplist");
	var fcall = [proc, [null , null]];
	var ret = null;
	while(list) {
			fcall[1][0] = list;
			ret = [__ffuncall(fcall,env),ret];
			list = list[1];
			}
return _reverse(ret);
}

// (map proc list|vector ...)
var _map = function (top, argc,env) {
var proc,list1,list2 = null;
		var proc = _stack[top++];
		var list1 = _stack[top++];
		
		if (list1 instanceof Vector) return _vector_map(top-2,argc,env);
		
		if(argc > 2) list2 = _stack[top++];
		if(argc > 3) glisp_error(38,"","map:4:n");
		if(list1 === null) return null;
		
		if (list1 instanceof Procrastinator || list2 instanceof Procrastinator) 
				return Procrastinator.g_map (proc,list1,list2,env);
		
		if(notIsList(list1)) glisp_error(20,list1,"map");
		if(list2 && notIsList(list2)) glisp_error(20,list2,"map");
		
		return (argc === 2) ?
				 _map_2 (proc,list1,env) :
				 _map_3 (proc,list1,list2,env);
}

function _map_2  (proc, list, env) {
// could make direct call if sysfun:1:1 NYI (easy)
	proc = checkProc(proc,1,1,"map");
	var fcall = [proc, [null , null]];
	var ret = [];
	while(list) {
			fcall[1][0] = list[0];
			ret.push  (__ffuncall(fcall,env));
			list = list[1];
			}
return __array_to_list(ret) ;
}

function _map_3 (proc, list1, list2,  env) {
	proc = checkProc(proc,2,2,"map");
	var fcall = [proc, [null , [null , null]]];
	var ret = [];
	while(list1 && list2) {
			fcall[1][0] = list1[0];
			fcall[1][1][0] = list2[0];
			ret.push (__ffuncall(fcall,env));
			list1 = list1[1];
			list2 = list2[1];
			}
return __array_to_list(ret) ;
}

// (every proc list ...)
var _every = function (top, argc,env) {
var proc,list1,list2 = null;
		var proc = _stack[top++];
		var list1 = _stack[top++];
		if(argc > 2) list2 = _stack[top++];
		if(argc > 3) glisp_error(38,"","every:4:n");
		if(list1 === null) return _false ;
		
		if (list1 instanceof Procrastinator || list2 instanceof Procrastinator) 
			return Procrastinator.g_every (proc,list1,list2,env);
		
		if(notIsList(list1)) glisp_error(20,list1,"every");
		if(list2 && notIsList(list2)) glisp_error(20,list2,"every");
		
		return (argc === 2) ?
				 _every_2 (proc,list1,env) :
				 _every_3 (proc,list1,list2,env);
}

function _every_2  (proc, list, env) {
// could make direct call if sysfun:1:1 NYI (easy)
	proc = checkProc(proc,1,1,"every");
	var fcall = [proc, [null , null]];
	while(list) {
			fcall[1][0] = list[0];
			if (__ffuncall(fcall,env) === _false) return _false;
			list = list[1];
			}
return _true ;
}

function _every_3 (proc, list1, list2,  env) {
	proc = checkProc(proc,2,2,"every");
	var fcall = [proc, [null , [null , null]]];
	while(list1 && list2) {
			fcall[1][0] = list1[0];
			fcall[1][1][0] = list2[0];
			if (__ffuncall(fcall,env) === _false) return _false;
			list1 = list1[1];
			list2 = list2[1];
			}
return _true;
}

// (any proc list ...) -> a | #f
var _any = function (top, argc,env) {
var proc,list1,list2 = null;
		var proc = _stack[top++];
		var list1 = _stack[top++];
		if(argc > 2) list2 = _stack[top++];
		if(argc > 3) glisp_error(38,"","any:4:n");
		if(list1 === null) return _true ;
		
		if (list1 instanceof Procrastinator || list2 instanceof Procrastinator) 
			return Procrastinator.g_any (proc,list1,list2,env);

		
		if(notIsList(list1)) glisp_error(20,list1,"any");
		if(list2 && notIsList(list2)) glisp_error(20,list2,"any");
		
		return (argc === 2) ?
				 _any_2 (proc,list1,env) :
				 _any_3 (proc,list1,list2,env);
}

function _any_2  (proc, list, env) {
// could make direct call if sysfun:1:1 NYI (easy)
	proc = checkProc(proc,1,1,"any");
	var fcall = [proc, [null , null]];
	while(list) {
			fcall[1][0] = list[0];
			if (__ffuncall(fcall,env) !== _false ) return list[0];
			list = list[1];
			}
return _false ;
}

function _any_3 (proc, list1, list2,  env) {
	proc = checkProc(proc,2,2,"any");
	var fcall = [proc, [null , [null , null]]];
	while(list1 && list2) {
			fcall[1][0] = list1[0];
			fcall[1][1][0] = list2[0];
			if (__ffuncall(fcall,env) !== _false) return [list1[0],list2[0]];
			list1 = list1[1];
			list2 = list2[1];
			}
return _false;
}

// FOLD
// (foldl cons '() '(1 2 3 4))   --> '(4 3 2 1)
var _foldl = function (top, argc,env) {
var proc,acc,list1,list2 = null;
		var proc = _stack[top++];
		var acc = _stack[top++]; // init acc
		var list1 = _stack[top++];
		if(argc > 3) list2 = _stack[top++];
		if(argc > 4) glisp_error(38,"","fold:5:n");
		if(list1 === null) return acc;
		
		if (list1 instanceof Procrastinator || list2 instanceof Procrastinator) 
			return Procrastinator.g_fold (proc,acc,list1,list2,env);

		if(notIsList(list1)) glisp_error(20,list1,"fold");
		if(list2 && notIsList(list2)) glisp_error(20,list2,"fold");
		
		return (argc === 3) ? _foldl_3 (proc,acc,list1,env) :
							  _foldl_4(proc,acc,list1,list2,env);
}

var _foldr = function (top, argc,env) {
var proc,acc,list1,list2 = null;
		var proc = _stack[top++];
		var acc = _stack[top++]; // init acc
		var list1 = _stack[top++];
		if(list1 === null) return acc;
		if(argc > 3) list2 = _stack[top++];
		if(argc > 4) glisp_error(38,"","foldr:5:n");
		if(notIsList(list1)) glisp_error(20,list1,"foldr");
		if(list2 && notIsList(list2)) glisp_error(20,list2,"foldr");
		
		return (argc === 3) ?  _foldl_3 (proc,acc,_reverse(list1),env) :
							   _foldl_4(proc,acc,_reverse(list1),_reverse(list2),env);
}

function _foldl_3 (proc,acc, list, env) {
	proc = checkProc(proc,2,2,"fold");
	var fcall = [proc, [null , [null , null]]];
	
	while(list) {
			fcall[1][0] = list[0];
			fcall[1][1][0] = acc;
			acc = __ffuncall(fcall,env);
			list = list[1];
			}
return acc;
}


function  _foldl_4  (proc, acc, list1, list2,  env) {
	proc = checkProc(proc,3,3,"fold");
	var fcall = [proc, [null , [null , [null , null]]]];
	while(list1 && list2) {
			fcall[1][0] = list1[0];
			fcall[1][1][0] = list2[0];
			fcall[1][1][1][0] = acc;
			acc = __ffuncall(fcall,env);
			list1 = list1[1];
			list2 = list2[1];
			}
return acc;
}




/*--------------
mark ops
null !== #f
---------------*/
var _mark = function  (list , flag) {
	if(list === _false) return list ; // comes from member
	if(list === null) return list;
	if(notIsList(list)) glisp_error(20,list,"mark") ;
	list[TAG_MARK] = flag;
	return list;
	}

var _markp  = function (list) {
	if(notIsList(list)) glisp_error(20,list,"mark?") ;
	if( list[TAG_MARK] === undefined ) return _false;
	return  list[TAG_MARK];
}
var  _unmark = function (list) { // 0 is a valid mark. Sets to undefined
	if(notIsList(list)) glisp_error(20,list,"unmark") ;
	list[TAG_MARK] = undefined ;
	return list;
}
// filter with eq
var _mark_filter = function(top, argc) { // (mark-filter lst [value|all])
	var list = _stack[top++];
	var tag = (argc > 1) ? _stack[top] : null ; // compare
	var res = null ;
	if(notIsList(list)) glisp_error(20,list,"mark-filter") ;
	while(list) {
		if((list[TAG_MARK] !== undefined) && (tag === null || tag === list[TAG_MARK]))
			res = [list , res] ;
		list = list[1];
	}
	return res;
}

var _mark_print = function (top, argc) {
	if(argc === 1) 
		_MARK_PRINT = (_stack[top] === _false) ? false : true;
	return _MARK_PRINT ? _true : _false;
	}


////////////////
// Date and time
//////////////////

var _date_p = function (obj) {
	return (obj instanceof Date) ? _true : _false;
}

var _current_time_msec = function () {
	return Date.now();
}
var _current_time = function () {
	return Math.round(Date.now() * 0.001) ;
}
var _current_date = function () {
	return new Date();
}

var _DATE_DICT = { //  ending s
	now:0.00001 , today:0.00001, days : 24*3600, hours:3600, minutes:60, mns:60, seconds:1, secs:1 ,
	years:365*24*3600, months:30*24*3600,weeks:7*24*3600 ,
	maintenant:0.00001,jours:24*3600, heures:3600, secondes:1,
	cejour: 0.00001, ans:365*24*3600, mois:30*24*3600, semaines:7*24*3600,sem:7*24*3600,
	
	yesterday:-3600*24,tomorrow:3600*24,
	hier:-3600*24,demain:3600*24
}

// return undef if name unk
function __named_date( name, mult) {
var day = 24*3600*1000;
	mult = mult || 1 ;
	name = nameToString(name);
	if(name === "longtemps")  // random 10 years
		return new Date (Date.now() + day * __random (365*10) * mult) ;

	var delay = _DATE_DICT[name] || _DATE_DICT[name + 's'];
	if( delay !== undefined)  return new Date( Date.now() + 1000*delay*mult) ;
	return undefined ;
}

var _date = function (top , argc) {
	if(argc === 0) return new Date();
	
	if((typeof _stack[top] === "string") || (_stack[top] instanceof Symbol))
		return _string_to_date (_stack[top]) ;
		
	if((typeof _stack[top] === "number")
	  && argc === 2
	  && ((typeof _stack[top+1] === "string") || (_stack[top+1] instanceof Symbol)))
	  	return __named_date(_stack[top+1],_stack[top]) || Date.now(); // name, multiplier
		
	var y = (argc > 0) ? _stack[top++] : 1970 ;
	if( ! isJSInteger (y)) glisp_error(48,y,"date"); 
	var m = (argc > 1) ?  _stack[top++] : 1 ;
	if( ! isJSInteger (m)) glisp_error(48,m,"date"); 
	var d = (argc > 2) ?  _stack[top++] : 1 ;
	var h = (argc > 3) ?  _stack[top++] : 0 ;
	var mn = (argc > 4) ?  _stack[top++] : 0 ;
	var s = (argc > 5) ?  _stack[top++] : 0 ;
	var ms = (argc > 6) ?  _stack[top] : 0 ;
	return new Date(y,m-1,d,h,mn,s,ms); // note month-1
}

function __fr_to_date_string (str) { //  "1/3/2015" -> "2015-03-01"
	str= str.replace(/(\d{1,2})\/(\d{1,2})\/(\d{4,4})/,"$3-$2-$1");
	str = str.replace( /\-(\d)-/ , "-0$1-");
	str = str.replace( /\-(\d)$/ , "-0$1");
	str = str.replace( /\-(\d)T/ , "-0$1T"); // "2011-10-10T14:48:00"
return str;
}

var _string_to_date = function (str) { // 13/11/1946
var named ;
	str = nameToString(str,"string->date");
	named = __named_date(str);
	if(named) return named; // (string->date 'demain)
	var date = new Date (__fr_to_date_string (str)); 
// console.log("STR->DATE",date,typeof date, date.toString());
	if(isNaN(date.getTime())) glisp_error(76,str,"string->date") ;
	return date;
}

var _msec_to_date = function (msec) {
	msec = 0 + msec ;
	if( !(typeof msec === "number")) glisp_error(22,msec,"milliseconds->date");
	return new Date (msec) ;
}
var _date_to_msec = function (date) {
	if(! (date instanceof Date)) glisp_error(76,date,"date->milliseconds") ;
	return date.getTime();
}
var _sec_to_date = function (sec) {
	sec = 0 + sec ;
	if( !(typeof sec === "number")) glisp_error(22,sec,"seconds->date");
	return new Date (sec * 1000) ;
}
var _date_to_sec = function (date) {
	if(! (date instanceof Date)) glisp_error(76,date,"date->seconds") ;
	return Math.round(date.getTime()/1000);
}


var _date_to_string = function (d) { 
	if(! (d instanceof Date)) glisp_error(76,d,"date->string") ;
	return  d.toLocaleDateString() + " " + d.toLocaleTimeString();
}
var _date_to_date_string = function (d) { 
	if(! (d instanceof Date)) glisp_error(76,d,"date->date-string") ;
	return  d.toLocaleDateString(d) ;
}
var _date_to_time_string = function (d) { 
	if(! (d instanceof Date)) glisp_error(76,d,"date->time-string") ;
	return  d.toLocaleTimeString(d) ;
}

function __options_to_jsobject (lst) { // checks NYI
	var key_value ,key,value,obj = {} ;
	while(lst) {
				key_value = lst[0];
				key = nameToString(key_value[0],"date-format");
				value = key_value[1];
				if(Array.isArray(value)) value = value[0]; // not dotted pair
				obj[key] = 
						(value === _false ) ? false :
						(value === _true) ? true :
						nameToString(value,"date-format") ;
				lst = lst[1];
				}
		return obj ;
}

// BAD : creates Intl object each time NYI NYI
var _date_format = function (date , locales , options) { // checks lst NYI
	if(! (date instanceof Date)) glisp_error(76,date,"date-format") ;
	locales = nameToString (locales, "date-format");
	if(options === null) return date.toLocaleDateString(locales);
	if(notIsList(options)) glisp_error(20,options,"date-format");
	
	options = __options_to_jsobject (options) ;
	return new Intl.DateTimeFormat(locales, options).format(date);
}


var _date_diff = function (d1 , d2) {
	if(! (d1 instanceof Date)) glisp_error(76,d1,"date-diff") ;
	if(! (d2 instanceof Date)) glisp_error(76,d2,"date-diff") ;
	var dt = d1.getTime() - d2.getTime();
	return Math.floor(dt / 1000); // seconds
}
var _date_add = function (date , sec) { // NEW - change object !
	if(!(date instanceof Date)) glisp_error(76,date,"date-add") ; 
	sec = 0 + sec ;
	if( !(typeof sec === "number")) glisp_error(22,sec,"date-add");
	date.setTime (date.getTime() + 1000*sec);
	return date;
	}

/////////////////////
// DEBUG
////////////////////////
var _trace_fun = function (symb) {
	_putprop(symb,_true,_trace);
	return _true;
}
var _untrace_fun = function (symb) {
	_remprop(symb,_trace);
	return _false;
}
var _console_log = function (msg, obj) {
	console.log("EchoLisp[" + _topblock +"]",msg,glisp_tostring(obj,""),"RAW::",obj);
	return _true ;
}
var _console_dir = function ( obj) {
	console.dir(obj);
	return _true ;
}
var _console_trace = function (msg, obj) {
	console.trace("EchoLisp[" + _topblock +"]",msg,glisp_tostring(obj,""),"RAW::",obj);
	return _true ;
}

var _assert = function (self,env) { // check obj != #f
	var form = self[1];
	var obj = form[0];
	var info = (form[1]) ? form[1][0] : "assert" ;
	if(__eval(obj,env) !== _false) return _true;
	glisp_error(40,obj,info ) ;
}

var _check_expect = function(self, env) {
	var form = self[1];
	var a = form[0];
	var b = form[1][0];
	if (__equal(__eval(a,env) , __eval(b,env))) return _true ;
	glisp_error(6,a,b) ; // warning only
	return _false;
}

//////////////
// DEBUG options
////////////
var _DEBUG_COMPILE = 1;
var _DEBUG_SYNTAX = 2 ;
var _DEBUG_TRACE = 4;
var _debug = function (dbg) {
	writeln("(debug 0 | 1 :: compile | 2 :: syntax/macros)",_STYLE.plist["warning"]) ;
	_DEBUG = dbg;
	return _DEBUG;
}


////////////////////
// ABBREV's and JSDEBUG : get symbol object by name
///////////////
function symbol(name) {
	return glisp_look_symbol(name);
}
function sysfun(name) {
	return glisp_look_sysfun(name);
}
function environment(name) {
	return glisp_look_glenv(name);
}
function keyword(nameOrSymb) { // --> symb
	return glisp_look_keyword(nameOrSymb);
}

//////////////////
// HELPERS
//////////////////

// apropos returns a Vector of all matchers fun's & symbs
// try catch here for ill-formed user regexp NYI 
// patch (apropos *)  -> (apropos .*) 


function __apropos_string(obj) {
	if (isQuote (obj)) return __apropos_string (_cadr(obj)) ; // permissive
	if(typeof obj === "function") return obj.glfun ?  obj.glfun.name : "_fun_" ;
	return nameToString(obj) ;
}
var _apropos = function (self,env) { // --> returns __void
	var obj = _cadr(self); 
	var str = __apropos_string (obj);
	var regexp, matchers;
	if(str === "*") str = ".*";
	if(str.indexOf("*") === 0) str = "\\" + str;
	
	try { regexp = new RegExp (str,"i"); }
	catch(err) {glisp_error(53,str,"apropos");}
	
	matchers = glisp_matcher_symbols(regexp,env, true) ; // vector
	writeln(glisp_message(matchers),"") ;  // with arity
	
	 return __void;
}

var _help = function (self,env) {
	var obj = _cadr(self); 
	var name = __apropos_string (obj);
	var fun = sysfun(name) ;
	if (fun ) {
		glisp_help("./help.html#" + name );
		return name + fun.arity() ;
		}
	if(isSymbol(obj)) {
		var arity = isProc(obj);
		if(arity) return name + __arity_to_string(arity[0],arity[1]);
		}
	// look for first letter in help
	   glisp_help("./help.html#" + name.substr(0,1).toLowerCase());
	return obj;
}

/*--------------------
to be Overriden by lib's
--------------------------*/
function Hash() {
	this.toString = function() {return '#<Hash>';}
	}
function Integer() {
	this.toString = function() {return '#<Integer>';}
	}
var _GENERICS = null ;
function Generic() {
	this.toString = function() {return '#<Generic>';}
	}
	
/*-------------
jseval
------------------*/
var _js_eval = function (expr) { // eg.  window.location.href
	expr = glisp_message(expr);
	try { expr =  eval(expr); }
	catch (err) {
	writeln("🎃  " + expr ,_STYLE.plist["jserror"]);
	writeln("🎃  " + err.name + ' : ' + err.message ,_STYLE.plist["jserror"]);
	return _false;
	}
	if(typeof expr === "number") return expr;
	return expr.toString();
}

// will use toJSON if expr = object with this method.
var _jsonify = function (expr) {
	return JSON.stringify (expr) ;
}

/*--------------
version
------------------*/
var _version = function() {
	writeln(_VERSION,"color:green");
	return _NUM_VERSION ; // number
}

var _define_macro = function (x) { x } ; // overriden by match.lib
///////////////
// BOOT
///////////////////
var _KWD_ALL ;

function glisp_boot() {
var symb;
	 glisp.env = new GLenv(null,"global") ;
	 glisp.user = new GLenv(glisp.env,"user");
	 
	_Symbols = []; // array of Symbols objects
	_Sysfuns = []; // array of Sysfuns objects which associate names with jsfunctions
	_Formals = [];
	_GLenvs = [];
	_Keywords = [];
	
	/*---------------
	package
	-------------------*/
	glisp.pack = "system" ;
	
	_true = new Symbol('#t',true,true) ;  // constant, autoeval
	bind_symbol (_true,_true);  // assoc('#t',_true symb)
	_false = new Symbol('#f',true,true) ; 
	bind_symbol (_false,_false); 
	_undefined = new Symbol('#undefined',true,true) ; // was used for letrec
	bind_symbol (_undefined,_undefined);
	_ellipsis = new Symbol('...',true,true) ; 
	bind_symbol (_ellipsis,_ellipsis); 
	_range_sep = new Symbol('..',true,true) ; 
	bind_symbol (_range_sep,_range_sep); 
	_kons_sep = new Symbol(':',true,true) ; 
	bind_symbol (_kons_sep,_kons_sep); 
	_question_mark = new Symbol('?',true,true) ; // used for (match)
	bind_symbol (_question_mark,_question_mark); 
	_placeholder = new Symbol('_',true,true) ; // used for (match)
	bind_symbol (_placeholder,_placeholder); 
	_pipe_op = new Symbol('->');
	_vertical_bar = new Symbol('|') ;
	_esperluette = new Symbol('&');

	/*
	_assoc_proc_call = new Symbol('assoc-proc-call',true,true);
	bind_symbol (_assoc_proc_call,_assoc_proc_call); 
	*/
	_else = new Symbol('else');
	_right_arrow = new Symbol('=>',true,true);
	bind_symbol(_right_arrow,_right_arrow) ;
	_trace = new Symbol("trace");
	
	__void = new Symbol("#void",true,true);
	bind_symbol(__void,__void);
	var _void = function () { return __void; }
	var _voidp = function (obj) {return (obj === __void) ? _true : _false;};
	
// empty set
	symb = new Symbol("∅"); // NOT CONSTANT
	bind_symbol(symb,null);
	
// globs from local storage
	_STYLE = new Symbol('*style*',true,true); // autoeval not truly necessary
	bind_symbol(_STYLE,_STYLE) ; // in glisp env
	_CALENDAR = new Symbol("system.calendar");
	bind_symbol(_CALENDAR,null) ; // list ((date action)(date ..))
	
// user globals
	new Symbol('*home*');
	glisp.user.set ('*home*',"");
	
// keywords
	define_keyword ("#:all"); // (take .. #:all)
	define_keyword ("#:any"); // words library
	define_keyword ("#:onchange");
	define_keyword ("#:initialize");
	define_keyword ("#:tostring");
	define_keyword ("#:break");
	define_keyword ("#:continue");
	define_keyword ("#:package");
	define_keyword ("#:context");
	define_keyword ("#:auto");
	define_keyword ("#:when");
	define_keyword ("#:infix"); 
	define_keyword ("#:endpoint");
	
	_KWD_ALL = keyword("#:all") ;
	
// constants
	system_constant("DAY",3600*24);
	system_constant("JOUR",3600*24);

// libraries
	define_sysfun(new Sysfun('lib',_lib,1,1)) ;
	define_sysfun(new Sysfun('import',_import,1,1))  
	define_sysfun(new Sysfun('require',_require,1,1)) ; 
	define_sysfun(new Sysfun('version',_version,0,0)) ; 
	define_sysfun(new Sysfun('exit',_exit,0,0)) ; 
	
// inline
	define_special(new Sysfun("inline",_inline,2,2)) ;
	
// reader
	// define_sysfun(new Sysfun('reader-get-dict-entry',_reader_get_dict_entry,1,1)) ;
	define_sysfun(new Sysfun('inline-comments',_inline_comments,1,1)) ; // reader option DOC NYI
	define_sysfun(new Sysfun('reader-dict-set!',_reader_set_dict_entry,2,2)) ; 
	define_sysfun(new Sysfun('reader-dict-new',_reader_set_dict,1,1)) ;
	define_sysfun(new Sysfun('reader-dict',_reader_get_dict,0,0)) ;
	define_sysfun(new Sysfun('reader-set-proc!',_reader_set_proc,2,2)) ;
	define_sysfun(new Sysfun('reader-rem-proc',_reader_rem_proc,0,0)) ;
	define_sysfun(new Sysfun('reader-set-prompt!',_reader_set_prompt,1,1)) ;
	
	define_sysfun(new Sysfun('save-reader-dict',_save_reader_dict,1,1)) ;
	define_sysfun(new Sysfun('load-reader-dict',_load_reader_dict,1,1)) ;
	define_sysfun(new Sysfun('text-parse',_text_parse,1,2)) ; // NEW
	define_sysfun(new Sysfun('reader-translate',_reader_translate,2,2)) ;
	
	define_sysfun(new Sysfun('define-modifier-key',_define_modifier_key,1,1)) ;
	define_sysfun(new Sysfun('meta-keys',_meta_keys,0,0)) ;
	define_sysfun(new Sysfun('meta-key',_meta_key,2,2)) ;
	define_sysfun(new Sysfun('suppr-key',_suppr_key,1,1)) ;

// debug
	define_sysfun(new Sysfun('properties->values',_prop_val_to_list,1,1)) ;
	define_sysfun(new Sysfun('trace',_trace_fun,1,1)) ;
	define_sysfun(new Sysfun('untrace',_untrace_fun,1,1)) ;
	define_sysfun(new Sysfun('console-log',_console_log,2,2)) ;
	define_sysfun(new Sysfun('console-dir',_console_dir,1,1)) ;
	define_sysfun(new Sysfun('console-trace',_console_trace,2,2)) ;
	define_sysfun(new Sysfun('debug',_debug,1,1)) ;
	define_special(new Sysfun('time',_time,1,1,[isListOrNull]));
	define_special(new Sysfun('check-expect',_check_expect,2,2));
    define_special(new Sysfun('assert',_assert,1,2));
    define_sysfun(new Sysfun('js-eval',_js_eval,1,1)) ;
     define_sysfun(new Sysfun('jsonify',_jsonify,1,1)) ;
    define_sysfun(new Sysfun('doc',_doc,1,1)) ; // doc output format - internal -

// date and time
// Date(year, month [1-12], day, hours, minutes, seconds, msecs) 
	define_sysfun(new Sysfun('date',_date,0,7)) ; 
	define_sysfun(new Sysfun('date?',_date_p,1,1)) ; 
	//define_sysfun(new Sysfun('milliseconds->date',_msec_to_date,1,1)) ;
	//define_sysfun(new Sysfun('date->milliseconds',_date_to_msec,1,1)) ;
	define_sysfun(new Sysfun('seconds->date',_sec_to_date,1,1)) ;
	define_sysfun(new Sysfun('date->seconds',_date_to_sec,1,1)) ;
	define_sysfun(new Sysfun('string->date',_string_to_date,1,1)) ;
	define_sysfun(new Sysfun('current-date',_current_date,0,0)) ; // -> a js date object
	define_sysfun(new Sysfun('date->string',_date_to_string,1,1)) ; 
	define_sysfun(new Sysfun('date->time-string',_date_to_time_string,1,1)) ; // NEW
	define_sysfun(new Sysfun('date->date-string',_date_to_date_string,1,1)) ; 
	define_sysfun(new Sysfun('date-format',_date_format,3,3)) ; //  ( date lang (options list))
	define_sysfun(new Sysfun('current-time',_current_time,0,0)) ; // sec since 1970
	define_sysfun(new Sysfun('current-time-milliseconds',_current_time_msec,0,0)) ;
	define_sysfun(new Sysfun('date-diff',_date_diff,2,2)); // NEW -> seconds
	define_sysfun(new Sysfun('date-add!',_date_add,2,2)); // NEW 
	
//	define_special(new Sysfun('time',_time,1,1,[isListNotNull])) ; // better isProcCall NYI


// Helpers
	define_special(new Sysfun ('apropos',_apropos,1,1));
	define_special(new Sysfun ('ap',_apropos,1,1)); // abbrev
	define_special(new Sysfun ('help',_help,1,1)); // --> html page
	define_special(new Sysfun ('??',_help,1,1)); // --> html page
	
// Environments
// https://groups.csail.mit.edu/mac/ftpdir/scheme-7.4/doc-html/scheme_14.html#SEC124
	define_sysfun(new Sysfun ('environment?',_envp,1,1));
	define_sysfun(new Sysfun ('environment-bindings',_environment_bindings,1,1)); // -> NEW List
	define_sysfun(new Sysfun ('environment-parent',_environment_parent,1,1)); // -> NEW List
	define_sysfun(new Sysfun ('environment-of',_environment,1,1));  // lambda env  
	define_sysfun(new Sysfun ('bound?',_boundp,1,1));  // --> defining env || _false
	define_special(new Sysfun ('environment-current',_environment_current,0,0));
	define_sysfun(new Sysfun ('environment-new',_environment_new,1,1)); // from a-list
	define_sysfun(new Sysfun ('lib-functions',_lib_functions,1,1)); // NEW
	system_constant('system-global-environment',glisp.env);
	system_constant('user-initial-environment', glisp.user);
	
	//define_sysfun(new Sysfun('save-definitions',_save_definitions,1,1)) ; // rename me NYI
	//define_sysfun(new Sysfun('load-definitions',_import_definitions,1,1)) ;
	define_sysfun(new Sysfun('edit',_edit,1,1)) ;
	define_sysfun(new Sysfun('definitions',_definitions,0,0)) ;
	
	define_sysfun(new Sysfun('void',_void,0,0)); // returns __void
	define_sysfun(new Sysfun('void?',_voidp,1,1)); 

	
// Primitives
// possible compile checks are :  [pred,pred,....]
	define_special (new Sysfun ('define-constant' , _define_constant , 2, 2)) ;
	define_special (new Sysfun ('define' , _define , 2, undefined, [isListOrSymbol])) ; 
	define_sysfun  (new Sysfun ('define-global',_define_global, 2, 2));
	define_special (new Sysfun ('undefine' , _undefine , 1, 1, [isSymbol])) ; 
	define_special (new Sysfun ('set!' , _setq , 2, 2, [isSymbolOrFormal])) ; 
	define_special (new Sysfun ('+=' , _plus_equal , 2, 2, [isSymbolOrFormal])) ; 
	define_special (new Sysfun ('-=' , _minus_equal , 2, 2, [isSymbolOrFormal])) ; 
	define_special (new Sysfun ('*=' , _mult_equal , 2, 2, [isSymbolOrFormal])) ; 
	define_special (new Sysfun ('/=' , _div_equal , 2, 2, [isSymbolOrFormal])) ; 
	define_special (new Sysfun ('%=' , _modulo_equal , 2, 2, [isSymbolOrFormal])) ; 
	define_special (new Sysfun ('//=' , _xdiv_equal , 2, 2, [isSymbolOrFormal])) ; 
	define_special (new Sysfun ('++' , _plus_plus , 1, 1, [isSymbolOrFormal])) ; // (++ a) 
	define_special (new Sysfun ('--' , _minus_minus , 1, 1, [isSymbolOrFormal])) ; 
	define_special (new Sysfun ('+$+' , _infix_plus_plus , 1, 1, [isSymbolOrFormal])) ; 
	define_special (new Sysfun ('-$-' , _infix_minus_minus , 1, 1, [isSymbolOrFormal])) ; 
	define_special (new Sysfun ('setv!' , _setv , 2, 2, [isSymbolOrFormal])) ; // DOC ??? NYI
	define_sysfun  (new Sysfun ('symset!' , _symset , 2, 2, [isSymbol])) ; // DOC NEW
	define_special (new Sysfun ('λ', _lambda, 2, undefined , [isListOrNull])) ; 
	define_special (new Sysfun ('lambda', _lambda , 2, undefined , [isListOrNull])) ; 
	define_special (new Sysfun ('lambda-tail-call',_lambda_tail_call,2,undefined, [isListOrNull])); 

	
// SYNTAX and quote family
define_special (new Sysfun ('define-syntax-rule' , _define_syntax_rule , 2, 2, [isListNotNull])) ; 
define_special (new Sysfun ('define-syntax-id' , _define_syntax_id , 2, 2, [isSymbol])) ; 
define_special (new Sysfun ('define-syntax' , _define_syntax , 2, 2, [isSymbol])) ; 
define_sysfun  (new Sysfun  ('syntax-ids', _syntax_ids,0,0)); 

	define_special (new Sysfun ('flambda', _flambda , 2, undefined , [isListOrNull])) ; 
	define_special (new Sysfun ('quote', _quote , 1, 1 )) ; 
	define_special (new Sysfun ('macro-eval', _macro_eval , 1, 1 )) ; 
	define_special (new Sysfun ('quasiquote', _quasiquote , 1, 1 )) ; 
	define_special (new Sysfun ('unquote', _unquote , 1, 1 )) ; 
	define_special (new Sysfun ('unquote-splicing', _unquote_splicing , 1, 1 )) ; 
	// define_special (new Sysfun ('match', _match, 2)) ; // true matcher - rfu


// basic special forms
	define_special (new Sysfun ('values', _values , 1 )) ; // (values 4 5) -> (values 4 5)
	define_special (new Sysfun ('set!-values', _set_values , 2 ,2 )) ;
	define_special (new Sysfun ('define-values', _define_values , 2,2)) ;
	define_special (new Sysfun ('begin', _begin, 1 )) ; 
	define_special (new Sysfun ('begin0', _begin0, 1 )) ; 
	define_special (new Sysfun ('if', _if, 3, 3)) ;
	define_special (new Sysfun ('when', _when, 2)) ;
	define_special (new Sysfun ('unless', _unless, 2)) ; 
	define_special (new Sysfun ('cond', _cond, 1 )) ; 
	define_special (new Sysfun ('case', _case, 2 )) ; 
	define_special (new Sysfun ('do', _do, 2 ,undefined, [isListNotNull,isListNotNull] )) ; 

var _let_macro = function () {} ; // dummy for help
var _lets_macro = function () {} ;
var _letrec_macro = function () {} ;

	define_special (new Sysfun ('let', _let_macro, 2 ,undefined, [isListOrNull] )) ; 
	define_special (new Sysfun ('let*', _lets_macro, 2 ,undefined, [isListOrNull] )) ; 
	define_special (new Sysfun ('letrec', _letrec_macro, 2 ,undefined, [isListOrNull] )) ; 


// stacks
	define_sysfun (new Sysfun('pop', _pop,1,1)); // (pop symb) 
	define_sysfun (new Sysfun('push', _push,2,2)); // (push symb val)
	define_sysfun (new Sysfun('stack->list', _stack_to_list,1,1)); // (stack->list symb )
	define_sysfun (new Sysfun('list->stack', _list_to_stack,2,2)); // (list->stack list symb ) NEW
	define_sysfun (new Sysfun('stack', _set_stack_empty,1,1)); // (stack symb )
	define_sysfun (new Sysfun('stack-empty?', _stack_empty,1,1)); 
	define_sysfun (new Sysfun('stack-top', _stack_top,1,1)); 
	define_sysfun (new Sysfun('stack-length', _stack_length,1,1)); 
	define_sysfun (new Sysfun('stack-swap', _stack_swap,1,1)); 
	
// misc
	define_sysfun (new Sysfun('gensym', _gensym,0,0));
	define_sysfun (new Sysfun('make-symbol', _make_symbol,1,1));
	
	define_sysfun (new Sysfun('iota', _range,1,3));
	define_sysfun (new Sysfun('range', _range,1,3)); // (range end) | (range start end [step])
	define_sysfun (new Sysfun('srange', _srange,1,3)); 

	define_sysfun (new Sysfun('identity',_identity,1,1)); // NEW
	define_sysfun (new Sysfun('apply-compose',_apply_compose,2,2)); // ((list sin cos foo) 42)
	define_special (new Sysfun('compose',_compose,1,undefined)); // (compose op ...) -> (lambda..)
	
	define_special (new Sysfun('->',_pipeline,1,undefined)); // (-> x f g (h a)  ..)
	define_special (new Sysfun('apply-pipeline',_apply_pipeline,2,2)); // (x flist)
	define_special (new Sysfun('->>',_pipeline_last,1,undefined)); 


	define_special (new Sysfun('apply-curry',_apply_curry,4,4)); 
	define_special (new Sysfun('curry',_curry,2,undefined)); // (curry proc v1 ..) -> (lambda..)
	define_special (new Sysfun('apply-rcurry',_apply_rcurry,4,4)); 
	define_special (new Sysfun('rcurry',_rcurry,2,undefined)); // (curry proc v1 ..) -> (lambda..)


	define_sysfun (new Sysfun('apply-iterate',_apply_iterate,2,2)); // ( foo n  ) x )
	define_sysfun (new Sysfun('iterate',_iterate,2,2)); // (iterate f n) -> lambda
	
	define_sysfun (new Sysfun('remember',_remember,1,2)); 
	define_sysfun (new Sysfun('forget',_forget,1,1)); 
	define_sysfun (new Sysfun('cache',_cache,1,1)); 
	define_sysfun (new Sysfun('cache-size',_cache_size,0,1)); // NEW

	
// list ops
	define_sysfun (new Sysfun('length', _length,1,1));
	define_sysfun (new Sysfun('cons', _cons, 2,2));
	define_sysfun (new Sysfun('car', _car, 1,1));
	define_sysfun (new Sysfun('first', _car, 1,1));
	define_sysfun (new Sysfun('cdr', _cdr, 1,1));
	define_sysfun (new Sysfun('rest', _cdr, 1,1));

	define_sysfun (new Sysfun('set-car!', _set_car, 2,2));
	define_sysfun (new Sysfun('set-cdr!', _set_cdr, 2,2));

	define_sysfun (new Sysfun('cadr', _cadr, 1,1));
	define_sysfun (new Sysfun('second', _cadr, 1,1));
	define_sysfun (new Sysfun('cddr', _cddr, 1,1));
	define_sysfun (new Sysfun('caar', _caar, 1,1));
	define_sysfun (new Sysfun('cdar', _cdar, 1,1));
	define_sysfun (new Sysfun('caaar', _caaar, 1,1));
	define_sysfun (new Sysfun('caadr', _caadr, 1,1));
	define_sysfun (new Sysfun('cadar', _cadar, 1,1));
	define_sysfun (new Sysfun('caddr', _caddr, 1,1));
	define_sysfun (new Sysfun('third', _caddr, 1,1));
	define_sysfun (new Sysfun('cdaar', _cdaar, 1,1));
	define_sysfun (new Sysfun('cdadr', _cdadr, 1,1));
	define_sysfun (new Sysfun('cddar', _cddar, 1,1));
	define_sysfun (new Sysfun('cdddr', _cdddr, 1,1));
	
	define_sysfun (new Sysfun('last', _last, 1,1));
	define_sysfun (new Sysfun('list-ref', _list_ref, 2,2));
	define_sysfun (new Sysfun('list-tail', _list_tail, 2,2)); // (list-tail lst pos (< lg))
	define_sysfun (new Sysfun('sublist', _sublist, 3,3));    // (sublist list [start end[ )
	
// polymorh functions
	define_sysfun (new Sysfun('state', _state, 1,1));
	define_sysfun (new Sysfun('set-state!', _set_state, 1,2));
	define_sysfun (new Sysfun('take', _take, 2,2));
	define_sysfun (new Sysfun('drop', _drop, 2,2));

	define_sysfun (new Sysfun('list', _list, 1,undefined)); 
	define_sysfun (new Sysfun('make-list', _make_list, 2,2)); // length obj
	define_sysfun (new Sysfun('append', _append, 1,undefined)); 
	define_sysfun (new Sysfun('nconc', _nconc, 1,undefined)); 
	define_sysfun (new Sysfun('copy', _copy, 1,1)); 
	define_sysfun (new Sysfun('reverse', _reverse, 1,1)); 
	define_sysfun (new Sysfun('circular-list', _circular_list, 1,undefined)); 
	define_sysfun (new Sysfun('circular?', _circular_p, 1,1)); // NEW DOC DOC
	define_sysfun (new Sysfun('shuffle', _shuffle, 1,1)); 

	define_sysfun(new Sysfun('member',_member,2,2));
	define_sysfun(new Sysfun('member*',_member_star,2,2));
	define_sysfun(new Sysfun('list-index',_list_index,2,2));
	define_sysfun(new Sysfun('memq',_memq,2,2));
	define_sysfun(new Sysfun('memv',_memv,2,2));
	define_sysfun(new Sysfun('list-sort',_list_sort,2,2));
	define_sysfun(new Sysfun('list-sort/fields',_list_sort_fields,2,2)); //  (numf, list)
	define_sysfun(new Sysfun('group',_list_group,1,2));
	define_sysfun(new Sysfun('group*',_list_group_merge,1,2)); 
	define_sysfun(new Sysfun('flatten',_list_flatten,1,1));
	define_sysfun(new Sysfun('list-swap!',_list_swap,3,3)); 
	define_sysfun(new Sysfun('list-swap-ref!',_list_swap_ref,3,3));  
 
	define_sysfun(new Sysfun('mark?',_markp,1,1));  
	define_sysfun(new Sysfun('mark',_mark,2,2)); // (mark list flag)
	define_sysfun(new Sysfun('unmark',_unmark,1,1)); 
	define_sysfun(new Sysfun('mark-filter',_mark_filter,1,2)); 
	define_sysfun(new Sysfun('mark-print',_mark_print,0,1)); 

// sets
	define_sysfun (new Sysfun('set?', _set_p, 1,1));
	define_sysfun (new Sysfun('set-equal?', _set_equal_p, 2,2));
	define_sysfun (new Sysfun('make-set', _make_set, 1,1));
	define_sysfun (new Sysfun('set-intersect?', _set_intersectp, 2,2));
	define_sysfun (new Sysfun('set-intersect', _set_intersect, 2,2));
	define_sysfun (new Sysfun('set-union', _set_union, 2,2));
	define_sysfun (new Sysfun('set-product', _set_product, 2,2));
	define_sysfun (new Sysfun('set-substract', _set_substract, 2,2));
	define_sysfun (new Sysfun('set-sym-diff', _set_sym_diff, 2,2));
	define_sysfun (new Sysfun('set-subset?', _set_subset_p, 2,2)); // subset? A B) ? B inside A

	
// mapping 
// http://people.csail.mit.edu/jaffer/r5rs_8.html#SEC48
	define_sysfun(new Sysfun('for-each',_for_each,2,undefined));
	define_sysfun(new Sysfun('map',_map,2,undefined));
	define_sysfun(new Sysfun('maplist',_maplist,2,2)); // NEW
	define_sysfun(new Sysfun('filter',_filter,2,2));
	define_sysfun(new Sysfun('filter-count',_filter_count,2,2)); // NEW
	define_sysfun(new Sysfun('foldl',_foldl,3,undefined));
	define_sysfun(new Sysfun('foldr',_foldr,3,undefined));
	define_sysfun(new Sysfun('every',_every,2,undefined));
	define_sysfun(new Sysfun('any',_any,2,undefined));
	
	define_sysfun(new Sysfun('eval',_eval,1,2)); // (eval expr [env])
	define_sysfun(new Sysfun('apply',_apply,2,2));

// Control flow (see also (break ..) in (for ...))
	define_sysfun(new Sysfun('error',_error,2, 2)) ; // (error msg obj)
	define_sysfun(new Sysfun('throw',_throw,2, 2)) ; // (throw tag message)
	define_special(new Sysfun('catch',_catch,1)) ; // (catch (tag msg) ... ... )
	define_special(new Sysfun('try',_try,2)) ; // (try body (catch (tag msg) ...))
	define_special(new Sysfun('call/cc',_call_cc,0)) ;
	define_special(new Sysfun('call-with-current-continuation',_call_cc,0)) ; 
	
// Delay and force
	define_special(new Sysfun('delay',_delay,1,1));  // --> promise + env
	define_sysfun(new Sysfun('force',_force,1,1)) ; // (force promise) --> value
	define_sysfun(new Sysfun('promise?',_promisep,1,1));

// P-Lists
	define_sysfun(new Sysfun('remprop',_remprop,2,2)) ; // (remprop <symb> <key>) #t or nil
	define_sysfun(new Sysfun('getprop',_getprop,2,2)) ; // (get <symb> <key>) #f if none
	define_sysfun(new Sysfun('get',_getprop,2,2)) ; // (get <symb> <key>) #f if none
	define_sysfun(new Sysfun('putprop',_putprop,3,3)) ; // (putprop <symb> <value> <key>) 
	define_sysfun(new Sysfun('symbol-plist',_symbol_plist,1,1));
	define_sysfun(new Sysfun('set-plist!',_set_plist,2,2));
	define_sysfun(new Sysfun('plist-keys',_plist_keys,1,1));
	define_sysfun(new Sysfun('info',_info,1,2));
	
// A-Lists
	define_sysfun(new Sysfun('alist?',_alistp,1,1)); 
	define_sysfun(new Sysfun('assq',_assq,2,2));  // (assq obj alist)
	define_sysfun(new Sysfun('assv',_assv,2,2));  // NYI
	define_sysfun(new Sysfun('assoc',_assoc,2,2)); 
//  (assoc-procedure pred selector)
	define_sysfun(new Sysfun('association-procedure',_association_procedure,2,2)); 
	define_sysfun(new Sysfun('assoc-proc-call',_assoc_proc_call,4,4)); 

// Boxes
	define_sysfun(new Sysfun('box',_box,1,1)); 
	define_sysfun(new Sysfun('box?',_boxp,1,1)); 
	define_sysfun(new Sysfun('set-box!',_set_box,2,2));  
	define_sysfun(new Sysfun('unbox',_unbox,1,1)) ; 


// I/O

	
// Ajax
	define_sysfun(new Sysfun('load', _load_file, 0,1)); // source .glisp in ./lib/
	define_sysfun(new Sysfun('save-as', _save_as, 2,2)); // (obj filename)
	define_sysfun(new Sysfun('file->string', _file_to_string, 1,2)); // (proc file string) [file]
	define_sysfun(new Sysfun('url->string', _url_to_string, 2,2)); // (proc file string) file

	
	define_sysfun(new Sysfun('string-delimiter', _string_delimiter, 0,1));  
	define_sysfun(new Sysfun('write', _write, 1)); // write (obj's) in reader format 
	define_sysfun(new Sysfun('writeln', _writeln, 0)); 
	define_sysfun(new Sysfun('newline', _newline, 0,0)); 
	define_sysfun(new Sysfun('display', _display, 1,2)); // display (obj [style string])
	
	define_sysfun (new Sysfun('alert', _alert, 1,1)); 
	define_sysfun (new Sysfun('confirm', _confirm, 1,1)); // -> Boolean
	
	define_sysfun(new Sysfun('read',  _read, 0,2)); // (read [default [prompt]])
	define_sysfun (new Sysfun('read-string', _read_string, 0,2)); 
	define_sysfun (new Sysfun('read-list', _read_list, 0,2)); 
	define_sysfun (new Sysfun('read-number', _read_number, 0,2)); 
	define_sysfun (new Sysfun('read-from-string', _read_from_string, 1,1)); 
	define_sysfun (new Sysfun('input-string', _input_string, 2,2)); // (input proc prompt)
	define_sysfun (new Sysfun('input-expr', _input_expr, 2,2)); // (input proc prompt)

	define_sysfun(new Sysfun('number->string',_number_to_string,1,2));
	define_sysfun(new Sysfun('number-length',_number_to_length,1,2));
	define_sysfun(new Sysfun('format',_format,1));
	define_sysfun(new Sysfun('printf',_printf,1));
	define_sysfun(new Sysfun('decimals',_decimals,0,1));
	define_sysfun(new Sysfun('html-print',_html_print,1,1));
	
	define_sysfun(new Sysfun('worksheet-save',_save_worksheet,1,1)); 
	define_sysfun(new Sysfun('worksheet-open',_open_worksheet,1,1));
	define_sysfun(new Sysfun('worksheet-remove',_remove_worksheet,1,1));
	define_sysfun(new Sysfun('notebook',_notebook,0,0));
	define_sysfun(new Sysfun('worksheet-import',_worksheet_import,0,1));
	define_sysfun(new Sysfun('worksheet-export',_worksheet_export,0,0));
	
	
	define_sysfun(new Sysfun('stdout-background',_stdout_background,1,1)); 
	define_sysfun(new Sysfun('stdout-color',_stdout_color,1,1));
	define_sysfun(new Sysfun('stdout-font',_stdout_font,0,1));
	define_sysfun(new Sysfun('stdout-font-size',_stdout_font_size,0,1));
	define_sysfun(new Sysfun('stdout-clear',_stdout_clear,0,0));
	define_sysfun(new Sysfun('stdout-hide',_stdout_hide,1,1));
	
	define_sysfun(new Sysfun('stdin-background',_stdin_background,1,1)); 
	define_sysfun(new Sysfun('stdin-color',_stdin_color,1,1));
	define_sysfun(new Sysfun('stdin-font',_stdin_font,0,1));
	define_sysfun(new Sysfun('stdin-font-size',_stdin_font_size,0,1));
	define_sysfun(new Sysfun('stdin-hide',_stdin_hide,1,1)); 
	
	define_sysfun(new Sysfun('info-text',_info_text,1,2)); 


// sysout options
	define_sysfun(new Sysfun('style',_style,0,2)); 
	
// Constructors
	define_sysfun (new Sysfun ('rational', Qnew,2,2)) ; //-> integer may be

// PREDICATES
	define_sysfun (new Sysfun ('symbol?',   _symbolp,1,1)) ;
	define_sysfun (new Sysfun ('list?',   _listp,1,1)) ; // pair or null
	define_sysfun (new Sysfun ('pair?',   _pairp,1,1)) ;
	define_sysfun (new Sysfun ('number?',   _numberp,1,1)) ;
	define_sysfun (new Sysfun ('rational?',   _rationalp,1,1)) ;
	define_sysfun (new Sysfun ('complex?',   _complexp,1,1)) ;
	define_sysfun (new Sysfun ('real?',   _realp,1,1)) ;
	define_sysfun (new Sysfun ('integer?',   _integerp,1,1)) ;
	define_sysfun (new Sysfun ('empty?',   _nullp,1,1)) ;
	define_sysfun (new Sysfun ('null?',   _nullp,1,1)) ;
	define_sysfun (new Sysfun ('!empty?',   _not_nullp,1,1)) ;
	define_sysfun (new Sysfun ('!null?',   _not_nullp,1,1)) ;
	define_sysfun (new Sysfun ('boolean?',   _boolp,1,1)) ;
	define_sysfun (new Sysfun ('exact?',   _exactp,1,1)) ;
	define_sysfun (new Sysfun ('inexact?',   _inexactp,1,1)) ;
	define_sysfun (new Sysfun ('positive?',   _positivep,1,1)) ;
	define_sysfun (new Sysfun ('negative?',   _negativep,1,1)) ;
	define_sysfun (new Sysfun ('positive*?',   _spositivep,1,1)) ;
	define_sysfun (new Sysfun ('procedure?',   _procedurep,1,1)) ; // -> arity


// LOGICAL
	define_sysfun (new Sysfun ('not',   _not,1,1)) ; //  (not ()) = #f
	define_sysfun (new Sysfun ('eq?',   _eq,2,2)) ;  // values and locations
	define_sysfun (new Sysfun ('eqv?',   _eqv,2,2)) ;  
	define_sysfun (new Sysfun ('equal?',   _equal,2,2)) ;  // deep compare
	define_sysfun (new Sysfun ('!eq?',   _not_eq,2,2)) ;  // values and locations
	define_sysfun (new Sysfun ('!equal?',   _not_equal,2,2)) ;  // deep compare
	define_special (new Sysfun ('_and_xx',   _and_xx,2,2,[isAny,isAny])) ; 
	define_special (new Sysfun ('and',   _and,0)) ; 
	define_special (new Sysfun ('_or_xx',   _or_xx,2,2,[isAny,isAny])) ; 
	define_special (new Sysfun ('or',   _or,0)) ; 
	define_special (new Sysfun ('or*',   _or_star,0)) ; 
	define_sysfun  (new Sysfun ('xor',   _xor,2,2)) ; 

/// NOT-LISP functions (DOM, misc, ..)
	define_sysfun (new Sysfun ('tty-lines',  _tty_lines, 0,1)) ;
	define_sysfun (new Sysfun ('autocomplete-delay',  _stdin_autocomplete_delay, 0,1)) ;
	define_sysfun (new Sysfun ('autocomplete-top',  _autocomplete_top, 1,1)) ; 
	
/// modules 
	boot_local();
	boot_maths();
	boot_complex();
	boot_vector();
	boot_strings();
	boot_streams();
	boot_usage();
	
	/*----------------
	end package
	----------------*/
	glisp.pack = null ;
	
	} // boot









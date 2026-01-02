/*--------------------------
sequences and generators
© EchoLisp 2015

http://www.golimojo.com/etc/js-subclass.html
*/


_lib ( 'match.lib' , true);

/*-------------------------------
‘classes‘
--------------------------------*/

function subclass(constructor, superConstructor)  {
	function surrogateConstructor()
	{
	}
	surrogateConstructor.prototype = superConstructor.prototype;
	var prototypeObject = new surrogateConstructor();
	prototypeObject.constructor = constructor;
	constructor.prototype = prototypeObject;
}



/*---------------------
library macros
[a ..] -> sequence a Infinity
[a b ..] -> [sequence a b ïnfinity]
[a .. b] -> (sequence a b)
[a b .. c] -> (sequence a b c)
[a : b] -> (kons a b)
---------------------------*/
function __make_sequence_macros () {
var a = new Symbol('a'), b = new Symbol('b'), c= new Symbol('c') ;

_READER_MACROS_['m_[]_1'] = 
		[[a,[_range_sep,null]], [[_sequence, [a , [Infinity, null]]], null]] ;
_READER_MACROS_['m_[]_2'] =
		 [[a,[b,[_range_sep,null]]], [[_sequence, [a , [b ,[Infinity, null]]], null]]] ;
_READER_MACROS_['m_[]_3'] =
		 [[a,[_range_sep,[b,null]]], [[_sequence, [a , [b , null]], null]]] ;
_READER_MACROS_['m_[]_4'] =
		 [[a,[b,[_range_sep,[c,null]]]], [[_sequence, [a , [b ,[c, null]]], null]]] ;
_READER_MACROS_['m_[]_5'] =
		 [[a,[_kons_sep,[b,null]]], [[_p_cons, [a , [b , null]], null]]] ;

/*
var zip = new Symbol('zip');
_READER_MACROS_['m_zip'] = // (zip a b) -> (map cons a b)
		[[[_quote , [zip, null]] ,[a , [b ,null]]]  , [[ _map, [ _cons, [a,[b,null]]] , null]]]  ;

*/
}

/*------------------
special _funcall
-------------------------*/
// in common pool NYI
function __make_lambda(source,params, body) {
	var lambda =  [_lambda, [params, body]] ;
	lambda[TAG_CLOSURE] = source[TAG_CLOSURE];
	lambda[TAG_CLOSING] = source[TAG_CLOSING];
	lambda[TAG_ENV] = source[TAG_ENV];
	return lambda;
}

function isYield(expr) {
	return  Array.isArray(expr) && (expr[0] === _yield);
	}

// lambda MUST be lambda(x [x def]..] NOT lambda x nor lambda (x . y) DOC NYI

function __g_call(lambda,values,env) {
	var save_top = _top, ret ;
	var memory = -1; // remember idx 
	var params = lambda[1][0], body = lambda[1][1], newenv = env ;
	var remember = lambda[TAG_REMEMBER]; // array or null
	var sem, state , msec , stack_shot = [] , s;
	var next ;

	if(lambda[TAG_CLOSURE])  		 newenv = lambda[TAG_ENV] ;
	else if(lambda[TAG_CLOSING])	 newenv =  new GLenv(env,"C"); 
	// else newenv = env;
	
//glisp_trace(params,values,"BIND",true);
//glisp_trace(lambda,"","LAMBDA",true);
	 __flambda_bind(params,values,env,newenv); // increases top
	 	
	_blocks[++_topblock] = save_top;
	
	// var ret =  __begin(body,newenv);
	for(var expr = body ; expr != null ; expr = expr[1]) {
	
	if (isYield(expr[0])) {
		 		next =  __eval(expr[0][1][0], newenv);
		 		//rem : state =  _stack[save_top] ;
		    	for(s = save_top ; s < _top ; s++) 
		    		stack_shot.push(_stack[s]) ;
		 		    ret = [ _yield , next , stack_shot,  __make_lambda (lambda, params, expr[1])];
		 		 	break ;
		 		} // isYield

		else ret = __eval(expr[0],newenv);
		}
		
	_top = save_top;
	_topblock--;
	return ret;
} // __g_call

/*-------------------
dbg utilities
-------------------------*/
function array_tostring(obj) {
	if(obj === _false) return "[#f]" ;
	if(obj === null) return "[null]" ;
	if(! Array.isArray(obj))  return "[???]" ;
	if(obj.length === 0) return "[]" ;
	return "[" + obj[0] + " .. " + obj[obj.length-1] + "]" + " length:" + obj.length;
}

/*--------------------------------
Procrastinators -->  Sequences, LazyLists, Generators
--------------------------------------------*/
function checkProcrastinator (obj,sender) { // sender ex : "sequence:action"
	sender = sender || "sequences" ;
	if(obj instanceof Procrastinator) return obj;
	glisp_error(139,obj,sender);
	}
	
function Procrastinator (init , env , sender) {
sender = sender || "sequences" ;
	this.env = env ;
	this.p_init = init ;
	this.p_state = init ;
	
	this.p_n = -1; // count next
	this.p_cache = null;
//  glisp_trace("new Procrastinator:init: ",init,sender,true);
}

// to OVERRIDE  in each subclass

Procrastinator.prototype.toString = function () {
	return "#procrastinator:" + glisp_tostring(this.p_state, "state: ") ;
}

Procrastinator.prototype.next = function () {
	this.p_n++;
	var ret = this.p_state ; // f(p_state) or cache[p_n]
	// compute next state
	this.p_state++;
	// if(cache) cache[p_n] = ret ;
	return ret ;
}


// to override [MANDATORY]

Procrastinator.prototype.dup = function () {
	return new  Procrastinator(this.p_init,this.env,"dup");
}

// a clone, with same state
Procrastinator.prototype.clone = function () {
	var clone = new  Procrastinator(this.p_state,this.env,"clone");
	return clone;
}

// default behavior

Procrastinator.prototype.head = function () { 
	return this.dup().next();
	}
	
Procrastinator.prototype.tail = function () { 
	var dup = this.dup();
	dup.next();
	return dup.clone();
	}

Procrastinator.prototype.state = function  () {
	return this.p_state;
}

Procrastinator.prototype.set_state = function (state) {
	if(state === undefined)  return this.init();
	this.p_state =  state ;
	return this;
}

Procrastinator.prototype.init = function  () {
	this.p_state = this.p_init;
	this.p_n = -1;
	return this ;
}

Procrastinator.prototype.cache = function  () {
	return  this.p_cache ? new Vector(this.p_cache) : null ;
}

Procrastinator.prototype.length = function  () {
	return  +Infinity ;
}

Procrastinator.prototype.last = function () {
	return _false ;
}


/*-------------------
Generics
.dup() : a new copy, inited
proctor.clone() : a new copy such as proctor.next ()  === clone.next()
--------------------------*/

// usage : (take (drop proctor 12) 67)
// returns a new copy
Procrastinator.prototype.drop = function (n) { // (drop) --> new one
	var next, dup = this.dup();
	if(n <= 0) return dup;
	while (n--) {
		next = dup.next();
		if(next === _false) break;
	}
	return dup.clone(); // clone current state
}

Procrastinator.prototype.drop_while = function (pred, n, env) { // (drop) --> new one
	var next, dup = this.dup(), i = 0;
	if(n <= 0) return dup;
	var call = [pred,[null,null]];
	while (i < n ) {
		next = dup.nth(i++);
		if(next === _false) break;
		call[1][0] = next;
		if(__ffuncall(call,env) === _false) break;
		dup.next();
	}
	return dup.clone(); // clone current state
}

// from init state
// take
Procrastinator.prototype.toList = function (n) { 
	var ret = [], next, i, dup = this.dup();
	for( i = 0; i< n; i++) {
		next = dup.next();
		if(next === _false) break;
		ret.push(next);
		}
	return __array_to_list(ret);
}

Procrastinator.prototype.take_when = function (pred,n,env) { // (take/when pred obj n)
	var ret = [], next, i= 0, dup = this.dup();
	if(n <= 0) return null;
	var call = [pred,[null,null]];
	while(true) {
		next = dup.next();
		if(next === _false) break;
		call[1][0] = next;
		if(__ffuncall(call,env) === _false) continue;
		ret.push(next);
		if(++i === n) break;
		}
	return __array_to_list(ret);
}

Procrastinator.prototype.take_while = function (pred,n,env) { // (take/when pred obj n)
	var ret = [], next, i= 0, dup = this.dup();
	if(n <= 0) return null;
	var call = [pred,[null,null]];
	while(true) {
		next = dup.next();
		if(next === _false) break;
		call[1][0] = next;
		if(__ffuncall(call,env) === _false) break;
		ret.push(next);
		if(++i === n) break;
		}
	return __array_to_list(ret);
}


// does not change state 
// nth[0] = head
Procrastinator.prototype.nth = function (n) {
if(this.p_cache && this.p_cache[n] !== undefined) return this.p_cache[n] ;
var dup = this.dup(); // inited
	while (true) {
		next = dup.next();
		if(next === _false ) break;
		if(n-- === 0) break;
	}
	return next;
	}
	
Procrastinator.prototype.sum = function (n) {
// cache NYI
	var sum = 0, dup = this.dup() , next ;
		while (n--) {
			next = dup.next();
			if(next === _false ) break;
			sum = _add_xx(sum, next);
		}
	return sum ;
	}
	
Procrastinator.prototype.min = function () {
	var ret = +Infinity , dup = this.dup() , next ;
		while(true) {
			next = dup.next();
			if(next === _false ) break;
			if(_lt (next,ret) === _true) ret = next ;
			}
	return ret ;
	}
	
Procrastinator.prototype.max = function () {
	var ret = -Infinity , dup = this.dup() , next ;
		while(true) {
			next = dup.next();
			if(next === _false ) break;
			if(_gt (next,ret) === _true) ret = next ;
		}
	return ret ;
	}
	
Procrastinator.prototype.sum_when = function (pred,n,env) { // (take/when pred obj n)
	var ret = 0, next, i= 0, dup = this.dup();
	if(n <= 0) return null;
	var call = [pred,[null,null]];
	while(true) {
		next = dup.next();
		if(next === _false) break;
		call[1][0] = next;
		if(__ffuncall(call,env) === _false) continue;
		ret = _add_xx(ret,next);
		if(++i === n) break;
		}
	return ret ;
}

/*------------------
Common static functions
-------------------------*/

Procrastinator.g_convert = function (obj,env,sender) {
	if(obj === _false) return _false; // RETURN _FALSE_PROC NYI NYI NYI
	if(obj instanceof Procrastinator) return obj ;
	if(typeof obj === "number") return new Procrastinator(obj,env,"number"); // sequence n,n+1,..
	if(isListNotNull(obj)) return new LazyList(obj,env) ;
	if(typeof obj === "string") return new LazyArray(obj.split(""),0,env);
	if(obj instanceof Vector) return new LazyArray(obj.vector,0,env); // Table NYI
	checkProcrastinator(obj,sender);
	}
	
// sub-classes choose to re-init or not ..
Procrastinator.g_dup = function (obj,env,sender) {
	if(obj === _false) return _false;
	obj = Procrastinator.g_convert(obj,sender);
	return obj.dup();
	}
	
Procrastinator.g_cons = function (head,tail,env) {
	return new Kons (head,tail,env) ;
}
	
Procrastinator.g_filter = function (proc,obj,env) {
	obj = Procrastinator.g_convert(obj,"filter");
	return new Filter (proc,obj,env);
	}
	
Procrastinator.g_mean = function (obj, env) {
	obj = Procrastinator.g_dup(Procrastinator.g_convert(obj,env,"mean"));
	var m = 0, lg = 0, val;
		while ((val = obj.next()) !== _false) { m += val ; lg++; }
		if(lg === 0)  {glisp_error(9,"empty-sequence","mean"); return 0;}
		return m / lg ;
}


Procrastinator.g_append  = function ( ga, gb, env) { // gb may be null
	if(ga === null) return Procrastinator.g_convert(gb,env,"append") ; 
	if(gb === null) return ga;
	return new Concatenator 
	(Procrastinator.g_convert(ga,env,"append") , Procrastinator.g_convert(gb,env,"append") ,env) ;
}


Procrastinator.g_map  = function (proc, ga, gb, env) { // gb may be null
	proc = (gb === null) ? 
		checkProc(proc,1,1,"sequence-map") : checkProc(proc,2,2,"sequence-map")  ;
	proc = (gb === null ) ? [proc,[null,null]] : [proc, [null, [null,null]]];
	return new Mapper (proc,ga,gb,env) ;
}

Procrastinator.g_scan  = function (proc, acc0, ga, gb, env) { // gb may be null
	proc = (gb === null) ? 
		checkProc(proc,2,2,"sequence-scan") : checkProc(proc,3,3,"procrastinatorscan")  ;
	proc = (gb === null ) ? [proc,[null,[null,null]]] : [proc, [null, [null,[null,null]]]];
	return new Scanner (proc,acc0,ga,gb,env) ;
}

Procrastinator.g_every  = function (proc ,ga, gb, env) { // gb may be null
var arg1ref, arg2ref ;
	if( gb === null) {
	proc = checkProc(proc,1,1,"sequence-every") ;
	proc = [proc,[null,null]] ; 
	ga = Procrastinator.g_dup(Procrastinator.g_convert(ga,env,"sequence-every")); 
	arg1ref = proc[1];
		while(true) {
			arg1ref[0] = ga.next();
			if(arg1ref[0] === _false) return _true ;
			if( __funcall(proc,env) === _false) return _false;
		}
		return _true;
	} // only ga
	
	else {
	proc = checkProc(proc,2,2,"sequence-every")  ;
	proc =  [proc, [null, [null,null]]] ;
	ga = Procrastinator.g_dup(Procrastinator.g_convert(gb,env,"sequence-every")); 
	gb = Procrastinator.g_dup(Procrastinator.g_convert(gb,env,"sequence-every")); 

	arg1ref = proc[1];
	arg2ref = proc[1][1];
		while(true) {
			arg1ref[0] = ga.next();
			if(arg1ref[0] === _false) return _true ;
			arg2ref[0] = gb.next();
			if(arg2ref[0] === _false) return _true ;
			if( __funcall(proc,env) === _false) return _false;
		}
		return _true;
	}
} // every

Procrastinator.g_any  = function (proc ,ga, gb, env) { // gb may be null
var arg1ref, arg2ref ;
	if( gb === null) {
	proc = checkProc(proc,1,1,"sequence-any") ;
	proc = [proc,[null,null]] ; 
	ga = Procrastinator.g_dup(Procrastinator.g_convert(ga,env,"sequence-any")); 
	arg1ref = proc[1];
		while(true) {
			arg1ref[0] = ga.next();
			if(arg1ref[0] === _false) return _false ;
			if( __funcall(proc,env) !== _false) return arg1ref[0];
		}
		return _false;
	} // only ga
	
	else {
	proc = checkProc(proc,2,2,"sequence-any")  ;
	proc =  [proc, [null, [null,null]]] ;
	ga = Procrastinator.g_dup(Procrastinator.g_convert(ga,env,"sequence-any")); 
	gb = Procrastinator.g_dup(Procrastinator.g_convert(gb,env,"sequence-any")); 

	arg1ref = proc[1];
	arg2ref = proc[1][1];
		while(true) {
			arg1ref[0] = ga.next();
			if(arg1ref[0] === _false) return _false ;
			arg2ref[0] = gb.next();
			if(arg2ref[0] === _false) return _false ;
			if( __funcall(proc,env) !== _false) return [arg1ref[0],arg2ref[0]];
		}
		return _false;
	}
} // any
			
Procrastinator.g_fold  = function (proc, acc ,ga, gb, env) { // gb may be null
var accref, arg1ref, arg2ref ;
	if( gb === null) {
	proc = checkProc(proc,2,2,"sequence-fold") ;
	proc = [proc,[null,[null,null]]] ;
	ga = Procrastinator.g_dup(Procrastinator.g_convert(ga,env,"sequence-fold")); 

	arg1ref = proc[1];
	accref = proc[1][1];
		while(true) {
			accref[0] = acc;
			arg1ref[0] = ga.next();
			if(arg1ref[0] === _false) break;
			acc = __funcall(proc,env);
		}
		return acc;
	} // only ga
	
	else {
	proc = checkProc(proc,3,3,"sequence-fold")  ;
	proc =  [proc, [null,[null, [null,null]]]] ;
	ga = Procrastinator.g_dup(Procrastinator.g_convert(ga,env,"sequence-fold")); 
	gb = Procrastinator.g_dup(Procrastinator.g_convert(gb,env,"sequence-fold")); 

	arg1ref = proc[1];
	arg2ref = proc[1][1];
	accref = proc[1][1][1] ;
		while(true) {
			accref[0] = acc;
			arg1ref[0] = ga.next();
			if(arg1ref[0] === _false) break;
			arg2ref[0] = gb.next();
			if(arg2ref[0] === _false) break;
			acc = __funcall(proc,env);
		}
		return acc;
	}
} // fold

Procrastinator.g_for_each  = function (proc ,ga, gb, env) { // gb may be null
var arg1ref, arg2ref ;
	if( gb === null) {
	proc = checkProc(proc,1,1,"sequence-for-each") ;
	proc = [proc,[null,null]] ;
	ga = Procrastinator.g_dup(ga); // or convert ???  NYI NYI
	arg1ref = proc[1];
		while(true) {
			arg1ref[0] = ga.next();
			if(arg1ref[0] === _false) break;
			 __funcall(proc,env);
		}
		return __void ;
	} // only ga
	
	else {
	proc = checkProc(proc,2,2,"sequence-for-each")  ;
	proc =  [proc, [null, [null,null]]] ;
	ga = Procrastinator.g_dup(Procrastinator.g_convert(ga,env,"sequence-for-each")); 
	gb = Procrastinator.g_dup(Procrastinator.g_convert(gb,env,"sequence-for-each")); 

	arg1ref = proc[1];
	arg2ref = proc[1][1];
		while(true) {
			arg1ref[0] = ga.next();
			if(arg1ref[0] === _false) break;
			arg2ref[0] = gb.next();
			if(arg2ref[0] === _false) break;
			 __funcall(proc,env);
		}
		return __void ;
	}
} // for-each

/*----------------------
Kons
p_head
p_tail (eval or not) , p_n
p_init = [head , tail (not eval)]
p_state not used
p_cursor : clones
----------------------------*/

/*-------------------------
(: 777 (: 888 [1 ..]))
-------------------------*/

subclass(Kons, Procrastinator);

function Kons(head, tail , env) { // init = state = is [head,tail] 
	Procrastinator.call(this, [head,tail] , env, "kons"); 
	this.p_head  =  head ;
	this.p_tail =  tail; // do not eval yet
	this.p_cache = [];
	this.p_cursor = 0;
	}
	
Kons.prototype.toString = function () {
	return "#kons [" + glisp_tostring(this.p_head, "") + 
			 "  p_n : " + this.p_n +
			 " p_cursor : " + this.p_cursor +
			 "  cache : " + array_tostring(this.p_cache) +
			 "  rest : "  +  (this.p_tail === this ? "self " : glisp_tostring(this.p_tail, ""))  +
			 "]";
}

Kons.prototype.init = function  () {
	this.p_head =  this.p_init[0] ; 
	this.p_tail =  this.p_init[1] ; 
	return this ;
}

Kons.prototype.dup = function  () {
//console.log("Kons dup", this.p_cache,this.p_n);
var kons =  new Kons(this.p_init[0],this.p_init[1],this.env);
		kons.p_cache = this.p_cache;
		kons.p_cursor = this.p_cursor;
		return kons;
}

Kons.prototype.clone = function () {
//console.log("Kons clone", this.p_cache,this.p_n);
console.trace();
var clone =  new Kons(this.p_init[0],this.p_init[1],this.env);
		clone.p_cache = this.p_cache;
		clone.p_n = -1 ;
		clone.p_cursor = this.p_cursor + this.p_n+1;
		clone.p_cache = this.p_cache;
		return clone;
}

Kons.prototype.head = function () {
	if(this.p_cursor === 0) return this.p_head;
	return this.dup().next();
}

Kons.prototype.tail  = function () {
	var dup = this.dup();
	dup.p_cursor++;
	return dup;
}


Kons.prototype.next = function () {
var next , p_n ; ;
	this.p_n++;
	p_n = this.p_cursor + this.p_n ;
	if(this.p_cache[p_n] !== undefined) return this.p_cache[p_n] ;
	if(p_n === 0) 
			return (this.p_cache[0] = this.p_head) ;
			
	if(! (this.p_tail instanceof Procrastinator)) {
			this.p_tail = __eval(this.p_tail,this.env);
			this.p_tail = Procrastinator.g_convert (this.p_tail,"kons").dup() ;
			}
			
	while  (this.p_tail.p_n < p_n -1) {
			next =  this.p_tail.next() ;
			if(next === _false) break;
			}
			
	return (this.p_cache[p_n] = next );
}


Kons.prototype.state = function () {
	return [this.p_head , this.p_tail]; // to inspect
	}
	


/*----------------------
Concatenator (append, ++)
state = ga.dup, gb.dup()
p_state : not used, or #f
----------------------------*/
subclass(Concatenator, Procrastinator);

function Concatenator(ga , gb , env) { // start is [ga,gb] Procrastinators
	ga =  Procrastinator.g_convert(ga,env,"append");
	gb =  Procrastinator.g_convert(gb,env,"append");
	Procrastinator.call(this, [ga,gb] , env, "++"); // init state = [ga,gb]
	this.init();
	}
	
Concatenator.prototype.toString = function () {
	return "#append: " + glisp_tostring([this.p_ga,this.p_gb], "") ;
}

Concatenator.prototype.init = function  () {
	this.p_ga =  this.p_init[0].dup() ; 
	this.p_gb =  this.p_init[1].dup(); 
	return this ;
}
Concatenator.prototype.dup = function  () {
	return new Concatenator (this.p_init[0],this.p_init[1],this.env);
}
Concatenator.prototype.clone = function  () {
	var clone = this.dup();
	clone.p_ga= this.p_ga === _false ? _false : this.p_ga.clone();
	clone.p_gb= this.p_gb === _false ? _false : this.p_gb.clone();
	clone.p_state = this.p_state;
	clone.p_n = this.p_n;
	return clone;
}


Concatenator.prototype.state = function () {
	return [this.p_ga, this.p_gb];
}

Concatenator.prototype.set_state = function (state) {
	this.p_ga = state[0];
	this.p_gb = state[1];
	return this;
}

Concatenator.prototype.next = function () {
var next ;
	if(this.p_state === _false) return _false;
	this.p_n++;
	next = (this.p_ga === _false) ?  _false : this.p_ga.next();
	if(next === _false)  
				this.p_ga = _false;
				else return next ;
	next = (this.p_gb === _false) ?  _false : this.p_gb.next();
	if(this.p_gb === _false)  return ( this.p_gb = this.p_state = _false) ;
	return next;	 
}

Concatenator.prototype.head = function () {
	return this.p_init[0].head(); 
}

Concatenator.prototype.length = function () {
	return this.p_init[0].length() + this.p_init[1].length();
	}

/*----------------------
Mappers
state = ga.dup() , gb.dup()|null ,
p_state UNUSED
p_init = [ga,gb,acc0]
----------------------------*/
subclass(Mapper, Procrastinator);

// gb may be null
function Mapper(proc, ga , gb , env) { // start is [ga,gb] Procrastinators
	ga =  Procrastinator.g_convert(ga,env,"map"); 
	if(gb !== null) gb =  Procrastinator.g_convert(gb,env,"map");
	Procrastinator.call(this, [ga,gb] , env, "map"); // init state = [ga,gb]
	this.p_proc = proc;
	this.p_ga = this.p_gb = null;
	this.init(); // make dups
	}
	
Mapper.prototype.toString = function () {
	return "#map" + glisp_tostring(this.p_ga, ":")  + glisp_tostring(this.p_gb, ":") ;
}

Mapper.prototype.init = function  () {
	this.p_ga =  this.p_init[0].dup(); 
	if(this.p_init[1]) this.p_gb =  this.p_init[1].dup(); 
	return this ;
}

Mapper.prototype.dup = function  () {
	return new Mapper (this.p_proc, this.p_init[0],this.p_init[1],this.env);
}

Mapper.prototype.clone = function  () {
	return new Mapper (this.p_proc, this.p_ga.clone(),this.p_gb[1].clone(),this.env);
}


Mapper.prototype.state = function () {
	return [this.p_ga, this.p_gb];
}

Mapper.prototype.set_state = function (state) {
	this.p_ga = state[0];
	this.p_gb = state[1];
	return this;
}


Mapper.prototype.next = function () {
var na, nb ;
	if(this.p_state === _false) return _false;
// console.log("MAPPER NEXT",this.p_ga.toString());
	this.p_n++;
	var na = this.p_ga.next();
	if(na === _false) return (this.p_state  = _false ); 
	this.p_proc[1][0] = na;
	
	if(this.p_gb)  {
		nb = 	this.p_gb.next();
		if(nb === _false) return (this.p_state  = _false ); 
		this.p_proc[1][1][0] = nb;
		}
	
	return  __ffuncall(this.p_proc,this.env) ;		 
}


Mapper.prototype.length = function () {
	return Math.min 
		(this.p_init[0].length(), this.p_init[1] ? this.p_init[1].length() : +Infinity) ;
	}
	
/*----------------------
Scanners
state = p_acc, p_ga, p_gb
p_state UNUSED except for _false 
-------------------------------*/
subclass(Scanner, Procrastinator);

function Scanner(proc, acc0 , ga , gb , env) { // start is [ga,gb,acc0] 
	ga =  Procrastinator.g_convert(ga,env,"map"); 
	if(gb !== null) gb =  Procrastinator.g_convert(gb,env,"map");
	Procrastinator.call(this, [ga,gb,acc0] , env, "map"); // init state = [ga,gb,acc0]
	this.p_proc = proc;
	this.p_ga = this.p_gb = null;
	this.p_acc = 0;
	this.init(); // make dups
	}
	
Scanner.prototype.toString = function () {
	return "scan:" + glisp_tostring(this.p_acc, "acc:") + glisp_tostring(this.p_state, " ") ;
}

Scanner.prototype.init = function  () {
	this.p_ga =  this.p_init[0].dup(); 
	if(this.p_init[1]) this.p_gb =  this.p_init[1].dup(); 
	this.p_acc = this.p_init[2];
	return this ;
}

Scanner.prototype.dup = function  () {
	return new Scanner (this.p_proc, this.p_init[2], this.p_init[0],this.p_init[1],this.env);
}

Scanner.prototype.clone = function  () {
	return new Scanner 
	(this.p_proc, this.p_acc, this.p_ga.clone(), this.p_gb ? this.p_gb.clone() : null ,this.env);
}


Scanner.prototype.state = function () {
	return [this.p_ga, this.p_gb, this.p_acc] ;
}
Scanner.prototype.set_state = function (state) {
	this.p_ga = state[0];
	this.p_gb = state[1];
	this.p_acc = state[2];
	return this;
}


Scanner.prototype.next = function () {
var na, nb ;
	if(this.p_state === _false) return _false;
	this.p_n++;
	if(this.p_n === 0) return this.p_acc ;
	var na = this.p_ga.next();
	if(na === _false) return (this.p_state  = _false ); 
	this.p_proc[1][0] = na;
	
	if(this.p_gb)  {
		nb = 	this.p_gb.next();
		if(nb === _false) return (this.p_state  = _false ); 
		this.p_proc[1][1][0] = nb;
		this.p_proc[1][1][1][0] = this.p_acc;
		}
		else  this.p_proc[1][1][0] = this.p_acc ;
		
	
	return  (this.p_acc = __ffuncall(this.p_proc,this.env)) ;		 
}


Scanner.prototype.length = function () {
	return Math.min 
		(this.p_init[0].length(), this.p_init[1] ? this.p_init[1].length() : +Infinity) ;
	}


/*----------------------
Filter
	state = p_state = ga.dup()
----------------------------*/
subclass(Filter, Procrastinator);

function Filter(proc, ga , env) { // start is ga procrastinator
	Procrastinator.call(this, ga , env, "filter"); // init state = ga
	proc = checkProc(proc,1,1,"filter");
	this.p_proc = [proc, [null, null]];
	this.init();
	}
	
Filter.prototype.toString = function () {
	return "# 👓 filter: " + glisp_tostring(this.p_state, "") ;
}

Filter.prototype.init = function  () {
	this.p_state = this.p_init.dup() ;
	return this ;
}

Filter.prototype.dup = function  () {
	return new Filter (this.p_proc[0], this.p_init,this.env);
}

Filter.prototype.clone = function  () {
	return new Filter (this.p_proc[0], this.p_state.clone(),this.env);
}

Filter.prototype.next = function () {
var na , proc ;
	if(this.p_state === _false) return _false;
	this.p_n++;
	while(true) {
			na = this.p_state.next();
			if(na === _false) return (this.p_state  = _false ); 
			this.p_proc[1][0] = na;
			if (__ffuncall(this.p_proc,this.env) !== _false) return na;
			}	 
}


Filter.prototype.length = function () {
	return this.p_init.length();
}

/*-------------------------------
n-D indices
--------------------------------*/
// state = {  index : [i1 i2 i3 ...]  dims = [d1 ... dn] }
// init with state.index = null
// return _false when finished
// uses js-arrays

function __next_index (state, dims) {
	if(state === _false) return _false;
	var dim = dims.length ;

	if(state === null) {
		state = [];
		for(i=0;i< dim; i++) state[i]=0;
		return state;
		}
		
	for(i = dim-1 ; i >= 0 ; i--) {
		state[i]++;
		if(state[i] < dims[i]) return state ;
		if(i === 0) return _false;
		state[i] = 0 ;
		}
}

/*----------------------
Indices
	state =  js array [i j k ..] to return by next
	p_init = dims = js array [d1 d2 .. dn]
----------------------------*/
subclass(Indices , Procrastinator);

function Indices(dims,env) {
	Procrastinator.call(this, dims, env,"indices"); // super
	this.init();
	}
	
Indices.prototype.toString = function () {
	return (this.p_state === _false) ? "#indices:#f" :
	       "#indices: " + glisp_tostring(new Vector(this.p_state),"") + 
	       glisp_tostring (new Vector (this.p_init) ," dims: ");
	       }
	       
Indices.prototype.init = function () {
	this.p_state = __next_index(null,this.p_init);
}
			
Indices.prototype.next = function () {
	if(this.p_state === _false) return _false;
	var next = new Vector(this.p_state); // dup needed !
	this.p_n++;
	this.p_state = __next_index(this.p_state,this.p_init);
	return next ;
}

Indices.prototype.head = function () {
	if(this.p_state === _false) return _false;
	var head = new Vector(0); ;
	head.vector = this.p_state;
	return head;
}
	
Indices.prototype.dup = function () {
	return new Indices( this.p_init,this.env);
	}
	
Indices.prototype.clone = function () {
	var clone = new Indices( this.p_init,this.env);
	clone.p_state = (this.p_state === _false) ? _false : this.p_state.slice(0);
	return clone;
	}
	
Indices.prototype.length = function () {
	var lg = 1;
	for(var i=0; i < this.p_init.length; i++) lg *= this.p_init[i];
	return lg ;
	}

/*----------------------
Powerset
	p_state =  k = integer in 0 2^32-1
	p_init = [jsarray]
	p_starter = 0 // k starter
	p_max = 2^N 
----------------------------*/
subclass(Powerset, Procrastinator);

function Powerset(array,env ) { // p_init = list->array
	Procrastinator.call(this, array , env, "Powerset"); 
	this.p_max = Math.pow(2,array.length) ;
	this.p_starter = 0 ;
	this.init(array);
	}
	
Powerset.prototype.toString = function () {
	return "#Powerset: "  + this.p_state + "/" + this.p_max  ;
}

Powerset.prototype.init = function  (array) {
	this.p_state = this.p_starter = 0 ;
	this.p_init = array ;
//console.log("comb init",this.p_state.c);
	return this ;
}

Powerset.prototype.dup= function  () {
	var dup =  new Powerset (this.p_init,this.env);
	dup.p_state = dup.p_starter = this.p_starter ;
	return dup ;
}

Powerset.prototype.clone = function  () {
	var clone =  new Powerset (this.p_init,this.env);
	clone.p_starter = clone.p_state  = this.p_state;
	return clone;
}


Powerset.prototype.next = function () {
	if(this.p_state === _false) return _false;
	if(this.p_state >= this.p_max) return (this.p_state = _false) ;
	this.p_n++;
	
	var pset = [];
	var k = this.p_state;
	var idx = 0;
	while (k) {
		if(k & 0x01) pset.push(this.p_init[idx]) ;
		idx++;
		k >>= 1 ;
	}
	
	this.p_state++;
	return __array_to_list(pset);
}

Powerset.prototype.length = function () {
	return this.p_max ;
}

/*----------------------
Combinator
	needs list.lib
	state = {state} js object of __comb_next function
	p_init = [jsarray,k]
----------------------------*/
subclass(Combinator, Procrastinator);

function Combinator(array, k , env) { // p_init = list->array
	Procrastinator.call(this, [array,k] , env, "combinator"); 
	this.init(array,array.length,k);
	}
	
Combinator.prototype.toString = function () {
	return "#combinator: (" + this.p_init[0].length + "," + this.p_init[1] +")" ;
}

Combinator.prototype.init = function  (array,n,k) {
	this.p_state = { c : [], n : n , k : k , first : true , array : array } ;
	if(! _LIB["list.lib"]) glisp_error(70,"list.lib","combinator") ;
	this.p_state = __comb_init(this.p_state,n,k) ;
//console.log("comb init",this.p_state.c);
	return this ;
}

Combinator.prototype.dup= function  () {
	var dup =  new Combinator (this.p_init[0], this.p_init[1],this.env);
	if(this.p_state.ref) {
						dup.p_state.ref = this.p_state.ref ;
						dup.p_state.c = dup.p_state.ref.slice(0);
						dup.p_state.first = this.p_state.first ;
						}
	return dup ;
}

Combinator.prototype.clone = function  () {
	var clone =  new Combinator (this.p_init[0], this.p_init[1],this.env);
	clone.p_state = this.p_state === _false ? _false :
			{ 
			ref : this.p_state.c.slice(0), // remember starter to dup this clone
			c : this.p_state.c.slice(0), // dup current state
			n : this.p_state.n , 
			k : this.p_state.k , 
			first : this.p_state.first , 
			array : this.p_state.array } ;
	
//console.log("comb.clone",clone.p_state.c);
	return clone;
}


Combinator.prototype.next = function () {
	if(this.p_state === _false) return _false;
	this.p_n++;
	
	var comb = [] ;
	var array = this.p_init[0];
	var i,k = this.p_init[1];
	
	next = __comb_next(this.p_state); // sets new state
//console.log("comb.next",this.p_state.c);
	if(next === false) {this.p_state = _false; return _false;}
	for(i=0; i< k; i++) comb.push(array[this.p_state.c[i]]) ;
	return __array_to_list (comb);
}

Combinator.prototype.length = function () {
	return _Cnp (this.p_init[0].length,this.p_init[1]) ;
}

/*-----------------------------
Combinators with repetitions
-------------------------------*/
subclass(CombinatorRep, Procrastinator);

function CombinatorRep(array, k , env) { // p_init = list
	Procrastinator.call(this, [array,k] , env, "combinator/rep"); 
	this.init(array,array.length,k);
	}
	
CombinatorRep.prototype.toString = function () {
	return "#combinator/rep: (" + this.p_init[0].length + "," + this.p_init[1] +")" ;
}

CombinatorRep.prototype.init = function  (array,n,k) {
	this.p_state = { c : [], n : n , k : k , first : true , array : array } ;
	if(! _LIB["list.lib"]) glisp_error(70,"list.lib","combinator/rep") ;
	this.p_state = __comb_rep_init(this.p_state,n,k) ;
//console.log("comb init",this.p_state.c);
	return this ;
}

CombinatorRep.prototype.dup= function  () {
	var dup =  new CombinatorRep (this.p_init[0], this.p_init[1],this.env);
	if(this.p_state.ref) {
						dup.p_state.ref = this.p_state.ref ;
						dup.p_state.c = dup.p_state.ref.slice(0);
						dup.p_state.first = this.p_state.first ;
						}
	return dup ;
}

CombinatorRep.prototype.clone = function  () {
	var clone =  new CombinatorRep (this.p_init[0], this.p_init[1],this.env);
	clone.p_state = this.p_state === _false ? _false :
			{ 
			ref : this.p_state.c.slice(0), // remember starter to dup this clone
			c : this.p_state.c.slice(0), // dup current state
			n : this.p_state.n , 
			k : this.p_state.k , 
			first : this.p_state.first , 
			array : this.p_state.array } ;
	
//console.log("comb.clone",clone.p_state.c);
	return clone;
}

CombinatorRep.prototype.next = function () {
	if(this.p_state === _false) return _false;
	this.p_n++;
	
	var comb = [] ;
	var array = this.p_init[0];
	var i,k = this.p_init[1];
	
	next = __comb_rep_next(this.p_state); // sets new state
//console.log("comb.next",this.p_state.c);
	if(next === false) {this.p_state = _false; return _false;}
	for(i=0; i< k; i++) comb.push(array[this.p_state.c[i]]) ;
	return __array_to_list (comb);
}

CombinatorRep.prototype.length = function () {
	var n = this.p_init[0].length ;
	var k = this.p_init[1];
	return _Cnp (n+k-1,k) ;
}

/*---------------------
LazyList
state = p_state = list pointer
---------------------*/
subclass(LazyList , Procrastinator);

function LazyList(list, env) {
	Procrastinator.call(this, list, env,"LazyList"); // super
	}
	
LazyList.prototype.toString = function () {
	return (this.p_state === _false) ? "#list:#f" :
	       (this.p_state === null) ?  "#list:null" :
	       "#list:[" + glisp_tostring(this.p_state[0],"") + " ...]" ;
	       }
			
LazyList.prototype.next = function () {
	if(this.p_state === _false) return _false;
	if(this.p_state === null) {return (this.p_state = _false)};
	this.p_n++;
	var next = this.p_state[0];
	this.p_state = this.p_state[1];
	return next ;
}

LazyList.prototype.head = function () {
	if(this.p_state === _false) return _false;
	if(this.p_state === null)  return _false;
	return this.p_state[0];
}
	
LazyList.prototype.dup = function () {
	return new LazyList( this.p_init,this.env);
	}
	
LazyList.prototype.clone = function () {
	return new LazyList( this.p_state,this.env);
	}
	
LazyList.prototype.length = function () {
	return __length(this.p_init);
	}
LazyList.prototype.nth = function (n) {
	return _list_ref(this.p_init,n);
	}
LazyList.prototype.last = function () {
	return _last(this.p_init);
	}

/*---------------------
LazyArray
idx = p_init + p_n + 1
state = p_init | #f
---------------------*/
subclass(LazyArray , Procrastinator);

function LazyArray(jsarray, init, env) {
	Procrastinator.call(this,init, env,"LazyArray"); 
	this.p_array = jsarray;
	}
	
LazyArray.prototype.toString = function () {
var idx = this.p_n + this.p_init + 1;
	return "#array: " + array_tostring(this.p_array) + " idx: " + idx ;
	}
			
LazyArray.prototype.next = function () {
	if(this.p_state === _false) return _false;
	this.p_n++;
	var idx = this.p_n + this.p_init ;
	if(idx >= this.p_array.length) {return (this.p_state = _false)};
	return this.p_array[idx];
}

LazyArray.prototype.head = function () { // nth(0)
	return this.p_array[this.p_init];
}
	
LazyArray.prototype.dup = function () {
	return new LazyArray( this.p_array,this.p_init,this.env);
	}
	
LazyArray.prototype.clone = function () {
	var clone = new LazyArray( this.p_array,this.p_init+this.p_n+1,this.env);
	return clone;
	}
	
LazyArray.prototype.nth = function (n) {
	var idx = n + this.p_init ;
	return (idx < this.p_array.length ) ? this.p_array[idx] : _false ;
	}
	
LazyArray.prototype.length = function () {
	return this.p_array.length - this.p_init ;
	}
	
LazyArray.prototype.last = function () {
	return this.p_array[this.p_array.length -1];
	}
	
// drop NYI NYI (no loop needed) NYI 
	
/*-------------------
iterators : f(start), f(start+1), ...
iterators proc (n) , n >= 0  or #f
iterators proc's   have a cache
All dup's, clones share same cache

state = p_init | # f
nth (n) = proc (n + p_init)
-----------------------------------------------------*/

subclass(Iterator , Procrastinator);
function Iterator(proc, init,cache, env) {
	Procrastinator.call(this, init , env); // super
	this.p_proc = proc; // :=  [proc,[null,null]]
	
	if(cache === true) {
		var lambda = proc[0];
		if(isLambda(lambda) && lambda[TAG_REMEMBER] === undefined) {
			lambda[TAG_REMEMBER] = [] ;
			this.p_cache = lambda[TAG_REMEMBER];
			}
		else this.p_cache = null ;
		}
	else this.p_cache = cache ; // share 
	this.init();
}

Iterator.prototype.toString = function () {
	return "#iterator/n" 
	+ " cache: " + array_tostring(this.p_cache) 
	+ glisp_tostring([this.p_state,this.p_n],":state: ");
}


Iterator.prototype.state = function  () {
	return [this.p_state , this.p_n];
}

Iterator.prototype.set_state = function  (state) {
	this.p_state =  state[0];
	this.p_n =  state[1];
	return this;
}

Iterator.prototype.init = function  () {
	this.p_state =  this.p_init ;
	this.p_n = -1;
	return this;
}

// share cache
Iterator.prototype.dup = function  () {
	return new Iterator (this.p_proc, this.p_init, this.p_cache , this.env);
}

Iterator.prototype.clone = function  () {
	return new Iterator (this.p_proc, this.p_init+this.p_n+1, this.p_cache, this.env);
}


Iterator.prototype.next= function () {
var ret, idx ,cache = this.p_cache;

	if(this.p_state === _false) return _false;
	this.p_n++;
	idx = this.p_n + this.p_init;
	// if idx < 0 || not integer NYI
	if(cache &&  cache[idx] !== undefined) return cache[idx] ;
	this.p_proc[1][0] = idx;
	
	ret  = __ffuncall(this.p_proc,this.env); 
	if(ret === _false) return (this.p_state = _false) ;
	// if(cache) cache[idx] = ret; set by proc
	return ret; 
	}
	
Iterator.prototype.nth= function (n) {
var ret, idx , cache = this.p_cache ;
	idx = n + this.p_init;
	// if idx < 0 NYI
	if(cache && cache[idx] !== undefined) return cache[idx] ;
	this.p_proc[1][0] = idx;
	
	ret  = __ffuncall(this.p_proc,this.env); 
	if(ret === _false) return _false ;
	// if(cache) cache[idx] = ret; set by proc
	return ret; 
	}
	
Iterator.prototype.head = function () {
	if(this.p_state === _false) return _false;
	return this.nth(0);
	}
	
Iterator.prototype.drop = function (n) {
	var drop = this.dup();
	drop.p_init += n ;
	drop.p_state = drop.p_init;
	return drop;
}
	
	
/*-------------------
Compositors :  start, f(start), f(f start) , ...
Compositors  p_n not used
Compositors proc's   may have a cache

state = f(f(f(p_init))..) | # f
nth (0) =  p_init
nth(3) = (f(f(f p_init)))
-----------------------------------------------------*/

subclass(Compositor , Procrastinator);
function Compositor(proc, init, env) {
	Procrastinator.call(this, init , env); // super
	this.p_proc = proc; // :=  [proc,[null,null]]
	this.init();
}

Compositor.prototype.toString = function () {
	return "#iterator/fun" + glisp_tostring([this.p_state,this.p_n],":state: ");
}


Compositor.prototype.state = function  () {
	return [this.p_state , this.p_n];
}

Compositor.prototype.set_state = function  (state) {
	this.p_state =  state[0];
	this.p_n =  state[1];
	return this;
}

Compositor.prototype.init = function  () {
	this.p_state =  this.p_init ;
	this.p_n = -1;
	return this;
}


Compositor.prototype.dup = function  () {
	return new Compositor (this.p_proc, this.p_init, this.env);
}

Compositor.prototype.clone = function  () {
	var clone =  new Compositor (this.p_proc, this.p_state , this.env);
	return clone;
}


Compositor.prototype.next= function () {
	if(this.p_state === _false) return _false;
	this.p_n++; 
	if(this.p_n === 0) return this.p_init;
	this.p_proc[1][0] = this.p_state ;
	this.p_state   = __ffuncall(this.p_proc,this.env); 
	return this.p_state ; 
	}
	
Compositor.prototype.nth= function (n) {
var ret;
	if(this.p_n === n) return this.p_state;
	if(n === 0) return this.p_init;
	if(this.p_n < n) {
			ret = this.p_init ;
			for(i=0; i < n ; i++) {
					this.p_proc[1][0] = ret ;
					ret = __ffuncall (this.p_proc,this.env); 
					if(ret === _false) return _false;
					}
			return ret;
			}
			
			ret = this.p_state;
			for (i= this.p_n ; i < n ; i++) {
					this.p_proc[1][0] = ret ;
					ret = __ffuncall (this.p_proc,this.env); 
					if(ret === _false) return _false;
					}
			return ret;
	}
	
Compositor.prototype.length= function () {
var len = this.p_n + 1 || 1 , ret = this.p_state ;
		if(ret === _false) return len ;
		while (true) {
					this.p_proc[1][0] = ret ;
					ret = __ffuncall (this.p_proc,this.env); 
					if(ret === _false) return len ;
					len++;
					}
	}
	
Compositor.prototype.head = function () {
	if(this.p_state === _false) return _false;
	return this.p_init;
	}
	


/*---------------------
Sequences
state = p_state = p_init + num_steps * p_step
p_n not used
---------------------*/
subclass(Sequence , Procrastinator);

function Sequence(start, step, end, env) {

	Procrastinator.call(this, start, env, "sequence"); // super
	this.p_step = step;
	this.p_end = end ;
	this.p_bump = _ge (this.p_step,0) === _true ? true : false ; // increase ?
	
	if(typeof start === "number" && typeof step === "number" && typeof end === "number") {
	this.next = function () { // overrides
		var ret  = this.p_state ;
			if(ret === _false) return _false;
			this.p_n++;
			if (this.p_bump) {
			if(ret >= this.p_end) return _false;
			}
			else {
			if(ret <= this.p_end) return _false;
			}
		this.p_state = ret + this.p_step;
		return ret ;
		}
		
	this.nth = function (n) {
		return this.p_init + n * this.p_step;
		}
	
	this.length = function () {
		return (this.p_end === Infinity) ? Infinity : (this.p_end === -Infinity) ? -Infinity :
		        Math.ceil ((this.p_end - this.p_init) / this.p_step)   ;
		}
		
	this.sum = function (n) {
				n = Math.min(this.length() ,n) ;
				return (n === Infinity) ? Infinity : (n === -Infinity ) ?  -Infinity :
				(n * (2 * this.p_init + (n - 1) * this.p_step)) / 2 ;
				}
				
	this.last = function () {
		var n = this.length();
		return (n === Infinity) ? Infinity : (n === -Infinity ) ?  -Infinity :
		this.p_init + (n-1) * this.p_step ;
	}
	
	this.max = function () {
		return this.p_step > 0 ? this.last() : this.p_init ;
	}
	
	this.min = function () {
		return this.p_step > 0 ? this.p_init : this.last() ;
	}
	
	} // number type
}

Sequence.prototype.toString = function () {
	return "#sequence [" + glisp_tostring(this.p_state) + 
	 glisp_tostring (_add_xx (this.p_state,this.p_step), " ") +
	 " .. " +
	 glisp_tostring(this.p_end) + "[" ;
	
}

Sequence.prototype.dup = function () {
	return new Sequence(this.p_init,this.p_step,this.p_end,this.env);
}

Sequence.prototype.clone = function () {
	return new Sequence(this.p_state,this.p_step,this.p_end,this.env);
}

Sequence.prototype.init = function () {
	this.p_state = this.p_init;
}

Sequence.prototype.next= function () {
var ret;
	ret  = this.p_state ;
	if(ret === _false) return _false;
	this.p_n++;
	
	if (this.p_bump) {
		if(_ge (ret, this.p_end) === _true) return _false;
		}
	else {
		if(_le (ret, this.p_end) === _true) return _false;
		}
		
	this.p_state = _add_xx(ret, this.p_step) ;

	return ret ;
	}
	
Sequence.prototype.head= function () {
	return this.p_init;
	}
	
Sequence.prototype.tail = function () {
return new Sequence(_add_xx(this.p_init,this.p_step),this.p_step,this.p_end,this.env);
}
	
Sequence.prototype.nth = function (n) { // check limit NYI NYI 
	return _add_xx(this.p_init , _mul_xi (this.p_step,n)) ;
	}
	
Sequence.prototype.length = function () {
		return (this.p_end === Infinity) ? Infinity : (this.p_end === -Infinity) ? -Infinity :
		Math.ceil (_div_xx (_sub_xx(this.p_end,this.p_init) ,this.p_step))  ;
	}
	
Sequence.prototype.sum = function (n) {
		n = Math.min(this.length() ,n) ;
		return (n === Infinity) ? Infinity : (n === -Infinity ) ?  -Infinity :
		_div_xi (_mul_xx (n , _add_xx (_mul_xi(this.p_init,2), _mul_xx(this.p_step, (n-1)))), 2) ;
		}
		
Sequence.prototype.last = function () {
		var n = this.length();
		return (n === Infinity) ? Infinity : (n === -Infinity ) ?  -Infinity :
		_add_xx (this.p_init, _mul_xx (this.p_step, n-1)) ;
		}
		
Sequence.prototype.min = function () {
		return  _gt (this.p_step,0) === _true ? this.p_init : this.last();
		}
Sequence.prototype.max = function () {
		return  _gt (this.p_step,0) === _true ? this.last() : this.p_init;
		}
		
/*-----------------
StringSequences
p_init = [char codes]
p_state = [codes];
p_end = [codes]
-------------------------*/

subclass(StringSequence , Procrastinator);

function __codes_to_string (codes) { // js array
if(codes === _false) return _false;
return codes.map(function(code){ return String.fromCharCode(code);}).join('') ;
}

// start,end = js arrays of codes
function StringSequence(start, end, env) {
	Procrastinator.call(this, start, env, "string-sequence"); // super
	this.p_end = end ;
	this.init();
	}
	
StringSequence.prototype.toString = function () {
	return "#string-sequence [" + 
			 __codes_to_string(this.p_init)  +  // dbg
			 " .. " + 
			 __codes_to_string(this.p_end) + "]" ;
}

StringSequence.prototype.dup = function () {
	return new StringSequence(this.p_init,this.p_end,this.env);
}

StringSequence.prototype.clone = function () {
	return new Sequence(this.p_state.slice(0),this.p_end,this.env);
}

StringSequence.prototype.init = function () {
	this.p_state =  this.p_init.slice(0);
}

StringSequence.prototype.next= function () {
var ret , i;
	if(this.p_state === _false) return _false;
	this.p_n++;
	ret = __codes_to_string(this.p_state);
	
	for(i=0; i<this.p_init.length;i++) {
		this.p_state[i]++;
		if(this.p_state[i] > (this.p_end[i] || this.p_init[i]))
		   this.p_state[i] = this.p_init[i];
		   else break;
	}
	if(i >= this.p_init.length) this.p_state = _false;
	return ret ;
	}
	
StringSequence.prototype.head= function () {
	return  __codes_to_string(this.p_init) ;
	}

/*-----------------
generators

(define (pgene i)
	(yield i)
	(yield (+ 10 i))
	(set! i (+ 2 i))
	i)
	
(define gene (make-generator pgene 1))
------------------------*/

var _yield = function (value, env) {
	return value; // outside generator
}

/*---------------------
Generator s yield values
state = p_state + p_awake + p_freeze
p_cache not used
-----------------------------*/

subclass(Generator , Procrastinator);
function Generator(proc, init,  env) {
	Procrastinator.call(this, init, env); // super
	this.p_proc = proc;
	this.p_cache = null;
	this.init();
}

Generator.prototype.toString = function () {
	return "#generator" + glisp_tostring(this.p_state,":state:");
}


Generator.prototype.state = function  () {
	return [this.p_state, this.p_awake, this.p_freeze] ;
}

Generator.prototype.set_state = function  (state) {
	this.p_state =  state[0] ;
	this.p_awake =  state[1];
	this.p_freeze = state[2];
	return this;
}

Generator.prototype.init = function  () {
	this.p_state =  this.p_init ;
	this.p_awake = null;
	this.p_freeze = null;
	this.p_n = -1;
	return this;
}

Generator.prototype.dup = function  () {
	return new Generator (this.p_proc, this.p_init,  this.env);
}

Generator.prototype.clone = function  () {
	glisp_error(38,this,"generator:clone");
}

Generator.prototype.next= function () {
var proc, retnext, values ;

	if(this.p_state === _false) return _false;
	this.p_n++;

	if(this.p_awake) {
					proc = this.p_awake ;
					values = __array_to_list(this.p_freeze);
					this.p_freeze = null;
					this.p_awake = null; }
				else {
					proc = this.p_proc ;
					values = [this.p_state,null] ;
					}
					
	retnext  = __g_call(proc,values,this.env); 
	if(retnext === _false) return (this.p_state = _false) ;
	
// [ _yield , next , stack_shot,  __make_lambda (params, expr[1])];
	if(Array.isArray(retnext) && retnext[0] === _yield) { // comes from yield
			this.p_freeze = retnext[2];
			this.p_awake= retnext[3];
			this.p_n++ ;
			// if(this.p_cache) this.p_cache[this.p_n] = retnext[1];
			return retnext[1];
			}
// console.log ("next-loop",next);		
	this.p_state = retnext ;
	return this.next(); // careful: endless loop if no yield inside
	}
	
Generator.prototype.head = function  () {
	glisp_error(38,this,"generator:head");
}

	
	
/*---------------------------
Making Procrastinators
----------------------*/
// (sequence a Infinity) (a next Infinity)  ...
var _sequence = function (top, argc, env) {
var end,step;
	var start = _stack[top++] ;
	if(typeof start === "string") 
		{
		start = start.split('').map(function (cstr) {return cstr.charCodeAt(0);}) ;
		// check type NYI
		end = _stack[top].split('').map(function (cstr) {return cstr.charCodeAt(0);}) ;
		return new StringSequence(start, end, env) ;
		}
	step =  (argc > 2) ? _sub_xx ( _stack[top++] , start ) : 1 ;
	end =  _stack[top] ;
	if (end === Infinity && _lt(step,0) === _true) end = -Infinity;
	return new Sequence (start, step, end, env) ;
}


var _make_generator = function (proc, init, env) {
	proc = checkProc(proc,1,1,"make-generator");
	return new Generator(proc,init,env); // no cache
}

var _make_iterator = function (proc, n_starter, env) {
	proc = checkProc(proc,1,1,"make-iterator/n");
	proc = [proc, [null,null]] ;
	return new Iterator(proc,n_starter,true,env); // creates cache
}

var _make_compositor = function (proc, seed, env) {
	proc = checkProc(proc,1,1,"make-iterator/f");
	proc = [proc, [null,null]] ;
	return new Compositor(proc,seed,env); 
}

var _make_indices = function (dims) {
	if (! (dims instanceof Vector)) glisp_error(65,dims,"indices") ;
	return new Indices(dims.vector);
}

var _make_combinator = function (list , k, env) {
	if(notIsList(list)) glisp_error(20,list,"combinator");
	list = __list_to_array(list);
	var n = list.length;
	if(! isSmallSmallInteger(k) || k <= 0 || k > n)
				glisp_error(102,k,"combinator") ;
	return new Combinator(list,k);
}

var _make_powerset = function (list , env) {
	if(notIsList(list)) glisp_error(20,list,"powerset");
	return new Powerset (__list_to_array(list));
}

var _make_combinator_rep = function (list , k, env) {
	if(notIsList(list)) glisp_error(20,list,"combinator/rep");
	list = __list_to_array(list);
	var n = list.length;
	if(! isSmallSmallInteger(k) || k <= 0 )
				glisp_error(102,k,"combinator/rep") ;
	return new CombinatorRep(list,k);
}

/*---------------
Procrastinators/Generators/Sequences  API
-----------------------*/

var _procrastinator_p = function (obj) {
	return (obj instanceof Procrastinator ) ? _true : _false;
}

var _make_procrastinator = function (obj, env) {
	return Procrastinator.g_convert(obj,env,"make-procrastinator") ;
}

var _p_next = function (obj) { // generic, cf take & drop
	checkProcrastinator (obj,"next");
	return obj.next(); 
}

var _p_head = function (obj) { // generic, cf take & drop
	checkProcrastinator (obj,"head");
	return obj.head(); 
}
var _p_tail= function (obj) { // generic, cf take & drop
	checkProcrastinator (obj,"tail");
	return obj.tail(); 
}

var _p_dup = function (obj,env) { // generic, cf take & drop
	return Procrastinator.g_dup(obj,env,"dup"); // env not used remove me NYI
}

var _p_clone = function (obj,env) { 
	checkProcrastinator (obj,"clone");
	return obj.clone();
}

var _p_init = function (obj) { 
	checkProcrastinator (obj,"init");
	return obj.init(); ;
}

// _append 
var _p_append = function (a,b,env) { // ++ operator - extended append
	return Procrastinator.g_append(a,b,env);
}

var _p_take_when = function (pred, obj, n, env) {
	obj = Procrastinator.g_convert(obj,env,"take/when") ;
	pred = checkProc(pred,1,1,"take/when");
	return obj.take_when(pred,n,env);
}
var _p_take_while = function (pred, obj, n, env) {
	obj = Procrastinator.g_convert(obj,env,"take/while") ;
	pred = checkProc(pred,1,1,"take/while");
	return obj.take_while(pred,n,env);
}
var _p_drop_while = function (pred, obj, n, env) {
	obj = Procrastinator.g_convert(obj,env,"drop/while") ;
	pred = checkProc(pred,1,1,"drop/while");
	return obj.drop_while(pred,n,env);
}
	
//var _p_sum = function (obj, n, env) {
var _p_sum = function(top, argc, env) {
	var obj = Procrastinator.g_convert(_stack[top++],env,"sum") ;
	var n = (argc > 1) ? checkInteger (_stack[top], "sum/when") : Infinity ;
	return obj.sum(n,env);
}

//var _p_sum_when = function (pred, obj, n, env) {
var _p_sum_when = function(top, argc, env) {
	var pred = checkProc(_stack[top++],1,1,"sum/when");
	var obj = Procrastinator.g_convert(_stack[top++],env,"sum/when") ;
	var n = (argc > 2) ? checkInteger(_stack[top],"sum/when") : Infinity ;
	return obj.sum_when(pred,n,env);
}


var _p_nth = function (obj,n,env) { // !! operator - extended list_ref
	obj = Procrastinator.g_convert(obj,env,"nth") ;
	// check n NYI
	return obj.nth(n);
}

var _p_cons = function (self,env) {
	self= self[1];
	var head = __eval(self[0],env);
	var tail = self[1][0] ;
	return Procrastinator.g_cons(head,tail,env);
}

/*-------------------
scan -> intermediate fold results
(scanl proc init list|proctor) -> list (init f(l[0],acc), ...)
-----------------------*/
var _scanl = function (top, argc,env) {
var proc,acc,list1,list2 = null;
		var proc = _stack[top++];
		var acc = _stack[top++]; // init acc
		var list1 = _stack[top++];
		if(argc > 3) list2 = _stack[top++];
		if(argc > 4) glisp_error(38,"","scan:5:n");
		if(list1 === null) return [acc, null] ;
		
		if (list1 instanceof Procrastinator || list2 instanceof Procrastinator) 
			return Procrastinator.g_scan (proc,acc,list1,list2,env);

		if(notIsList(list1)) glisp_error(20,list1,"scan");
		if(list2 && notIsList(list2)) glisp_error(20,list2,"scan");
		
		return (argc === 3) ? _scanl_3 (proc,acc,list1,env) :
							  _scanl_4 (proc,acc,list1,list2,env);
}

function _scanl_3 (proc,acc, list, env) {
	proc = checkProc(proc,2,2,"scan");
	var fcall = [proc, [null , [null , null]]];
	var ret = [acc];
	
	while(list) {
			fcall[1][0] = list[0];
			fcall[1][1][0] = acc;
			acc = __ffuncall(fcall,env);
			ret.push(acc);
			list = list[1];
			}
return __array_to_list(ret);
}

function  _scanl_4  (proc, acc, list1, list2,  env) {
	proc = checkProc(proc,3,3,"scan");
	var fcall = [proc, [null , [null , [null , null]]]];
	var ret = [acc];
	while(list1 && list2) {
			fcall[1][0] = list1[0];
			fcall[1][1][0] = list2[0];
			fcall[1][1][1][0] = acc;
			acc = __ffuncall(fcall,env);
			ret.push(acc);
			list1 = list1[1];
			list2 = list2[1];
			}
return __array_to_list(ret);
}

/*----------------
rem zip = (map cons ga gb)
rem zipWith = (map proc ga gb)

fibs = 0 : 1 : zipWith (+) fibs (tail fibs)
-------------------*/

function boot_sequences () {
		define_sysfun(new Sysfun ("procrastinator?",_procrastinator_p,1,1)); 
		define_sysfun(new Sysfun ("procrastinator",_make_procrastinator,1,1));  // DEBUG
		define_sysfun(new Sysfun ("generator",_make_generator,2,2)); 
		define_sysfun(new Sysfun ("indices",_make_indices,1,1)); 
		define_sysfun(new Sysfun ("powerset",_make_powerset,1,1)); 
		define_sysfun(new Sysfun ("combinator",_make_combinator,2,2)); 
		define_sysfun(new Sysfun ("combinator/rep",_make_combinator_rep,2,2)); 

		define_sysfun(new Sysfun ("iterator/n",_make_iterator,2,2)); 
		define_sysfun(new Sysfun ("iterator/f",_make_compositor,2,2)); 
		define_sysfun(new Sysfun ("make-generator",_make_generator,2,2));  // compatibility
		define_sysfun(new Sysfun ("sequence",_sequence,2,3)); 

// generalized, polymorph functions
// take, map, length, last, cache, foldl , for ((i procrastinator))
// filter , min, max

		define_sysfun(new Sysfun ("yield",_yield,1,1));
		define_sysfun(new Sysfun ("next",_p_next,1,1)); 
		define_sysfun(new Sysfun ("kons",_p_cons,2,2)); 
		define_sysfun(new Sysfun ("head",_p_head,1,1));  
		define_sysfun(new Sysfun ("tail",_p_tail,1,1));  
		define_sysfun(new Sysfun ("dup",_p_dup,1,1)); 
		define_sysfun(new Sysfun ("clone",_p_clone,1,1));  // debug only
		define_sysfun(new Sysfun ("init",_p_init,1,1)); 
		define_sysfun(new Sysfun ("take/when",_p_take_when,3,3)); // (pred, procast, n)
		define_sysfun(new Sysfun ("take/while",_p_take_while,3,3)); // (pred, procast, n)
		define_sysfun(new Sysfun ("drop/while",_p_drop_while,3,3)); // (pred, procast, n)
		define_sysfun(new Sysfun ("sum",_p_sum,1,2)); // (proctor [, n])
		define_sysfun(new Sysfun ("sum/when",_p_sum_when,2,3)); // (pre,proctor[,n])
		define_sysfun(new Sysfun ("scanl",_scanl,3,4)); // (proc:2 init list|proctor)

		define_sysfun(new Sysfun ("nth",_p_nth,2,2)); 
		
		define_special(new Sysfun(":",_p_cons,2,2));
		define_special(new Sysfun ("kons",_p_cons,2,2)); 
		
		if(_LIB["types.lib"]) define_type ("Procrastinator",null,_procrastinator_p,true);
		__make_sequence_macros () ; // :
		
    	writeln("sequences.lib v2.6 ® EchoLisp","color:green");		
     	_LIB["sequences.lib"] = true;
     	}

boot_sequences();
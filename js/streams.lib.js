/*
streams.lib (always here)
(C)  Jacques Tramu 2015

Sequences and streams
http://mitpress.mit.edu/sicp/full-text/book/book-Z-H-24.html#%_sec_3.5
http://srfi.schemers.org/srfi-41/srfi-41.html  <==: hard intro super exemples <===
http://people.cs.aau.dk/~normark/prog3-03/html/notes/eval-order_themes-delay-stream-section.html
http://docs.racket-lang.org/search/index.html?q=sequences

*/

//geeeeeeeeeeeee = 0; strict mode detector
var extendClass = function(child, parent) {
    var Surrogate = function() {};
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate();
};

/*-----------------
GLisp streams API
------------------*/
function isStream (stream) {
					return (stream instanceof NumStream || stream instanceof Stream );
					}
					
var _streamp = function (obj) {
				return (obj instanceof NumStream || obj instanceof Stream) ? _true : _false;
				}
var _jsstreamp = function (obj) {return (obj instanceof JSNumStream) ? _true : _false;}

var _stream_first = function (stream,env) {
					if(! isStream(stream)) glisp_error(72,stream,"stream-first");
					return stream.first();
					}
/*
var _stream_next = function (stream,env) { // INTERNAL - only numstreams
					if(! isStream(stream)) glisp_error(72,stream,"stream-next!");
					return stream.next(env);
					} // and scrambles stream
*/
var _stream_rest = function (stream,env) {
					if(! isStream(stream)) glisp_error(72,stream,"stream-rest");
					return stream.rest();
					}
// different from scheme
var _stream_iterate = function (stream,env) {
					if(! isStream(stream)) glisp_error(72,stream,"stream-iterate");
					return stream.iterate(); // returns self with new rest
					}
var _stream_ref = function (stream,idx,env) {
					if(! isStream(stream)) glisp_error(72,stream,"stream-ref");
					if(! isSmallInteger(idx)) glisp_error(48,idx,"stream-ref");
					return stream.ref(idx);
					}
var _stream_empty_p = function(stream,env) {
					if(! isStream(stream)) glisp_error(72,stream,"stream-empty");
					return stream.empty();
					}
					
var _stream_map = function (proc ,stream1 , stream2 ,env) { // map:3:3  (map 2:n NYI)
					proc = checkProc (proc,2,2); 
					if(! isStream(stream1)) glisp_error(72,stream1,"stream-map");
					if(! isStream(stream2)) glisp_error(72,stream2,"stream-map");
					return Stream.map ( proc, stream1, stream2 , env) ;
					}
var _stream_add = function (stream1 , stream2, env) { // add:2::2  (add 2:n NYI)
					if(! isStream(stream1)) glisp_error(72,stream1,"stream-add");
					if(! isStream(stream2)) glisp_error(72,stream2,"stream-add");
					return Stream.add (  stream1, stream2, env) ;
					}
var _stream_mul = function (stream1 , stream2, env) { // mul:2::2  (add 2:n NYI)
					if(! isStream(stream1)) glisp_error(72,stream1,"stream-mul");
					if(! isStream(stream2)) glisp_error(72,stream2,"stream-mul");
					return Stream.mul (  stream1, stream2, env) ;
					}
var _stream_filter = function (proc , stream, env) { 
					proc = checkProc (proc,1,1,"stream-filter");
					if(! isStream(stream)) glisp_error(72,stream,"stream-filter");
					return Stream.filter (  proc, stream , env) ;
					}
// fail if proc is 'prime? or 'f (same for map probably) : checkProc not quoted !!!!
// or convert proc to not quoted:  proc = getProc (proc,1,1) : BEST NYI NYI NYI

var _stream_to_list = function (top, argc) {
				var stream = _stack[top++];
				var limit = (argc > 1) ? _stack[top] : 999 ;
				if(! isStream(stream)) glisp_error(72,stream,"stream->list");
				return Stream.toList(stream,limit);
				}

var _stream_cons = function (self , env) { 
		self = self[1];
		var first = __eval(self[0],env) ;
		var rest = self[1][0];
//glisp_trace("stream cons", first , env ,true);
//glisp_trace("stream cons", rest , env,true);
		return new Stream (first,rest,env); 
		}
		
var _make_stream = function (self , env) { // (make-stream proc:1 initial-state)
		self = self[1];
		var proc = self[0];
		var init = __eval(self[1][0],env);
		proc = checkProc(proc,1,1,"make-stream");
		
//glisp_trace("stream cons", first , env ,true);
//glisp_trace("stream cons", rest , env,true);
// starting value/state
		proc = [proc, [null , env]] ;
		proc[1][0] = init ;
		// env.set("self","_undefined");
		init = __ffuncall(proc,env);
		return new Stream (init[0], proc ,env,init[1]); 
		}


/*----------------------
S T R E A M S
(stream-proc state) ->  (new first . new state) or not pair -> finished
-------------------------------*/
var _STREAM_ID = 0;
function Stream ( first, rest , env ,state) {
	this.cache = [] ; // for stream-ref
	this.state = state; // else built by make-stream
	this.car = first ; // expr value (not delayed)
	this.cdr = rest ; // (eval rest) -> a stream, or [proc , [ arg, null]]
	this._rest = undefined ; // cached value
	this.env = env ; // the stream-cons env - BEST new GL env - and add "self" NYI : NO NO NO
	this.id = _STREAM_ID++; // DBG
	
// glisp_trace(this.env,"env","new stream");
}

Stream.prototype.empty = function ()  {
		 return this.car === undefined ? _true : _false; }
		 
Stream.prototype.first = function () { 
		  if(this.car === undefined) glisp_error(71,this,"stream-first") ;
		  return this.car ;
		}
		
Stream.prototype.rest = function () { 
var newstate ;
		if(this._rest !== undefined) return this._rest; // return cached promise value

// stream with state
		if(this.state !== undefined) {
		
		if(typeof this.cdr === "function") // system stream
			newstate = this.cdr(this.state) ;
		else { // user stream
		 	this.env.set("self",this) ;
			this.cdr[1][0] = this.state; 
			newstate =  __ffuncall (this.cdr , this.env) ; // may need "self" NEW DOC NYI
			}
		if(Array.isArray (newstate)) 
			this._rest = new Stream (newstate[0] ,this.cdr , this.env, newstate[1]);
			else 
			this._rest = _empty_stream ;
		return this._rest ;
		}

// must return a  stream 
		 this._rest = __eval(this.cdr, this.env) ;
//glisp_trace(this.id,rest.id,"rest-of id --> id ",true);
		  return this._rest ; // new stream
} // rest
		
// iterates returns new first
// and patches self : new first, new rest , no cached _rest
// usage : (while (not(stream-empty? stream)))  (do-something (stream-iterate strem))
// NYI NYI iterate on NumStream ..... NYI NYI

Stream.prototype.iterate = function () { 
var first = this.car ; // to return
var rest, newstate ;
		if(first === undefined)  glisp_error(71,this,"stream-iterate") ;
//
		if(this.state !== undefined) {
		this.env.set("self",this) ;
			if(typeof this.cdr === "function") // system stream
				newstate = this.cdr(this.state) ;
			else { // user stream
				this.cdr[1][0] = this.state; 
				newstate =  __ffuncall (this.cdr , this.env) ; 
			}

		if(Array.isArray (newstate)) {
			this.car = newstate[0];
			this.state = newstate[1];
			}
			else 
			this.car = undefined ;
		return first ;
		} // with state

// a new stream
		 rest = __eval(this.cdr, this.env) ;
// patch me : not working on num strings NYI NYI NYI
		this._rest = undefined;
		this.car = rest.car;
		this.cdr = rest.cdr;
		return first ;
} // stream-iterate : return first
		
Stream.prototype.toString  = function () { // show first only if number
		if(this.car === undefined) return "empty-stream" ;
		var first = (typeof this.car === "number") ? this.car  : false;
		return  "#stream:id:"  + this.id 
			// + " state: " + this.state    // DBG
			// + glisp_tostring(this.env, " env:") // dbg
			+ ((first) ? glisp_tostring(first," first:") : "[...]") ;
		} 
		
// (stream-ref stream 0) -> first
Stream.prototype.ref = function (idx) {
		var memory = (idx < _CACHE_SIZE) ? idx : -1;
		if (memory  >= 0 && this.cache[memory]) return this.cache[memory];
		memory = 1;
		
		var ref   = this.first(); // not this.car (num subclasses have no car)
		this.cache[0] = ref;
		
        this.env.set("self",this);
		if(this.state !== undefined) {
		var state = this.state;
		while(idx--) {
				if(typeof this.cdr === "function")
					ref = this.cdr (state);
				else {
					this.cdr[1][0] = state;
					ref = __ffuncall(this.cdr,this.env);
					}
				if(! Array.isArray(ref)) glisp_error(71,this,"strem-ref");
				state= ref[1];
				ref = ref[0];
				if(memory < _CACHE_SIZE) this.cache[memory++] = ref;
				}
		return ref;
		}
		
		var next = this;
		while(idx--) {
					next = next.rest();
					ref = next.first();
					if(memory < _CACHE_SIZE) this.cache[memory++] = ref;
					}
		
		return ref;
} // stream-ref
		

Stream.add = function (astream , bstream , env)  {
 			var a = astream.first();
		    var b = bstream.first();
		    var car = _add_xx(a,b);
		    var arg1 = [_stream_rest , [astream, null]] ;
		    var arg2 = [_stream_rest , [bstream, null]] ;
		    var cdr =  [_stream_add , [ arg1 , [arg2 , null]]] ;
		    return new Stream (car , cdr ,env);
}

Stream.mul= function (astream , bstream , env)  {
 			var a = astream.first();
		    var b = bstream.first();
		    var car = _mul_xx(a,b);
		    var arg1 = [_stream_rest , [astream, null]] ;
		    var arg2 = [_stream_rest , [bstream, null]] ;
		    var cdr =  [_stream_mul , [ arg1 , [arg2 , null]]] ;
		    return new Stream (car , cdr ,env);
}


Stream.map = function (proc , astream , bstream , env )  {
 			var a = astream.first();
		    var b = bstream.first();
		    var car = __ffuncall( [proc , [ a , [ b , null]]] , env) ;
		    var arg1 = [_stream_rest , [astream, null]] ;
		    var arg2 = [_stream_rest , [bstream, null]] ;
		    var cdr =  [_stream_map , [proc , [ arg1 , [arg2 , null]]]] ;
		    return new Stream ( car , cdr , env);
}

Stream.filter = function (proc , stream , env )  {
var a, f ;
			while (true) {
 				 a = stream.first();
 				 if(a === undefined) return _empty_stream ;
//glisp_trace(a,stream,"filter",true);
		   		 f = __ffuncall( [proc , [ a ,  null]] , env) ;
		   		 if(f !== _false) break;
		   		 stream = stream.rest();
		   		 }
		   		 
		    var arg1 = [_stream_rest , [stream, null]] ;
		    var cdr =  [_stream_filter , [proc , [ arg1 , null]]] ;
		    return new Stream ( a , cdr , env);
}

Stream.toList = function (stream, limit) {
		var ret = [];
		var first = stream.first() ;
// proc defined		
stream.env.set("self",stream);

		if(stream.state !== undefined) {
			var state = stream.state;
			while(limit--) {
				ret.push(first) ;
				
				if(typeof stream.cdr === "function") // system stream
				first  = stream.cdr(state) ;
				else {
					stream.cdr[1][0] = state;
					first = __ffuncall(stream.cdr,stream.env);
					}
					
				if(! Array.isArray(first)) break;
				state= first[1];
				first = first[0];
				}
		return __array_to_list(ret);
		}
		
// stream defined	
		while(limit--) {
			first = stream.first();
			if(first === undefined) break;
			ret.push(first) ;
			stream = stream.rest();
			if(stream.first() === undefined) break;
		}
		return __array_to_list(ret);
}

var _stream_cache = function (stream) {
	return  new Vector(stream.cache);
}


// glob constant
var _empty_stream = new Stream(undefined,undefined);

/*---------------
NumStreams utilities
bump(val,step,end)
val += step 
 --> undef if stream empty or end reached
 --> do'nt raise error (used in (for ..) loops
---------------*/

function __jsnum_bump (val, step, end) { // js integers
	if(val === undefined) return undefined;
	val += step;
	if(step > 0 && val >= end) return undefined;
	if(step < 0 && val <= end) return undefined;
	return val;
	}
function __num_bump (val, step, end) { // any type of number
	if(val === undefined) return undefined;
	val = _add_xx(val,step);
	if(isPositive(step) && (_ge(val,end) === _true)) return undefined;
	if(isNegative(step) && (_le(val,end) === _true)) return undefined;
	return val;
	}

/*----------------------
NumStream's

NumStream and subclass JSNumstream are internal classes
(in-range ..) (in-naturals ..) return a [JS]NumStream
------------------------*/

function NumStream ( start , end , step) { // Glisp numbers
	this.cache = [] ; // for stream-ref
	this.start = start ;
	this.end = end;
	this.step = step || 1 ;
	this._next = start ; // in (for loops ) only
}

NumStream.prototype.first = function () {return this.start;} ;

NumStream.prototype.next = function() { // INTERNAL use me in (for..)
			return (this._next = __num_bump( this._next, this.step,this.end)) ; }

NumStream.prototype.rest = function () { 
			return  new NumStream 
				(__num_bump( this.start, this.step,this.end), this.end,this.step) ;
			 }
			 
NumStream.prototype.empty = function () { return this.start === undefined ? _true : _false; }

NumStream.prototype.toString  = function () {
				return  "#num-stream:" + this.start.toString() +
						 ":" + this.end.toString() + " step:" + this.step.toString() ;
				}
				
NumStream.prototype.ref = function (idx) {
				var memory = (idx < _CACHE_SIZE) ? idx : -1;
				if (memory  >= 0 && this.cache[memory]) return this.cache[memory];
				memory = 1;
				
				var _next = this._next ; // save
				var ret = this._next ;
				this.cache[0] = ret;
				while(idx--) {
						ret = this.next();
						if(ret === undefined) glisp_error(24,this,"stream-ref");
						if(memory < _CACHE_SIZE) this.cache[memory++] = ret;
						}
				this._next = _next; // restore
				return ret;
} 

/*-----------------
JS nums streams
-----------------------*/
function JSNumStream ( start , end , step) {
	this.cache = [];
	this.start = start ; // BOGUE ! undefined is legal and means an empty() one
	this.end = end;
	this.step = step || 1 ;
	this._next = start ; // loops only	
}

extendClass(JSNumStream, NumStream);

JSNumStream.prototype.toString  = 
function () {return  "#num-stream:" + this.start + ":" + this.end + " step:" + this.step ;} 

JSNumStream.prototype.next = function() { // use me in (for..)
			return (this._next = __jsnum_bump( this._next, this.step,this.end)) ; }
			
JSNumStream.prototype.rest = function () { 
			return  new JSNumStream 
				(__jsnum_bump( this.start, this.step,this.end), this.end,this.step) ;
			 }


/*---------------------
built-in streams
----------------------*/
var _in_range_endpoint = function (top,argc,env) {
	return _in_range(top,argc,env,true);
}

var _in_range = function (top,argc,env,endpoint) { // -->[JS] NumStream
	var start = 0, end , step = 1;
	if(argc ===  1) end = _stack[top] ;
	if(argc >= 2) { start = _stack[top]; end = _stack[top+1]; }
	if(argc === 3) step = _stack[top+2];
	if(endpoint) end = _add_xx(end,step);
	if(typeof start === "number" 
		&& typeof end === "number" 
		&& typeof step === "number")
		return new JSNumStream(start,end,step);

	return new NumStream(start,end,step);
}

var _in_naturals = function (top,argc) { // --> NumStream
	var start = 0 ;
	if(argc ===  1) start = Math.floor(+ _stack[top]) ;
	
	return new JSNumStream(start,+Infinity,1);
}

var _in_cycle = function (list) {
	// check not circular : NYI
	if(notIsList(list)) glisp_error(20,list,"in-cycle");
	var  head = list ;
	while (list) {
		if(list[1] === null) break;
		list = list[1] ;
		}
	list[1] = head;
	return head;
}

/*---------------------------------
for clause to js array (for perfs)
---------------------------*/
// input :  end value |   (in-range start end [step])  | (list) | *stream
// returns [type ,start, end, [step,] start]
// types :
// 1 = JS number
// 2 = Glisp number
// 3 = List (graph)
// 4 = stream : [4, stream.first, stream.rest, stream]
// 5 = string
// 6 = vector or hash (js arrays)
// 7 = table (js array of js arrays)
// 8  = producer
// 9  = object with object.next


function __for_sequence ( expr, env) {
/*	if(!(env instanceof GLenv)) {
				glisp_error(1,form,"for - missing env") ;
				}
*/

	expr = __eval(expr,env);
	
	if(typeof expr === "number") return [1 ,0 , expr, 1 ,0] ; 
	if(typeof expr === "string") return [5,expr.substr(0,1),0,expr.length-1,expr];

	if(isGraph (expr)) expr = expr[1];  // then, as a list
	
	if(isListNotNull (expr)) {
				if(expr[0] === _in_producer)  return [8, __eval(expr[1],env) , null,expr[1]] ;
				return [3 , expr[0] ,expr[1] , expr] ;  // in-list
				}
						 
	if(expr === null) return [3,undefined] ; // will stop the for

	if(expr instanceof Stream) return [4 , expr.first(), expr.rest(),expr]; // in-primes
	if(expr instanceof JSNumStream) { // in-range
						if(expr.start >= expr.end && expr.step > 0) return [1,undefined]; 
						if(expr.start <= expr.end && expr.step < 0) return [1,undefined]; 
						return [1, expr.start, expr.end,expr.step, expr.start]; 
						}
						
	if(expr instanceof NumStream) return [2, expr.start, expr.end,expr.step, expr.start];
	
	if(expr instanceof Vector)  return [6,expr.vector[0],0,expr.vector.length,expr.vector];
	if(expr instanceof Hash) { // use hash.cache iff not dirty : NYI NYI NYI
							expr = __hash_to_array(expr);
							return [6,expr[0],0,expr.length,expr];
							} 
	if(expr instanceof Table)  return [7,expr.getref(0),0,expr.array.length-1,expr];
	if(expr instanceof Procrastinator) {
								expr = expr.dup();
								var next = expr.next();
								if(next === _false) next = undefined;
								return [9, next,null,expr] ;
								}
	
	glisp_error(56,expr,"for");
}

/*------------------
(for ((i <sequence> ) (j ...) [break expr]) body)
----------------------------*/

/*
variant = 0 : for
 = 1 : sum
 = 2 : product
 = 3 : list
 = 4 : fold
 = 5 : vector
 = 6 : string 
 = 7 : and
 = 8 : or
 = 9 : max
 */
 
var _BREAK_FOR = null;
var _CONTINUE_FOR = null;
var _WHEN_FOR = null;

function __begin_for(exprs, env) {
	var kwd, ret = null, expr, next, wants_break ;
	for(expr = exprs ; expr !== null ; expr = expr[1]) {
	kwd = expr[0];
		if(kwd === _WHEN_FOR ) {
			expr = expr[1];
			// if(expr === null) .. syntax error NYI
			if( __eval(expr[0],env) === _false) return _CONTINUE_FOR ;
		}
		else if (kwd === _CONTINUE_FOR ) {
			expr = expr[1];
			if( __eval(expr[0],env) !== _false) return _CONTINUE_FOR;
			}
		else if (kwd === _BREAK_FOR ) {
			expr = expr[1];
			wants_break = ( __eval(expr[0],env) !== _false) ;
			next = expr[1];
			if(next && next[0] === _right_arrow ) { // pasre ==> expr
								expr = next[1];
								if (wants_break) throw new GLbreak(__eval(expr[0],env)) ;
								}
			if(wants_break) throw new GLbreak(__void) ;
			}

			
		else ret = __eval(expr[0],env);
		} // exprs
	return ret;
} // __begin_for



function _for_variant (self,env,variant) {
	var thefor = self[1];
	var accexpr , accid;
	if(variant === 4) {//  ( for/fold (acc-id init-exp) ((i 6) ...) 
					accexpr = thefor[0] ;
					accid = accexpr[0];
					if(! accid instanceof Symbol) glisp_error(23,accexpr,"for") ;
					thefor = thefor[1];
					}
	var bindings = thefor[0];
	var body = thefor[1];
	var clauses = [] ; // js array
	var i,id,ids,value,expr,clause,acc = __void ,ret, dispatch ;
	
	var newenv = new GLenv(env,'for');
	
	if(variant === 1) acc = 0 ;
	else if (variant === 2) acc = 1;
	else if (variant === 3) acc = [];
	else if (variant === 4) newenv.set (accid.name,__eval(accexpr[1][0],env)) ;
	else if (variant === 5) acc = [] ; // accumulate in jsarray
	else if (variant === 6) acc = ""; // for/string
	else if (variant === 9) acc = -Infinity; // for/max
	else if (variant === 10) acc = Infinity; 

// transform (id expr) --> [[id sequence] ..] js-array
// of ((id1 id2 ..) expr) -->[[[id id ...] sequence] js-array
// sequence is a NumStream or array [next end step start] or a list [next start]

	while (bindings) {
		clause = bindings[0];
		if(notIsList(clause)) glisp_error(20,bindings,"for");
		id = clause[0]; 
		if(id instanceof Symbol) { }
				else if (isListNotNull(id)) { // check all symbs  NYI NYI
				ids = id;
				while(ids) {
					if(! (ids[0] instanceof Symbol)) glisp_error(23,ids[0],"for") ;
					ids = ids[1];
					if(notIsList(ids)) break ; // (a . b)
					}}
			else glisp_error(23,id,"for") ;
		expr = __for_sequence(clause[1][0],env) ;
		clauses.push([id,expr]);
		bindings= bindings[1] ;
	}
// console.log("for-clauses",clauses);
	
	try {
	while(true) {
	// bind first - stop on any sequence empty
		for(i = 0; i < clauses.length; i++) {
		id = clauses[i][0];
		expr = clauses[i][1];
		value = expr[1];
		
		// end of sequence?
		if(value === undefined)  // end of list, range, .. stream
		 		return (variant === 3) ? __array_to_list(acc) :
		 		(variant === 4) ? newenv.get(accid.name) : 
		 		(variant === 5) ? new Vector(acc) :
		 		(variant === 7) ?  _true :
		 		(variant === 8) ?  _false :
		 		acc ;

		dispatch = expr[0];
		if(dispatch === 1) { // type = jsnum 
						   expr[1] += expr[3] ;
						   if(expr[3] > 0 && expr[1] >= expr[2]) expr[1] = undefined;
						   if(expr[3] < 0 && expr[1] <= expr[2]) expr[1] = undefined;
						   } // type 1
						   
		else if (dispatch === 2) { // type = GLisp number
							expr[1] = __num_bump(value, expr[3] ,expr[2] );
							}		
		else if(dispatch === 6) { // Vector or js Array
								if(expr[2] === expr[3]) expr[1] = undefined;
								else {
								expr[1] = expr[4][++expr[2]] ;
								}}	   
		else if(dispatch === 3) { // type = list sequence	 
						 if(expr[2] === null) expr[1] = undefined;
						 else  { expr[1] = expr[2][0] ; expr[2]= expr[2][1] ;} // avance
						 } 
		else if(dispatch === 4) { // Stream
								if(expr[2] === _empty_stream) expr[1] = undefined;
								else {
								expr[1] = expr[2].first();
								expr[2] = expr[2].rest();
								}}
		else if (dispatch === 8) { // in producer (stops if producer -> false)
								expr[1] = __eval(expr[3],env);
								if(expr[1] === _false) expr[1] = undefined; 
								}
							  
		// [5,expr.substr(0,idx),idx,expr.length-1,expr];
		else if(dispatch === 5) { // String
								if(expr[2] === expr[3]) expr[1] = undefined;
								else {
								expr[2]++;
								expr[1] = expr[4].substr(expr[2],1);
								}}
		else if(dispatch === 7) { // Table
								if(expr[2] === expr[3]) expr[1] = undefined;
								else {
								expr[1] = expr[4].getref(++expr[2]) ;
								}}
		else if(dispatch === 9) { // Procrastinator
								expr[1]= expr[3].next();
								if(expr[1] === _false) expr[1] = undefined;
								}
								
		if(Array.isArray(id)) while (id) { // (for ((u v) ...)
					if(id instanceof Symbol) { // (for ((u . v) ..)
						newenv.set(id,value) ;
						break;
						}
					if(!Array.isArray(value)) glisp_error(20,value,"for( [" + id[0].name + "..])") ;
					newenv.set(id[0],value[0]);
					id = id[1]; value = value[1];
					}

		else newenv.set(id,value);   // (for ((u ..)) : binding of symb u
		} // clauses
	
	ret = __begin_for (body,newenv);
	// if(ret === _BREAK_FOR) throw new GLbreak() ; done inside the break
	if(ret !== _CONTINUE_FOR) { // accumulate unless continue
	    if(variant === 0) acc = ret;
		else if(variant === 1)  acc = _add_xx(ret,acc);
		else if (variant === 2) acc = _mul_xx(ret,acc);
		else if (variant === 3)  acc.push(ret);
		else if (variant === 4)  newenv.set(accid.name,ret);
		else if (variant === 5) acc.push(ret);
		else if (variant === 6) acc += __str_convert(ret);
		else if (variant === 7 && ret === _false) return _false; // and
		else if (variant === 8 && ret !== _false) return ret; // or
		else if (variant === 9) acc = _max_xx (acc,ret);
		else if (variant === 10) acc = _min_xx (acc,ret);
		}
	}} // try
	
	catch (err) {
		if(err instanceof GLbreak) 
				return (err.message !== __void) ? err.message :
					   (variant === 3) ? __array_to_list(acc) :
		 		       (variant === 4) ? newenv.get(accid.name) : 
		 		       (variant === 5) ? new Vector(acc) :
		 		       (variant === 7) ? _true :
		 		       (variant === 8) ? _false :
		 		       (variant === 0) ? __void  :
		 		       acc ; 
		throw(err);
		}
} // _for


function _for_star_variant (self,env,variant) {
	var thefor = self[1];
	var accexpr , accid;
	if(variant === 4) {//  ( for (acc-id init-exp) ((i 6) ...) 
					accexpr = thefor[0] ;
					accid = accexpr[0];
					if(! accid instanceof Symbol) glisp_error(23,accexpr,"for") ;
					thefor = thefor[1];
					}

	var bindings = thefor[0];
	var body = thefor[1];
	var clauses = [] , avance = [] ; // js array
	var i,id,ids,value,expr,clause, acc = __void, ret , init, dispatch ;

// transform (id expr) --> [[id sequence] ..] js-array
// sequence is a NumStream or array nums:[0 next end step start] list: [1 next start start]

	var newenv = new GLenv(env,'for*');
	if(variant === 1) acc = 0 ;
	else if (variant === 2) acc = 1;
	else if (variant === 3) acc = [];
	else if (variant === 5) acc = [];
	else if (variant === 4) newenv.set (accid.name,__eval(accexpr[1][0],env)) ;
	else if (variant === 6) acc = "";
	else if (variant === 9) acc = -Infinity;
	else if (variant === 10) acc =  Infinity;

	
	while (bindings) {
		clause = bindings[0];
		if(notIsList(clause)) glisp_error(20,bindings,"for*");
		id = clause[0]; 
		expr = clause[1][0];
		
		if(id instanceof Symbol) { }
			else if (isListNotNull(id)) { // check all symbs  NYI NYI
				ids = id;
				while(ids) {
					if(! (ids[0] instanceof Symbol)) glisp_error(23,ids[0],"for*") ;
					ids = ids[1];
					if(notIsList(ids)) break ; // (a . b)
					}}
			else glisp_error(23,id,"for*") ;
			
		clauses.push([id,null,expr]);
		avance.push(true);
		bindings= bindings[1] ;
	}

	var last = clauses.length - 1;
	init = clauses[0][2];
	expr = __for_sequence(init,newenv) ;
	clauses[0][1] = expr;
	
	try {
	_for_loop:
	while(true) {
	// bind first - stop on any sequence empty
	
		for(i = 0; i < clauses.length; i++) {
		id = clauses[i][0];
		expr = clauses[i][1];
		value = expr[1];

		if(! avance[i]) continue; // next clause
		
		if(value === undefined) { // stream.empty 
		if(i === 0) return		(variant === 3) ? __array_to_list(acc) :
		 				  		(variant === 4) ? newenv.get(accid.name) :
		 				  		(variant === 5) ? new Vector(acc) :
		 				  		(variant === 7) ?  _true :
		 				  		(variant === 8) ?  _false :
		 				  		acc ; 
		
		avance[i-1] = true;
		continue _for_loop; // restart from clause 0
		}
		
		if(Array.isArray(id)) while (id) { // (for ((u v) ...)
				if(id instanceof Symbol) { // (for ((u . v) ..)
					newenv.set(id,value) ;
					break;
					}
				if(!Array.isArray(value)) glisp_error(20,value,"for( [" + id[0].name + "..])") ;
					newenv.set(id[0],value[0]);
					id = id[1]; value = value[1];
				}
				
		else newenv.set(id,value); 
		

// avance sequence (prepare next step)
		dispatch = expr[0];
		if(dispatch === 1) { // type = jsnum sequence
						   expr[1] += expr[3] ;
						   if(expr[3] > 0 && expr[1] >= expr[2]) expr[1] = undefined;
						   if(expr[3] < 0 && expr[1] <= expr[2]) expr[1] = undefined;
						   } // type 1
		else if (dispatch === 2) {
							expr[1] = __num_bump(value, expr[3] ,expr[2] );
							}		
		else if(dispatch === 6) { // Vector or js Array
								if(expr[2] === expr[3]) expr[1] = undefined;
								else {
								expr[1] = expr[4][++expr[2]] ;
								}}	   
		else if(dispatch === 3) { // type = list sequence	 
						 if(expr[2] === null) expr[1] = undefined;
						 else  { expr[1] = expr[2][0] ; expr[2]= expr[2][1] ;} // avance
						 }
	   	else if(dispatch === 4) {
								if(expr[2] === _empty_stream) expr[1] = undefined;
								else {
								expr[1] = expr[2].first();
								expr[2] = expr[2].rest();
								}}
		else if (dispatch === 8) { // in producer
								expr[1] = __eval(expr[3],env);
								if(expr[1] === _false) expr[1] = undefined; 
								}
		else if(dispatch === 5) {
								if(expr[2] === expr[3]) expr[1] = undefined;
								else {
								expr[2]++;
								expr[1] = expr[4].substr(expr[2],1);
								}}
		
		else if(dispatch === 7) { // Table
								if(expr[2] === expr[3]) expr[1] = undefined;
								else {
								expr[1] = expr[4].getref(++expr[2]) ;
								}}
		else if(dispatch === 9) { // Procrastinator
								expr[1]= expr[3].next();
								if(expr[1] === _false) expr[1] = undefined;
								}
// end avance
		
		if(i < last) avance[i] = false; 
		if(i < last) {
			init = clauses[i+1][2];
			expr = __for_sequence(init,newenv) ;
			clauses[i+1][1] = expr;
			}
		} // clauses

	ret = __begin_for(body,newenv);
	// if(ret === _BREAK_FOR) throw new GLbreak() ; 
	if(ret === _CONTINUE_FOR) continue _for_loop; 
		
    if(variant === 0) acc = ret;
	else if(variant === 1)  acc = _add_xx(ret,acc);
	else if(variant === 2) acc = _mul_xx(ret,acc);
	else if(variant === 3)  acc.push(ret) ;
	else if (variant === 4)  newenv.set(accid.name,ret);
	else if(variant === 5)  acc.push(ret);
	else if(variant === 6) acc += __str_convert(ret);
	else if(variant === 7 && ret === _false) return _false;
	else if(variant === 8 && ret !== _false) return ret;
	else if (variant === 9) acc = _max_xx (acc,ret);
	else if (variant === 10) acc = _min_xx (acc,ret);
	
		}} // try
	
		catch (err) {
		if(err instanceof GLbreak) 
		
				return	(err.message !== __void) ? err.message :
						(variant === 3) ? __array_to_list(acc) :
		 				(variant === 4) ? newenv.get(accid.name) : 
		 				(variant === 5) ? new Vector (acc) :
		 				(variant === 7) ? _true :
		 				(variant === 8) ? _false :
		 				(variant === 0) ?  __void :
		 				acc ;
		throw(err);
		}
} // _for*

var _break = function (expr) {
	if(expr === _true) throw (new GLbreak ()) ;
	return _false;
}

/*-----------------
(while cond body)
(while null ..) --> stop !!!!
-------------------------*/
var _while = function(self,env) {
	self = self[1];
	var cond = self[0];
	var body = self[1];
	var ret ;
	try {
	   		while (true) {
	   		ret = __eval(cond,env) ;
	   		if(ret === _false || ret === null) break;
	   		if(body === null) continue;
	   		__begin_for(body,env) ;
	   		}
	   	}
	   	catch (err) {
		if(err instanceof GLbreak) 
				return  (err.message === undefined) ?  _false : err.message ;
		throw(err);
		}
	   		
	   return _false;
	}

var _for = function(self,env) {return _for_variant(self,env,0);}
var _for_star = function(self,env) {return _for_star_variant(self,env,0);}
var _for_sum = function(self,env) {return _for_variant(self,env,1);}
var _for_star_sum = function(self,env) {return _for_star_variant(self,env,1);}
var _for_product = function(self,env) {return _for_variant(self,env,2);}
var _for_star_product = function(self,env) {return _for_star_variant(self,env,2);}
var _for_list = function(self,env) {return _for_variant(self,env,3);}
var _for_star_list = function(self,env) {return _for_star_variant(self,env,3);}
var _for_vector = function(self,env) {return _for_variant(self,env,5);}
var _for_star_vector = function(self,env) {return _for_star_variant(self,env,5);}
var _for_fold = function(self,env) {return _for_variant(self,env,4);}
var _for_star_fold = function(self,env) {return _for_star_variant(self,env,4);}
var _for_string = function(self,env) {return _for_variant(self,env,6);}
var _for_star_string = function(self,env) {return _for_star_variant(self,env,6);}
var _for_and = function(self,env) {return _for_variant(self,env,7);}
var _for_star_and = function(self,env) {return _for_star_variant(self,env,7);}
var _for_or = function(self,env) {return _for_variant(self,env,8);}
var _for_star_or = function(self,env) {return _for_star_variant(self,env,8);}
var _for_max = function(self,env) {return _for_variant(self,env,9);}
var _for_star_max = function(self,env) {return _for_star_variant(self,env,9);}
var _for_min = function(self,env) {return _for_variant(self,env,10);}
var _for_star_min = function(self,env) {return _for_star_variant(self,env,10);}

var _in_producer = function (self, env) {
	self = self[1];
	var proc = __eval(self[0],env);
	var args = __evlis(self[1],env);
	var argc = _length(args);
	proc = checkProc(proc,argc,argc,"in-producer");
	return [_in_producer  , [proc , args]]; // eval me at each step
	} 
	
// for glex_replace

var _FOR_FAMILY_PROCS = [_for,_for_star,_for_fold,_for_star_fold,
	_for_sum,_for_product,_for_vector,_for_list,_for_string,_for_and,_for_or,_for_max,_for_min,
	_for_star_sum,_for_star_product,_for_star_vector,_for_star_list,_for_star_string,
	_for_star_and,_for_star_or,_for_star_max,_for_star_min] ;
var _FOR_FAMILY_NAMES = ["for", "for*", "for/fold", "for*/fold",
	"for/sum","for/product","for/vector","for/list","for/string",
	"for/and","for/or","for/max","for/min",
	"for*/sum","for*/product","for*/vector","for*/list","for*/string",
	"for*/and","for*/or","for*/max","for*/min" ];
	
var _FOR_FOLD_FAMILY_PROCS = [_for_fold,_for_star_fold] ;
var _FOR_FOLD_FAMILY_NAMES = ["for/fold", "for*/fold"] ;

function isForProc (proc) {
	if( typeof proc === "function" ) return (_FOR_FAMILY_PROCS.indexOf(proc) >= 0 ) ; 
	else if( proc instanceof Symbol) return (_FOR_FAMILY_NAMES.indexOf(proc.name) >= 0 ) ; 
	else return false;
}
function isForFold (proc) {
	if( typeof proc === "function" ) return (_FOR_FOLD_FAMILY_PROCS.indexOf(proc) >= 0 ) ; 
	else if( proc instanceof Symbol) return (_FOR_FOLD_FAMILY_NAMES.indexOf(proc.name) >= 0 ) ; 
	else return false;
}


// appends for_vars names (strings) in js array
// returns new js_array
function __for_vars(for_call,var_names) {
var for_vars,symb;

	if(notIsList(for_call)) return var_names;
	if(! isForProc(for_call[0])) return var_names;
	
	var_names = var_names.slice(0);
	if( isForFold(for_call[0])) {
		for_vars = for_call[1][0] ; 
		if(notIsList(for_vars)) glisp_error(20,for_vars,for_call[0]) ;
		symb = for_vars[0] ;
		if(! (symb instanceof Symbol)) glisp_error (23,for_vars,for_call[0]) ;
		var_names.push(symb.name);
		for_call = for_call[1];
		}
		
	for_vars = for_call[1][0] ; 
	if(notIsList(for_vars)) glisp_error(20,for_vars,for_call[0]) ;
	while(for_vars) {
		symb = for_vars[0][0];
		if(! (symb instanceof Symbol)) glisp_error (23,for_vars,for_call[0]) ;
		var_names.push(symb.name);
		for_vars = for_vars[1];
	}
	return var_names ;
}

function boot_streams() {
 _WHEN_FOR = keyword("#:when") ;
 _BREAK_FOR = keyword("#:break") ;
 _CONTINUE_FOR = keyword("#:continue") ;

        system_constant ("empty-stream",_empty_stream) ;

        define_sysfun(new Sysfun ("stream?",_streamp,1,1));
        define_sysfun(new Sysfun ("js-stream?",_jsstreamp,1,1)); // TEST ONLY
        define_special (new Sysfun ("stream-cons",_stream_cons,2,2));
        define_special (new Sysfun ("cons-stream",_stream_cons,2,2));
        // (make-stream proc:1 init-state)
        define_special (new Sysfun ("make-stream",_make_stream,2,2)); 
       
        define_sysfun (new Sysfun ("stream-map",_stream_map,3,3)); // 2:n NYI
        define_sysfun (new Sysfun ("stream-add",_stream_add,2,2)); // 2:n NYI
        define_sysfun (new Sysfun ("stream-mul",_stream_mul,2,2)); // 2:n NYI
        define_sysfun (new Sysfun ("stream-ref",_stream_ref,2,2));
        define_sysfun(new Sysfun ("stream-first",_stream_first,1,1));
        define_sysfun(new Sysfun ("stream-rest",_stream_rest,1,1));
        define_sysfun(new Sysfun ("stream-iterate",_stream_iterate,1,1));
        define_sysfun(new Sysfun ("stream-empty?",_stream_empty_p,1,1));
        define_sysfun(new Sysfun ("stream->list",_stream_to_list,1,2)); // (s [,limit])
       // define_sysfun(new Sysfun ("stream-for-each",_stream_for_each,3,3)); // (proc ,s, limit|0)
        define_sysfun(new Sysfun ("stream-filter",_stream_filter,2,2)); // (proc ,s)
        // debug
        define_sysfun(new Sysfun ("stream-cache",_stream_cache,1,1)); // (proc ,s)

    // return streams :
        define_sysfun(new Sysfun ("in-range",_in_range,1,3)); // (start [end [step]])
        define_sysfun(new Sysfun ("in-range+",_in_range_endpoint,1,3)); // (start [end [step]])
        define_sysfun(new Sysfun ("in-naturals",_in_naturals,0,1)); // [start|0]
    // return list
     	define_sysfun(new Sysfun ("in-cycle",_in_cycle,1,1));  // (in-cycle list)
     // return ( proc args)
      	define_special(new Sysfun ("in-producer",_in_producer,1,undefined));
    	
        
        define_sysfun(new Sysfun ("break",_break,1,1));
        define_special(new Sysfun ("for",_for,2));
        define_special(new Sysfun ("for*",_for_star,2));
        define_special(new Sysfun ("for/sum",_for_sum,2));
        define_special(new Sysfun ("for*/sum",_for_star_sum,2)); 
        define_special(new Sysfun ("for/product",_for_product,2));
        define_special(new Sysfun ("for*/product",_for_star_product,2)); 
        define_special(new Sysfun ("for/list",_for_list,2));
        define_special(new Sysfun ("for*/list",_for_star_list,2));
        // define_special(new Sysfun ("for*/first",_for_star_first,2)); NYI NYI
        define_special(new Sysfun ("for/string",_for_string,2));
        define_special(new Sysfun ("for*/string",_for_star_string,2));
        define_special(new Sysfun ("for/and",_for_and,2));
        define_special(new Sysfun ("for*/and",_for_star_and,2));
        define_special(new Sysfun ("for/or",_for_or,2));
        define_special(new Sysfun ("for*/or",_for_star_or,2));
        define_special(new Sysfun ("for/max",_for_max,2));
        define_special(new Sysfun ("for*/max",_for_star_max,2));
        define_special(new Sysfun ("for/min",_for_min,2));
        define_special(new Sysfun ("for*/min",_for_star_min,2));


        define_special(new Sysfun ("for/vector",_for_vector,2));
        define_special(new Sysfun ("for*/vector",_for_star_vector,2));
        define_special(new Sysfun ("for/fold",_for_fold,2));
    	define_special(new Sysfun ("for*/fold",_for_star_fold,2));
    	
    	define_special (new Sysfun ('while', _while, 1)) ; // (while cond [body]) ->#f

    	_LIB["streams.lib"]= true; // always here
    	// writeln("streams.lib v1.2 ® EchoLisp","color:green"); // integrated
    	console.log("stream.lib",__js_mode());
        }

// boot_streams();

	

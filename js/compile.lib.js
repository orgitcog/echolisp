/*
compile.lib for EchoLisp
(C) Jacques Tramu 2015
*/
//"use strict";
// todo : optimize pure arith expressions


	
/*----------------------------
unfold
--------------------*/
// (unfold '(* a b c d), 1) -> (* a (* b (* c d)))
// (unfold '(/ a) 1) ->  (* 1 a)

function __unfold_1(op,def,list) {
	if(list === null) glisp_error(20,list,"unfold:list");
	if(list[1] === null) return [op, [def , [list[0], null]]] ;
	if(list[1][1] === null) return[op, [list[0] , [list[1][0] , null]]] ;
	return [op, [list[0], [__unfold_1(op,def,list[1]),null]]] ;
}

var _unfold = function (op,def,list) {
if(notIsList(list)) glisp_error(20,list,"unfold");
	return __unfold_1(op,def,list);
}

/*------------------------------------
compiler
------------------------------------*/

function compile_warning(message,obj,caller) {
	caller = caller || "compile" ;
	glisp_warning(message,obj,caller);
	throw new GLError(0) ; // stop compile with message
	}


/*----------------
references
see __eval : eval.js line #36
---------------------*/

function __ref_string(str) {
	return "'" + str + "'" ; // protect ' : NYI
	}
function __ref_num( num) {
	return '' + num ;
	}
function __ref_formal(form) {
	var ref  ;
	if(form.clone) {
		ref = "env.get('name')" ;
		ref = op.replace("name",form.name);
		return ref;
		}
	else {
		if(form.index === 0) return "_stack[top]" ;
		ref = "_stack[index + top]";
		ref = ref.replace("index",'' + form.index) ;
		return ref ;
		}
 }
 function __ref_symbol (symb) {
// special : keywords
// autoeval NYI
 	var ref = "env.get('name')" ;
		ref = ref.replace("name",symb.name);
		return ref ;
 }

/* ------------
OPS
------------------*/
var _REFS = [] ; // references array

// returns new ref or already known
function __NEW_REF(expr) {
var i, lg = _REFS.length , op = "_REFS[_arg1]";
		if(typeof expr === "number") return expr;
		if(typeof expr === "string") return "'" + expr + "'" ;
		
		for(i=0;i<lg;i++) if( _REFS[i] === expr) break;
		if(i === lg) _REFS.push(expr);
		op = op.replace("_arg1",'' + i);
		return op;
		}
		
// (REF i) dbg
var _print_ref = function (i) {
	glisp_trace(''+i,_REFS[i],"REFS",true);
	return __void;
}

var _FLOPS_OPTION = {
// predicates
	'zero?' : "(_arg1 === 0 ? _true : _false)",
	'!zero?' :"(_arg1 === 0 ? _false : _true)",
// predicates NYI FLOPS
/*	'positive?' : "_positivep(_arg1)",
	'negative?' : "_negativep(_arg1)",
	'positive*?' : "_spositivep(_arg1)", */

// comparison
	'>' : "(_arg1 > _arg2 ? _true : _false)",
	'<' : "(_arg1 < _arg2 ? _true : _false)", 
	'>=' :  "(_arg1 >= _arg2 ? _true : _false)",
	'<=' : "(_arg1 <= _arg2 ? _true : _false)",
	
// arity 1:1
	'1+' : "(1 +_arg1)",
	'1-' : "(_arg1 - 1)",
	'add1' : "(1 + _arg1)", // one hour bogue (missing ")"
	'sub1' : "(_arg1 - 1)",

	'even?' : "(_arg1 & 0x01 ? _false : _true)", 
	'odd?' :  "(_arg1 & 0x01 ? _true : _false)", 
	'sqrt' : "Math.sqrt(_arg1)",
	'cbrt' : "Math.cbrt(_arg1)", 
	'abs' : "Math.abs(_arg1)", 
	'floor' : "Math.floor(_arg1)", 
	'ceil' : "Math.ceil(_arg1)", 
	'round' : "Math.round(_arg1)",  
	'fract' : "(ref = _arg1 ,ref - Math.floor(ref))", 

// arity 2:2
	'=' :  "(_arg1 === _arg2 ? _true : _false)",
	'!=' :  "(_arg1 !== _arg2 ? _true : _false)",

	'_>_xi' : "(_arg1 > _arg2 ? _true : _false)",
	'_<_xi' : "(_arg1 < _arg2 ? _true : _false)",
	'_>=_xi' : "(_arg1 >= _arg2 ? _true : _false)",
	'_<=_xi' : "(_arg1 <= _arg2 ? _true : _false)",

	'_=_xi' : "(_arg1 === _arg2 ? _true : _false)",
	'_=_ix' : "(_arg1 === _arg2 ? _true : _false)",

	'_+_xi' : "(_arg1 + _arg2)",
	'_-_xi' : "(_arg1 - _arg2)",
	'_*_xi' : "(_arg1 * _arg2)",
	'_/_xi' :  "(_arg1 / _arg2)",
	'_//_xi' :  "(_arg1 / _arg2)",
	'_modulo_xi' : "(_arg1 % _arg2)",
	'_quotient_xi' : "Math.floor(_arg1, _arg2)",
	
	'_+_ix' :  "(_arg1 + _arg2)",
	'_*_ix' :  "(_arg1 * _arg2)",

	'_+_xx' :  "(_arg1 + _arg2)",
	'_-_xx' :  "(_arg1 - _arg2)",
	'_*_xx' :  "(_arg1 * _arg2)",
	'_/_xx' :  "(_arg1  / _arg2)",
	'_//_xx' :  "(_arg1 / _arg2)",
	'_min_xx' : "Math.min(_arg1, _arg2)",
	'_max_xx' : "Math.max(_arg1, _arg2)",
	
	'modulo' :  "(_arg1 % _arg2)", 
	'quotient' : "Math.floor(_arg1, _arg2)", 
	
	"_gcd_xx" : "__gcd(_arg1, _arg2)",

//BIT-WISE
	'bitwise-and' :  "(_arg1 &_arg2)",
	'bitwise-not' : " (~ (_arg1))",
	'bitwise-ior' :  "(_arg1 |_arg2)",
	'bitwise-xor' :  "(_arg1 ^_arg2)",
	//'bitwise-bit-set?' : "_log_bit_set(_arg1, _arg2)",
	//'arithmetic-shift' : "_logshift(_arg1, _arg2)",
	
// TRIGO
	'asin' : "Math.asin(_arg1)", 
	'acos' : "Math.acos(_arg1)", 
	'atan' : "Math.atan(_arg1)", 
	'atan2' : "Math.atan2(_arg1, _arg2)", 
	'sin' : "Math.sin(_arg1)", 
	'cos' : "Math.cos(_arg1)", 
	'tan' : "Math.tan(_arg1)", 
	'log' : "Math.log(_arg1)", 
	'log2' : "Math.log2(_arg1)", // ???? 
	'log10' : "Math.log10(_arg1)", 
	'exp' : "Math.exp(_arg1)", 
	'expt' : "Math.pow(_arg1, _arg2)", 
	
// special ops:1:n implemented with unfold 
			'+' : "(_arg1 + _arg2)",
			'-' : "(_arg1 - _arg2)",
			'*' : "(_arg1 * _arg2)",
			'/' : "(_arg1 / _arg2)",
			'//' : "(_arg1 / _arg2)",
			'min' : "Math.min(_arg1,_arg2)",
			'max' : "Math.max(_arg1,_arg2)",
			"_div_1" : "( 1 /(_arg1))",
			"_sub_1" : "(- (_arg1))",
			"_xdiv_1" : "(1 / (_arg1))",
			"gcd" : "__gcd(_arg1,_arg2)"
			
} // FLOPS_OPTION

var _FLOPS = {} ; // set to _FLOPS_OPTION if -f option
var _OPS = {

	'exact->inexact' : "_exact_to_inexact(_arg1)",
	'inexact->exact' : "_inexact_to_exact(_arg1)",
	
// predicates
//	'square?' : "_squarep(_arg1)",
	'square?' : 
			"(ref = Math.floor(Math.sqrt(_arg1)), _arg1 === ref*ref ? _true:_false)",
	'prime?' : "_primep(_arg1)",
	'zero?' : "(ref = _arg1, (ref === 0) ? _true : _zerop(ref))",
	'!zero?' :"(ref = _arg1, (ref === 0) ? _false : _not_zerop(ref))",
	
	 "xor"  :
	  "((_arg1 === _false && _arg2 === _false) || (_arg1 !== _false && _arg2 !== _false) ? _false : _true)",
	
// comparison
	'>' : "_gt(_arg1, _arg2)", 
	'<' : "_lt(_arg1, _arg2)", 
	'>=' : "_ge(_arg1, _arg2)", 
	'<=' : "_le(_arg1, _arg2)", 
	
// arity 1:1
	'1+' : "_1_add(_arg1)",
	'1-' : "_1_sub(_arg1)",
	'add1' : "_1_add(_arg1)",
	'sub1' : "_1_sub(_arg1)",

	'even?' : "_evenp(_arg1)", 
	'odd?' : "_oddp(_arg1)", 
	'sqrt' : "_sqrt(_arg1)",
	'cbrt' : "_cbrt(_arg1)", 
	'abs' : "_abs(_arg1)", 
	'floor' : "_floor(_arg1)", 
	'ceil' : "_ceil(_arg1)", 
	'round' : "_round(_arg1)", 
	'num' : "_num(_arg1)", 
	'den' : "_den(_arg1)", 
	'fract' : "_fract(_arg1)", 

// arity 2:2
	'=' : "_numequal_xx(_arg1, _arg2)",
	'!=' : "_not_numequal(_arg1, _arg2)",

	'_>_xi' : "_gt_xi(_arg1, _arg2)",
	'_<_xi' : "_lt_xi(_arg1, _arg2)",
	'_>=_xi' : "_ge_xi(_arg1, _arg2)",
	'_<=_xi' : "_le_xi(_arg1, _arg2)",

	'_=_xi' : "_numequal_xi(_arg1, _arg2)",
	'_=_ix' : "_numequal_ix(_arg1, _arg2)",

	'_+_xi' : "_add_xi(_arg1, _arg2)",
	'_-_xi' : "_sub_xi(_arg1, _arg2)",
	'_*_xi' : "_mul_xi(_arg1, _arg2)",
	'_/_xi' : "_div_xi(_arg1, _arg2)",
	'_//_xi' : "_xdiv_xi(_arg1, _arg2)",
	'_modulo_xi' : "_modulo_xi(_arg1, _arg2)",
	'_quotient_xi' : "_quotient_xi(_arg1, _arg2)",
	
	'_+_ix' : "_add_ix(_arg1, _arg2)",
	'_*_ix' : "_mul_ix(_arg1, _arg2)",

	'_+_xx' : "_add_xx(_arg1, _arg2)",
	'_-_xx' : "_sub_xx(_arg1, _arg2)",
	'_*_xx' : "_mul_xx(_arg1, _arg2)",
	'_/_xx' : "_div_xx(_arg1, _arg2)",
	'_//_xx' : "_xdiv_xx(_arg1, _arg2)",
	'_min_xx' : "_min_xx(_arg1, _arg2)",
	'_max_xx' : "_max_xx(_arg1, _arg2)",
	
	'modulo' : "_modulo_xx(_arg1, _arg2)", 
	'quotient' : "_quotient_xx(_arg1, _arg2)",  

//BIT-WISE
	'bitwise-and' : "_logand(_arg1, _arg2)",
	'bitwise-not' : "_lognot(_arg1)",
	'bitwise-ior' : "_logor(_arg1, _arg2)",
	'bitwise-xor' : "_logxor(_arg1, _arg2)",
	'bitwise-bit-set?' : "_log_bit_set(_arg1, _arg2)",
	'arithmetic-shift' : "_logshift(_arg1, _arg2)",
	
// TRIGO
	'asin' : "_asin(_arg1)", 
	'acos' : "_acos(_arg1)", 
	'atan' : "_atan(_arg1)", 
	'atan2' : "_atan2(_arg1, _arg2)", 
	'sin' : "_sin(_arg1)", 
	'cos' : "_cos(_arg1)", 
	'tan' : "_tan(_arg1)", 
	'log' : "_log(_arg1)", 
	'log2' : "_log2(_arg1)",
	'log10' : "_log10(_arg1)", 
	'exp' : "_exp(_arg1)", 
	'expt' : "_expt(_arg1, _arg2)", 

// RANDOM
	// "random" : "_random,0,1
	"random-seed" : "_random_seed(_arg1)",
	
// NUM theory
	// "rationalize" : "_rationalize,1,2 //  (rationalize x [epsilon])
	"factor" : "_factor(_arg1)",
	"numdiv" : "_numdiv(_arg1)", // RFU NYI
	"prime-factors" : "_prime_factors(_arg1)",
	"random-prime" : "_random_prime(_arg1)",
	"next-prime" : "_next_prime(_arg1)",
	"primes" : "_primes(_arg1)",
	"_gcd_xx" : "_gcd_xx(_arg1, _arg2)",
	"lcm" : "_lcm(_arg1, _arg2)",
	
	"Cnp" : "_Cnp(_arg1, _arg2)", // NEW
	"Anp" : "_Anp(_arg1, _arg2)",
	"factorial" : "_factorial(_arg1)", 
	
// SYSFUNS
// PREDICATES TO OPTIMIZE pair? etc  NYI
	'symbol?' : "_symbolp(_arg1)",
	'list?' : "_listp(_arg1)", // pair or null
	'pair?' : "_pairp(_arg1)", // inline me NYI
	'number?' : "_numberp(_arg1)",
	'rational?' : "_rationalp(_arg1)",
	'complex?' : "_complexp(_arg1)",
	'integer?' : "_integerp(_arg1)",
	'empty?' : "((_arg1) === null ? _true:_false)",
	'null?' :"  ((_arg1) === null ? _true:_false)",
	'!empty?' : "((_arg1) === null ? _false:_true)",
	'!null?' : "((_arg1) === null ? _false:_true)",
	'boolean?' : "_boolp(_arg1)",
	'exact?' : "_exactp(_arg1)",
	'inexact?' : "_inexactp(_arg1)",
	'positive?' : "_positivep(_arg1)",
	'negative?' : "_negativep(_arg1)",
	'positive*?' : "_spositivep(_arg1)",
	'procedure?' : "_procedurep(_arg1)",


// LOGICAL
	'not' : "((_arg1) === _false ? _true:_false)",
	"eq?" : "((_arg1) === (_arg2) ? _true:_false)",
	'eqv?' : "_eqv(_arg1, _arg2)",  
	'equal?' : "_equal(_arg1, _arg2)",  // deep compare
	'!eq?' : "((_arg1) === (_arg2) ? _false:_true)",
	'!equal?' : "_not_equal(_arg1, _arg2)",  // deep compare
	// define_special (new Sysfun ('and' : "_and,0  NYI NYI NYI
	// define_special (new Sysfun ('or' : "_or,0 
	
// list ops
	'length' : "_length(_arg1)",
	'cons' : "[_arg1,_arg2]",
	
	"first" : "(_arg1[0])",
	"car" : "(_arg1[0])",
	"second" : "(_arg1[1][0])",
	"cadr" : "(_arg1[1][0])",
	"rest" : "(_arg1[1])",
	"cdr" : "(_arg1[1])",
			
	'set-car!' : "_set_car(_arg1, _arg2)",
	'set-cdr!' : "_set_cdr(_arg1, _arg2)",

// to inline NYI
	'cddr' : "_cddr(_arg1)",
	'caar' : "_caar(_arg1)",
	'cdar' : "_cdar(_arg1)",
	'caaar' : "_caaar(_arg1)",
	'caadr' : "_caadr(_arg1)",
	'cadar' : "_cadar(_arg1)",
	'caddr' : "_caddr(_arg1)",
	'third' : "_caddr(_arg1)",
	'cdaar' : "_cdaar(_arg1)",
	'cdadr' : "_cdadr(_arg1)",
	'cddar' : "_cddar(_arg1)",
	'cdddr' : "_cdddr(_arg1)",
	
	'last' : "_last(_arg1)",
	'list-ref' : "_list_ref(_arg1,_arg2)",
	'list-tail' : "_list_tail(_arg1,_arg2)", // (list-tail lst pos (< lg))
	'sublist' : "_sublist(_arg1,_arg2,_arg3)",   // (sublist list [start end[ )

	'make-list' : "_make_list(_arg1,_arg2)", // length obj
	//'append' : "_append, 1,undefined  needs append_xx NYI NYI
	//'nconc' : "_nconc, 1,undefined 
	'copy' : "_copy(_arg1)", 
	'reverse' : "_reverse(_arg1)", 
	// 'circular-list' : "_circular_list, 1,undefined 
	'circular?' : "_circular_p(_arg1)", 
	'shuffle' : "_shuffle(_arg1)", 

	'member' : "_member(_arg1,_arg2)",
	'list-index' : "_list_index(_arg1,_arg2)",
	'memq' : "_memq(_arg1,_arg2)",
	'memv' : "_memv(_arg1,_arg2)",
	'list-sort' : "_list_sort(_arg1,_arg2)",
	'group' : "_list_group(_arg1)",
	'flatten' : "_list_flatten(_arg1)",
	'list-swap!' : "_list_swap(_arg1,_arg2,_arg3)", 
	'list-swap-ref!' : "_list_swap_ref(_arg1,_arg2,_arg3)",  
 
	'mark?' : "_markp(_arg1)",  
	'mark' : "_mark(_arg1,_arg2)", // (mark list flag)
	'unmark' : "_unmark(_arg1)", 
	

// sets
	'set?' : "_set_p(_arg1, _arg2)",
	'set-equal?' : "_set_equal_p(_arg1, _arg2)",
	'make-set' : "_make_set(_arg1, _arg2)",
	'set-intersect?' : "_set_intersectp(_arg1, _arg2)",
	'set-intersect' : "_set_intersect(_arg1, _arg2)",
	'set-union' : "_set_union(_arg1, _arg2)",
	'set-product' : "_set_product(_arg1, _arg2)",
	'set-substract' : "_set_substract(_arg1, _arg2)",
	'set-sym-diff' : "_set_sym_diff(_arg1, _arg2)",
	'set-subset?' : "_set_subset_p(_arg1, _arg2)", 
	
// stacks
	'pop' : "(ref=_arg1.stack.pop(), (ref === undefined) ? _false : ref)", 
	'push' : "(ref = _arg2, _arg1.stack.push(ref),ref)", 
	'stack->list' : "_stack_to_list(_arg1)", 
	'list->stack' : "_list_to_stack(_arg1, _arg2)", 
	'stack' : "_set_stack_empty(_arg1)", 
	'stack-empty?' : "(_arg1.stack.length ? _false : _true)", 
	'stack-top' :
	 "(ref = _arg1.stack, ref.length === 0 ? _false :ref[ref.length -1])", 
	'stack-swap' : "_stack_swap(_arg1)", 
	'stack-length' : "(_arg1.stack.length)",

// heaps
	"heap-pop" : "_arg1.pop()",
	"heap-push" : "_arg1.push(_arg2)",
	"heap-top" : "(ref = _arg1.content, ref.length === 0 ? _false : ref[0])",
	"heap-empty?" : "(_arg1.content.length === 0 ? _true : _false)",
	
// special ops:1:n implemented with unfold 
			'+' : "_add_xx(_arg1, _arg2)",
			'-' : "_sub_xx(_arg1, _arg2)",
			'*' : "_mul_xx(_arg1, _arg2)",
			'/' : "_div_xx(_arg1, _arg2)",
			'//' : "_xdiv_xx(_arg1, _arg2)",
			'min' : "_min_xx(_arg1, _arg2)",
			'max' : "_max_xx(_arg1, _arg2)",
			"_div_1" : "__inv(_arg1)",
			"_sub_1" : "__neg(_arg1)",
			"_xdiv_1" : "__xdiv_xx(1,_arg1)",
			"gcd" : "_gcd_xx(_arg1,_arg2)",
			"and" : "_and_xx(_arg1,_arg2)",
			"or" : "_or_xx(_arg1,_arg2)",
			
// vector ops
			"vector-ref" : "_arg1.vector[_arg2]", 
			"vector-set!" : "(_arg1.vector[_arg2] = _arg3)", // cf useful aVector.dirty = true;
			
// 2D-array-ops NYI

// table-ops
			"table-ref" : "_arg1.array[_arg2]",
			"table-set!" : "(ref= _arg3, _arg1.array[_arg2] = ref.slots, _arg3)", // returns struct
			"table-xref" : "_arg1.array[_arg2][_arg3]",
			"table-xset!" : "(_arg1.array[_arg2][_arg3] = _arg4)", // return value

// plot ops
        "rgb" : "_rgb_clamp(_arg1,_arg2,_arg3)",
        "rgba" : "_rgba_clamp(_arg1,_arg2,_arg3,_arg4)",
        "rgba-abs" : "_rgba_abs(_arg1,_arg2,_arg3,_arg4)",
        "hsv->rgb" : "_hsv_clamp_to_rgb(_arg1,_arg2,_arg3)",
        "gray" : "_gray(_arg1)",

// struct ops (NYI)
		// not user visible : struct get
		// "struc-get" : "(_arg1.slots[_arg2])",

// hash ops (NYI)


// stream ops
		"stream-ref" : "__stream_ref(_arg1,_arg2)",
		"stream-first" : "__stream_first(_arg1)",
		"stream-rest" : "__stream_rest(_arg1)",
		
// special forms
			"set!" : "set!", // known in ops
			"*set-formal" : "(_stack[index] = _arg2)",
			// to test with closure NYI NYI
			"*set-clone" : "(ref=_arg2, _stack[index] = ref, env.set('name',ref))",
			"*set-symb"  : "_symset(_arg1,_arg2,env)" ,
			
			"if" : "((_cond !== _false) ? (_arg1) : (_arg2))",
			"when" : "((_cond !== _false) ? _body : _false)" ,
			"unless" : "((_cond === _false) ? _body : _true)" ,
			"while" :
			 "(function (env) {\nvar cond; while((cond = _cond) && (cond !== _false)) _body ; return _false; } (env))" ,
 
			"cond" : " (_clauses  _last_clause)", // last =  _false or else_expr
			"begin" : "_body" ,
			"_and_xx" : "((_arg1 === _false) ? _false : ((ref=_arg2) === _false) ? _false :ref)",
			"_or_xx" : 
		"(((ref =_arg1) !== _false) ? ref : ((ref=_arg2) !== _false) ? ref : _false)",

// own compile ops
// "use strict"; NYI NYI

			"*prologue" : "var ref,top = _blocks[_topblock];", // ref= work register
			"*return" : "return (" ,
			"*epilogue" : ");",
			"*funcall" : "__funcall(_arg1, env)",
			"*clause" : "(_cond !== _false) ? _body : "
		}
		
/*-------------
NB : args is a js array
     expr is a lisp list
-------------------------*/
		
/*-------------------
special forms
-------------------*/
// generates (expr1,... exprn)
// _BREAK_FOR  for (when ...) NYI NYI
function __emit_body(exprs) {
var expr,body = "(";
	while(exprs) {
		body += __compile_expr(exprs[0]);
		if(exprs[1]) body += ", ";
		exprs = exprs[1];
	}
	body += ')' ;
	return body;
}


function __emit_set(sysname,argc,args) {
var _arg1 = args[0]; // symb or formal
var _arg2 = __compile_expr(args[1]);
var index,name = _arg1.name;
var op;
//glisp_trace(_arg1,_arg2,"compile:set!",true);

	if(_arg1 instanceof Formal) {
	index = _arg1.index === 0 ? 'top' : 'top +' + _arg1.index;
		if(_arg1.clone) 
			op = _OPS["*set-clone"];
			else op = _OPS["*set-formal"];
		op = op.replace("name",_arg1.name);
		op = op.replace("_arg2",_arg2);
		op = op.replace("index",index);
// glisp_trace(op,"compiled","compile:set!",true);
		return op;
		}
		
	if(_arg1 instanceof Symbol) {
			op = _OPS["*set-symb"];
			op = op.replace("_arg1",__NEW_REF(_arg1));
			op = op.replace("_arg2",_arg2);
			return op;
	}
	compile_warning("cannot compile",args[0],"compile:set!") ;
}


function __emit_if(sysname,argc,args) {
var op = _FLOPS[sysname] || _OPS[sysname] ;
	if(! op) glisp_error(1,op,"compile:if") ;
	op = op.replace("_cond",__compile_expr(args[0]));
	op = op.replace("_arg1",__compile_expr(args[1]));
	op = op.replace("_arg2",__compile_expr(args[2]));
	return op;
}

// when/unless/while family
// (when cond a b c) ; expr -> (cond a b c) 
function __emit_when(sysname,expr) {
var op = _FLOPS[sysname] || _OPS[sysname] ;
	if(! op) glisp_error(1,op,"compile") ;
	op = op.replace("_cond",__compile_expr(expr[0]));
	op = op.replace("_body",__emit_body(expr[1]));
	return op;
	}
	
// exprs -> ( clause clause ...), clause = ( test|else expr expr)
function __emit_cond(sysname,exprs) {
var op = _FLOPS[sysname] || _OPS[sysname] ;
var expr,clauses='',clause,_else_clause=null;

	if(! op) glisp_error(1,op,"compile:cond") ;
	while (exprs) {
		expr = exprs[0] ; // (test body)
		clause = _OPS["*clause"];
		if(expr[0] === _else) {
			_else_clause = __emit_body(expr[1]);
			break;
		}
		clause = clause.replace("_cond",__compile_expr(expr[0]));
		clause = clause.replace("_body",__emit_body(expr[1]));
		exprs = exprs[1] ; 
		clauses += clause ;
	}
	op = op.replace("_clauses",clauses);
	op = op.replace("_last_clause", _else_clause || "_false");
	return op ;
}

		
/*-----------------
std function calls
-----------------------*/

// argc limited to 4 (see __funcall)
function __emit_op(sysname,argc,args) {
var op = _FLOPS[sysname] || _OPS[sysname] ;
var arg1 ;
	if(! op) glisp_error(1,sysname,"compile:emit:op") ;
	if(argc === 0) return op;
	arg1 = __compile_expr(args[0]);
	op = op.replace ("_arg1", arg1) ;
	op = op.replace ("_arg1", arg1) ; // two times. eg (square?)
	if(argc >= 2) {
				op = op.replace ("_arg2", __compile_expr(args[1])) ;
				op = op.replace ("_arg2", __compile_expr(args[1])) ;
				}
	if(argc >= 3) op = op.replace ("_arg3", __compile_expr(args[2])) ;
	if(argc >= 4) op = op.replace ("_arg4", __compile_expr(args[3])) ;
	return op ;
	}
	
// sysname -> *,//,min,..   expr -> (a b c d ..)
function __emit_op_n(sysname,expr,argc,args) {
var _arg2,op ;
// glisp_trace(expr,sysname,"compile:op:n",true);

	if(argc === 2) return __emit_op(sysname,argc,args);
	if(argc === 1) switch (sysname) {
	case "/" : return __emit_op("_div_1",1,args); // __inv
	case "//" : return __emit_op("_xdiv_1",1,args); 
	case "-"  : return __emit_op("_sub_1",1,args); // __neg
	default : glisp_error(1,expr,"cannot compile:op:1: " + sysname) ;
	}
	
	switch(sysname) {
	case "and" : expr = __unfold_1(_and_xx,_true,expr); break;
	case "or" : expr = __unfold_1(_or_xx,_false,expr); break;
	case "*" : expr = __unfold_1(_mul_xx,1,expr); break;
	case "+" : expr = __unfold_1(_add_xx,0,expr); break;
	case "min" : expr = __unfold_1(_min_xx,Infinity,expr); break;
	case "max" : expr = __unfold_1(_max_xx,-Infinity,expr); break;
	case "gcd" : expr = __unfold_1(_gcd_xx,1,expr); break;
	case "/"  : 
	case "//" :
	// generates (/ a (* b c d..))
				op = _FLOPS[sysname] || _OPS[sysname] ;
				op = op.replace("_arg1",__compile_expr(expr[0]));
				//_arg2 = __unfold_1(_mul_xx,1,expr[1]) ; // gain 2 lignes NYI
				//_arg2 = __compile_expr(_arg2);
				op = op.replace("_arg2",__compile_expr(__unfold_1(_mul_xx,1,expr[1])));
				return op;
	case "-" :
	// generates (- a (+ b c d..))
				op = _FLOPS[sysname] || _OPS[sysname] ;
				op = op.replace("_arg1",__compile_expr(expr[0]));
				//_arg2 = __unfold_1(_add_xx,0,expr[1]) ;
				//_arg2 = __compile_expr(_arg2);
				op = op.replace("_arg2",__compile_expr(__unfold_1(_add_xx,0,expr[1])));
				return op;
				
	default : glisp_error(1,expr,"compile:op:n: " + sysname) ;
	}

return __compile_expr(expr);
}
	
	
// sets, OBjects .... NYI see _Eval
function isTerminal(obj) { // true/false
	if((typeof obj === "number") ||
	(typeof obj === "string") ||
	(typeof obj === "function") ||
	(obj instanceof Formal) ||
	(obj instanceof Symbol) ||
	((obj === null) || (obj === _false) || (obj === _true))) return true;
			
	if(Array.isArray(obj)) {
		if(obj[TAG_SET]) return true ; 
		if(obj[TAG_GRAPH]) return true;
		return false; // true list = function call
		}

	if(typeof obj === "object") return true;
	return false;
}

function __obj_ref(obj) { // return a string
	if(obj === null) return "null" ;
	if(obj === _false) return "_false" ;
	if(obj === null) return "_true" ;

	if(typeof obj === "number") return __ref_num(obj);
	if(typeof obj === "string") return __ref_string(obj);
	if(obj instanceof Formal) return __ref_formal(obj);
	if(obj instanceof Symbol) return __ref_symbol(obj);
	
	return __NEW_REF(obj);
	// compile_warning("cannot compile" ,obj, "compile:reference") ;
}

// return string
var _LAMBDA_REF = 0; // to build a compile name for anon lambda

/*--------------------
compile_expr
compiles next expr in body
return a string
-------------------------*/

function __compile_expr(expr) {
var op, sysfun ,sysname , argc = 0, args, i , source = null ;
// glisp_trace("",expr,"compile:expr",true); // debug only

	if(isTerminal(expr)) { 
		source =  __obj_ref(expr);
		return source ;
	}
	
	if(! Array.isArray(expr)) glisp_error(1,expr,"compile:expr");
	
// no terminal : function call
// special cases :  set, quote, etc...
// to do : generics NYI

	op = expr[0];
	if(op === _quote) return __NEW_REF(expr[1][0]);
	
// compile on the fly, and continue
	if(isLambda(op)) __compile_lambda(op,"lambda_" + (_LAMBDA_REF++)) ;
	if(_C_ALL && (op instanceof Symbol) && op.fval && isLambda(op.fval)) 
		__compile_lambda(op.fval,op.name);
	
	
	if(typeof op === "function") {
		sysfun = op.glfun ;
		sysname = sysfun.name;
		if( _FLOPS[sysname] || _OPS[sysname]) { // known
				
		// args array of exprs
		args = __list_to_array(expr[1]);
		argc = args.length;
		
		// special formm
		switch (sysname) {
		case "set!" : source = __emit_set(sysname,2,args); break;
		case "if" : source = __emit_if(sysname,argc,args); break;
		case "when" : source = __emit_when(sysname,expr[1]); break;
		case "unless" : source = __emit_when(sysname,expr[1]); break;
		case "while" : source = __emit_when(sysname,expr[1]); break; // test me
		case "cond" : source = __emit_cond(sysname,expr[1]); break;
		case "begin" : source = __emit_body(expr[1]); break;
		}
		
		// standard sysfuns
		if(!source)
		if (sysfun.maxarity && (sysfun.maxarity === sysfun.minarity)) {
			source =  __emit_op(sysname,argc,args) ; // (+ x y)
			}
		// variable arity sysfuns (+ a b c)
		else {
			source = __emit_op_n(sysname,expr[1],argc,args);
			}
		}} // Known function
		
// g is a compiled function
// compile  ( g a b c d..) to " g ( compile(a),compile(b) ...) " NYI ......
		
		if(! source) {
				source = _OPS["*funcall"];
				source = source.replace("_arg1",__NEW_REF(expr));
			  }
			
		return source;
} // comile_expr

			
			
// in -> form ( expr expr expr...)
// in : name for generated js function = Sysfun.name
//  patched form :=  (anonymous(env)) js fun reference with 0 lisp args
// _funcall will call (anonymous env)
// returns : true|false

// to do : compile f ( g  ..) ==> compile f &&& g
// to do check not already compiled

var _COMPILED = "_🔷_" ;
function __compile_lambda (lambda, name) {
	var assign,anon ;
	var prog= [];
	var source;
	var body = lambda[1][1];
	var expr = body;
	var cname = _COMPILED + name;
	if(_C_VERBOSE) glisp_trace(cname,body,"compiling",true);
	
// already compiled ?
	  if(lambda[TAG_COMPILED]) return false;

	try {
	prog.push (__emit_op("*prologue",0));
	prog.push (__emit_op("*return",0));
	
		while (expr) {
			source = __compile_expr(expr[0]) ;
			if(expr[1]) source += "," ;
			prog.push (source) ; 
			expr = expr[1];
			}
	prog.push (__emit_op("*epilogue",0)); 
	
	prog = prog.join('\n /* */');
	if(_C_VERBOSE) writeln(prog,"color:magenta");
	
	// patch expr with function call
	// anonymous function.glfun --> Sysfun
	
	anon = new Function('env',prog);
	
	
	define_sysfun(new Sysfun ( cname, anon , 0,0)); 
	body[0] = [anon,null];
	body[1] = null;
	lambda[TAG_COMPILED] = true ;
	return true ;
	}
	
	catch (err) {
		if((err instanceof GLError) && err.errno === 0) { // cannot compile
			return false;
			}
		throw err ;
		}
} // compile_lambda


/*----------------------------------------
(compile-function symb b "[-v][-f]-[all]")
returns #t|#f
-------------------*/

var _C_VERBOSE = false;
var _C_ALL = false;

function _compile_function  (top, argc) {
var symb = _stack[top++] ;
var options = (argc > 1) ? nameToString(_stack[top],"compile") : "" ;
var lambda;

	if(! (symb instanceof Symbol) ||
	   ! symb.fval ||
	   ! isLambda(symb.fval))
       glisp_error(122,symb,"compile") ;
       
    lambda = symb.fval;
    if(lambda[TAG_COMPILED])  {
	   glisp_trace(symb.name,"already compiled","compile",true);
	   return _false ;
	   }

// set defaults
	_FLOPS = {} ;
	_COMPILED = "_🔷_" ;
	_C_VERBOSE = _C_ALL = false;
	
// debug 

	if(options.indexOf("-v") !== -1) _C_VERBOSE = true;
	if(options.indexOf("-a") !== -1) _C_ALL = true;
	// floating operations
	if(options.indexOf("-f") !== -1) {
				_FLOPS = _FLOPS_OPTION;
				_COMPILED = "_🔶_" ;
				}
	
	return  __compile_lambda (lambda, symb.name) ? _true : _false ; 
}


function boot_compile() {

		define_sysfun(new Sysfun ("compile.unfold",_unfold,3,3));
		define_sysfun(new Sysfun ("compile.compile",_compile_function,1,2)); 
		// define_special(new Sysfun ("compile.inline",_inline,1,2)); 
		
// debug
		define_sysfun(new Sysfun("REF",_print_ref,1,1));
		
     	_LIB["compile.lib"] = true;
     	writeln("compile.lib v1.3 ® EchoLisp","color:green");
}

boot_compile();
		
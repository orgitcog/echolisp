
/*---------------------
GLisp
(C) G. Brougbard, Echolalie & Jacques Tramu
EVAL - RUN
--------------------*/
var _stack = []; // stack of values (any obj)
var _top = 0;   // next to push
var _blocks = [0] ; // blocks[i] --> base of stack
var _topblock = 1; // next to push


// (eval expr [env]) : (eval ' (+ 7 8))
var _eval = function (top, argc, env) {
	 var expr = _stack[top];
	 env = (argc > 1) ? _stack[top+1] : env ;
	 return __eval(expr,env);
}

// NYI replace (f a b c) by (lambda ( x y z) a b c ..)
// in env , that is before eval or patch form  at run-time?? dangerous
/////
// Notations :
//  arg_i : INDEX of arg # i in array [args]
// __fun : deep internal, not user visible
//  _fun : user visible - name or symbol in Sysfun object
// stack format
//  -1 [block_n] [block n-1] .... top -->  [block 0]
//     [block_i] : arg_0 arg_1 .. 
/////


// _eval (form)
function __eval(form,env) {
var val, sidx; // stack index
glisp.ncycle++;
// glisp_trace(form,env,"eval");

	if(!(env instanceof GLenv)) {
				glisp_error(1,form,"eval - missing env") ;
				}
				
	if(typeof form === "object") {
	
// Eval Formal param
	if(form instanceof Formal) {
	
		if(form.clone) { // symbol inside closure
		return env.get(form.name);
		// check undef internal error NYI NYI
		}
		
		sidx = form.index + _blocks[_topblock]; // N hours bogue - cf LET NYI
		if(sidx >= _top ) return glisp_error(28,sidx,"stack[" + _top +"]"); // internal : OK
		// stack max parameter NYI
		if(sidx >= 100000 ) return glisp_error(29,sidx,"stack[" + _top +"]"); 
		return _stack[sidx] ;
		} // Formal
		
// Eval jsArray : List eg : ( f 6)
		if(Array.isArray(form)) {
// Quoted
		if(form[0] === _quote) return form[1][0];	
		if(form[TAG_SET]) return form ; // 2.6 set auto eval
		if(form[TAG_GRAPH]) return form;
		
		if(_GENERICS && (form[0] instanceof Generic)) {
			return form[0].call (form, env);
			}
		return  __funcall(form,env); 
		} // a list to eval
		
// Other terminals
		if(form instanceof Symbol) {
		if(form.autoeval) return form;	

				val = env.get(form.name) ;
				if(val !== undefined) return val;
				glisp_error (17,form,env);  
				}
// any other  js object self-evaluates (Struct, RegExp, ...)
		return form ;
	} // object
	
	else { // no object
	// autoeval  basic types
 	if((typeof form === "number") ||
 	(typeof form === "string") ||
	(typeof form === "function")) return form;

	if(typeof form === "boolean") glisp_error(62,form,"eval-js-boolean");
	if(form === undefined) glisp_error(62,"undefined","eval-undef"); // bad mess NYI
	glisp_error(62,form,"eval");
	} // noobject 
} // __eval

/////////////////
// F U N C A L L
// _funcall (fun arg0 ... argn)
// fun := lambda || user fun || primitive
// returns : a value (s-expr) or atom or null
// evaluates args
/////////////
// (environment-bindings (closure aLambda)) KO NYI NYI NYI
function __fun_compose (ops, argv, env) { // ops is a jsarray - argv = GLisp list
	var fun = ops[0];
	var arity = fun.arity,i;
	var ret,arg0,arg1;

	if(!Array.isArray(ops))  glisp_error(1,ops,"fun-compose - bad ops") ;
	
			arg0 = argv[0]; 
			if(typeof arg0 !== "number") arg0 = __eval(arg0,env);
			if(arity === 2)  {
						arg1 = argv[1][0];
						if(typeof arg1 !== "number") arg1 = __eval(arg1,env);
						ret =  fun(arg0,arg1,env);
						}
			else if(arity === 1)  ret = fun(arg0,env); // 2 hours bogue- missing env
			else glisp_error(1,fun.arity,"fun-compose - bad arity") ;
			
	for(i=1; i < ops.length; i++) {
		fun = ops[i];
		ret = fun(ret,env) ;
	}
	return ret; 
}

function __inline_vref (aVector, args , env) {
//	if (args[1]) // assumes V[i j]
//		return _array_ref(aVector, __eval(args[0],env), __eval(args[1][0],env)) ;
	var val =  aVector.vector[__eval(args[0],env)] ;
 	return (val === undefined) ? glisp_error(42,__eval(args[0],env),"vector-ref") : val ;
	}

function __funcall(form,env) {
	var fvalue = null , ret , arg0, arg1, arg2 , arity;
	var fun =  form[0];  // car : the fun
	var argv = form[1]; // --> cdr : list of args values
	
		if(!(env instanceof GLenv)) {
				console.trace ("FUNCALL");
				return glisp_error(1,form,"funcall - missing env") ;
				}

// 1) js primitive = compiled Sysfun
	if(typeof fun === "function")  { 
			if(fun.special) return fun(form,env); // special is called with self
			
			if(fun.inline) {
				argv = __list_to_array(argv);
				for(var i= 0; i < argv. length; i++)
						argv[i]= __eval(argv[i],env);
				return fun.apply(null,argv);
				}

			if(form[TAG_COMPOSE]) 
				return 	__fun_compose(form[TAG_COMPOSE],form[TAG_COMPOSE_ARGS],env);
			arity = fun.arity; 
			
			if(arity === 0) return fun(env); // e.g compiled functions
			
			// 0:0 1:1 2:2 ... sys funs
			// #[arity-dispatched-procedure nn]
			if(arity === undefined) {  // n:m sysfun's - use stack
				arg0 = 0; // arg0 = argc
				arg1 = _top; // save_top
				
				// eval and PUSH args 
				while(argv) { 
					arg0++;
					_stack[_top++] = __eval(argv[0],env) ;
					argv = argv[1] ;
					}
				ret =  fun(arg1,arg0,env) ; // eg (list x y z t ...)
				_top = arg1; // POP
			return ret;
			}

			
			if(arity === 1)  {
				arg0 = argv[0] ;
				return (typeof arg0 === "number") ?
					fun (arg0) : fun(__eval(arg0,env)) ;
					}

			if(arity === 2)  {
					arg0 = argv[0];
					arg1 = argv[1][0];
					if(typeof arg0 !== "number") arg0 = __eval(arg0,env);
					if(typeof arg1 !== "number") arg1 = __eval(arg1,env);
						return fun(arg0,arg1,env);
						}
			
				argv = __list_to_array(argv);
				for(var i= 0; i < argv. length; i++)
						argv[i]= __eval(argv[i],env);
				return fun.apply(null,argv);
	} // js function
			
/*
			if(arity === 3)  {
					arg1 = argv[1][0];
					if(typeof arg1 !== "number") arg1 = __eval(arg1,env);
					arg2 = argv[1][1][0];
					if(typeof arg2 !== "number") arg2 = __eval(arg2,env);
					return fun(arg0,arg1,arg2,env);
					}
			if(arity === 4) return fun(arg0,
								 __eval(argv[1][0],env),  
								 __eval(argv[1][1][0],env),
								 __eval(argv[1][1][1][0],env) ,env);
			glisp_error(1,fun,"sys-funcall:bad arity") ;
*/
			
			
//// fval /////
// sets fvalue (may be undef) if no fval

	if(fun instanceof Symbol) {  
	fvalue = fun.fval; // glob
	_CONTEXT = fun ;
			 			
		 	if(isXLambda(fvalue)) {
		 		if(fun.plist["trace"])
					{
					ret =  __lambda_call(fvalue,argv,env,fun.remember,fun); 
					glisp_trace("<--",ret,fun,true);
					return ret;
					}
			
			return __lambda_call(fvalue,argv,env,fun.remember); //(params) (body) (argv)
			} // Xlambda
			
		if(typeof fvalue === "function")  //  (define (f) sin)
				{ return __funcall([fun.fval, argv],env) ; }


		 fvalue = env.get(fun.name); // clone or symb
		 
		 if(fvalue instanceof Vector) return __inline_vref (fvalue, argv,env) ;
		 
		 if(! fun.formal) glisp_error(47,fun.name,'funcall-symb'); // not a function
		 } // Symbol
		
		
//// lambda /////
// (3) pure lambda 
// NYI : should get the env from lambda ... in _lambda_call

	if(isLambda(fun))  {  
		_CONTEXT = fun[TAG_LAMBDA_DEF] || _CONTEXT;
		return __lambda_call(fun,argv,env); //(params) (body) (argv)
		}
	

// (3bis) formal bound to lambda. eg (define (f g x y ) (g x y))
// sets fvalue
	if(fun instanceof Formal) {
		if(fun.fval === _undefined) {  // clone here NYI NYI NYI get its clone value eval line 52
					fvalue = _stack[fun.index + _blocks[_topblock]];
					}
		else fvalue = fun.fval ; // case (let foo ((..) (foo x)))
		
// (let ((foo sin)) (foo 5))
		if(typeof fvalue === "function") return __funcall ([fvalue , argv], env); 
		
// (let ((foo 'sin)) (foo 6))
		if( fvalue instanceof Symbol)  return __funcall ([fvalue , argv], env); 
		
// check bounds NYI NYI NYI
		if(fvalue instanceof Vector) return __inline_vref (fvalue, argv,env) ; 
		} 
// end Formal 

	    // not formal   (4 5 6)
	if(fun === null) glisp_error(47,"null","funcall");


// dispatch fvalue from symbol or formal

		if(isLambda(fvalue)) {
			return __lambda_call(fvalue,argv,env); //(params) (body) (argv)
		}
		
		if(typeof fvalue  === "function") {
			return __funcall ([fvalue , argv], env) ;
			}


// (7) Eval to  fun ? eg ((if (> a b)  +  *) a b ) 
	if(isListNotNull(fun))  // self eval --> infinite loop NYI easy test
		return __funcall([__eval(fun,env) , argv],env) ;
		

// bottom
	return glisp_error(12,fun,'funcall'); // object not applicable
} // __funcall

/////////////////
// F F U N C A L L
// _ffuncall (fun arg0 ... argn)
// DO NOT evaluates args
/////////////

function __ffuncall(form,env) {
// glisp_trace(env,form,"funcall",true);
	var lambda = null , fvalue = null , sidx , argv , argc, save_top, ret ;
	var fun = form[0];  // car : the fun
// special ?
	if(typeof fun === "function" && fun.special) 
		return fun(form,env); // special is called with self

// 2) js primitive ?
	if(typeof fun === "function")  { 
			
			argv = form[1]; // --> cdr : list of args values
			
			if(fun.inline) {
			return fun.apply(null,__list_to_array(argv));
			}

			
			// 0:0 1:1 2:2 sys funs
			// #[arity-dispatched-procedure nn]
			if(fun.arity === 2) return fun(argv[0],argv[1][0],env);
			if(fun.arity === 1) return fun(argv[0],env); 
			if(fun.arity === 0) return fun(env);
			if(fun.arity === 3) return fun(argv[0],argv[1][0], argv[1][1][0],env);
			if(fun.arity === 4) 
				return fun(argv[0],argv[1][0], argv[1][1][0] , argv[1][1][1][0],env);
			
			// n:m sysfun's - use stack

			argc = 0;
			save_top = _top;
			// PUSH args 
			while(argv) { 
				argc++;
				_stack[_top++] =argv[0] ;
				argv = argv[1] ;
				}
				
			ret =  fun(save_top,argc,env) ; // eg (list x y z t ...)
			_top = save_top;
			//_stack.length = top ; // POP
			return ret;
			} // _xxxxx function called
			
//// fval /////
	if(fun instanceof Symbol && fun.fval) { // 2.20 replaced lambda (???) by fun.fval
		_CONTEXT = fun ;
		return __flambda_call(fun.fval,form[1],env); //(params) (body) (argv)
		}
		
//// lambda /////
// (3) pure lambda 
	if(isLambda(fun))  {  // fun[0] === _lambda NYI
		_CONTEXT = fun[TAG_LAMBDA_DEF];
		return __flambda_call(fun,form[1],env); //(params) (body) (argv)
		}
	

// (3bis) formal bound to lambda. eg (define (f g x y ) (g x y))
	if(fun instanceof Formal) {
		if(fun.fval !== _undefined) // case (let foo ((..) (foo x)))
			fvalue = fun.fval ; // 1 H bogue
			else {
					sidx = fun.index + _blocks[_topblock];
					fvalue = _stack[sidx];
					}
		if(typeof fvalue === "function") return __ffuncall ([fvalue , form[1]], env);
		} 
// Formal 
	    else fvalue = env.get(fun.name); // LONG !!!!! OPTIMIZE POSSIBLE : done : fval
				
		if(isLambda(fvalue)) {
			return __flambda_call(fvalue,form[1],env); //(params) (body) (argv)
		}
		if(isFLambda(fvalue)) {
		// error here NYI
		}
		
// bottom
	glisp_error(12,fun,'funcall-apply'); // object not applicable
	return null;
} // __ffuncall

/////////////////
// L A M B D A  B I N D
/////////////////////////
// bumps top
// returns nothing .  env = caller env
// binds onto stack(and) new lambda closure env if needed
// trace if fun is set
// remember is an array [num] = value or undef

function __formal_check(formal) { // just after push - 
	var _S_CONTEXT = _CONTEXT ;
	var t_status = __type_check (_stack[ _top] , formal.type.t_expr);
	if (t_status !== true) {
						_CONTEXT = _S_CONTEXT + ":" + formal.name ;
			 			glisp_error(145, t_status ,  formal.type.name);
			 			}
	}

function __lambda_bind(formals,values,env,newenv,fun) { 
var formal ;
//  lambda x (...)
		if(formals instanceof Formal) { 
		_stack [_top ] = __evlis(values,env);
		if(formals.type) __formal_check(formals) ;
		if(formals.clone) newenv.set(formals.name,_stack[_top]);
		_top++;
		return ;
		}
		
// lambda ( x y)
		while(formals) {
		formal = formals[0];
// default value ?
		if(!values) { // values exhausted
			if(formal.defvalue === undefined)
				return glisp_error(15,formal,"lambda-bind") ; 
			_stack[ _top] = __eval(formal.defvalue,env) ;
			}
		else { // more values
			if(typeof values[0] === "number")
				_stack[ _top]  = values[0] ;
			else
				_stack[ _top]  = __eval(values[0],env) ;
			}
			
	    if(fun) glisp_trace(formal,_stack[_top],"--> " + fun.name,true);
	    
// Type checking
		if(formal.type) __formal_check(formal) ;

		if(formal.clone) {
						newenv.set(formal.name,_stack[_top]);
						}
		
		_top++;
		formals = formals[1] ;
		if(values) values = values[1];
		if(formals instanceof Formal) break; // (x y z . u )
		} // bindings
		
// lmabda (x y . rest)
		if(formals === null) return;

		_stack[_top] = __evlis(values,env); // bind rest
		if(formals.type) __formal_check(formals) ;
        if(fun) glisp_trace(formals,_stack[_top],"--> " + fun.name,true);
		if(formals.clone) newenv.set(formals.name,_stack[_top]);
		_top++;
	return ; 
} // lambda_bind


function __flambda_bind(formals,values,env,newenv) { // env needed for def values
var formal;

		if(formals instanceof Formal) { // flambda x (...)
		_stack [_top ] = values ;
		if(formals.clone) newenv.set(formals.name,_stack[_top]);
		_top++;
		return ;
		}
		
		while(formals) {
		formal = formals[0];
		if(! values) {
				if(formal.defvalue === undefined) 
						return glisp_error(15,formal,"flambda-bind") ; 
				_stack[ _top] = __eval(formal.defvalue,env) ;
				}
		else { // more values
			_stack[ _top]  = values[0]; // do not eval
			}
			
		
		if(formal.clone) newenv.set(formal.name,_stack[_top]);
		_top++;
		
		formals = formals[1] ;
		if(values) values = values[1]; 
		if(formals instanceof Formal) break; // (x y z . u )
		} // bindings
		
		if(formals === null) return ;
		_stack[_top] = values; // bind rest
		if(formals.clone) newenv.set(formals.name,_stack[_top]);
		_top++;

	return ; 
} //flambda_bind


///////////////
// __evlis (list env) -> new list
///////////////
function __evlis (list, env) {
	if(list === null) return null;
	var ret = [null,null];
	var last = ret;
		while(list) {
			last[0] = __eval(list[0],env);
			if(list[1] === null) return ret ;
			last[1] = [null,null];
			last = last[1];
			list = list[1];
			}
	return ret;
}

//////////
// lambda-call args (x y) body (+ x y) values ( 5 foo())
// looks like a let (and not let*)
// evals: 900008   gpu: 555.2 KHz   time: 1621ms (g 100000)
//////
var _tmp_stack = [];
var _CACHE_SIZE = 16000;

function __lambda_call(lambda,values,env, remember /* array */ ,fun /* to trace */ ) {
	var save_top = _top, ret,  j , expr , argval , newenv = env ;
	var memory = -1; // remember idx 
	var params = lambda[1][0], body = lambda[1][1] ;
	

//(params,"","lambda-call-params");
//glisp_trace(body,"","lambda-call-body");
//glisp_trace(lambda[TAG_ENV],lambda[TAG_CLOSURE],"lambda-call-env");

	if(lambda[TAG_CLOSURE])          newenv = lambda[TAG_ENV] ;
	else if(lambda[TAG_CLOSING])	 newenv =  new GLenv(env,"C"); 
	// else newenv = env;
	
	 __lambda_bind(params,values,env,newenv,fun); // increases top
	 
	 if(remember) {
	 	memory = _stack[save_top] ; // first and unique arg value
	 	if((typeof memory !== "number") 
	 		|| (memory > _CACHE_SIZE) 
	 		|| memory !== Math.floor(memory)) memory = -1; // bad index
	 	if(memory >= 0  && remember[memory] !== undefined) 
	 			{
	 			_top = save_top;
	 			return remember[memory] ;
	 			}
	 	} // remember ON
	 
	_blocks[++_topblock] = save_top;
     
//glisp_trace(newenv,body,"lambda-newenv");
	// var ret =  __begin(body,newenv);
	tail_recurse :
	while(true) {
	for( expr = body ; expr != null ; expr = expr[1]) {
		ret = __eval(expr[0],newenv);
	
// will not (?) work with (lambda x (..)) or (lambda (x . y) ..) 
		if(isLambdaTailCall(ret)) {
				values =ret[1];
				for(j = save_top; j < _top; j++) { // parallel eval
					// if(values === null) glisp_error(15,fun,"tail-call"); // 2.40
					
					argval = (values === null) ? null : values[0] ; // defaulted or local args
					_tmp_stack[j] =  (typeof argval === "number") ? argval :  __eval(argval,newenv);
					values =  (values === null) ? null : values[1];
					}
					
				params = lambda[1][0] ;
				for(j = save_top; j < _top; j++) {
						 _stack[j] = _tmp_stack[j] ;
						 // console.log("S",j,_stack[j]);
						 var formal = params[0];
						 if(formal.clone) newenv.set(formal.name,_stack[j]);
						  params = params[1];
						 }
						 
				continue tail_recurse;
				} /// tail-call
		} // for expr
		break tail_recurse;
	} // while loop
	
	
	_top = save_top;
	_topblock--;
//glisp_trace(ret,_top,"lambda-ret: " + _top);
	if(memory >= 0 ) remember[memory] = ret;
	return ret;
} // _lambda call

//////////
// flambda-call : do not eval
//////

function __flambda_call(lambda,values,env) {
	var save_top = _top, ret ;
	var memory = -1; // remember idx 
	var params = lambda[1][0], body = lambda[1][1], newenv = env ;
	var remember = lambda[TAG_REMEMBER]; // array or null
	var sem, state , msec ;

	if(lambda[TAG_CLOSURE])  		 newenv = lambda[TAG_ENV] ;
	else if(lambda[TAG_CLOSING])	 newenv =  new GLenv(env,"C"); 
	// else newenv = env;
	
	 __flambda_bind(params,values,env,newenv); // increases top
	 
	 if(remember) {
	 	memory = _stack[save_top] ; // first and unique arg value
	 	if((typeof memory !== "number") 
	 		//  || (memory > _CACHE_SIZE) unlimited
	 		|| memory !== Math.floor(memory)) memory = -1; // bad index
	 	if(memory >= 0  && remember[memory] !== undefined) 
	 			{
	 			_top = save_top;
	 			return remember[memory] ;
	 			}
	 	} // remember ON
	 	
	_blocks[++_topblock] = save_top;
	
	// var ret =  __begin(body,newenv);
	for(var expr = body ; expr !== null ; expr = expr[1]) {
    	ret = __eval(expr[0],newenv);
		}
		
	_top = save_top;
	_topblock--;
	if(memory >= 0 ) remember[memory] = ret;
	return ret;
} // __flambda call

function _lambda_tail_call(self,env) {
	return self;
} // _lambda call


//////
// __bind : ' do, ..' bind
// input : ((<variable1> <val1> [<step1>])  ...) 
// output : nothing
// if env === newenv : sequential , else parallel
///////
function __bind(list, env, newenv) {
	if(! env || ! newenv ) 
		return glisp_error(1,"undefined environment","bind") ; 
	while(list) {
		var binding = list[0];
		if(notIsList(binding)) glisp_error(20,binding,"bind") ;
		newenv.set(binding[0].name,__eval(binding[1][0],env)) ;
		list = list[1];
	}
} // __bind

function __begin(exprs, env) {
	var ret = null;
	for(var expr = exprs ; expr != null ; expr = expr[1]) {
// glisp_trace("expr",expr[0],"__begin");
		ret = __eval(expr[0],env);
		}
	return ret;
} // __begin


/*-------------------------------
// S P E C I A L    P R I M I T I V E S
---------------------------*/

// (values a b ..) --> (values (eval a) (eval b) ..)
var _values = function (self,env) { 
	return [self[0], __evlis(self[1],env)] ;
	}
	
// accept a list or (values in input)
var _set_values = function(self ,env , prebind) { // (set!-values (a b) (list 6 8) | (values 6 7))
	self = self[1];
	var symbs = self[0];

	var vals = __eval(self[1][0],env);
	if(vals[0] === _values) vals = vals[1];
	
	while(symbs && vals) {
	if(prebind) env.set(symbs[0].name,null) ;
		_symset(symbs[0],vals[0],env) ;
		symbs= symbs[1];
		vals = vals[1];
		}
	return __void; 
	}
	
var _define_values = function(self,env) {
	var symbs = self[1][0] ;
	_set_values(self, env,true); // pre-bind
	return symbs ;
}


////////////////
// set!
///////////////////
// change value in variable bounding environment
// arg  Symbol

// check no more used - delete NYI
/*
var _symsetq = function(self, env) { // _setq with no check 
	var argv = self[1];
	var symb = argv[0];
	env.set(symb.name,__eval(argv[1][0],env)) ; 
}
*/


var _symset = function (symb, val, env) {
var bounding, name = symb.name;

	if(symb instanceof Formal) {
		if(symb.clone) {
						env.set(name,val) ; // closure
						}
		sidx = symb.index + _blocks[_topblock ]; 
		if(sidx >= _top ) return glisp_error(28,sidx,"stack[" + _top +"]"); 
		 _stack[sidx] = val ;
		 return val;
	} // &_x 
	
	bounding  = env.isBound(name) ; // chained envs
	if(symb.readonly) glisp_error(19,symb,"set!");
	if(!bounding) glisp_error(17,symb,'set!'); 
	bounding.set(name,val) ; 
	if(typeof val === "function" || isXLambda(val)) symb.fval = val; // (set! f sin)

	return val ;
}


var _setq = function (self,env) {  
	var argv = self[1];
	var symb = argv[0];
	_symset(symb,__eval(argv[1][0],env),env) ;
	return __void;
	} // set!

var _setv = function (self,env) {  
	var argv = self[1];
	var symb = argv[0];
	return _symset(symb,__eval(argv[1][0],env),env) ;
	} // setv!
	
// (+= symb val)
var _plus_equal = function (self,env) {
	var argv = self[1];
	var symb = argv[0];
	var value = _add_xx (__eval(symb,env),__eval(argv[1][0],env)) ;
	return _symset(symb,value,env);
}
// (-= symb val)
var _minus_equal = function (self,env) {
	var argv = self[1];
	var symb = argv[0];
	var value = _sub_xx (__eval(symb,env),__eval(argv[1][0],env)) ;
	return _symset(symb,value,env);
}
// (*= symb val)
var _mult_equal = function (self,env) {
	var argv = self[1];
	var symb = argv[0];
	var value = _mul_xx (__eval(symb,env),__eval(argv[1][0],env)) ;
	return _symset(symb,value,env);
}
// (//= symb val)
var _div_equal = function (self,env) {
	var argv = self[1];
	var symb = argv[0];
	var value = _div_xx (__eval(symb,env),__eval(argv[1][0],env)) ;
	return _symset(symb,value,env);
}
// %=
var _modulo_equal = function (self,env) {
	var argv = self[1];
	var symb = argv[0];
	var value = _modulo_xx (__eval(symb,env),__eval(argv[1][0],env)) ;
	return _symset(symb,value,env);
}
// (/= symb val)
var _xdiv_equal = function (self,env) {
	var argv = self[1];
	var symb = argv[0];
	var value = _xdiv_xx (__eval(symb,env),__eval(argv[1][0],env)) ;
	return _symset(symb,value,env);
}
// (++ symb )
var _plus_plus = function (self,env) {
	var symb = self[1][0];
	return _symset(symb,_add_xi (__eval(symb,env),1),env);
}
// (-- symb )
var _minus_minus = function (self,env) {
	var symb = self[1][0];
	return _symset(symb,_sub_xi (__eval(symb,env),1),env);
}
// symb ++ (infix only)
var _infix_plus_plus = function (self,env) {
	var symb = self[1][0];
	var val = __eval(symb,env) ;
	_symset(symb,_add_xi (val,1),env);
	return val;
}
var _infix_minus_minus = function (self,env) {
	var symb = self[1][0];
	var val = __eval(symb,env) ;
	_symset(symb,_sub_xi (val,1),env);
	return val;
}




///// LAMBDA /////
var _lambda = function(self,env) {
	if(self[TAG_CLOSURE]) return self;
	var lambda = [_lambda , self[1]] ; // a new one is needed
	lambda[TAG_CLOSURE] = true;
	lambda[TAG_ENV] = env;
	lambda[TAG_REMEMBER] = self[TAG_REMEMBER];

	return lambda; // easy
}

var _flambda = function(self,env) { // NYI
	return self; // easy
}

///////////////
// BEGIN
////////////////
var _begin = function(self, env) {
	var ret = null;
	var expr, exprs = self[1];
	for(expr = exprs ; expr != null ; expr = expr[1]) {
		ret = __eval(expr[0],env);
		}
	return ret;
} // _begin

var _begin0 = function(self, env) {
	var ret = null;
	var expr, exprs = self[1];
	for(expr = exprs ; expr != null ; expr = expr[1]) {
		if(expr === exprs) ret = __eval(expr[0],env);
		else  __eval(expr[0],env);
		}
	return ret;
} // _begin0

////////////////
// (IF <test> a [b])
// (when cond expr..)
// (unless cond expr..)
//////////////

var _if = function(self, env) {
		var argv = self[1];
		var comp = __eval(argv[0],env);
		if(comp === _false) {
				return __eval(argv[1][1][0],env) ;
				}
	return __eval(argv[1][0],env);
}
var _when = function(self, env) {
		var argv = self[1];
		var comp = __eval(argv[0],env);
		if(comp !== _false) 
				return __begin(argv[1],env) ;
	return _false ;
}
var _unless = function(self, env) {
		var argv = self[1];
		var comp = __eval(argv[0],env);
		if(comp === _false) 
				return __begin(argv[1],env) ;
	return _true ; 
}
//////////////////
// COND (cond clauses ...)
// clause := (test e1 ..en) | (else e1 ..en) | (test => recipient-thunk)
////////////////
var _cond = function(self,env) {
	var clause, clauses = self[1];
	var test,body,res;
	while(clauses) {
		clause = clauses[0];
		if(notIsList(clause)) glisp_error(20,clause,"cond-clause") ;
		test = clause[0];
		body = clause[1];
		if(test === _else) return __begin(body,env) ;
		res = __eval(test,env) ;
		if(res !== _false) {
							if(body === null) return res;
							/*
							// http://www.cs.cmu.edu/Groups/AI/html/r4rs/r4rs_6.html
							if(isList(body) && body[0] === _right_arrow) 
								return __ffuncall([ body[1][0] , [res , null]],env) ;
							*/
							return __begin(body,env) ;
							}
		clauses = clauses[1];
		}
		return _false ;
} // cond


///////////////
// CASE
// (case <key> <clause 1> <clause 2> ...)
// clause ::= ((<datum 1> ...) <expression 1> <expression 2> ...) | (else expr ...)
////////
// (case 'list ((list) ..) must work: patched eqv 2.9.9
var _case = function(self,env) {
	var clause, key = self[1][0], clauses = self[1][1] , test;
	key = __eval(key,env);
	while(clauses) {
		clause = clauses[0];
		if(notIsList(clause)) glisp_error(20,clause,"case-clause") ;
		test = clause[0];
		body = clause[1];
		if(test === _else) return __begin(body,env) ;
		if(notIsList(test)) glisp_error(20,test,"case-test") ;
		if(_memv(key,test) !== _false) return __begin(body,env);
		clauses = clauses[1];
		}
		return _false;
} // case

/////////////
// DO
// awfully long ..
//////////

/* (do ((<variable1> <init1> [<step1>])  ...) 
   (<test> <expression> ...) // to return last
   <command> ...)
* http://www.schemers.org/Documents/Standards/R5RS/HTML/r5rs-Z-H-7.html#%%5Fsec%5F4.2.4
*/

 
var _do = function(self,env) {
	var thedo = self[1];
	var bindings = thedo[0];
	if(notIsList(bindings)) glisp_error(20,bindings,"do-bindings") ;
	thedo = thedo[1];
	var test = thedo[0][0];
	var exprs = thedo[0][1];
	var cmds = thedo[1];
	var newenv = new GLenv(env,'_do');

	__bind(bindings,env,newenv) ;

	 while (glisp.error === 0) {
			if(__eval(test,newenv) === _false) {
			__begin(cmds,newenv);
			 var steps = bindings;
			 while(steps != null) {
				var step = steps[0];
				if(notIsList(step)) glisp_error(20,step,"do-step");

				var dovar = step[0];
				step =  step[1][1] ; // cddr(step);
				if(step) newenv.set(dovar.name,__eval(step[0],newenv));
				steps = steps[1];
				}} // eval to false 
			else return __begin(exprs,newenv) ;
		} // while
} // do



///////////////
// L E T R E C
// (letrec  bindings body)
///////////////

var _letrec = function(self,env) { 
	var body = self[1];
	
	if(body === null) return glisp_error(11,self,_letrec);
	var newenv = new GLenv(env,'_letrec');
	return __begin(body,newenv);
	}

/*--------------------
 CATCH and THROW
---------------------------*/

// will be catched ad top level
var _error = function(name, message) {
	throw new GUserError(name, message) ;
}

// (try body (catch tag body)) .. elsewhere (throw tag message)
var _throw = function(tag , message) {
	if(!isSymbol(tag)) return glisp_error(23,tag,"throw");
	throw  new GLInterrupt(tag,message);
}

/*
(define (g x y) (try (f x) (catch (id mess) (writeln "catch" id mess x y) mess)))
(define (f x) (throw 'bad x))
*/

var _try = function(self,env) { // execute body in sequence - bypass (catch ..)
	var exprs , expr, ret = null , catcher = null ;
	var _s_topblock = _topblock;

	// install the catcher proc
	for(exprs = self[1] ; exprs != null ; exprs = exprs[1]) {
		expr = exprs[0];
		if(isListNotNull (expr) && expr[0] === _catch) catcher = expr;
		}
		
	try {
	for(exprs = self[1] ; exprs != null ; exprs = exprs[1]) {
		expr = exprs[0];
		if(isListNotNull (expr) && expr[0] === _catch) continue;
		ret = __eval(expr,env);
		}
	return ret;
	}
	catch (err)   {
				  if(err instanceof GLInterrupt && catcher) {
				  		_topblock = _s_topblock;
				  	   return __catch(err,catcher,env) ;
				  	   }
				  throw(err);
			      }
}

// input GLInterrupt( tag, message)
// input user catcher : (catch (tag msg) expri ..)

function __catch  (err,catcher,env) { 
console.log("catch top",_topblock);
	var params = catcher[1][0] ; // (tag message) NYI check length
	var body = catcher[1][1] ;
	var catchenv = new GLenv(env,"K");
	if(_length(params) !== 2) glisp_error(85,params,"catch") ;
	env.set(params[0].name,err.name);
	env.set(params[1][0].name,err.message);
	
	for( ;body !==null; body= body[1])
		ret = __eval(body[0],catchenv) ;
	return ret;
	
} // __catch

var _catch = function(self,env) {
	glisp_error(84,"","catch") ;
}

var _call_cc = function(self, env) {
	writeln
		("😀 call/cc not yet implemented - (catch) and (throw) available",_STYLE.plist["warning"]);
	return 666;
	}
	
/*---------------
remembering
---------------------*/
var _remember = function (top , argc) {
	var symb = _stack[top++];
	var init = (argc > 1) ? _stack[top] : null ;
	if(!(symb instanceof Symbol)) glisp_error(23,symb,"remember") ;
	var fval = checkProc(symb,1,1,"remember") ;

	var remember ;
			if (init) {
				if(! (init instanceof Vector))  glisp_error(65,init,"remember");
				init = init.vector.slice(0) ; // copy needed
				}
				
	remember = init || []; // cache = js array
	
	symb.remember = remember;
	if(isLambda(fval)) fval[TAG_REMEMBER] = remember;
	return _true;
}

var _forget = function (symb) {
	if(! (symb instanceof Symbol)) glisp_error(23,symb,"forget");
	symb.remember = false;
	if(isLambda(symb.fval)) symb.fval[TAG_REMEMBER] = false;
	return _true;
}
var _cache = function (symb) {
	if( symb instanceof Procrastinator) return symb.cache();
	if(! (symb instanceof Symbol)) glisp_error(23,symb,"cache");
	if(symb.remember) return new Vector(symb.remember);
	return _false;
}
var _cache_size = function (top, argc) {
	if(argc === 0) return _CACHE_SIZE ;
	var size = checkIntegerRange(_stack[top],100,4*1024*1024,"cache-size");
	return (_CACHE_SIZE = size) ;
}

/*----------------
Misc primitives
--------------------*/
var _identity = function(x) {return x;}

// (range a b [step, default 1|-1])
var _range = function (top, argc) { // (range end) | (range start end [step])
	var start = 0, end, step = 1 , i , list = [];
	if(argc === 1) end = _stack[top];
	else {
		 start = _stack[top++];
		 end = _stack[top++];
		 if(argc === 3) step = _stack[top];
		 }
	
	if(! isJSInteger(end)) glisp_error(61,end,"range");
	if(! isJSInteger(start)) glisp_error(61,start,"range");
	if(! isJSInteger(step)) glisp_error(61,step,"range");
	
	if(step === 0) step = 1;
	if(end < start) step = - Math.abs(step) ;
	
	for(i=start;; i+= step) {
		if(step > 0 && i >= end) break;
		if(step < 0 && i <= end) break;
		list.push(i);
		}
	list = __array_to_list(list);
	if(list) list[TAG_SET] = true;
	return list;
	}
	
var _srange = function (top, argc) { // (srange end) | (srange start end [step])
	var start = 0, end, step = 1 , i , list = [];
	if(argc === 1) end = _stack[top];
	else {
		 start = _stack[top++];
		 end = _stack[top++];
		 if(argc === 3) step = _stack[top];
		 }
	if(step === 0) step = 1;
	i = start ;
	while (true) {
		if(_positivep(step) === _true) {
				 if ( _ge(i,end) === _true) break;
				 }
		else if (_le(i,end) === _true) break;
		list.push(i);
		i = _add_xx(i,step);
		}
	list = __array_to_list(list);
	
	if(list) list[TAG_SET] = true;
	return list;
	}
	
/*-----------------------
(apply-compose op-list value)
(compose f:1 g:1 h:1 .. last:n) -> lambda x (apply-compose (list op ..) x)
----------------------*/
var _apply_compose = function (ops , x, env)  {
// glisp_trace(ops,"","apply-compose");
	if(notIsList(ops)) return glisp_error(20,ops,"compose") ;
	var opcall = [null , [null , null]] ;
	// last call n args
	opcall[0] = ops[0] ;
	opcall[1] = x ;
	x = __ffuncall(opcall,env);
	opcall = [null , [null , null]] ;
	ops = ops[1];
	// 1 arg
		while(ops) {
			opcall[0] = ops[0];
			opcall[1][0] = x ;
			x = __ffuncall(opcall,env);
			ops = ops[1] ;
		}
		return x;
}

var _compose = function (self, env) { 
	var ops =self[1], op;
	var revops = null ;
	while(ops) { // eval and reverse
		op = ops[0];
		op = checkProc(op,1,1,"compose");
		revops = [op, revops];
		ops = ops[1];
		}
	
	var x = _gensym();
	var call = [_apply_compose , [[_list,revops] , [ x ,null]]];
	var lambda = [_lambda ,  [ x , [ call, null]]];
	glex_lambda(lambda);
	return lambda;
	}
	
/*-----------------------
(iterate-apply (list f n) value)
----------------------*/

var _apply_iterate = function (op , x)  {
	if(notIsList(op)) return glisp_error(20,ops,"iterate") ;
	var n = op[1][0];
	var opcall = [op[0] , [null , null]] ;
	var env = glisp.user; // NYI should get environment from lambda  !!!
		while(n--) {
			opcall[1][0] = x ;
			x = __ffuncall(opcall,env);
		}
	return x;
}
var _iterate = function (f , n , env) { 
	var x = _gensym();
	if(!isJSInteger(n) || n < 0) return glisp_error(22,n,"(iterate f n)");
	var call = [_apply_iterate , [[_list , [f , [n , null]]] , [ x ,null]]];
	var lambda = [_lambda ,  [[x,null], [ call, null]]];
	glex_lambda(lambda); // must provide father env NYI 
	return lambda;
	}
	
	
	
////////////
// DELAY 
//////////////
function Promise ( promise, env) {
	this.promise = promise;
	this.env = env;
	this.value = undefined;
}
Promise.prototype.toString = function () {
			if(this.value === undefined) 
			return  "#[promise: " + glisp_tostring(this.promise,"") + "]";
			else
			return  "#[promise! "  + glisp_tostring(this.value,"") + "]";
	}

var _promisep = function( obj) {
	return obj instanceof Promise ? _true : _false ;
	} 
	
var _delay = function (self, env) {
	var promise = _cadr(self) ;
	return new Promise(promise, env);
} // delay

var _force = function (aPromise) {
	if( !(aPromise instanceof Promise)) return aPromise; // nopish
	if(aPromise.value === undefined)   
			aPromise.value  =  __eval(aPromise.promise,aPromise.env) ;
	return aPromise.value ;

} // force

////////////////
// BOXES
///////////////

function Box(value) {
	this.value = value ;
	}
Box.prototype.toString = function() {
		return "#[box " + glisp_tostring(this.value) + "]";
	}

var _boxp = function (obj) {
	return obj instanceof Box  ? _true : _false ;
}

var _box = function(value) { 
	return new Box (value); 
}

var _unbox = function(box) { // check type NYI
	return box.value;
}

var _set_box = function (box,value) {
	if(value instanceof Vector) value = new Vector(value.vector) ; // freeze it
	box.value = value;
	return box; 
}

////////////
// timing
// "⌚️"
/////////////
var _time = function(self, env) { // (time form)
	var form = self[1][0];
	var t0 = Date.now() ; // milli sec
	var ret = __eval(form,env);
	var dt = Date.now() - t0 ;
	// return [_values , [ret , [ dt , null]]] ;
	return [dt, [ret , null]] ;
	}


;; http://wiki.pageforest.com/#js-patterns/amb


/*------------------
distinct
------------------------*/
var _distinct_p = function (list) {
	if(notIsList (list)) glisp_error(20,list,"distinct=?");
	list = __list_to_array(list);
	var lg = list.length -1 , i, j;
	for(i=0;i<lg;i++)
		for(j=i+1;j<=lg;j++)
			if(list[i] === list[j]) return _false;
	return _true;
}

/*--------------------
amb_fail
---------------------------*/

var _amb_make_context = function () { // [amb index , jsarray of choices lists]
	return [ 0 , [ null  , null] ];
}

var _amb_choices = function (context) {
	var index = context[0];
	var choices = context[1];
	var ret = [];
	for(var i=0; i<= index ; i++) {
			if(choices[i]) 
				ret.push(choices[i][0]) ;
				else
				break;
			}
	return __array_to_list(ret);
	}
	
var _amb_vector = function (context) {
	var index = context[0];
	var choices = context[1];
	var ret = [];
	for(var i=0; i<= index ; i++) {
			if(choices[i]) 
				ret.push(choices[i][0]) ;
				else
				break;
			}
	return new Vector(ret) ;
	}

var _amb_fail = function (env) {
	throw _amb_fail;
	}
	
var _amb_require = function (expr) {
	if(expr === _false) throw _amb_fail;
	return expr;
	}
	
/*-----------------
amb
returns a value in (values)
----------------------*/

var _amb = function (context,values,env) {
	var index = context[0] ,choices = context[1];
	
	if(values === null) {
		_ambfail();
		}
		
	if( choices[index] === null ) {
			choices[index] = values;
			choices[index+1] = null;
			}
			
	context[0]++ ; // bump index
	return choices[index][0];
}

/*---------------------
amb_run
in  ;context = [-1,[]]
--------------------------*/

var _amb_loops; // debug
var _amb_run = function (top, argc, env) {
	var proc= checkProc(_stack[top],1,99,"amb-run");
	var context = _stack[top+1];
	var _s_topblock = _topblock;
	var _s_top = _top;
	_amb_loops = 0; // dbg
	
	
	// build list of args
	var args = [];
	for(var i = top+1 ; i < top+argc ; i++) args.push(_stack[i]) ;
	args = __array_to_list(args);
	
	var call = [proc, args];
	var choices = context[1] ;
	choices[0] = null ; // choices[0];

	while(true) {
	_amb_loops++;
		try {
			context[0] = 0  ; // AMB_INDEX
			_topblock = _s_topblock;
			_top = _s_top;
			return __ffuncall(call,env);
		}
		catch (e) {
			if(e !== _amb_fail) { throw e; }
			
		// back track
		for(var last = context[0]-1 ; last >=  0 ; last--) {
		choices[last] =choices[last][1];
		if(choices[last] !== null ) break;
		// choices[last] = null; 
		}
		
		if(choices[0] === null) return _false; // no more choices
		} // catch

	} // while
} // amb_run

/*---------------------
(amb-select predicate ((values)(values) ...))
----------------------*/
var _amb_select_random = function (pred, values,env) {
	return _amb_select(pred,values,env,true);
	}
	
var _amb_select = function (pred, values,env, opt_random) {
	if(notIsList(values)) glisp_error(20,values,"amb-select");
	pred = checkProc(pred,1,1,"amb-select");
	
	var context = _amb_make_context();
	var call = [pred, [null ,null]];
	var choices = context[1] ;
	var selected ;
	
	choices[0] = null ; // choices[0];
	values = __list_to_array(values) ;
	
	if(opt_random)
		for(var i = 0; i< values.length ; i++)
			values[i]= _shuffle(values[i]) ;

	while(true) {
			context[0] = 0  ; // AMB_INDEX
			// amb loop
			for(var i=0; i < values.length; i++)
				_amb(context,values[i],env) ;
			
			// check predicate
			call[1][0] = selected =  _amb_choices(context) ;
			if( __ffuncall(call,env) !== _false) return selected ; // stops on first hit
		
			// back track
			for(var last = context[0]-1 ; last >=  0 ; last--) {
			choices[last] = choices[last][1];
			if(choices[last] !== null ) break;
			}
		
		if(choices[0] === null) return _false; // no more choices
	} // while
	return _false;
	} // select
	
var _amb_select_all = function (pred, values,env) {
	if(notIsList(values)) glisp_error(20,values,"amb-select/all");
	pred = checkProc(pred,1,1,"amb-select/all");
	
	var context = _amb_make_context();
	var call = [pred, [null ,null]];
	var choices = context[1] ;
	var selected ;
	var ret = [] ;
	
	choices[0] = null ; // choices[0];
	values = __list_to_array(values) ;

	while(true) {
			context[0] = 0  ; // AMB_INDEX
			// amb loop
			for(var i=0; i < values.length; i++)
				_amb(context,values[i],env) ;
			
			// check predicate
			call[1][0] = selected =  _amb_choices(context) ;
			if( __ffuncall(call,env) !== _false) ret.push(selected); 
		
			// back track
			for(var last = context[0]-1 ; last >=  0 ; last--) {
			choices[last] = choices[last][1];
			if(choices[last] !== null ) break;
			}
		
		if(choices[0] === null) return  __array_to_list(ret); // no more choices
	} // while
	return __array_to_list(ret);
	} // select/all



function amb_boot() {
	define_sysfun (new Sysfun( "distinct?",_distinct_p,1,1));
	define_sysfun (new Sysfun( "amb-make-context",_amb_make_context,0,0));
	define_sysfun (new Sysfun( "amb-choices",_amb_choices,1,1));
	define_sysfun (new Sysfun( "amb-vector",_amb_vector,1,1));
	define_sysfun (new Sysfun( "amb-run",_amb_run,2,undefined)); // (ambrun  fun context [args] )
	define_sysfun (new Sysfun( "amb",_amb,2,2)); // (amb context, values)
	define_sysfun (new Sysfun( "amb-fail",_amb_fail,0,0)); // (ambfail)
	define_sysfun (new Sysfun( "amb-require",_amb_require,1,1)); // (amb-require expr)
	
	define_sysfun (new Sysfun( "amb-select",_amb_select,2,2)); // (pred [args..])
	define_sysfun (new Sysfun( "amb-select/random",_amb_select_random,2,2));
	define_sysfun (new Sysfun( "amb-select/all",_amb_select_all,2,2));
	
	writeln("amb.lib loaded","color:green");
	_LIB["amb.lib"] = true;
}

amb_boot();



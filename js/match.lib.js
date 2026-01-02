/*
GLisp
match.lib
(C)  Georges Brougnard - 2015
*/


///////////////////////
// M A T C H I N G
//////////////////////////

function isQuestion(pattern) {
	return isListNotNull(pattern) && (pattern[0] === _question_mark) ;
}

/*------------------------
__match_compile : 
replaces struct name by meta in pattern 
----------------------------*/
function __match_compile (pattern) {
var name, meta , next = pattern;
	if(notIsList (pattern)) return;
	while(next) {
		__match_compile (next[0]);
		next = next[1] ;
		}
		
	name = pattern[0];
	if(isSymbol(name)) meta = __find_meta(name.name);
	if(meta) pattern[0] = meta;
}

/*--------------
match_ellipsis
in :pattern (following ellipsis) , expr
out: matching expr, and augmented env
------------------------*/
function __match_ellipsis(pattern,expr,env) {
	if(pattern === null) return expr ;
	var ret = [], match_env ;
	while(expr) {
		match_env = new GLenv(env);
		if(__match_1(pattern,expr,match_env)) {
						env.merge(match_env);
						return __array_to_list(ret) ;
						}
		ret.push(expr[0]);
		expr = expr[1];
		}
	return false;
	}
	
/*-----------------
struct match  pattern = (struct name values..) (instance-of-struct (name slots ....))
-------------------------*/
function __struct_match (pattern , istruct , env) {
	if(notIsList (pattern)) return false;
	__match_compile(pattern) ;
	if(istruct.meta !== pattern[0]) return false;
	return __match_1(pattern[1] ,__array_to_list(istruct.slots), env);
}

/*---------------------
vector match pattern = vector expr = (list ...) or #Vector
-------------------*/

/*--------------
matching
returns true | false
------------------*/
function __match_1 (pattern, expr,match_env) {
var id,name,question,ematch;
	if(pattern === null && expr === null) return true ;
	
	// (? regexp|regexp string [id])
	// (? pred [id]) - matches and binds id --> expr iff (pred 'expr) === true
	// rem : match_env = match_env, not glisp.match_env
	
	if(isQuestion(pattern)) {
			question = pattern[1][0];
			
			if(isRegExp (question)) { // (? regexp )
				question = pattern[1][0] = __regexp(question,""); // JIT patch
				if(! question.test(__str_convert(expr))) return false;
				}
				
			else if (question === _numberp) {
				if(_numberp(expr) === _false) return false;
			}
				
			else { // (? proc)
				question = checkProc(question,1,1,"match (? pred:1:1 [id])");
				if(__ffuncall ([question, [expr , null]] , glisp.user) === _false) return false;
				}
			
			pattern = pattern[1][1]  ;
			if(pattern === null) return true;
			pattern = pattern[0] ; // Id
			} // question
			
		
	if(isId(pattern)) { // keywords test here
				name = pattern.name;
				if(name === "_") return true;
				// already bound ?
				if(match_env.get(name) !== undefined) return __equal(match_env.get(name),expr) ; 
				// bind
				match_env.set(name,expr); 
				return true;
				}
				
	if(expr instanceof Struct)
				return __struct_match (pattern, expr, match_env);
				
	// acts as a keyword - no variable match
	if(isQuote(pattern)) 
				return __equal(pattern[1][0],expr) ;
				
	//if(pattern instanceof Vector)
				//return __vector_match (pattern, expr, match_env);
	
	if(isListNotNull(pattern) && isListNotNull (expr)) {
		// match car
		if(! __match_1 (pattern[0], expr[0], match_env)) return false;
		// skip to cdr
		if(pattern === null) return (expr === null);
			id = pattern[0] ; // ( a ... b)
			pattern = pattern[1] ;
			expr = expr[1];
			
		// ellipsis case ?
			if(pattern && (pattern[0] === _ellipsis)) {
					ematch = __match_ellipsis(pattern[1],expr,match_env);
					if(ematch === false) return false;
					if(isId(id)) {
							match_env.set(id.name ,[match_env.get(id.name),ematch]) ; // bind to list
							glisp_trace(name,match_env.get(name),"match::bind ...");
							}
				return true;
				}
				
		 // match cdr
		else return __match_1(pattern,expr,match_env); // cdr match
	} // lists
	
	return pattern === expr ; // terminal (number, ...) , + symbol, ..
	// rational, etc.. see '=' (numeq) NYI - vectors itou
} // __match_1

function checkMatchClause(clause) {
	if(notIsList(clause) || notIsList(clause[1]))
		glisp_error(32,clause,"match");
	}

function __match_eval  (expr , clauses , env) {
var clause,pattern,body,match_env;
//glisp_trace("",expr,"match_eval:expr",true);
		while(clauses) {
		clause = clauses[0];
			checkMatchClause(clause);
			pattern = clause[0];
			body  =  clause[1];
//glisp_trace("",pattern,"match_eval:pattern",true);
			
			if(pattern === _else)
				return __begin(body,env);
				
			match_env = new GLenv(null,"M"); // matchings  ids
			
		    if(__match_1 (pattern,expr,match_env)) {
		    		match_env.parent = env ; // augment env
					return   __begin(body,match_env) ; 
					}
		clauses = clauses[1];
		}
	return undefined ;
} // __match_eval



/*---------------------------------
(match val-expr clause ... [(else ret-expr)])
raise error if no match
--------------------------------*/

var _match = function (self,env) {
	self = self[1];
	var expr = __eval(self[0],env); 
	var clauses = self[1];
	var ret = __match_eval(expr, clauses,env) ;
	if(ret === undefined) glisp_error(49,expr,"match");
	return ret;
	}
	
/*---------------------------------
(check-match val-expr pattern [proc:1])
raise error if no match
--------------------------------*/

var _check_match = function (self,env) {
	self = self[1];
	var expr = __eval(self[0],env); 
	var pattern = self[1][0];
	var proc = self[1][1] ? self[1][1][0] : null ;
	var match_env = new GLenv(null,"M"); // matchings  ids
	
	if( ! __match_1 (pattern,expr,match_env)) {
		if (proc) {
		proc = checkProc(proc,1,1,"check-match");
		return __ffuncall([proc, [expr , null]], env);
		}
		glisp_error(64,expr,glisp_message(pattern,"check-match: "));
		}
	return _true;
}

//////////////////
// READER MACROS
//////////////////

/*-------------------
match_replace_1
in : template + match env bindings
out : id's replace in template
-----------------------------------*/
function __replace_1 (list, env) { // at depth n
	if(list === null) return null;
	var copy = [null,null];
	var next = copy , item;
	while(list) {
				item = list[0];
// glisp_trace(isQuote(item),item,"expand",true);

				if (item === null) { next[0] = null;}

				else if(isQuote(item))  { next[0] = item[1][0]; }
				
				else if(isListNotNull(item))  { next[0] = __replace_1(item,env); }
				
				else if(item instanceof Symbol && (env.get(item.name) !== undefined)) {
					item = env.get(item.name); // bound value to replace
					
					// bogue a ... if a not bound to list : NYI
					if(list[1] && list[1][0] === _ellipsis) { // splice insert item
					next[0] = item[0];
					next[1] = item[1]; // check item bound to list NYI
					// return copy; // if assumes ellipsis at end ....
					// recompute next -> last of cop
					next = copy; while(next[1]) next = next[1] ;
					list = list[1]; // skip ellipsis
					}
					else next[0] = item ;
				} // item === Id
				
				else next[0] = item ;
				
				if(list[1] === null) return copy;
			
				list = list[1];
				next[1] = [null, null];
				next = next[1];				
				}
	return copy;
} //__replace_1


/*--------------------
(define-macro name pattern template)
-> a new macro = (pattern template)
-> _READER_MACROS[name] = (pattern template)
----------------------*/
var _define_macro = function(self , env) {
	self = self[1];
	var name = nameToString(self[0],"define-macro") ;
	if(self[1][0] === null) { // undef
			_READER_MACROS_[name] = undefined;
			return _false;
			}
	checkClause(self[1],"define-macro");
	_READER_MACROS_[name] = self[1]; 
	return self[0] ;
}

var _macro_p = function ( name) {
	name = nameToString(name,"macro?");
	return _READER_MACROS_[name] || _false;
}

// list of reader macros
var _reader_macros = function () {
	var names = Object.keys(_READER_MACROS_)  ;
	var list = [] ;
	var name = names.pop(); // macro name

	while(name) {
		if (_READER_MACROS_[name]) // no reset to null
			list.push ([name, _READER_MACROS_[name]]) ;
		name = names.pop();
		}
		return __array_to_list(list);
	}

// patch expressions
// returns nothing 
function _reader_apply_macros (expr) {
	var names = Object.keys(_READER_MACROS_)  ;
	var name = names.pop(); // macro name

	while(name) {
	if (_READER_MACROS_[name]) // no reset to null
		_reader_apply_1_macro(null,expr, _READER_MACROS_[name], name) ;
	name = names.pop();
	}
}

// patch in place - returns nothing
function _reader_apply_1_macro (parent,expr, clause, name) {
	if(notIsList (expr)) return false; // rules apply only to lists
	if(isAutoRef (expr)) return false;
	if(expr[0] === _define_macro) return false;
	if((expr[0] instanceof Symbol) && expr[0].name === "define-macro") return false;
	var matchenv = new GLenv(glisp.user,"M") , wants_eval = false  ; 
	var pattern = clause[0];
	var template = clause[1][0];
	
	// @ (template)
	if(isListNotNull(template) && template[0] === _macro_eval) {
		template = template[1];
		wants_eval = true;
		_CONTEXT = name; 
		}
		
		
	if (parent)
	if ( __match_1 (pattern, expr, matchenv)) {
			parent[0]  =   __replace_1(template,matchenv) ;
			if(wants_eval) parent[0] = __eval(parent[0],glisp.user);
			if( _DEBUG & _DEBUG_SYNTAX) 
				glisp_trace(expr,parent[0], name + " → ",true);
				
			}
	
	while(expr) {
		  _reader_apply_1_macro (expr,expr[0], clause, name) ;
		 expr = expr[1];
		 }
}


function boot_match() {
			define_sysfun  (new Sysfun('match.reader-macros',_reader_macros,0,0));
			define_special (new Sysfun('match.define-macro', _define_macro, 3,3));
			define_sysfun  (new Sysfun('match.macro?', _macro_p, 1,1));
			
			define_special (new Sysfun('match.match', _match, 2, undefined)); // (exp clause ..)
			 // (check-match expr pat [proc])
			define_special (new Sysfun('match.check-match', _check_match, 2, 3));
			writeln("match.lib v1.3 ® EchoLisp","color:green"); 
			_LIB["match.lib"] = true;
			}
			
boot_match();
	
 
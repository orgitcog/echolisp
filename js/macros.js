/*
* GLisp - M A C R O S
*/


//////////////
// quote family 
/////////////

var _macro_eval = function (self, env) { // @
	return self[1][0] ;
}

var _quote = function (self,env) {
	return self[1][0];
	}
	
var $depth = 1; // remove me NYI
var _quasiquote = function (self,env) {
$depth++;
	var res = [null,null]; // to return
	var arg = self[1][0];

	if(notIsList (arg)) return arg ;
	
	while(arg) {
		if(isUnquote(arg[0])) res =  __append_2(res , [__eval(arg[0][1][0],env), null]);
	else 
		if(isUnquote_splicing(arg[0])) {
		var tosplice  = arg[0][1][0] ;
		var spliced =  __eval(arg[0][1][0],env) ;
		if(spliced && notIsList(spliced)) glisp_error(20,tosplice,"unquote-splicing (,@)");
		res = __append_2(res ,spliced ); 
		}

	else
	res = __append_2(res ,[ _quasiquote([_quasiquote, [arg[0], null]], env) , null]) ;
	arg = arg[1];
	}
$depth--;
	return res[1] ;
} // quasiquote
	
var _unquote = function (self,env) {
	glisp_error(82, self[1][0],"unquote");
	//return self[1][0]; // NOPISH
	}
var _unquote_splicing = function (self,env) {
	glisp_error(83, self[1][0],"unquote-splicing");
	//return self[1][0]; // NOPISH
	}
	


// EX : (define-syntax-rule (foo tic ...) (list 1 '( tic ...) 2))
// EX : (define-syntax-rule (foo tic ...) (list 1 ' tic [CHECK ... NYI] 2))

/////////////////////
// SYNTAX-RULES
// http://docs.racket-lang.org/guide/pattern-macros.html
// if i1 bound ( a b c), i2 bound (x y z) and same length
// expand (s i1 i2) ...  to ( s a x)(s b y) ...  NYI
////////////////////////


// return a new fresh list from list=template and env=bindings
function _syntax_match_replace_1 (list, env) { // at depth n
	if(list === null) return null;
	var copy = [null,null];
	var next = copy , item;
	while(list) {
				item = list[0];
				if(isListOrNull(item)) next[0] = _syntax_match_replace_1(item,env);
				
				else if(item instanceof Symbol && (env.get(item.name) !== undefined)) {
					item = env.get(item.name); // bound value to replace
					
					if(list[1] && list[1][0] === _ellipsis) { // splice insert item
					next[0] = item[0];
					next[1] = item[1];
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
} //_match_replace

// syntax clauses 
function checkClause (clause,sender) {
sender = sender || "syntax-match" ;
	if(isListNotNull(clause) 
	&& (__length(clause) === 2) 
	&& isListNotNull (clause[0])
	&& isListNotNull (clause[1][0])) return clause ;
	glisp_error(32,clause,sender);
}
		
function isId (id ) { 
	return id instanceof Symbol && isAlpha(id.name[0]) ;
}

/*---------------
hygienic : replaces (let,let*,letrec,lambda ()) formal by anonymous names
-------------*/
var _anonymous_id = 0; 
function _anonymous (symb) {
	if(! (symb instanceof Symbol)) glisp_error (23,symb,"let-macro") ;
	_anonymous_id++ ;
	return new Symbol('#:' + symb.name + "_" + _anonymous_id) ;
	}
	
function _hygienic_let_replace (inlet) {
	inlet  = inlet[1] ;
	if(isSymbol(inlet)) inlet = inlet[1] ; // named let
	var formals = inlet[0] ;
	var body = inlet[1];
	var anon;
	
// glisp_trace("formals",formals,"let_replace",true);
	while(isListNotNull (formals)) {
		 symb = formals[0][0];
		  formals[0][0] = anon = _anonymous(symb) ;
		 glex_replace(body,symb,anon);
		 formals = formals[1];
		 }
}

function _hygienic_lambda_replace (lambda) {
	var formals = lambda[1][0], symb;
	var body = lambda[1][1];
	var anon;
// lambda x
	if(isSymbol(formals)) {
		lambda[1][0] = anon =_anonymous(formals) ;
		glex_replace(body,formals,anon);
		return;
		}
// lambda (x y )
	while(isListNotNull (formals)) {
		symb = formals[0];
		formals[0] = anon = _anonymous(symb) ;
		 glex_replace(body,symb,anon);
		 if(isSymbol(formals[1])) break;
		 formals = formals[1];
		 }
// lambda (x y . z)
	if(formals[1]) {
		symb = formals[1];
		formals[1] = anon = _anonymous(symb) ;
		glex_replace(body,symb,anon);
		}
}

function _hygienic_let (template) {
var next = template;
	if(notIsList(template)) return;
	while(next) {
		_hygienic_let (next[0]) ;
		next = next[1];
		}
	if(isLet(template)) _hygienic_let_replace (template) ;
// glisp_trace("",template,"hygienic",true);
	/* Lets / Let*  NYI NYI NYI */
}

function _syntax_hygienic (body) { // ( (kwds) clause clause
		var clauses = body[1], clause, template ;
		while(clauses) {
			clause = clauses[0];
			if(clause.length !== 2) glisp_error(32,clause,"syntax-rule") ;
			template = clause[1][0] ;
			if(notIsList(template)) glisp_error(32,template,"syntax-rule") ;
			_hygienic_let(template) ; // patch template
			clauses = clauses[1] ;
			}
}
			
/*--------------
match_ellipsis
in :pattern (following ellipsis) , expr
out: matching expr
------------------------*/
function __syntax_match_ellipsis(kwds,pattern,expr,env) {
	if(pattern === null) return expr ;
	var ret = [];
	var matchenv ;
	while(expr) {
// glisp_trace("MATCH ELLIPSIS",pattern,expr,true);
		matchenv = new GLenv(env);
		if(_syntax_match_1(kwds,pattern,expr,matchenv)) {
						env.merge(matchenv);
						return __array_to_list(ret) ;
						}
		ret.push(expr[0]);
		expr = expr[1];
		}
	return false;
	}
	
/*--------------
syntax matching
	kwds : list of must match keywords
------------------*/
function _syntax_match_1 (kwds,pattern, expr,env) {
var id,name,question,ematch;
	if(pattern === null && expr === null) return true ;
			
	if(isId(pattern)) { // keywords test here
				name = pattern.name;
				if(name === "_") return true;
				if(env.get(name) !== undefined) return __equal(env.get(name),expr) ; //already bound
				if(kwds && kwds.indexOf(pattern) >= 0) return (pattern === expr); 
				env.set(name,expr); // bind
glisp_trace(pattern.name,expr,"match::bind");
				return true;
				}
				
	// acts as a keyword - no variable match
	if(isQuote(pattern)) return __equal(pattern[1][0],expr) ;
	
	if(isListNotNull(pattern) && isListNotNull (expr)) {
		// match car
		if(! _syntax_match_1 (kwds,pattern[0], expr[0], env)) return false;
		// skip to cdr
		if(pattern === null) return (expr === null);
			id = pattern[0] ; // ( a ... b)
			pattern = pattern[1] ;
			expr = expr[1];
			
		// ellipsis case ?
			if(pattern && (pattern[0] === _ellipsis)) {
					ematch = __syntax_match_ellipsis(kwds,pattern[1],expr,env);
					if(ematch === false) return false;
					if(isId(id)) {
							env.set(id.name ,[env.get(id.name),ematch]) ; // bind to list
							glisp_trace(name,env.get(name),"match::bind ...");
							}
				return true;
				}
				
		 // match cdr
		else return _syntax_match_1(kwds,pattern,expr,env); // cdr match
	} // lists
	
	return pattern === expr ; // terminal (number, ...) , + symbol, ..
	// rational, etc.. see '=' (numeq) NYI - vectors itou
} // _syntax_match_1
	
///////////////
//  __syntax_match_replace  ( expr, clauses)
// -> returns NEW list or null if no match
///////////////
function _syntax_match_replace  (expr , clauses , sender) {
sender = sender || "syntax-match" ;
var expanded , kwds,clause,pattern,template,match_env;
	
	kwds = clauses[0] ; // null may be
	clauses = clauses[1];
		while(clauses) {
			clause = clauses[0];
			checkClause(clause,sender);
			pattern = clause[0];
			template  =  clause[1][0];
			match_env = new GLenv(null,"M"); ; // assoc list for ids
			
		    if(_syntax_match_1 (kwds,pattern,expr,match_env)) {
					expanded =   _syntax_match_replace_1(template,match_env) ;
					if(isListNotNull (expanded)) expanded[TAG_SYNTAX] = true; // info only
					return expanded ;
					}
		clauses = clauses[1];
		}
	return null ;
} // __syntax_match_replace


/*-----------------
(define-syntax-rule pattern template)
pattern = (id rest ...)
rem: can quote keywords inside pattern
-----------------------------*/
var _define_syntax_rule = function(self, env) {
	var clause  = self[1];
	var pattern = clause[0];
	var id = pattern[0] ;
	checkClause(clause,"define-syntax-rule");
	if(! (id instanceof Symbol)) return glisp_error(33,id,"syntax-rule") ; // missing id
	// if(sysfun(id.name)) writeln(id.name + ": really?");
	id.syntax = [ null , [ clause , null]] ; // clause list - 1 clause
	_syntax_hygienic(id.syntax) ; // check & patch in place
	env.set(id.name,id); // evals to self ???
	return id;
}

/*-----------------
(define-syntax-id id expr)
id = symb 
expr === null : reset
-----------------------------*/
var _SYNTAX_IDS = [];
var _define_syntax_id = function(self, env) {
	var clause  = self[1];
	var id = clause[0];
	var expr = clause[1][0];
	if(! (id instanceof Symbol)) return glisp_error(33,id,"syntax-id") ; // missing id
	if(expr === null)
		id.syntax = null;
		else id.syntax = [_define_syntax_id , expr] ; // clause list - 1 clause
	_SYNTAX_IDS.push(id);  // symbols
	env.set(id.name,id);  // evals to self
	return id;
}

var _syntax_ids = function () {
	return __array_to_list(_SYNTAX_IDS) ;
}

/*---------------------
 (define-syntax id
     (syntax-rules (kwds...) ([pattern template] ...))

internal syntax slot format :
clauselist := ( (kwd ...)  clause  clause ...)
clause := (pattern template)
----------------*/

var _define_syntax = function(self,env) {
	self = self[1];
	var id = self[0]; // symbol
	var body = self[1][0];
	var syntax_type = body[0];
	// switch (type) cases _syntax_rules, syntax_id, .. NYI
	if(!(id instanceof Symbol)) return glisp_error(33,id,"define-syntax") ; // missing id
	if(isSymbol(body[0]) && body[0].name === "syntax-rules") {
		// check well formed kwds
		// check well formed clauses  NYI
		_syntax_hygienic(body[1]) ; // patch in place
		id.syntax = body[1]; // the rules
		env.set(id.name,id); // evals to self ???
		// id.pack = null; // = imported from, or null (new one)
		return id;
		}
	return glisp_error(34,body[0],"define-syntax");
}

///////////////
// syntax-expand 
// apply syntax rules
// return true iff at least one hit
////////////
function glisp_syntax_expand(parent, expr,env) { // assert parent[0] = expr
env = env || glisp.user ;
	// if(parent[0] !== expr) glisp_error(1,expr,"syntax - internal error") ;
	if(notIsList (expr)) return false; // rules apply only to lists
	if(isAutoRef (expr)) return false;
	var node = expr[0];
	var rest = expr;
	var ret = false;
	var rep = null;
	while(rest) { // go inside
		 ret |= glisp_syntax_expand(rest,rest[0],env) ;
		 rest  = rest[1];
		 }
	if(isSymbol(node) && node.syntax) {
		rep  = _syntax_match_replace  (expr , node.syntax)
		if( rep )  parent[0] = rep;
				   else glisp_error(49,expr,"syntax-rules");
		glisp_syntax_expand(parent,rep,env);
		ret = true; 
		}
	return ret ;
} // glisp_syntax_expand

/*--------------------
__symbol_match ( _.foo any.foo) or (foo._ foo.any)
returns undef or symbol matcher for _
-----------------------------*/
function __symbol_match (pat, symb) {
	if(pat === symb) return undefined; // do not expand self
	if(packName(symb.name) === null)  return undefined;
	if(symb.name.indexOf("#") !== -1) return undefined; // no match special symbs
	
	if(packName(pat.name) === "_")  
	if(simpleName(symb.name) === simpleName(pat.name)) 
			return new Symbol(packName(symb.name)) ;
			
	if(simpleName(pat.name) === "_")  
	if(packName(symb.name) === packName(pat.name)) 
			return new Symbol(simpleName(symb.name)) ;
			
	return undefined;
}

/*---------------
deep copy to return
----------------------*/
function __symbol_match_replace(expr,symb,newsymb) {
	if(isSymbol(expr)) return (expr === symb) ? newsymb : expr;
	if(expr === null) return null;
	if(notIsList(expr)) return expr ;
	
	var ret = [] ;
	while(expr) {
		ret.push(__symbol_match_replace(expr[0],symb,newsymb)) ;
		expr = expr[1];
	}
	return __array_to_list(ret) ;
}


/*-----------------------
syntax-id-expand 
apply syntax-id rules
return expr
NYI : foo.gee.bazz
-----------------------------*/
var _UNDERSCORE_SYMB = null;

function glisp_syntax_id_expand(expr) { 
	if(_SYNTAX_IDS.length === 0) return expr ;
	if(_UNDERSCORE_SYMB === null) _UNDERSCORE_SYMB = new Symbol("_");
	if(isAutoRef (expr)) return expr  ;
	if(expr === null)    return expr ;
	var  s_expr = expr , node,id, syntax_id, smatch, matched;
	
	if(isListNotNull (expr))
	    while(expr) {
		expr[0] = glisp_syntax_id_expand(expr[0]);
		expr = expr[1] ;
		if(notIsList(expr)) break;
		}
		
	 if(isSymbol(expr)) { 
			node = expr;
			// as is
			if(node.syntax 
				&& node.name.indexOf("_") === -1
				&& node.syntax[0] === _define_syntax_id) {
			if(isListNotNull(node.syntax[1])) 
				return node.syntax[1].slice(0) ;  // clone mandatory
				}
		
		// pattern match
		// syntax = _.foo , node = xyz.foo or syntax = foo._ node  = foo.xyz
			else for (id=0; id < _SYNTAX_IDS.length; id++) {
				syntax_id = _SYNTAX_IDS[id] ;
				if  (syntax_id.syntax 
					&& isListNotNull(syntax_id.syntax[1])
					&& (smatch = __symbol_match(syntax_id,node))) {
						matched = syntax_id.syntax[1] ; // need copy
						return __symbol_match_replace(matched,_UNDERSCORE_SYMB,smatch) ;
				}}
		} // symbol
	
	return s_expr;
} // glisp_syntax_id_expand






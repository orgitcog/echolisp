/*----------------------
EchoLisp
infix.lib
© Simon Gallubert 2016
http://www.codecodex.com/wiki/Recursive_descent_parsing
-------------------------------*/

/*---------------------
goodies 4*5 --> 4 * 5
---------------------------*/
function _infix_goodies (line) {
var oline ;
	 		line = line.replace(/\;/g," ; "); // keep ;
	 		line = line.replace(/\/\//g, " //"); //   //=
	 		line = line.replace(/\^/g, " ^ ");
	 		line = line.replace(/\:\=/g, " := ");
	 		line = line.replace(/\+\=/g, " += ");
	 		line = line.replace(/\*\=/g, " *= ");
	 		line = line.replace(/\/\=/g, " /= ");
	 		line = line.replace(/\%\=/g, " %= ");
	 		line = line.replace(/\-\=/g, " -= ");
	 		line = line.replace(/\+\+/g, " ++ ");
	 		line = line.replace(/\-\-/g, " -- ");
	 		line = line.replace(/\&\&/g, " && ");
	 		line = line.replace(/\|\|/g, " || ");

	 		while(true) { // preserve for/sum , for*  in-naturals , 1.66e+7 , 1+ , ++ , 3/4
	 			oline = line ;
	 			line = line.replace (/([A-Za-z]+?)\*([A-Za-z]+?)/,"$1 * $2") ; //a*b
	 			line = line.replace (/([A-Za-z]+?)\*([0-9]+?)/,"$1 * $2") ; //a*2
	 			line = line.replace (/([0-9]+?)\*([A-Za-z]+?)/,"$1 * $2") ; // 2*a
	 			line = line.replace (/([0-9]+?)\*([0-9]+?)/,"$1 * $2") ; // 2*4
	 			
	 			line = line.replace (/([A-Za-z]+?)\%([A-Za-z]+?)/,"$1 % $2") ; //a%b
	 			line = line.replace (/([A-Za-z]+?)\%([0-9]+?)/,"$1 % $2") ; //a%2
	 			line = line.replace (/([0-9]+?)\%([A-Za-z]+?)/,"$1 % $2") ; // 2%a
	 			line = line.replace (/([0-9]+?)\%([0-9]+?)/,"$1 % $2") ; // 2%4

	 			line = line.replace (/([A-Za-z]+?)\+([A-Za-z]+?)/,"$1 + $2") ; //a+b
	 			line = line.replace (/([0-9]+?)\+([A-Za-z]+?)/,"$1 + $2") ; // 2+a
	 			line = line.replace (/([0-9]+?)\+([0-9]+?)/,"$1 + $2") ; // 2+4
	 			line = line.replace (/([A-DF-Za-df-z]+?)\+([0-9]+?)/,"$1 + $2") ; // a+3
	 			
	 			line = line.replace (/([A-Za-z]+?)\/([0-9]+?)/,"$1 / $2") ; // a/2
	 			line = line.replace (/([0-9]+?)\/([A-Aa-z]+?)/,"$1 / $2") ; // 1/a
	 			
	 			line = line.replace (/([A-DF-Za-df-z]+?)\-([0-9]+?)/,"$1 - $2") ; // a-2
	 			line = line.replace (/([0-9]+?)\-([0-9]+?)/,"$1 - $2") ; // 2-4
	 			line = line.replace (/([0-9]+?)\-([A-Za-z]+?)/,"$1 - $2") ; // 2-a
	 			if(line === oline) break;
	 			}
	 	 return line; 
		 }

var _EXPT_OP = new Symbol("^");
var _MULT_OP = new Symbol("*");
var _DIV_OP = new Symbol("/");
var _DIVX_OP = new Symbol("//");
var _MODULO_OP = new Symbol("%");
var _PLUS_OP = new Symbol("+");
var _MINUS_OP = new Symbol("-");
var _EOL_OP = new Symbol("_EOL_OP"); // end of list
var _COMMA_OP = new Symbol(",") ;
var _SEMICOLON_ = new Symbol(";") ;
var _BEGIN_OP = new Symbol("begin") ;
var _WHEN_OP = new Symbol("when") ;
var _WHILE_OP = new Symbol("while") ;
var _IF_OP = new Symbol("if") ;
var _ELSE_OP = new Symbol("else") ;
var _NOT_OP = new Symbol("!") ;
var _COMPARE_OPS = [ new Symbol("="), new Symbol("!="), new Symbol(">"), new Symbol(">="), new Symbol("<"), new Symbol("<=")]; 
var _ASSIGN_OPS = [ new Symbol(":="), new Symbol("*="), new Symbol("+="), new Symbol("-=")]; 

/*
	"cannot parse expression" , // 150
	"missing expression", // 151
	"not expected" // 152
*/

/*-------------------------------
I N F I X    P A R S E R
-------------------------------*/

function infix_parse (tokens) {
	var TOKEN =null ; // current
	var tokstack = [];
	
/*---------------
utilities
------------------------*/
// in js array [ + 8 - 9 + a ...]
// out lisp tree  (- (+ a b c d) e f g h)

function add_to_nodes (ops) {
	var plus = [];
	var minus = [] ;
	for(var i =0; i< ops.length; i++) {
		if( ops[i] === "+") plus.push(ops[++i]);
		else if (ops[i] === "-") minus.push(ops[++i]);
		// else glisp_error(xx,ops[i],"infix-reader:+ expression"); // xx !!!!
		}
	if(minus.length === 0) {
		if(plus.length === 1) return plus[0];
		return [_PLUS_OP , __array_to_list (plus)] ;
		}
	else if(plus.length === 0) { // - a - b - c
		return [_MINUS_OP, [ 0, __array_to_list (minus)]] ;
		}
	else if(plus.length === 1) { // + a - b - c - d
		return [_MINUS_OP, [plus[0], __array_to_list(minus)]] ;
		}
	else if (minus.length === 1) { // a + b + c - d
		plus = [_PLUS_OP , __array_to_list (plus)];
		return [_MINUS_OP, [plus, [minus[0] , null]]] ;
	}
	else {
		plus = [_PLUS_OP , __array_to_list (plus)];
		minus = [_PLUS_OP , __array_to_list (minus)];
		return [_MINUS_OP, [plus, [minus , null]]] ;
		}
}

// in js array [* 8 * 8 / a // b // ... / f]
// out lisp tree  (/ (* a b c d) e f g h)

function mult_to_nodes (ops) {
	var mult = [];
	var div = [] ;
	var div_op = _DIV_OP ; // default
	for(var i = 0; i< ops.length; i++) {
		if( ops[i] === "*") mult.push(ops[++i]);
		if (ops[i] === "/") div.push(ops[++i]);
		if (ops[i] === "//") {div.push(ops[++i]); div_op = _DIVX_OP; }
		}
		
	if(div.length === 0) {
		if(mult.length === 1) return mult[0];
		return [_MULT_OP , __array_to_list (mult)] ;
		}
	else if(mult.length === 1) { // * a / b / c / d
		return [div_op, [mult[0], __array_to_list(div)]] ;
		}
	else if (div.length === 1) { // a * b * c / d
		mult = [_MULT_OP , __array_to_list (mult)];
		return [div_op, [mult, [div[0] , null]]] ;
	}
	else {
		mult = [_MULT_OP , __array_to_list (mult)];
		div = [_MULT_OP , __array_to_list (div)];
		return [div_op, [mult, [div , null]]] ;
		}
}

// input ^ a [ ^ b ^ c ..)
// build a ^ (b ^  (c ^ d))
function expt_to_nodes (ops) {
	var expt = [] ;
	for(var i = 0; i< ops.length; i++) 
		if( ops[i] === "^") expt.push(ops[++i]);
		
	if(expt.length === 1) return expt[0];
	if(expt.length === 2) return [_EXPT_OP,[expt[0],[expt[1],null]]] ;
	
	var terms = expt.length-1;
	var node = [_EXPT_OP, [expt[terms-1],[expt[terms],null]]] ;
	for(var i = terms-2; i>=0 ; i--)
		node = [_EXPT_OP, [expt[i], [node, null]]] ;
	return node;
}


/*------------------
types predicates
------------------------*/
function is_assign() {
	var symb = look_ahead(1);
	return (symb instanceof Symbol) && symb.name === ":=" ;
}
function is_add(symb) {
	return (symb instanceof Symbol) && (symb.name === "+" || symb.name === "-") ;
}
function is_mult(symb) {
	return  (symb instanceof Symbol) &&
		    (symb.name === "/" || symb.name === "//" || symb.name === "*") ;
}
function is_mod(symb) {
	return (symb instanceof Symbol) && symb.name === "%" ;
}
function is_or(symb) {
	return (symb instanceof Symbol) && symb.name === "||" ;
}

function is_and(symb) {
	return (symb instanceof Symbol) && symb.name === "&&" ;
}

function is_expt(symb) {
	return (symb instanceof Symbol) && symb.name === "^" ;
}
	
function is_special(symb) {
	return (symb instanceof Symbol) &&
			symb.fval && (typeof symb.fval === "function") && symb.fval.special ;
	}
	
function is_eol(symb) {
	return (symb instanceof Symbol) && symb.name === "_EOL_OP" ;
	}
	
function is_quote_symb(symb) {
	return (symb instanceof Symbol) && (symb.name === "'" ) ;
	}
	
function is_funcall(symb) {
	return (symb instanceof Symbol && tokens && isListOrNull (tokens[0])) ;
	}
	
/*--------------------
parser
1 + 8 + 9 + 
1 + 8 + 8 9
-------------------------*/

// sets token
// returns nothing
function getsym(sender) {
	sender = sender || "infix-reader" ;
	if(tokens === null) { TOKEN = _EOL_OP ;  if(tokstack.length) tokens = tokstack.pop() ; return;}
	TOKEN = tokens[0];
	tokens= tokens[1];
}

// look for op string 
function look_ahead(op) {
	if (tokens === null ) return false;
	var next = tokens[0] ;
	return (next instanceof Symbol && next.name === op) ;
}

// (accept "symbol name") (accept "symbol array) (accept _pairp) 
// when  ok(TOKEN) avance, and ->TOKEN ; else -> false
function accept (pred) {
//writeln(glisp_message(TOKEN,"accept:token ->")) ;
//writeln(glisp_message(pred,"accept:pred ->")) ;

var accepted = false ;
		if(pred === null && TOKEN === null) accepted = null ;
		
		else if (pred === _pairp && _pairp (TOKEN) === _true) { 
				tokstack.push(tokens) ;
				tokens = TOKEN ;
				accepted = TOKEN ;
				}
		else if (Array.isArray(pred) && (pred.indexOf(TOKEN) >= 0)) {
				accepted = TOKEN ;
				}
		else if ((typeof pred === "string") && (TOKEN instanceof Symbol) && TOKEN.name === pred)  {
	    		accepted = TOKEN;
	    		}
		else if (typeof pred === "function" &&  pred (TOKEN) === _true) {
				accepted = TOKEN ;
				}
//writeln(glisp_message(accepted,"accept <-")) ;
	if(accepted !== false) getsym();
	return accepted ;
	}
	
// error if not expected ; else avance
function expect(pred,sender) {	
sender = sender || pred ;
var accepted = accept(pred);
	return accepted === false ?  glisp_error(152,TOKEN,sender) : accepted ; // not expected msg
}

/*--------------
syntax proc's
-------------------*/

function funcall () {
//writeln (glisp_message (TOKEN, "funcall → ")  + " " + glisp_message (tokens,"tokens" )) ;
var fun = TOKEN ;
var args = [];
	expect(_symbolp) ;
	if (accept (null) !== false) { // no parms
		getsym();
		return [fun , null];
		}
		
	if(accept (_pairp) !== false )
		while (true) {
			args.push(expression());
			if(accept("_EOL_OP")) break;
			expect(",") ;
			}
	return [fun, __array_to_list(args)] ;
	}
		
// bottom := symbol | number | funcall | (statement)
function bottom() {
// writeln (glisp_message (TOKEN, "bottom → ")  + " " + glisp_message (tokens,"tokens" )) ;

	var symb ,node = TOKEN;
	
	if(is_eol(TOKEN)) glisp_error(151,"","infix-reader"); // missing

	if(isQuote(TOKEN))  { 
						getsym();
						return node;
						} // (_quote val) : &i symbol
	
	else if (accept ("++")) { // ++ a
		symb = TOKEN ;
		expect(_symbolp,"++") ;
		return [_plus_plus , [symb,  null]] ;
		} 
		
	else if (accept ("--")) {
		symb = TOKEN ;
		expect(_symbolp,"--") ;
		return [_minus_minus , [symb, null]] ;
		} 
		
	else if (look_ahead("++")) {//  a ++
		symb = TOKEN ;
		expect(_symbolp,"++");
		expect("++");
		return[_infix_plus_plus, [symb, null]];
		}
		
	else if (look_ahead("--")) {
		symb = TOKEN ;
		expect(_symbolp,"--");
		expect("--");
		return[_infix_minus_minus, [symb, null]];
		}
	
	
	else if(is_quote_symb(TOKEN)) { // ' val
						getsym();
						node =  [_quote , [TOKEN , null]] ;
						getsym();
						return node;
						}
	
	else if(is_funcall(TOKEN)) return funcall();
	
	else if(accept(_pairp)) {
					node  = statement(); // 1 * ( x + 1)
					expect("_EOL_OP") ;
					return node ;
					}
// default -
	if(is_special(TOKEN)) glisp_error(150,TOKEN,"infix-reader:special-op"); // cannot parse
	getsym();
	return node;
}

// factor = bottom ^ bottom ^...
function factor () {
//writeln (glisp_message (TOKEN, "factor  → ")  + " " + glisp_message (tokens,"tokens" )) ;
var ops = [];
	ops.push("^");
	ops.push(bottom());
		while(is_expt(TOKEN)) {
		 ops.push(TOKEN.name);
		 getsym();
		 ops.push(bottom());
		 }
	return expt_to_nodes (ops);
}

// term = factor *|/ factor [ *|/ factor ...
function term () {
//writeln (glisp_message (TOKEN, "term → ")  + " " + glisp_message (tokens,"tokens" )) ;
var ops = [] ;
	ops.push("*");
	ops.push(factor());
	while(is_mult(TOKEN)) {
		 ops.push(TOKEN.name);
		 getsym();
		 ops.push(factor());
		 }
	return mult_to_nodes (ops);
}

function mod() {
	var op1 = term();
	var op2 = false;
	if(is_mod(TOKEN)) {
		getsym();
		op2 = term();
		}
	return op2 === false ? op1 : [_MODULO_OP, [op1, [op2,null]]] ;
}

function log_and() {
	var ops = [mod()];
	while(is_and(TOKEN)) {
		getsym();
		ops.push(mod());
		}
	return (ops.length === 1) ? ops[0] : [_and,__array_to_list(ops)] ;
}

function log_or() {
	var ops = [log_and()];
	while(is_or(TOKEN)) {
		getsym();
		ops.push(log_and());
		}
	return (ops.length === 1) ? ops[0] : [_or,__array_to_list(ops)] ;
}

// expr = [+|-] term +/- term +/- term ...
function expression() {
// writeln (glisp_message (TOKEN, "expression → ")  + " " + glisp_message (tokens,"tokens:" )) ;

	var sign ; // "+" | "-"
	var ops = [] ;
	if(is_add(TOKEN))
		 {ops.push(TOKEN.name); getsym();}
		 else ops.push("+") ;
		 
	ops.push(log_or());
	
	while(is_add(TOKEN)) {
		ops.push(TOKEN.name);
		getsym();
		ops.push(log_or()) ;
		}
	return add_to_nodes (ops);
}

// condition := ( a < b) || expression
function condition() {
// writeln (glisp_message (TOKEN, "condition → ")  + " " + glisp_message (tokens,"tokens:" )) ;
var op1,op2 = false,cmp  ;
	expect(_pairp,"infix-reader:(condition)") ;
	op1 = expression();
	cmp = TOKEN ;
	if(accept(_COMPARE_OPS)) op2 = expression();
	expect("_EOL_OP","infix-reader:condition");
// writeln (glisp_message (op1, "condition → op1"));
// writeln (glisp_message (op2, "condition → op2"));
	return (op2 !== false) ? [cmp ,[op1 , [op2, null]]] : op1 ;
}

function clause(sender) { // (block) or expression ;
var op ;
		if(accept(_pairp)) 
			return  block(); 
		op = expression();
		// expect(";",sender) 
		return op;
}
	
// symb *= statement
function assign(symb) {
	if (look_ahead (":=")) {
		expect(_symbolp,":=") ;
		expect(":=");
		return [_setv , [symb, [ statement() , null]]] ;
		} 
	else if (look_ahead ("+=")) {
		expect(_symbolp,"+=") ;
		expect("+=");
		return [_plus_equal , [symb, [ statement() , null]]] ;
		} 
	else if (look_ahead ("-=")) {
		expect(_symbolp,"-=") ;
		expect("-=");
		return [_minus_equal , [symb, [ statement() , null]]] ;
		} 
	else if (look_ahead ("*=")) {
		expect(_symbolp,"*=") ;
		expect("*=");
		return [_mult_equal , [symb, [ statement() , null]]] ;
		} 
	else if (look_ahead ("/=")) {
		expect(_symbolp,"/=") ;
		expect("/=");
		return [_div_equal , [symb, [ statement() , null]]] ;
		} 
	else if (look_ahead ("//=")) {
		expect(_symbolp,"//=") ;
		expect("//=");
		return [_xdiv_equal , [symb, [ statement() , null]]] ;
		} 

	else return false;
}



// statement :=  (symb := statement) || (expr)
function statement() {
// writeln (glisp_message (TOKEN, "statement → ")  + " " + glisp_message (tokens,"tokens:" )) ;
var symb = TOKEN ;
var  op1, op2 = false,  cond ;

	op1 = assign(symb);
	if (op1) return op1 ;
	
	else if (accept("when") || accept("while")) { //  when (cond) expression || (block)
		cond = condition();
		op1 = clause("infix-reader:" + symb.name);
		return [symb, [ cond, [op1, null]]] ;
		} // when/while
		
	else if (accept("if")) { //  if (cond) expression || (block) [else ..]
		cond = condition();
		op1 = clause("infix-reader:if");
		if(accept("else")) {
			op2 = clause("infix-reader:if");
		    return [symb, [ cond, [op1, [op2, null]]]] ;
		   }
		return [_WHEN_OP, [cond, [op1, null]]];
		} // if
		
	else {
		return  expression();
		}
}

// block := { statement [; statement ; ...]}
function block () {
//writeln (glisp_message (TOKEN, "block → ")  + " " + glisp_message (tokens,"tokens" )) ;
var node ;
var begin = [];

	while (true) {
		if(is_eol(TOKEN)) break;
		begin.push(statement());
		if(accept(";")) continue;
		break;
		}
	expect("_EOL_OP","infix-reader:(block)") ;
//writeln (glisp_message (__array_to_list(begin), "block <- ")) ;
	return [_begin, __array_to_list(begin)] ;
	}

// main
	getsym();
	return block();
} // infix_parse

/*---------------------------
Mecro expand
-------------------------------*/
// (#:infix expr [ expr ....])
function _infix_expand (list) {
var next = list;

	function is_infix_expr(expr) {
	return isListNotNull(expr) && (expr[0] instanceof Symbol)  && expr[0].name === "#:infix" ;
	}

	if(notIsList(list)) return list;
	
	if(is_infix_expr(list)) {
		return infix_parse(list[1]) ;
		}

	while(next) {
			next[0] = _infix_expand(next[0]);
			next = next[1];
			} 
	return list;
}

/*-----------------------
A P I
------------------------------*/
// for REPL
var _use_infix = function (what) {
	_INFIX_REPL = (what === _true) ? true : false ;
	return _INFIX_REPL ? _true : _false ;
}
	
function _infix_to_expr (form) {
	if(notIsList(form)) return form ;
	return infix_parse(form);
}

// input form = (_values ... ...)
function glisp_infix_repl(form) {
	var  expr  = form[1];		
	expr = _infix_to_expr (expr);
	return [_values, [expr, null]] ;
}


// (infix->expr '(3 + 4 * 2 / ( 1 - 5 ) ^ 2 ^ 3))

function boot_infix() {
		
// INFIX REPL
		define_sysfun  (new Sysfun('infix.use-infix', _use_infix,1,1)); // set infix mode

    	writeln("infix.lib v2.6 ® EchoLisp","color:green");		
     	_LIB["infix.lib"] = true;
     	}

boot_infix();



/*
* EchoLisp
* ERROR HANDLING
* http://www.gnu.org/software/emacs/manual/html_node/elisp/Catch-and-Throw.html
* http://www.fileformat.info/info/unicode/category/So/list.htm
* V 2.4.16
*/

// Crée un nouvel objet, héritage par prototype depuis le constructeur de type Error
function GLError(errno) { // GLisp errors
    this.name = "GLError";
    this.message = "GLerror# " + errno;
    this.errno = errno;
}
GLError.prototype = new Error();
GLError.prototype.constructor = GLError;

function GLInterrupt(name,message) { // created by (throw name message)
	this.name = name ;
	this.message = message;
}
GLInterrupt.prototype = new Error();
GLInterrupt.prototype.constructor = GLInterrupt;

function GUserError(msg,obj) { // created by (error msg obj)
	this.name = "GUserError" ;
	this.message = icon(user_icons) + " error: " + msg.toString() + ' ' + glisp_message(obj,"");
}
GUserError.prototype = new Error();
GUserError.prototype.constructor = GUserError;

function GLbreak(value) { // created by #:break #t in for loop
	this.name = "GLbreak" ;
	this.message = value  ; // break value may be undefined
}
GLbreak.prototype = new Error();
GLbreak.prototype.constructor = GLbreak;



// * : internal error 
var _glisp_errors = [ '', // 0 = none or warning
// READER
	"EchoLisp error", // 1 internal
	// warnings
	"missing left parenthesis: '('",
	"too many left parenthesis: '('",
	"missing right parenthesis: ')'",
	"too many right parenthesis: ')'",
	"check failed", // 6
	"bad expression", // 7
	"missing (catch ...)", // 8
	"zero-divide", // 9
	"bad format directive", // 10
	// end warnings
	
// COMPILE and RUN : throw exception
	"ill-formed special form", // 11
	"object not applicable", // 12
	"undefined value", // 13
	"too many arguments", // 14
	"missing argument(s)", // 15
	"argument type is not correct", // 16
	"unbound variable" , // 17
	"* cannot bind value" , // 18
	"cannot redefine", // 19
	"expected list", // 20
	"misplaced quote", // 21
	"expected numeric value",  // 22
	"expected symbol", // 23 
	"bad range", // 24
	"ill-formed dotted list", // 25
	"unknown key", // 26 bad name NYI
	"cannot define", // 27
	"internal stack error", // 28
	"stack overflow" , // 29
	"duplicate name" ,// 30
	"not a macro", // 31
	"expected clause : (pattern template)", // 32
	"expected identifier", // 33
	"unknown syntax form", // 34
	"not a symbol" , // 35 --> 23 ?
	"unknown symbol", // 36
	"unknown package", // 37
	"not yet implemented", // 38
	"missing delimiter", //39
	"assertion failed", // 40
	"format is not a string", // 41
	"index out of range", // 42
	"run-time", // 43
	"expecting function", // 44
	"unknown Complex operation", // 45
	"expected complex value", // 46
	"not a function", // 47
	"expected positive integer", // 48
	"no matching pattern", // 49
	"missing body", // 50 (let)
	"expected string", // 51
	"unknown tag",  // 52 
	"expected regexp", // 53
	"not a valid name" , // 54 
	"cannot save", // 55 
	"not a sequence", // 56
	"expected string or symbol", // 57
	"unknown dictionnary", // 58
	"expected environment", // 59
	"null is not an object", // 60
	"expected integer", // 61
	"cannot eval", // 62
	"unknown struct", // 63 meta
	"no match found", // 64
	"expected vector", // 65
	"expected complex", // 66
	"expected value", // 67
	"busy", // 68
	"misplaced comment", // 69
	"missing library", // 70
	"empty stream", // 71
	"expected stream", // 72 
	"expected procedure", // 73
	"wrong number of arguments for argument function", // 74
	"too large number (use bigint.lib)", // 75
	"expected date", // 76
	"expected struct", // 77 instance
	"not a valid style string (missing ':')", // 78
	"unknown sound", // 79
	"circular list", // 80
	"cannot read", // 81 #foo input
	"misplaced ','", // 82
	"misplaced ',@'", // 83
	"catch without try", // 84
	"expecting (catch (tag message) body)", // 85
	"cannot undefine", // 86
	"not a data serie", // 87
	"not a JSObject", // 88
	"cannot translate", // 89
	"undefined value", // 90 - json
	"not a valid (key value) list", // 91
	"unknown key", // 92
	"expected vector or list", // 93
	"not same length", // 94
	"expected set", // 95
	"no open data base", // 96
	"unknown local store", // 97
	"wrong compile directive", // 98
	"expected procedure", // 99
	"key already exists", // 100
	"expected email address", // 101
	"integer out of range", // 102
	"expected number", // 103
	"expected tree", // 104
	"expected binary tree", // 105
	"unicode point value out of range", // 106
	"expected graph", // 107
	"unknown class", // 108
	"expected class", // 109
	"expected class instance", // 110
	"unknown slot name", // 111
	"expected method", // 112
	"no method found", // 113
	"misplaced keyword", // 114
	"no super class method found", // 115
	"expected &lambda; expression", // 116
	"cannot swap", // 117
	"expected matrix", // 118
	"expected array", // 119
	"expected boolean", // 120
	"expected square matrix", // 121
	"not compilable", // 122
	"expected hash", // 123
	"expected (key . value)", // 124
	"not indexed (use hash-make-index)", // 125
	"expected (define $1 value) or (define ($1 ...) expr ...)" , // 126
	"expected heap", // 127
	"expected keyword", // 128
	"field index out of range", // 129
	"expected table", // 130
	"field reference: expected struct.field or index", // 131
	"unknow sql operation (sum|max|min)", // 132
	"expected {set}", // 133
	"expected structure (struct:name)", // 134
	"expected task" , // 135
	"expected semaphore", // 136
	"expected running task", // 137
	"expected stopped state", // 138
	"expected procrastinator", // 139
	"missing argument", // 140
	"expected [u]int32 vector", // 141
	"expected same number of columns", // 142
	"expected sequence", // 143
	"expected type-expression", // 144
	"type-check failure", // 145
	"expected Type", // 146
	"signature does not match function arguments",  // 147
	"wrong types number", //  148 
	"unknown Type (requires type.lib)", // 149
	"cannot parse expression" , // 150
	"missing expression", // 151
	"not expected", // 152
	"expected ui-element", // 153
	"expected 'return'" // 154
	] ;
	
// swap: use does not match pattern: (swap x y) in: swap
	

function glisp_throw(errno,obj,caller) { // RFU
		glisp_error(errno, obj ,caller) ; // printing
		var error = new Error(errno);
		throw error;
}

/*-------------
icons
-------------*/

var err_icons =  [ "😡" ,  "&#x274C;"  ,"💥"  , "&#x2757;", "&#x26D4;" , "&#x1F616️", "💣" ] ; // cross, !
var warn_icons = [ "😯" , "😢 " , "😁" ,  "😐", "😐" ];
var user_icons = [  "🚫" ,"😡" , "👓" ,"⛔️", "❌" ,"🔴" ] ;
var context_icons = [ "🔍", "🔎", "🔦", "🔬"] ;

function icon (icons) {return icons[random(icons.length)] + "  " ; }

/*------------------
glisp_error & warning
------------------------*/
function __short_list (obj , n) {
var ret = [];
	if(isListNotNull(obj)) {
	var next = obj ;
	while (n-- && next) { ret.push(next[0]) ; next = next[1]; }
		if(next === null || ! Array.isArray(next)) return obj ;
		ret.push("[…]");
		ret = __array_to_list(ret);
		return ret;
		}
	else if (obj instanceof Vector)
		{
		if(obj.vector.length <= n) return obj;
		ret = obj.vector.slice(0,n);
		if(! (Array.isArray(ret))) return "[ ??? ]" ;
		ret.push ("[…]");
		return new Vector(ret) ;
		}
	else return obj ;
}

// THROWS a JS GLError if errno === 1 or > 10 
// will be CATCHED by glisp_repl()
// obj === '' -> no obj display

function glisp_error(errno, obj ,caller) {
var txt,msg = "", warning =  (errno >= 0 && errno < 11) ;
var color = warning ? _STYLE.plist["warning"] : _STYLE.plist["error"] ;
var header = (warning) ? icon(warn_icons) : icon(err_icons) ;
var context = null;
var  erridx;

	if(errno) // not a warning
	if(glisp.error === errno ) 
		return glisp.error; // stop on same first
	
	glisp.error = errno ;
	erridx = ( errno >= _glisp_errors.length) ? 1 : errno ;

	header = warning ? header + 'warning: ' : header + 'error: ' ;

	if (obj !== "") msg =  glisp_message(__short_list(obj,4)," : ") ; 
	caller = glisp_message(caller,"");
	txt = header  + caller + ' : ' + _glisp_errors[erridx]  + msg ;
	
	if(_CONTEXT instanceof Symbol || _CONTEXT instanceof Formal)  context = _CONTEXT.name;
	if(typeof _CONTEXT === "string") context = _CONTEXT;
	if(context  && txt.indexOf(context) === -1 ) {
			txt +=  "    → " +  "'" + context + "'" ;
			}
		
	// $replace
	if(obj instanceof Symbol) {
		txt = txt.replace("$1",obj.name);
		txt = txt.replace("$1",obj.name);
		}

	_stdout_hide(_false);
	writeln(txt,color);

	if(warning) return null;
	throw new GLError(errno) ;
} // glisp_error

function glisp_warning(errmsg, obj ,caller) {
var txt = icon(warn_icons) +' warning: ' + caller + ' : ' + errmsg + glisp_message(obj," : ") ;
var color = _STYLE.plist["warning"] ;
	writeln(txt,color);
	stdpanel_write (txt,color);
	if(_UI.printer_echo) GPrinter.write(txt,color);
return null;
}

/*------------
debug and user (trace proc)
-------------------------*/

function glisp_trace(msg ,obj, caller, force) { // use force with (trace ..)
var header,i,line;
if(!force)
if((_DEBUG & _DEBUG_TRACE) === 0) return;

		if(typeof caller === "function" && caller.glfun)
				caller= "#[" + caller.glfun.symb +"] "; // a fun here NYI
				
		header = "💡" + " [" +_topblock +"] " ;
		for(i = 0 ; i <= _topblock && i <= 10 ; i++ ) header += _TAB; // indent
		
		line = header + caller + glisp_message(msg," ") ;
		if(obj !== undefined) line +=  "  " + glisp_message(obj,"");
		writeln(line,_STYLE.plist["trace"]);
		GPrinter.write(line,_STYLE.plist["printer-trace"]) ; // "font-style:italic;color:blue;"); 
}




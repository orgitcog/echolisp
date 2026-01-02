/*
* Glisp (C) Echolalie & G.Brougnard
* READ/PRINT functions
* http://www.n-a-n-o.com/lisp/cmucl-tutorials/LISP-tutorial-12.html
* http://c2.com/cgi/wiki?ImplementingLisp
*/

/*--------------
keyboard meta
-----------------*/
var _META_KEY = null ;
var _GREEK_CHARS = {  // "j" left
"a":  "\u03b1",	
"b":  "\u03b2",	
"g": "\u03b3",	
"d": "\u03b4",	
"e": "\u03b5",	
"z": "\u03b6",	
"h": "\u03b7", // eta
"t": "\u03b8",	
"i": "\u03b9",
"k":  "\u03ba",	
"l":  "\u03bb",	
"m": "\u03bc",	
"n": "\u03bd",	
"x": "\u03be",	
"q": "\u03bf",	// OmiQron
"p": "\u03c0",	
"r": "\u03c1",	
"w": "\u03c2",	// final sigma
"s": "\u03c3",	
"t": "\u03c4",	
"u": "\u03c5",	
"f"	: "\u03c6",
"c": "\u03c7",
"y": "\u03c8", // psi
"o"	: "\u03c9",

"A": "\u0391",
"B": "\u0392",
"G": "\u0393",
"D": "\u0394",
"E": "\u0395",
"Z": "\u0396",
"H": "\u0397", // eta
"T": "\u0398",
"I": "\u0399",
"K": "\u039a",
"L": "\u039b",
"M": "\u039c",
"N": "\u039d",
"X": "\u039e",
"Q": "\u039f", // omiQron
"P": "\u03a0",
"R": "\u03a1",
"S": "\u03a3",
"T": "\u03a4",
"U": "\u03a5",
"F": "\u03a6",
"C": "\u03a7",
"Y": "\u03a8", // psi
"O": "\u03a9",

"0" : "❌",
"1" : "❗️",
"2" : "❓",
"3" : "✔️",
"4" : "⛔️",
"5" : "✅",
"6" : "🚩",
"7" : "⌚️",
"8" : "🏁",
"9" : "😜" }

var _define_modifier_key = function (meta) {
	meta = nameToString(meta,"meta-key");
	if( [null,"meta","ctrl","alt"].indexOf(meta) === -1) glisp_error(24,meta,"define-meta-key");
	return (_META_KEY = meta);
}
var _meta_keys = function () {
	writeln("Modifier: " + _META_KEY,"color:magenta");
	return _prop_val_to_list (_GREEK_CHARS);
	}
var _meta_key = function (letter, str) {
	letter = nameToString(letter,"meta-key");
	if(str) str = nameToString(str,"meta-key"); // may ne null
	if(letter.length !== 1) glisp_error(24,letter,"meta-key");
	_GREEK_CHARS[letter] = str;
	return [letter , str] ;
}


/*-------------------------
T E X T parser
string -> list of strings, including separators
-------------------------------*/
var _def_text_regexp = new RegExp("([\'\(\)\.\,\;\!\:\-\?\\\"])","g"); // default

function _make_text_regexp (seps) {
if(! typeof seps === "string") glisp_error(51,seps,"text-parse");
var regexp = "([";
	for(var i=0; i < seps.length ; i++)
		regexp += "\\" + seps.substr(i,1) ;
	regexp += "])" ;
//console.log("REGEXP",regexp);
	return new RegExp(regexp,"g") ;
}

// input string may have \" protections
var _text_parse = function (top , argc) {
	var txt = _stack[top++] ;
	var text_regexp = (argc === 1) ?  _def_text_regexp : _make_text_regexp (_stack[top]) ;
	if(! typeof txt === "string") glisp_error(51,txt,"text-parse");
	txt = txt.replace (text_regexp, " $1 ");
	txt = txt.trim().split(/\s+/);
	return __array_to_list(txt);
}

/*--------------------------
output styling
	styles are found in symbol STYLE plist
	- get style (if any) for a particular object
	- if no : apply defstyle (if any)
--------------------*/
var _STYLE_COLORING = true;
function glisp_style(str,defstyle) { // style("foo"), style( "456678","number")
if(! _STYLE_COLORING) return str;
if(! (typeof str === "string")) return str;
	var style = (defstyle === "number") ? null : _STYLE.plist[str] ;
	if((! style) && defstyle)	 style = _STYLE.plist[defstyle] ;
	if(! style) return str;
	return '_STYLE_' + style + '_SPAN_' + str + '_SPAN_' ;
}

/*-----------------------
HTML greek and other
-----------------------*/
var _GREEK = [ "alpha","beta","gamma","delta","epsilon","zeta","eta","theta","iota",
"kappa","lambda","mu","nu","xi","omicron","pi","rho","sigma","tau",
"upsilon","phi","chi","psi"] ;

function __to_greek(word) { // from greek necessary NYI NYI
if(! glisp.greek) return word;
	if(word === "PI") return "&Pi;"; 
	if(word === "PI/2") return "&Pi;/2"; 
	if(word === "sigma") return "&Sigma;"; 
	if(_GREEK.indexOf(word) >-1) return "&"+word+";" ;
	return word;
} 

/*-------------------------
R E A D E R
 _READER_DICTIONARY (symbol.name -> symbol.name)
-----------------*/
var _INLINE_COMMENTS = true;
var _READER_DICTIONARY = {} ; // for symbs
var _READER_TRANSLATE_ = {} ; // for string|regexp 
var _READER_MACROS_ = {} ; // (pattern) -> (template) for lists
var _READER_INFIX = [] ; // array of infix ops = symbols

var _inline_comments = function (bool) {
	_INLINE_COMMENTS = (bool !== _false) ? true : false ;
	return (bool === _false) ? _false : _true ;
	}

function __reader_get_value(key) {
    if (_READER_DICTIONARY.hasOwnProperty(key)) 
       return _READER_DICTIONARY[key]  || key ;
    return key;
}

function __reader_set_value(key,value) { // internal
	 if( !value )
	  _READER_DICTIONARY[key] = null ;
	  else if(value.indexOf(' ') === -1)
        _READER_DICTIONARY[key] = value ;
    else glisp_error(16,value,"reader-dict") ;
}

// (translate key [value])
var _reader_set_dict_entry = function (key,value) { // (set! key #f) to remove
	key = nameToString(key) ; // NO !!! already translated
	if(! (typeof key === "string"))
		glisp_error(57,key,"reader-dict-set!") ;
	if(value === _false) value = null; 
		else value =  nameToString(value);
	__reader_set_value(key, value);
	return  [key , [value , null]] ;
}
/*
var _reader_get_dict_entry = function (key) { // already translated !!!
	key = 
		(typeof key === "string") ? key : 
		(key instanceof Symbol)?  key.name : glisp_error(57,key,"reader-get-entry") ;
	var value = __reader_get_value(key);
	return  [key , [ "->" , [ value,null]]] ;
}
*/
var _reader_get_dict = function () {
	return _prop_val_to_list(_READER_DICTIONARY) ;
}

var _reader_set_dict = function (list) {
	if( notIsList(list)) glisp_error(20,list,"reader-set-dict!");
	_READER_DICTIONARY = _list_to_prop_val(list);
	return _true ;
}

// replace/g _UNICODE_.... by unicode char(s)
function __unicode_replace(str) {
	var i = str.indexOf("_UNICODE_"); // lg 9
	if(i === -1) return str;
	var u = parseInt(str.slice(i+9,i+13),16) ;
	u = String.fromCodePoint(u) ;
	str = str.replace(str.slice(i,i+13),u);
	return __unicode_replace(str) ;
}

// preprocess strings into strings[] array
//replace n spaces or nl or tab by 1 space 
//remove comments

function glisp_preprocess(line,strings) {
var start,end,str,strid;
var here = false ; // #<< .... >># here text
// here text : asis into string
	while(true) {
			start = line.indexOf("#<<");
			if(start === -1) break;
			end = line.indexOf(">>#",start+3);
			if(end === -1)  glisp_error(39,"at " + start,"read #<< ..>>#"); 
			str = line.slice(start+3,end).trim();
			strid = " STR#" + strings.length + " " ;
			strings.push(str);
			line = line.replace(line.slice(start,end+3),strid);
			}
			

	 line =  line.replace(/\\\"/g,'_DBL_QUOTE_'); // protected \"
// array of strings
	while(true) {
		start = line.indexOf("#'"); //#' ..."abc" ....'#  big string
		if(start !== -1) {
				end = line.indexOf("'#",start+2);
				if(end === -1)  glisp_error(39,"at " + start,"read #' ... '#"); // bad string
			str = line.slice(start+2,end);
			end=end+1;
			}
			
		if(start === -1) {
			start = line.indexOf('"');
			if(start === - 1) break; // no more strings
			end = line.indexOf('"',start+1);
			if(end === -1)  glisp_error(39,"at " + start,"read \"...\""); 
			str = line.slice(start+1,end);
			}
		
		// replace "...." with STR_IDENT
		
		strid = " STR#" + strings.length + " " ;
		str = str.replace(/_DBL_QUOTE_/g,"\"") ;
		str = str.replace(/\\\\/g,"_PROTECT_")
		str = str.replace(/\\n/g,"\n");
		str = str.replace(/\\r/g,"\r");
		str = str.replace(/\\t/g,"\t");
		str = str.replace(/\\u(....)/g,"_UNICODE_$1"); // 4-digits needed if \u inside a string
		str = str.replace(/\\(.)/g,"$1"); 
		str = str.replace(/_PROTECT_/g,"\\")
		str = __unicode_replace(str);
		strings.push(str);
		line = line.replace(line.slice(start,end+1),strid);
	}
	
	// comments out
	 if(line.indexOf("#|") >=0 && line.indexOf("|#") == -1) glisp_error(69,"#| .. |#","reader") ;
	 line = line.replace(/\#\|(.|\n)*?\|\#/g,' ');  
	 line = line.replace(/\;.*\n/g,' ');
	 line = line.replace(/\;.*\r/g,' ');
	 line = line.replace(/\;.*$/,' ');
	 

	 // hack 56*89 -> 56 * 89, 67! -> 67 !
	 if(_READER_PROCS.length) { // NYI NYI
	 line = line.replace(/([0-9])(\*\*)([0-9])/g,"$1 ** $3"); // keep 3/4 as is
	 line = line.replace(/([0-9])([\*\+\-])([0-9])/g,"$1 $2 $3"); // 3*4
	 line = line.replace(/([0-9])([\*\+\-])([0-9])/g,"$1 $2 $3"); // 3*4*5
	 line = line.replace(/([0-9])(\/\/)([0-9])/g,"$1 // $3");
	 line = line.replace(/([0-9])(\!)/g,"$1 ! ");
	 line = line.replace(/\^/g," ^ ");
	 }

return line;
}

var _reader_translate = function (oldstr,newstr) {
	oldstr = nameToString(oldstr,"reader-translate");
	if(newstr !== null) newstr = nameToString(newstr,"reader-translate");
	_READER_TRANSLATE_[oldstr] = newstr ;
	return newstr;
}

function glisp_translate(line) {
	var keys = Object.keys(_READER_TRANSLATE_)  ;
	var key = keys.pop();
	while(key) {
	if (_READER_TRANSLATE_[key]) // no reset to null
		line= line.replace(new RegExp(key,"g"),_READER_TRANSLATE_[key]);
	key = keys.pop();
	}
return line;
}

// returns array of tokens
function glisp_tokenize (line, strings) {
line = glisp_translate(line); // uses _READER_TRANSLATE_
line = glisp_preprocess(line, strings);
    line = line.replace(/ \#\(/g, ' _VECTOR_ ')
    		.replace(/^\#\(/g, ' _VECTOR_ ')
    		.replace(/\(/g, ' ( ')
            .replace(/\)/g, ' ) ')
            .replace(/\[/g, ' ( ')
            .replace(/\]/g, ' ) ')
            .replace(/\{/g, ' { ')
            .replace(/\}/g, ' } ')
            .replace(/\'/g, " ' ") // quote
            .replace(/\`/g, " ` ") // quasiquote
            .replace(/\,\@/g, "_UNQUOTE_SPLICING_") 
            .replace(/\,/g, " , ") 
            .replace(/\@/g, " @ ") // macro-eval
            .replace(/\|\|/g, "_DOUBLE_II_") 
            .replace(/\|/g, " | ") 
            .replace(/_UNQUOTE_SPLICING_/g, " ,@ ") 
            .replace(/_DOUBLE_II_/g, " || ");
    if(_INLINE_COMMENTS)
			line = line.replace(/\s\S+?:\s/g," ") ; // info: style comments
	return  line.trim().split(/\s+/);
   }
   
function __intdigits(s) { // count integer digits (<= 0 is float)
  if(s.indexOf(".") !== -1 ) return 0;
  var intdigits = 0 ;
  var e = s.indexOf("e");
  		if(e > -1) {intdigits = parseInt(s.substring(e+1));  s = s.substring(0,e);}
  	 	return intdigits + s.length  ;
}

// glisp_number --> jsnumber or Q-number a/b or Integer or Complex
// 10e+13 --> new Integer
function glisp_number(token) {
	if(token.slice(-1) === "i") { // replace e+ e- NYI
	var a,b,i ;
	a = parseFloat(token);
	if(token.indexOf("+i") >= 0) return new Complex (a,1);
	if(token.indexOf("-i") >= 0) return new Complex (a,-1);
	if(token.indexOf("+") === 0 || token.indexOf("-") === 0) token = token.substring(1);
	
	token = token.replace(/e\+/g,"PP");
	token = token.replace(/e\-/g,"MM");
	i = Math.max(token.indexOf("+"),token.indexOf("-")) ;
	token = token.replace(/PP/g,"e+");
	token = token.replace(/MM/g,"e-");

	if(i === -1) return new Complex(0,a);
	b= parseFloat(token.substring(i)) ;
//console.log("read.complex",a,b);
	return Cnew (a,b);
	}
	
	var nums = token.split(/\//);
	if(nums.length === 2) {
		var num =  + nums[0]; // check JSInteger NYI
		var den =  + nums[1];
	  		 return Qnew(num,den); // --> integer, or Q-num, or float
		}
	if(Integer.add && __intdigits(token) > 9 ) return new Integer(token);
	return parseFloat(token);
}

// input : a string "#\u...." (up to 4 digits)
// out : a string of 1 unicode char or undefined if bad input
function __unichar_to_string (ustring) {
var charCode ;
	if(ustring === "#\\space") return " ";
	if(ustring === "#\\tab") return "\t";
	if(ustring === "#\\newline") return "\n";
	if(ustring.indexOf("#\\u") === 0 ) {
		charCode  = parseInt (ustring.substring(3),16) ;
		if(isNaN(charCode) ||charCode <= 0 || charCode > 0x0010FFFF) 
			return "👻" ;
			else return String.fromCodePoint(charCode) ;
		}
	return undefined;
}

// token --> atom
// typeof Object = 'number' or 'string'  (literals) or other : identifier
// &i returns glisp.results[i]

function glisp_atom(token,strings) {
var nval, unichar , number , kwd;
	if(token.indexOf("&") === 0) { // &i symbol
		var i = parseInt(token.substring(1));
		if(i >=0 && i < glisp.results.length) 
				// return glisp.results[i];
				 return	[_quote , [glisp.results[i] , null]]  ;
		// return glisp_error(13,token,"read"); // accept &&
		}
		
		if(token === "null") return null;
		
// BEGINNING with #
	if(token.indexOf ("#") === 0) {

// Characters are written using the notation #\character or #\character-name.
//  #\u0404
	unichar = __unichar_to_string(token) ; // is it a \uxxx ?
	if(unichar) return unichar;

	// should check name : space/newline/.. NYI NYI
	//#\A --> string "#\A"
	if(token.indexOf("#\\") === 0)  return token; // DOC NYI NYI NYI
		
	if(token === "#t") return _true;
	if(token === "#f") return _false;
	if(token === "#void") return __void;
	
	kwd = glisp_look_keyword(token);
	if(kwd) return kwd;  // a Symbol
	
	// # alone : error NYI
	// accept "-#" --> "1#-"  NYI
	//#1.e30 --> 1 !! error if ("." NYI
	
	// token.indexOf("#") === 0
				number = token.substring(1);
				nval = parseFloat (number) ; // #1e+10 allowed
				if(isNaN(nval)) glisp_error(81,token,"read") ;
				number = number.replace("_","","g") ; // DOC NYI NYI
				nval = parseFloat(number);
				if(Integer.add) return new Integer(number,10) ;
				return nval;
				
	} // END of #
	
	// special symbols which are numbers-like
	if(token === "1+") return new Symbol(token) ;
	if(token === "1-") return new Symbol( token) ;
	if(token === "+i") return new Complex(0,1); // I Symbol 
	if(token === "-i") return new Complex(0,-1); // -I Symbol NYI

	if(token.indexOf("0x") === 0)
		return  parseInt(token);
		
	nval = parseFloat(token); // check leading digit(s)
	if(!isNaN (nval)) {
				token = token.replace("_","","g"); // accept 100_000_000
				return glisp_number(token) ;
				}
		else if (token.indexOf("STR#") === 0) // good string
				return strings[parseInt(token.slice(4))];
		else   {
				// token = __reader_translate_html(token); /// from greek NYI
				token = __reader_get_value(token); // translate
				
				 if (_SCORE[token])
						_SCORE[token]++;
						else _SCORE[token] = 1; 
		
				return new Symbol(/* name = */ token) ; // or already existing
				}
} // glisp_atom

/*
listify : tokens --> list of lists of.. of atoms
scrambles tokens array
returns null if error
*/

// check balancing ()
// sets error or try to fix
// returns 0 or  error

function glisp_check(tokens) {
var lpars = 0, rpars = 0 , npars;
var	ctokens = tokens.concat() ; // a copy
	while(ctokens.length) {
		var token = ctokens.shift();
	 	if (token === "(" ||  token === "[" || token === "_VECTOR_" ) lpars++;
	 	if (token === ")"  || token === "]") rpars++;
		} // while tokens
	npars = lpars - rpars;
	if(npars === 0) return 0; 
	var error = (lpars === 0) ? 2 : (npars < 0) ? 5 : 4 ;
	glisp_error(error,'','reader'); // abort reading
	
	// autocomplete is default
	// remove at end - work on original 
	if(npars < 0)  // case :  ( )))))
		while(npars++ && tokens[tokens.length - 1] === ')') tokens.pop() ;
	else // ((((( ...) case
		while(npars--) tokens.push(')');
	return glisp.error;
} // glisp_check

var _npars = 0; // for atomize

////////////////
// LISTIFY
//////////////////
// atomize and listify [tokens]
// returns (values ...) list
function glisp_listify (tokens, strings, list) {
      if (list === undefined) { // start
       _npars = 0;
       return glisp_listify (tokens,strings,[_values,null]) ;
       }
       
       var token = tokens.shift();
       var in_ensemble = false;
       
/*-------------------
compile directives
------------------------*/
		if(token === "#:package")  {
				token = tokens.shift();
				if(typeof token !== "string" || token === '' ) glisp_error(23,token,"#:package") ;
				glisp.pack = token;
				token = tokens.shift();
				}
       
// console.log("TOKEN",token);
       if(token === '' )  
       			return (list = __snoc ("",list));
       									
    	if (token === undefined)  { // no more
 // writeln(glisp_tostring(list,'reader --> '),'color:lightblue');
         return  list  ; //  list.pop();
         }
        else if (token === "_VECTOR_") {
         _npars++;
         // list.push (glisp_listify (tokens, []));
         list = __snoc(_list_to_vector(glisp_listify (tokens,strings, null)),list) ;
         list =  glisp_listify(tokens, strings, list);
         return list;
    	} 
    
        else if (token === "(" || token === "{" ) {
        if(token === "{") in_ensemble = true;
         _npars++;
         if(in_ensemble) {
         var aSet = glisp_listify (tokens,strings, null) ;
		 aSet = _make_set(aSet);

         list = __snoc(aSet,list);
         list =  glisp_listify(tokens, strings, list);
         return list ;
         }
         else {
         list = __snoc(glisp_listify (tokens,strings, null),list) ;
         list =  glisp_listify(tokens, strings, list); // multi (expr) input
         return list;
         }
    	} 
      else if (token === ")" || token === "}" ) {
      	_npars--;
        return list;
        }
       else {
        list = __snoc(glisp_atom(token, strings), list);
        list = glisp_listify (tokens, strings,  list);
        return list ;
        }
  }; // listify
  
///////////////////////////////////
// P R I N T I N G
////////////////////////////////
function indent(depth) {
		_line += _NL;
		while(depth--) _line += _TAB;
		}

// global checkers
var _o_strings = 0;  // count
var _o_depth = 0;

// global glisp_tostring options and vars

var _MARK_PRINT = true ;
var _STRING_DELIMITER = '\"' ;
var _MAX_OBJS = 4000;  // global
var _MAX_ITEMS = 2000; // local to list

function glisp_message(obj,header) { // to string w/out quotes and w/0 styles
	var  str_delimiter = _STRING_DELIMITER;
	_STRING_DELIMITER = "";
	_STYLE_COLORING = false;
	var msg = glisp_tostring(obj,header);
	_STYLE_COLORING = true;
	_STRING_DELIMITER = str_delimiter;
	return msg;
}

/*
external callers must always set the header; "" if no header
*/

function glisp_tostring(obj,header) { 
// console.log("TOSTRING",obj); // RAW
	var lstring = [], ostring , is_circular , is_ensemble , is_autoref;
	
	if(typeof header === "string") lstring.push (header);
	if(header === undefined) 
		{ } // inside call
		else _o_strings =  _o_depth  = 0; // init global checker
		
	if(obj === undefined) { lstring.push("undefined") ; return lstring.join(" "); }
	if(obj === null)      { lstring.push ("null"); return lstring.join(" "); } // or '() NYI
	if(obj === __void)    return lstring.join(" ");
	
	if(_o_strings++ === _MAX_OBJS) 
		{ lstring.push(" ... ...") ; return lstring.join(" ");} // limited output
	if(_o_strings > _MAX_OBJS) return '';
	
// strings
// &#...; strings are not quoted
// #\... strings are not quoted
	if(typeof obj === "string") {
			if(obj.indexOf("&#") === 0)  return  obj;
			if(obj.indexOf("#\\") === 0) return obj;
			// if(obj === "") return lstring.join(" ");
			obj = glisp_style (obj, "string");
			lstring.push(_STRING_DELIMITER + obj + _STRING_DELIMITER) ; 
			return lstring.join(" ");
			}
			
// js numbers
	if(typeof obj === "number" && _DECIMALS) {
		obj = obj.toFixed(_DECIMALS) ; // a string
		obj = obj.replace(/0+$/g,'') ; // right trim zeroes
		obj = obj.replace(/\.$/,'') ;
	}
	
// values
	if(isValues(obj)) {
		obj = obj[1];
		while(obj) {
			lstring.push(glisp_tostring(obj[0])) ;
			if(obj[1]) lstring.push("\n")  ;
			obj = obj[1]; }
		return lstring.join(" ");
	}

// Lists
	if(isListNotNull(obj)) {
	var s_obj = obj;
			if(isTruePair(obj)) {
				lstring .push( '(' + glisp_tostring(obj[0]) + ' . ' + glisp_tostring(obj[1])+ ')') ;
				return lstring.join(" ");
				}
				
			if(obj[0] === _quote && obj[1]) {
				lstring .push ("'" + glisp_tostring(obj[1][0])) ; 
				return lstring.join(" ");
			}
			
			if(obj[TAG_GRAPH]) {
				return "♺" + glisp_tostring(obj[0],"") + " :[" + ( __length(obj) -1) + "]" ;
			}
			
			// recurse on (cdr obj)
			var cdrs = 0; // local this level
			
			if(obj[TAG_SET]) 
				lstring.push ('{') ;
				else lstring.push ('(') ;
				
			if(typeof obj[0] === "function") {
				if(obj[TAG_REMEMBER]) lstring.push( "🎩 ") ; 
				if(obj[TAG_CLOSURE]) lstring.push( "🔒 ") ; 
				if(obj[TAG_CLOSING]) lstring.push( "🔑 ") ; 
				if(obj[TAG_COMPOSE]) lstring.push( "⭕️ " ); // functions compose  
				}
			
			
			if(obj[TAG_SYNTAX]) lstring.push( "📝  " ); // syntax expansion
			if(obj[TAG_CIRCULAR]) lstring.push( "🔄 " ); // circular
			if(obj[TAG_BIN_TREE]) lstring.push( "🌱 " ); // binary tree
				else if(obj[TAG_TREE]) lstring.push( "🌴 " ); // tree
			

			is_circular = obj[TAG_CIRCULAR]; // counter here
			is_ensemble = obj[TAG_SET];
			is_autoref = is_circular ? false : isAutoRef(obj); // O(n) ...
			if(is_autoref) _o_depth++ ; // global
			
			while(obj && cdrs <= _MAX_ITEMS) {
			
				if(obj[0] === null && is_ensemble) {
					lstring.push("∅");
					obj= obj[1];
					continue;
					}

				// too long list
				if(cdrs === _MAX_ITEMS) {
					lstring.push ( " 🔹🔹🔹 " + glisp_tostring(_last(obj))) ;
					break;
					}
				// LONG O(n*10) 
				
				if(is_circular && (cdrs > 2*is_circular)) {
								 lstring.push ( ' … ∞) ');
								 return lstring.join(" ");
								 }
				/*
				if(_o_depth > 3) {
								lstring.push( " …🔃 )");
								return lstring.join(" ");
								} 
				*/
								 
				if(_MARK_PRINT)
				if(obj[TAG_MARK] !== undefined) {
					// lstring.push ("✔️ ") ;
					lstring.push (glisp_style(glisp_tostring(obj[TAG_MARK]), "mark")) ;
					}
					
					
				lstring.push (glisp_tostring(obj[0])) ; 
// next in list, and bump  counters
				obj = obj[1] ;
				cdrs++;
				if(_o_depth) _o_depth++ ;
		
// pair
				 if(!isListOrNull(obj)) { // ( x y z . 9) 
				 	lstring.push ( '. ' + glisp_tostring(obj)) ;
				 	break;
				 	}
				 } // while (list)
			// end recurse
			if(is_ensemble) lstring.push ('}') ;
			else lstring.push (')') ;

			//lstring =  lstring.replace(/ \)/g,")"); // regexp space NYI
			//lstring =  lstring.replace(/\) \)/g,"))");
			//lstring =  lstring.replace(/\( \(/g,"((");
			ostring =  lstring.join(" ");
			ostring = ostring.replace(/\) \)/g,"))");
			ostring = ostring.replace(/\( \(/g,"((");
			ostring = ostring.replace(/ \)/g,")");
			ostring = ostring.replace(/\( /g,"(");
			return ostring;
			}	
// Atoms
	if(obj === _lambda)
		lstring.push (glisp_style("#&lambda;")) ;
		else
			if(typeof obj === "function" && obj.glfun) {
			var fname = obj.glfun.name;
			// COMMENTED OUT FOR MAP COMPILE
			if(! _LIB["compile.lib"] ) {
			fname = fname.replace("_xi","");
			fname = fname.replace("_ix","");
			fname = fname.replace(/_x*$/,"");
			fname = fname.replace(/^_/,"");
			}
			
			lstring.push (glisp_style ('#' + fname, "function")) ;
			}
				
		else 
			if(obj instanceof Symbol) {
			ostring = __to_greek(obj.toString()) ;
					if(obj.syntax)
						lstring.push(glisp_style(ostring,"syntax")) ;
					else if (obj.formal)
						lstring.push(glisp_style(ostring,"closure")) ;
					else
						lstring.push(glisp_style(ostring)) ;
					} 
		else 
			if(obj instanceof Integer) lstring.push(glisp_style(obj.toString(),"bigint")) ; 
		else 
			if(obj instanceof Complex) lstring.push(glisp_style(obj.toString(),"complex")) ; 
		else 
			if(obj instanceof Hash) lstring.push(glisp_style(obj.toString(),"hash")) ; 
		else 
			if (obj instanceof RegExp) 
					lstring.push (glisp_style("#regexp:" + obj.toString(),"regexp")) ;
		else
			lstring.push(obj.toString()) ; //  Formal or GLEnv or Vector or Box or ...
		
	ostring =  lstring.join(" ");
	ostring = ostring.replace(/\) \)/g,"))");
	ostring = ostring.replace(/\( \(/g,"((");
	return ostring;
} // glisp_tostring

// input: a form, compiled ot not
// output : HTML string
// NYI
function glisp_toprint(obj,depth) {
	
} // glist_pprint


/////////////////////////////
// R E A D
// return form
//////////////////////
function glisp_read(line) {
	var strings = [];
	var tokens = glisp_tokenize(line,strings) ;

	glisp_check(tokens);
    var form =  glisp_listify(tokens,strings); // (_values .... )
    if(tokens.length) console.log("*** rest:",tokens);

    // intermediate
    glisp_quote(form) ; // chirurgy
	glisp_pair(form);  // dotted pairs
	if(_LIB["match.lib"]) {
			 _reader_apply_macros(form);
			form =  _reader_apply_infix(form) ;
			}
 	return form;
}

/*-------------------
change reader proc
----------------------*/
var _PROMPTS = [];
var _READER_PROCS = [];

function lastOf(anArray) { // should be Array.lastOf NYI
	if(anArray.length === 0) return undefined;
	return anArray[anArray.length-1] ;
}

// (proc list-of-forms) -> new-list-of-forms
// lambda-arity is wrong if optional end params or rest params NYI NYI NYI
var _reader_set_proc = function (proc, prompt) {
	// checkProc(proc,1,1);
	if(!(isProc (proc))) glisp_error(73,proc,"reader-set-proc!") ;
	prompt = nameToString(prompt);
	stdin_prompt(prompt) ;
	_PROMPTS.push(prompt);
	_READER_PROCS.push(proc);
	return _true;
}
var _reader_rem_proc = function (all) {
	if (all) {
			_PROMPTS = []; _READER_PROCS = [];
			}
	_PROMPTS.pop(); 
	_READER_PROCS.pop();
	stdin_prompt(lastOf(_PROMPTS)) ;
// console.log("REMPROC",_READER_PROCS);
}


///////////////////
// R E P
// @line : string
// returns nothing but glisp.error may be set 
//////////////////////

// ; -> <h4> .. ;; -> <h3>  ;;; -> h2
function _html_line(line) {
	if(line.indexOf(";p") === 0) return "<pre>";
	if(line.indexOf(";e") === 0) return "</pre>";
	if(line.indexOf(";;;") === 0) return "<h2>" + line.substring(3)  + "</h2>" ;
	else if(line.indexOf(";;") === 0) return "<h3>" + line.substring(2) + "</h3>" ;
	else if(line.indexOf(";") === 0) {
			line = line.substring(1);
			line=line.replace(/^\((.*? )(.*?)\)/,"<h4 id='$1'>(<b>$1</b><i>$2</i>)");
		    line = line.replace(" '>","'>");
		    line += "</h4>" ;
			}
	return line;
}

// returns nothing but write onto stdout/GPrinter
function glisp_rep(line,batch) { // read/eval/print
	var form, evaluated,outline,defining,asymb;
	if(!GPrinter) GPrinter = new Book('printer');
	
	try {
		glisp.error = _top = _topblock = 0;
		_CONTEXT = null;
		glisp.pack = null ;
// printer echo
		if(batch) GPrinter.write(line,_STYLE.plist["printer-load"]);
		else
		if(_UI.printer_echo) GPrinter.write(line,_STYLE.plist["printer-echo"]) ; 
		
		form = glisp_read(line);
// glisp_trace(form,"","read",true);
		
		if(_READER_PROCS.length) { // input (values form_1 .. form_n) 
				form = __ffuncall([lastOf(_READER_PROCS),[form[1],null]],glisp.user);
				if(form === _false || form === null) form = [_false, null] ;
				if(notIsList(form)) glisp_error(20,form,"reader-proc") ;
				if(form[0] === _false)  _reader_rem_proc(); // pop me
				 form = [_values ,  form ];
				} // output (values form_p ... form_m) or #f
				
		form = glisp_compile(null,form,glisp.user) ;
		defining = isDefineFunction(form[1][0]) ; 
// glisp_trace(form[1][0],defining,"defining") ;
    	evaluated = __eval(form,glisp.user); // returns (values ...)
    	stdout_flush("");
    	if(evaluated[1][0] === __void) return;
 /*
    	if(glisp.running) { // RFU NYI long numbers ops 
    					   writeln("...wait...");
    					   return;
    					  }
*/  					  
    	
    	if(!batch) { // remember &n
    	glisp.results.push(evaluated[1][0]); // (values x y z)
    	asymb = evaluated[1][0];
    	if((asymb instanceof Symbol) && defining) glisp_push_def(asymb,line) ;
    	}
    	
    
    outline = glisp_tostring(evaluated,"");
	GPrinter.write(outline); 
	stdpanel_write(outline); // plotting case
	if(glisp.doc) {
		if(line[0] === ";")
			writeln(_html_line(line));
			else
			writeln("<i>" + line + "</i>&nbsp;&nbsp;&rarr;&nbsp;&nbsp;"  +  outline); 
		}
		
	else if(!batch) { // no doc
	if(glisp.results.length)
		writeln("[" + (glisp.results.length-1) + "]&rarr; " + outline); // [n]-> + result
		else
		writeln(outline);
		}
    } // try
    
    catch (err) {
// clean-up important things
    	_COMPUTING = _PLOTTING =  _MULTI_TASKING = false;
    	_CONTEXT = null;
    	glisp_cursor("plotter","crosshair");
    	glisp.pack = null;
    	evaluated = null;
    	stdout_flush("") ;
    	_reader_rem_proc(true); // remove all if error
    	
// dispatch error
    	if(err instanceof GUserError) {
    		writeln(err.message,_STYLE.plist["error"]);
    		GPrinter.write(err.message,_STYLE.plist["error"]); 
    	}
    	else if(err instanceof GLError) { // (glisp_error ...)
			// return to top level
    	}
    	else if(err instanceof GLInterrupt) 
    		glisp_error(8,err.name,"throw") ; // missing catch()
    	else if(err instanceof GLbreak)
    		writeln("warning: (break ..) outside for.") ;


		else if (_PRODUCTION) {
          if (err instanceof TypeError)  // undef, bad list access, etc..
        	writeln("❗ ; " + err.name + ' : ' + err.message,_STYLE.plist["jserror"]);
        
    	 	else if (err instanceof RangeError) 
        	writeln("❗  " + err.name + ' : ' + err.message,_STYLE.plist["jserror"]);
        	
    		// else stack overflow NYI
    		else {
    		    writeln("❗  " + err.name + ' : ' + err.message + " " + 
    		    	" -JS internal error (please, report it)-",_STYLE.plist["jserror"]);
    			throw err ; // to FireBug
    			}
			} // PRODUCTION
	else throw err ;
    } // catch
   } // Read Eval Print

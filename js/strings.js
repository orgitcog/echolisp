/*---------------------------
GLisp
strings (immutable)
----------------------------*/
function _string(obj) { // universal converter
		if(obj === null)  return "null";
		if(isLambda(obj))
		 return  obj[TAG_LAMBDA_DEF] ? obj[TAG_LAMBDA_DEF].name : "anonymous &lambda;"

		return __str_convert(obj);
}
		
function __str_convert(str) {
if(str === null) return glisp_error(60,str,"string-op");
	if(typeof str === "string") return str;
	if(str instanceof RegExp) return str;
	if(str instanceof Symbol) return str.name;
	if(typeof str === "function") return str.glfun.name ;
	if(typeof str === "number")  return '' + str;
	
	return glisp_message(str,'');
}

function __str_convert_ci (str) {
	return __str_convert(str).toLowerCase();
}

/*------------------
regexp
--> new RegExp  if re = "/blo.../[opt]" 
--> or return simple string
--------------------*/

var _REG_PATTERN = new RegExp ("/(.*)\/([igm]*$)") ;

function __regexp(re, opt) {
opt = opt || "" ;
var re_split,re_body,re_opt ;

	if(re instanceof RegExp) return re ;
	if(! (typeof re === "string")) glisp_error(53,re,"string-regexp");
	
	re_split = _REG_PATTERN.exec(re) ;
	if(! re_split) return re; // simple string
	re_body = re_split[1];
	re_opt = opt || re_split[2] ; // overrides
	
	try {
		re = new RegExp(re_body,re_opt);
	}
	catch (err) { return glisp_error(53,re_body + ' ' + re_opt,"string-regexp"); }
	return re ;
} // __regexp

function isRegExp(re) {
	return (re instanceof RegExp) || re[0] === "/" ;
}

//  input str is "bla...", not "/blabla..../"
function _make_regexp(top , argc ) { 
var str = __str_convert(_stack[top++]);
var opt = (argc > 1) ?__str_convert(_stack[top]) : "" ;
var re ;
	try {
		re = new RegExp(str, opt);
		}
		catch (err) { return glisp_error(53,str + ":" + opt ,"string-regexp"); }
	return re;
}

/*--------------------------
unicode functions
http://apps.timwhitlock.info/emoji/tables/unicode
(unicode->list 0x1F680 0x1F691)
[4]→ ( 🚀 🚁 🚂 🚃 🚄 🚅 🚆 🚇 🚈 🚉 🚊 🚋 🚌 🚍 🚎 🚏 🚐 🚑 )
------------------------------*/

// (unicode->string [ number | (list of numbers) ]) 
// 	unichar = __unichar_to_string(token) ; // is it a "#\uxxx" ?

var _unicode_string = function (n) {
// list of chars
	if(isListNotNull(n)) {
		var ustr = '';
		while(n) {
			ustr += _unicode_string(n[0]);
			n = n[1];
			}
		return ustr;
		}
// single char
	if(typeof n === "number" && n >=0 && n < 32) {
			return _ASCII_NAME[n]; 
			}
	else if (typeof n === "number" && n >= 0 && n <= 0x10FFFF) {
			return String.fromCodePoint(n);
			}
	else if (typeof n === "string") {
			return __unichar_to_string(n) || n ;
		 	}
	else glisp_error(106,n,"unicode") ;
}

/*-----------------------
string functions
--------------------------*/
var _ASCII_NAME = [  // used in explode
"#\\null" ,"#\\?","#\\?" ,"#\\?","#\\?", "#\\?","#\\?" ,"#\\?","#\\?","#\\tab" , // 0-9
"#\\newline" ,"#\\?","#\\?" ,"#\\newline","#\\?", "#\\?","#\\?" ,"#\\?","#\\?","#\\?" , // 10-19
"#\\?" ,"#\\?","#\\?" ,"#\\?","#\\?", "#\\?","#\\?" ,"#\\?","#\\?","#\\?" , //20- 29
"#\\?" ,"#\\?"] ;

// str is a 1-char string
// translate into char-names
// returns a string
function __string_to_char (str) {
	var c = str.charCodeAt(0);
	if(c < 32) return _ASCII_NAME[c]; 
	return str;
}

var _stringp = function(str) {
	return (typeof str === "string") ? _true: _false;
}
var _string_emptyp = function(str) {
	return (str === "")  ? _true: _false;
}

// ECMA6 will be easy :  for (let symbol of string) { ... }
// https://mathiasbynens.be/notes/javascript-unicode
// The first (high) surrogate is a 16-bit code value in the range U+D800 to U+DBFF. 
// The second (low) surrogate is a 16-bit code value in the range U+DC00 to U+DFFF.

var  _string_to_list = function (string) {
  var length = string.length;
  var index = -1;
  var output = [];
  var character;
  var charCode;
  while (++index < length) {
    character = string.charAt(index);
    charCode = character.charCodeAt(0);
    if (charCode < 32) {
    	output.push (_ASCII_NAME[charCode]) 
    	}
    else
    if (charCode >= 0xD800 && charCode <= 0xDBFF) {
      // Note: this doesn’t account for lone high surrogates;
      // you’d need even more code for that!
      output.push(character + string.charAt(++index));
    } else {
      output.push(character);
    }
  }
  return __array_to_list(output);
}


var _string_to_number = function (str) {
	str = __str_convert(str);
	var num = parseFloat(str);
	if(isNaN(num)) return _false ; // glisp_error(103,str,"string->number");
	return num;
}
var _string_to_html = function (str) {
	return __html_spaces ( __str_convert(str));
}

var _symbol_to_string = function(symb) {
	if(typeof symb == "string") return symb;
	if(! (symb instanceof Symbol)) glisp_error(23,symb,"symbol->string"); // NEW
	return symb.name;
}

var _substring = function (top,argc) {
	var str = __str_convert(_stack[top++]);
	var start = _stack[top++] ;
	if(argc === 2) return str.substr(start);
	var end =  _stack[top]   ;
	return str.substr(start,end);
}
var _string_first = function (str) {
	return __str_convert(str).substring(0,1);
}
var _string_rest = function (str) {
	return __str_convert(str).substring(1);
}
var _string_last = function (str) {
	str = __str_convert(str);
	var lg = str.length;
	return str.substring(lg-1,lg) ;
}
var _string_ref = function (str,i) {
	return __str_convert(str).substring(i,i+1);
}
var _string_index = function (substr, str ) {
	var i =  __str_convert(str).indexOf(__str_convert(substr)) ;
	return (i >= 0) ? i : _false;
}
// new ECMA6 functions hasTail, .. NYI
var _string_prefix = function (prefix,str) {
	var i =  __str_convert(str).indexOf(__str_convert(prefix)) ;
	return (i === 0) ? _true: _false;
}
var _string_suffix = function (suffix,str) {
	suffix = __str_convert(suffix);
	str = __str_convert(str);
    return (str.indexOf(suffix, str.length - suffix.length) !== -1) ? _true: _false ;
};


var _string_length = function (str) {
	return __str_convert(str).length;
}
var _string_append = function(top,argc) { // (str-append str ...)
	var str ='';
	for(var i=0;i<argc;i++) str += __str_convert(_stack[top++]) ;
	return str;
}
var _string_join = function(top,argc) { // (str-join list [sep])
	var str = '';
	var list = _stack[top++];
	var sep = (argc === 1) ? " " : _stack[top];
	if(notIsList(list)) return __str_convert(list);
	while(list) {
		str += __str_convert(list[0]);
		if(list[1]) str += sep ;
		list = list[1];
		}
	return str;
}
var _list_to_string = function(list) { // =  (str-join (list))
	var str ='';
	while(list) {
		str += __str_convert(list[0]);
		list = list[1];
		}
	return str;
}

var _string_upcase = function (str) {
return __str_convert(str).toUpperCase();
}
var _string_downcase = function (str) {
return __str_convert(str).toLowerCase();
}
var _string_titlecase = function (str) {
		str =__str_convert(str);
		return str.substring(0,1).toUpperCase() + str.substring(1).toLowerCase();
}
var _string_randcase = function (str) {
		str =__str_convert(str);
		str = str.split(''); // js array
		var ostr ='' ;
		for(var i=0; i< str.length;i++) {
			if(__random() < 0.5) ostr += str[i].toUpperCase();
			else ostr += str[i].toLowerCase();
			}
	 return ostr;
}

var _string_trim = function (str) {
	return __str_convert(str).trim();
}
var _string_trim_left = function (str) {
	return __str_convert(str).replace(/^\s+/gm,'');
}
var _string_trim_right = function (str) {
	return __str_convert(str).replace(/\s+$/gm,'');
}

/*----------------
using regexp
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
---------------------*/
var _string_replace = function (top, argc) {
	var str = __str_convert(_stack[top++]);
	var re = __str_convert(_stack[top++]); // string or /regexp/
	var to = __str_convert(_stack[top++]);
	var opt = (argc === 4) ? __str_convert(_stack[top]) : '' ;
	
	re = __regexp(re, opt);
	return str.replace(re,to);
	}
	
// could use String.prototype.search()
var _string_match = function (top, argc) {
	var str = __str_convert(_stack[top++]);
	var re = __str_convert(_stack[top++]); // string or /regexp/
	var opt = (argc === 3) ? __str_convert(_stack[top]) : '' ;
	
	if (isRegExp(re)) {
		re = __regexp(re,opt);
		return re.test(str) ? _true: _false;
		}
	else return str.indexOf(re) >= 0 ? _true : _false;
	}
	
var _string_split = function (top, argc) {
		var str = __str_convert(_stack[top++]);
		var sep = (argc === 1) ? " " :  __regexp(_stack[top]);
		return __array_to_list(str.split(sep));
	}
 
// -> #f or list of matched substrings
var _regexp_exec = function (re, str) {
		str = __str_convert(str);
		re= __regexp(re);
		if(! re instanceof RegExp) glisp_error(53,str,"regexp-exec") ;
		var ret = re.exec(str) ;
		return  ret === null ? null  : __array_to_list(ret.slice(1));
	}
	
var _regexp_match = function (re, str) {
		str = __str_convert(str);
		re= __regexp(re);
		var ret = str.match(re) ;
		return   __array_to_list(ret);
	}
var _regexp_match_g = function (re, str) {
		str = __str_convert(str);
		re= __regexp(re,"g");
		if(typeof re === "string") re = __regexp ("/" + re + "/" + "g") ;
		var ret = str.match(re) ;
		return   __array_to_list(ret);
	}
	
var _string_remove = function (str , chars) {  // (str, str-of-chars-to-delete)
	str = __str_convert(str);
	chars = chars.split("") ; //  explode
	for(var i=0; i < chars.length; i++)
		str = str.replace(chars[i],'');
	return str;
	}
	
/*---------------
diacritical
-------------------*/
var _string_diacritics = function(str)
{
    var diacritics =[
        /[\300-\306]/g, /[\340-\346]/g,  // A, a
        /[\310-\313]/g, /[\350-\353]/g,  // E, e
        /[\314-\317]/g, /[\354-\357]/g,  // I, i
        /[\322-\330]/g, /[\362-\370]/g,  // O, o
        /[\331-\334]/g, /[\371-\374]/g,  // U, u
        /[\321]/g, /[\361]/g, // N, n
        /[\307]/g, /[\347]/g, // C, c
    ];

    var chars = ['A','a','E','e','I','i','O','o','U','u','N','n','C','c'];
	str = __str_convert(str);
    for (var i = 0; i < diacritics.length; i++) {
        str = str.replace(diacritics[i],chars[i]);
    }
	return str;
}
	
/*-------------------
COMPARE
-----------------------*/

// comparisons
var _string_equal = function (stra, strb) {
	stra = __str_convert(stra);
	strb = __str_convert(strb);
	return (stra === strb) ? _true : _false;
}
var _string_gt = function (stra, strb) {
	stra = __str_convert(stra);
	strb = __str_convert(strb);
	return (stra > strb) ? _true : _false;
}
var _string_ge = function (stra, strb) {
	stra = __str_convert(stra);
	strb = __str_convert(strb);
	return (stra >= strb) ? _true : _false;
}
var _string_lt = function (stra, strb) {
	stra = __str_convert(stra);
	strb = __str_convert(strb);
	return (stra < strb) ? _true : _false;
}
var _string_le = function (stra, strb) {
	stra = __str_convert(stra);
	strb = __str_convert(strb);
	return (stra <= strb) ? _true : _false;
}

var _string_ci_equal = function (stra, strb) {
	stra = __str_convert_ci(stra);
	strb = __str_convert_ci(strb);
	return (stra === strb) ? _true : _false;
}
var _string_ci_gt = function (stra, strb) {
	stra = __str_convert_ci(stra);
	strb = __str_convert_ci(strb);
	return (stra > strb) ? _true : _false;
}
var _string_ci_ge = function (stra, strb) {
	stra = __str_convert_ci(stra);
	strb = __str_convert_ci(strb);
	return (stra >= strb) ? _true : _false;
}
var _string_ci_lt = function (stra, strb) {
	stra = __str_convert_ci(stra);
	strb = __str_convert_ci(strb);
	return (stra < strb) ? _true : _false;
}
var _string_ci_le = function (stra, strb) {
	stra = __str_convert_ci(stra);
	strb = __str_convert_ci(strb);
	return (stra <= strb) ? _true : _false;
}

/*
ascii  implode/explode
*/
var _string_to_unicode = function (str) {
	str = __str_convert(str);
	return __array_to_list (
  		str.split('').map(function (cstr) {return cstr.charCodeAt(0);}) ) ;
}

/*
alpha strings
*/
var _alphabetic_p = function (str) {
	str = __str_convert(str);
    return ( /[^a-zA-Zàáâãäåçèéêëìíîïòóôõöùúûüýÿœ]/.test( str )) ? _false : _true ;
 }




// (string-delimiter str)
function boot_strings() {
		define_sysfun (new Sysfun ('string?',   _stringp,1,1)) ;
		define_sysfun (new Sysfun ('string-empty?',   _string_emptyp,1,1)) ;
		// define_sysfun( new Sysgun ('make-string',_make_string,2,2); // NEW NYI (make-string lg str)
		define_sysfun (new Sysfun ('string',   _string,1,1)) ; // universal converter
		define_sysfun (new Sysfun('symbol->string', _symbol_to_string, 1,1));
		define_sysfun (new Sysfun('string->html', _string_to_html, 1,1));
	 	define_sysfun (new Sysfun('string->number', _string_to_number, 1,1));
	 	define_sysfun (new Sysfun('string->list', _string_to_list, 1,1)); // explode
	 	define_sysfun (new Sysfun('string-read', _read_string, 0,2)); // DEPRECATED
	 	define_sysfun (new Sysfun('string-length', _string_length, 1,1));
	 	define_sysfun (new Sysfun('string-ref', _string_ref, 2,2));
	 	define_sysfun (new Sysfun('string-first', _string_first, 1,1));
	 	define_sysfun (new Sysfun('string-last', _string_last, 1,1));
	 	define_sysfun (new Sysfun('string-rest', _string_rest, 1,1));
	 	define_sysfun (new Sysfun('substring', _substring, 2,3));
	 	define_sysfun (new Sysfun('string-append', _string_append,1,undefined));
	 	define_sysfun (new Sysfun('string-join', _string_join,1,2));
	 	define_sysfun (new Sysfun('list->string', _list_to_string,1,1));
	 	define_sysfun (new Sysfun('string-upcase', _string_upcase, 1,1));
	 	define_sysfun (new Sysfun('string-downcase', _string_downcase, 1,1));
	 	define_sysfun (new Sysfun('string-titlecase', _string_titlecase, 1,1));
	 	define_sysfun (new Sysfun('string-randcase', _string_randcase, 1,1));
	 	define_sysfun (new Sysfun('string-index', _string_index, 2,2)); // (index needle str)
	 	
	 	define_sysfun (new Sysfun('string-pad-left', _string_pad_left, 2,2));
	 	define_sysfun (new Sysfun('string-pad-right', _string_pad_right, 2,2));
	 	define_sysfun (new Sysfun('string-diacritics', _string_diacritics,1,1));
	 	define_sysfun (new Sysfun('string-trim', _string_trim,1,1));
	 	define_sysfun (new Sysfun('string-trim-left', _string_trim_left,1,1));
	 	define_sysfun (new Sysfun('string-trim-right', _string_trim_right,1,1));
	 	
	 	// define_sysfun (new Sysfun('string-trim',_string_trim,1,1)) ;
	 	define_sysfun (new Sysfun('make-regexp',_make_regexp,1,2)) ;
	 	define_sysfun (new Sysfun('regexp-exec',_regexp_exec,2,2)) ; // (re str) -> #f|list
	 	define_sysfun (new Sysfun('regexp-match',_regexp_match,2,2)) ; // (re str) -> #f|list 
	 	define_sysfun (new Sysfun('regexp-match*',_regexp_match_g,2,2)) ; // (re str) -> #f|list
	 	define_sysfun (new Sysfun('string-replace', _string_replace, 3,4));
	 	define_sysfun (new Sysfun('string-remove', _string_remove, 2,2));
	 	define_sysfun (new Sysfun('string-match',_string_match, 2,3));
	 	define_sysfun (new Sysfun('string-split', _string_split, 1,2)); // explode

	 	
	 	define_sysfun (new Sysfun('string-prefix?',_string_prefix, 2,2));
	 	define_sysfun (new Sysfun('string-suffix?',_string_suffix, 2,2)); //  : match.lib RFU
	 	define_sysfun (new Sysfun('string=?', _string_equal, 2,2));
	 	define_sysfun (new Sysfun('string>?', _string_gt, 2,2));
	 	define_sysfun (new Sysfun('string>=?', _string_ge, 2,2));
	 	define_sysfun (new Sysfun('string<?', _string_lt, 2,2));
	 	define_sysfun (new Sysfun('string<=?', _string_le, 2,2));
	 	
	 	define_sysfun (new Sysfun('string-ci=?', _string_ci_equal, 2,2));
	 	define_sysfun (new Sysfun('string-ci>?', _string_ci_gt, 2,2));
	 	define_sysfun (new Sysfun('string-ci>=?', _string_ci_ge, 2,2));
	 	define_sysfun (new Sysfun('string-ci<?', _string_ci_lt, 2,2));
	 	define_sysfun (new Sysfun('string-ci<=?', _string_ci_le, 2,2));
	 	
	 	define_sysfun (new Sysfun('unicode->string', _unicode_string,1,1)); // -> "unicode char(s)"	
	 	define_sysfun (new Sysfun('string->unicode', _string_to_unicode,1,1)); // -> explode	
	 	
	 	define_sysfun (new Sysfun('string-alphabetic?', _alphabetic_p,1,1));
	 	//define_sysfun (new Sysfun('string-alphanumeric?', _alphanumeric_p,1,1));
	 	//define_sysfun (new Sysfun('string-numeric?', _numeric_p,1,1));
	 		
	 	
}
/*
GLisp

	I/O functions
*/


/*
FileSaver.js
Copyright © 2014 Eli Grey.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/



// __tab_line
// replaces "\t" by 'tab' white spaces

function __tab_line(line,tab) {
tab = tab || 8 ;
	var i,words,word;
	var words = line.split("\t");
	if(words.length === 1) return line;
	for (i=0;i<words.length-1;i++) {
		word = words[i];
		while(word.length % tab !== 0) word += " ";
		word = word.replace(/\ /g,"&nbsp;");
		words[i] = word ;
		}
	return words.join("&nbsp;");
	}
	
function __html_spaces (line) {
	return line.replace(/\ /g,"&nbsp;");
}

/*----------------
info field
----------------------*/
function info(txt) {
document.getElementById("info").innerHTML = txt;
}

// from user
var _info_text = function (top,argc) {
_INFO_LOCK = true ;
	var html = nameToString(_stack[top++],"info-text");
	var color = (argc === 1) ? "black" : nameToString(_stack[top],"info-text");
	document.getElementById("info").style.color = color ;
	info(html);
	return __void;
}

/*----------------------
printer & tty echo on/off
------------------------*/
var _printer_writeln = function(top,argc) { // no (yet) printer buffering
var outline ='' ;
	for(var i=0;i<argc;i++) 
			outline += glisp_tostring(_stack[top+i],'') + _TAB ;
	GPrinter.write(outline);
	return __void;
}

var _printer_clear = function () {
	GPrinter.clear();
	return __void;
}

var _printer_page = function (top,argc) {
var title = (argc === 0)  ? undefined :  '' + _stack[top] ;
	GPrinter.newpage(title);
	return __void;
}

var _printer_font = function (top,argc) {
	if(argc === 0) return GPrinter.font();
	var font = nameToString(_stack[top]);
	GPrinter.font(font);
	return font;
}

var _printer_echo = function (what) {
	if(what === _false) _UI.printer_echo =false;
	else _UI.printer_echo = true;
return _UI.printer_echo ? _true : _false; 
}
var _tty_echo = function (what) {
	if(what === _false) _UI.tty_echo = false;
	else _UI.tty_echo = true;
return _UI.tty_echo ? _true : _false; 
}

// doc mode
var _doc = function (what) {
	glisp.doc = (what === _true) ? true: false ;
	return what;
}

var _read_from_string = function (str) {
	if(typeof str !== "string") glisp_error(51,str,"read-from-string");
	var form = glisp_read(str);
	return form? form[1][0] : false ;
}

// (read [default [prompt]])
// returns atom 
var _read = function (top, argc) {
	var strdef = (argc > 0) ?   _string(_stack[top++]) : "0" ;
	var strprompt = (argc > 1) ?_string(_stack[top]) : "EchoLisp:read" ;

	var line = prompt(strprompt,strdef) ;  
	var form = (line === null) ? false : glisp_read(line) ;
	return form? form[1][0] : _false; // skip (values ..)
}
var _read_list = function (top, argc) {
	var strdef = (argc > 0) ?    _string(_stack[top++]) : "1 2 3" ;
	var strprompt = (argc > 1) ? _string(_stack[top]) : "EchoLisp:read-list" ;

	var line = prompt(strprompt,strdef) ;  
	var form = (line === null) ? false : glisp_read(line.replace(","," ","g")) ;
	return form? form[1] : _false; // skip (values ..)
}
var _read_string = function (top, argc) {
	var strdef = (argc > 0) ?   _string(_stack[top++]) : "elvis" ;
	var strprompt = (argc > 1) ? _string(_stack[top]) : "EchoLisp:read-string" ;
	
	var line = prompt(strprompt,strdef) ;  
	return (line) ? line : _false ;
}
var _read_number = function (top, argc) {
	var strdef =    (argc > 0) ?    _string(_stack[top++]) : "42" ;
	var strprompt = (argc > 1) ?    _string(_stack[top]) : "EchoLisp:read-number" ;
	var num = "";
	
	while(true) {
	var line = prompt(strprompt,strdef) ;  
	if( ! line) return 0;
	num = glisp_read(line)[1][0];
	if(_numberp (num) === _true) return num;
	}
}

var _alert = function (str) {
	str = nameToString(str,"alert");
	alert(str);
	return __void;
}

var _confirm = function (str) {
	str = nameToString(str,"alert");
	return confirm(str) ? _true : _false;
}

/////////////////////////
// INPUT OUTPUT
/////////////////////////////
var _newline = function () {
	stdout_flush('');
	return __void;
}


var _string_delimiter = function (top,argc) {
	if(argc === 0) return _STRING_DELIMITER ;
	_STRING_DELIMITER = nameToString(_stack[top]);
	// if(delim.lengtht === 1) delim = "\\" + delim ; // protect ?? NYI
	return _STRING_DELIMITER ;
}

var _writeln = function(top,argc) { // (writeln) -> flush
var outline ='' ;
	for(var i=0;i<argc;i++) 
			outline += glisp_tostring(_stack[top+i],'') + _TAB ;
	stdout_flush(outline); // and GPrinter
	return __void;
}

var _write = function(top,argc) { // accumulates
	for(var i=0;i<argc;i++) stdout_cat (glisp_tostring(_stack[top+i],'')) ;
	return __void;
}

var _display = function(top,argc) { 
//console.log("_write",top,argc,_stack[top],_stack[top+1]);
	var obj = _stack[top++];
	var style = (argc === 2) ? nameToString (_stack[top]) : undefined ;
	var outline = glisp_message(obj,'') ;
	writeln(outline,style);
	GPrinter.write(outline); 
	return __void;
}

// directives : %[szx[.szy]]D|v|...
// returnds [op, szx  | 0 ,szy | -1 = default ,length]

function fmt_directive (fmt) {
	var re = /^.([0-9]+)\.([0-9]+)(.)/ ;
	var an = re.exec(fmt) ;
	if(an) return [an[3], an[1],an[2], an[0].length] ;
	re = /^.\.([0-9]+)(.)/ ;
	an = re.exec(fmt) ;
	if(an) return [an[2],"0",an[1],an[0].length];
	re = /^.([0-9]+)(.)/ ;
	an = re.exec(fmt);
	if(an) return [an[2],an[1],"-1",an[0].length];
	return [fmt.substring(1,2) ,"0","-1",2] ;
}

var _format = function(top, argc) { // output : string (spaces = &nbsp;)
	var str =  [ "a","A","s","S","v","V" ];
	var dec =  [ "d","D" ];
	var int =  [ "i","I" ]; // int - do decimal
	var nl =   [ "n"  ];
	var hexa = [ "x", "X" ];
	var tab =  [ "t", "T"]; // %32t is OK
	var nop =  ["~" ,"%"];
	
	var fmt = _stack[top++]; 
	var strings= [] ; // to join
	var next, altnext , direct;
	var op , szx , szy ,tab_length = 0 ;
	var stop = top + argc  ;
	var toFormat, _S_DECIMALS = _DECIMALS;
	if(typeof fmt !== "string") return glisp_error(41,fmt,"format");
	
		while(fmt.length && top < stop) {
			next = fmt.indexOf("~");
			altnext = fmt.indexOf("%");
			if(next === -1) next = altnext ;
			else  if (altnext >= 0) next = Math.min(next,altnext) ;
			if(next === -1) {strings.push(fmt); break;}
			strings.push(fmt.substring(0,next));
			
			fmt = fmt.substring(next); // fmt-> %xxD here
//console.log("fmt>",fmt);
			direct = fmt_directive(fmt) ;  // -> [op,szx,szy,dlg]
			op = direct[0]; 
			szx = parseInt(direct[1]); // or 0
			szy = parseInt(direct[2]); 
			
			fmt = fmt.substring(direct[3]); // 2 for %V, 4 for %45D
			
//console.log("> op",op,"szx",szx,"szy",szy,"fmt",fmt);
			
		if(nop.indexOf(op) >= 0) // %%
			strings.push(op) ;
		else if (nl.indexOf(op) >= 0)
			strings.push("\n") ; // format to stdout
		else if (tab.indexOf(op) >= 0) {
			tab_length = szx || tab_length ; // lasts wins
			strings.push("\t") ; // format to tab_line
			}
		else if(hexa.indexOf(op)>=0) { 
			toFormat = _stack[top++] ;
			toFormat = __number_to_string(toFormat,16) ;
			if(szx) toFormat = __html_spaces (_string_pad_right(toFormat,szx));
			strings.push(toFormat); // no chek here NYI
			}
		else {
				toFormat = _stack[top++] ;
				if(szy === 0 && typeof toFormat === "number") toFormat = Math.round(toFormat);
				if(szy > 0) _DECIMALS = szy;
			if(str.indexOf(op) >= 0) 
				toFormat = glisp_message(toFormat); // no colors, nor "
			else if(dec.indexOf(op)>=0)  
				toFormat = glisp_message(toFormat);
			else {
				glisp_error(10,op,"format"); // warning
				toFormat = glisp_message(toFormat);
				 }
			 if(szx) toFormat = __html_spaces (_string_pad_right(toFormat,szx));
			 	_DECIMALS = _S_DECIMALS ;
			 	strings.push(toFormat);
			 } // obj to format
		} // while
	return __tab_line(strings.join(""),tab_length || 16);
}

var _printf = function(top, argc) {
var outline,delim = _STRING_DELIMITER ;
	_STRING_DELIMITER = "";
	var outline = _format(top, argc) ;
	_STRING_DELIMITER = delim;
	writeln(outline);
	GPrinter.write(outline);
	return __void;
}

var _decimals = function (top,argc) {
	if(argc === 0) return _DECIMALS;
	_DECIMALS = Math.floor (0 + _stack[top]);
	if(_DECIMALS < 0 || _DECIMALS > 18) _DECIMALS = 0 ;
	return _DECIMALS ;
}

function __number_to_string  (n,b) {
	if( b > 36) glisp_error(24,b,"number->string (base <= 36)");
//var header =
//	(b === 10) ? '' : (b === 16) ? '0x' : '|'+b+'|' ;
	if(typeof n === "number") return n.toString(b);
	if(n instanceof Integer)  return n.toString(b);
	if(isRational(n)) return  rationalToString(n,b);
	// complex NYI
	return glisp_tostring(n,'');
}

function __number_to_length  (n,b) {
	if( b > 36) glisp_error(24,b,"number-length (base <= 36)");
	if(typeof n === "number") return Math.floor(n).toString(b).length ;
	if(n instanceof Integer)  return Integer.digits(n,b);
	if(n instanceof Rational) return __number_to_length(n.a / n.b);
	return 0;
}

var _number_to_string = function (top, argc) {
var n = _stack[top++];
var b = (argc > 1) ? _stack[top] : 10 ;
	return __number_to_string(n,b);
}
var _number_to_length = function (top, argc) {
var n = _stack[top++];
var b = (argc > 1) ? _stack[top] : 10 ;
	return __number_to_length(n,b);
}


var _string_pad_right = function (obj , length) {
	var str =  glisp_message(obj,''); // will include span directive if styled ....
	while(str.length < length) {str += ' ';}
	return str;
}
var _string_pad_left = function (obj , length) {
	var str =  glisp_message(obj,'');
	while(str.length< length) {str = ' ' + str;}
	return str;
}

var _html_print = function (html) {
	if(typeof html !== "string") glisp_error(xx,html,"html-print") ;
	stdout.innerHTML = html;
	GPrinter.writeHTML(html) ;
	return __void;
}

/*-------------------
Need a permanent counter for objects id
Use if in gensym 
---------------------------*/
function __new_id() { // unique
	var id = localStorage.getItem("ECHO_ID") || 0;
	localStorage.setItem("ECHO_ID", ++id);
	return id;
	}


/*-------------------------
 jsonify :
 NYI : shared lists will not be shared ....
 NYI : circular lists
 DONE : saving references in structs fields
 circular : https://github.com/douglascrockford/JSON-js/blob/master/cycle.js
---------*/
function MetaStruct(name) {this.name = name; } // OVERRIDDEN BY LIB
function Struct(meta) {this.meta = meta; } // OVERRIDDEN BY LIB
function Table(meta) {this.meta = meta; } // OVERRIDDEN BY LIB
function Procrastinator(init) {this.p_init = this.p_state = _false;} // OVERRIDEN BY LIB

/*
JSObject class - need to encapsulate raw javascript objects
USED BY json.lib
*/
function JSObject ( obj) {
	this.obj = obj ;
}
JSObject.prototype.toString = function () {
	return "#[jsObject]" ;
	}
	
// from a glisp list  to js object
function __lisp_pair_to_json_object (pair)
 {
    var array = [__lisp_to_json (pair[0] , "pair->json"),__lisp_to_json (pair[1] , "pair->json")] ;
 	return { _instanceof : "Pair" , array : array } ;
 }
 
 // poor man's circular ref
function __lisp_list_to_json_object (lst)
 {
 var self = lst ;
 	var isSet = lst[TAG_SET] ? true : false;
 	var isTree = lst[TAG_TREE] ? true : false;
 	var isBinTree = lst[TAG_BIN_TREE] ? true : false;
 	var array=[] ;
 	while(lst) {
// 			if (isAutoRef(lst[0])) glisp_error(1,"too much recursion","list->json");
 			array.push(__lisp_to_json (lst[0] , "list->json"));
 			lst = lst[1];
 			if(lst === self) break; // circular
 			}
 	return isSet ? { _instanceof : "Set" , array : array }  :
 		   isBinTree ? { _instanceof : "BinTree" , array : array }  :
 		   isTree ? { _instanceof : "Tree" , array : array }  :
 		   { _instanceof : "List" , array : array ,  circular : (self === lst) } ;
 }
 
 function __lisp_array_to_json_array (array)
 {
 	var clone = array.slice(0), i; // cloning mandatory : scrambles array
 	for(i=0; i<clone.length;i++) clone[i] = __lisp_to_json(array[i],"lisp:array->json") ;
 	return clone;
 }
 
 function __json_array_to_lisp_array (array)
 {
 	// var clone = array.slice(0), i;
 	var clone = array; // no need to clone: comes from json - may be scambled
 	for(i=0; i<clone.length;i++) clone[i] = __json_to_lisp(array[i],"json:array->lisp") ;
 	return clone;
 }
 
 // json array to list (ordered)
 // LOOOOOOOOONG NYI NYI
function __json_array_to_list (anArray, idx) { // at depth === 0
		if(idx === undefined) idx = 0;
		if(idx >= anArray.length) return null;
		return [
			 __json_to_lisp(anArray[idx],"json->list") ,
			  __json_array_to_list(anArray,idx+1)] ;
	} 
function __json_array_to_pair (anArray) {
	return  [__json_to_lisp(anArray[0],"json->list") , __json_to_lisp(anArray[1],"json->list")] ;
}
 
// convert echolisp simple objects to json data types
// we need this for (json-put JSObject key val)
// plists need a special converter = JSObject-new

function __lisp_to_json (obj , sender , _instanceof) {
// console.log("LISP->JSON", obj, sender) ;
// standard JSON
	if(obj === undefined) glisp_error(90,sender,"lisp->json");
	if((typeof obj === "number") ||(typeof obj === "string")) return obj;
	if (obj === _true ) return  true;
	if (obj === _false ) return false;
	if (obj === null ) return null; // ???
	if(obj instanceof Vector) return __lisp_array_to_json_array(obj.vector); 
	if(obj instanceof JSObject) return obj.obj;
	
// special EchoLisp
	// obj is [ name , def] (strings)
	
// general EchoLisp
	if(isTruePair(obj)) return __lisp_pair_to_json_object (obj); 
	if(Array.isArray(obj)) return __lisp_list_to_json_object (obj); // list or set
	if(obj instanceof Definition)  
			return    {_instanceof : "Definition" , name:obj.name, def : obj.def};
	if(obj instanceof Date)  return    {_instanceof : "Date" , date : obj.toJSON()};
	if(obj instanceof Rational) return { _instanceof : "Rational" , a : obj.a , b : obj.b } ;
	if(obj instanceof Complex) return  { _instanceof : "Complex" , a : obj.a , b : obj.b } ;
	if(obj instanceof Integer)    return   { _instanceof : "Integer" , bigint : obj.bigint} ;
	if(obj instanceof Symbol) return   { _instanceof  : "Symbol" , name : obj.name } ;
	if(obj instanceof MetaStruct)	  return   obj.jsonify(); // obj makes the job
	if(obj instanceof Struct)		  return   obj.jsonify();
	if(obj instanceof Table)		  return   obj.jsonify();
	if(typeof obj === "function") 	return   { _instanceof  : "Function" , name : obj.glfun.name } ;

	glisp_error(89,obj, sender || "lisp->json"); // cannot translate
}



// convert json raw data  and typed (List,..) objects to echolisp objects 
// needed for json-get

function __json_to_lisp  ( obj , sender)  { 
var _instanceof ;
var aset,atree,alist ;
// standard JSON
	if(obj === undefined) glisp_error(90,sender,"json->lisp");
	if(typeof obj === "number" || typeof obj === "string") return obj;
	if (obj === true ) return _true;
	if (obj === false ) return _false;
	if (obj === null ) return null; // ???
	if(Array.isArray(obj)) return new Vector(__json_array_to_lisp_array(obj)); // need to translate
// special EchoLisp
	if(obj instanceof Date) return obj;
	if(obj instanceof Object) {
				_instanceof = obj._instanceof;
				if(_instanceof === undefined) return new JSObject(obj) ;

				switch (_instanceof) {
					case "Definition" : return new Definition (obj.name,obj.def);
				    case "Pair" :  return __json_array_to_pair (obj.array) ;
					case "Rational" : return Qnew (obj.a,obj.b);
					case "Complex" : return new Complex (obj.a,obj.b);
					case "Integer" : return new Integer (obj.bigint);
					case "Symbol" : return new Symbol (obj.name);
					case "List" :  {
									alist =  __json_array_to_list (obj.array) ;
									if(obj.circular) __make_circular(alist) ;
									return alist;
									}
					case "Set" :  { aset = __json_array_to_list (obj.array) ;
								   aset[TAG_SET]= true;
								   return aset;
								  } // set tag
					case "Tree" :  { atree = __json_array_to_list (obj.array) ;
								   atree[TAG_TREE]= true;
								   return atree;
								  } //
					case "BinTree" :  { atree = __json_array_to_list (obj.array) ;
								   atree[TAG_BIN_TREE]= [0,0]; // not yet computed
								   return atree;
								  } //
					case "Date" : return new Date (obj.date);
					case "MetaStruct" : return MetaStruct.unjsonify(obj) ;
					case "Struct" : return Struct.unjsonify(obj);
					case "Table" : return Table.unjsonify(obj);
					case "Function" : return glisp_look_sysfun(obj.name)
					default : glisp_error(89,_instanceof,"json->lisp:object");
					}
				}
	glisp_error(89,obj,sender || "json->lisp");
	}
	
function glisp_jsonify(obj, _instanceof /* undef or special ttype: Definition .. */) {
	return __lisp_to_json(obj,"save-obj",_instanceof);
	}
	
// unjsonify (obj)
// chirurgy
function glisp_unjsonify(obj) {
	return __json_to_lisp(obj, "restore-obj") ;
	}
	

/*--------------
saving objects
--------------------*/
function nameToString(obj,sender) { // anything possible --> string
	if(typeof obj === "string") return obj;
	if(obj instanceof Symbol) return obj.name;
	if(typeof obj === "function") return obj.glfun.name ;
	
	glisp_error(54,obj, (sender) ? sender : "name->string");
}
var toNameString = nameToString ; // OLD compat



/*---------------------
((key value) ...)
depth = 0 
---------------------*/

// could use Object.keys && isEnumerable = not function
// input a JS OBJECT {[key] = lisp-type}  (plist, env.alist,  reader-dictionary,etc..)
// used to get symbol.plist in list form
// returns list

var _prop_val_to_list = function (obj) { 
var lst = [] , val;
	function pvsort(a,b) {return (a[0] < b[0]) ? -1 : (a[0] > b[0]) ? 1 : 0 ; }
	for(var key in obj)
		 if (obj.hasOwnProperty(key)) {
		 	val = obj[key];
		 	lst.push([key , [ val , null]]) ;
		 	}
	lst.sort(pvsort);
	return __array_to_list(lst);
}

function __prop_to_keys  (obj) { 
var lst = [] ;
	for(var key in obj)
		 if (obj.hasOwnProperty(key)) lst.push(key);
	lst.sort();
	return __array_to_list(lst);
}

// stringifies values by default
// list ((key value) (key value))  to JSOBJECT[key] = lisp-type
// used to set symbol.plist in jsobject form
// returns { object } 

var _list_to_prop_val = function(list , nostring)  {
var obj = {} , entry ;
	while(list) { 
		entry = list[0];
		if( notIsList(entry)) glisp_error(20,entry,"property-list");
		if(nostring) 
				obj[entry[0]] =  entry[1][0] ;
				else
				obj[entry[0]] = '' + entry[1][0] ;
		list = list[1];
		}
	return obj;
}


/*----------------------
saving reader dictionnary
-----------------------*/
var _save_reader_dict = function (fname) {
var value;
	fname = nameToString(fname);
	// no need of lisp->json, so, call __local_put
	__local_put(fname,_READER_DICTIONARY,"reader");
	return fname;
}

/*--------------------------
restore reader dict
---------------------*/
var _load_reader_dict = function (fname) {
var dico ;
	fname = nameToString(fname);
	_READER_DICTIONARY  = { };
	dico = __local_get(fname,"reader");
	if(!dico)  glisp_error(36,fname,"reader:load-dictionary") ; // unknown symb
	_READER_DICTIONARY  = dico ;
	return _prop_val_to_list (_READER_DICTIONARY);
}

/*------------------------------------
Definitions
----------------------------------*/
function Definition (name,def) {
	this.name = name; // qualified by save
	this.def = def; // string
}

Definition.prototype.toString = function () {
	var def = this.def;
	if(def === null) return this.name + " : " + 'undefined' ;
	var cut = def.indexOf("\n");
	var abbrev = (cut === -1) ? def : def.substring(0,cut) + " [...])" ;
	return  this.name + " : " + abbrev;
}

/*------------------------------
 save definition
 (save 'key)
 save new or modified defs : (no package) or defs in same pack
 save format is [[name define-string] [name define-string] ....]

 SAVE only in pack : skey or pack = null 
 do not save undef or bound to null (_undefined) NYI
----------------------------------*/

///////////////
// find a def from a symbol
// returns null of a Definition instance
// Definition.name is full qualified name
//////////////////
function glisp_find_def(name) {
	name = nameToString(name,"find-def");
	var defs = glisp.defs ;
	for(var i= 0; i < defs.length; i++)
		if(defs[i].name === name) return  defs[i] ;
	for(var i= 0; i < defs.length; i++)
		if(simpleName(defs[i].name) === name) return defs[i];
return null ;
}

///////////////
// push_def: remember definitions 
// defs := jsarray of Definitions
////////////////
function glisp_push_def(symb, line) { // line may be === null : (undefine 'foo)
	var aDefinition  = glisp_find_def (symb);
	if(aDefinition)  // override or clear
			aDefinition.def = line;
		else if(line) {
				aDefinition = new Definition (symb.name,line) ;
				glisp.defs.push( aDefinition) ;
				}
			else return;
	
	console.log ("Push def:", aDefinition.toString()) ;
	// auto save
	if(symb.name === "preferences")  _local_put_proc(symb);
}

/*--------------------
preferences auto-load
-----------------*/
function glisp_preferences() { 
	var prefs = _local_get_proc ("preferences"); // __compile_db_def
	if(prefs === null) return;
	__funcall([prefs, null],glisp.user);
	if(glisp.error === 0) stdin.value = "" ;
}

///////////////////
// compile a db definition
// above existings defs
////////////////////////

// aDefinition = { name , def } strings
// returns _false or symb
function __compile_db_definition (aDefinition , packname) {
var symb;
	if(! (aDefinition instanceof Definition)) glisp_error(1,aDefinition,"compile-definition");
	if(aDefinition.def === null) return _false ;
	symb = new Symbol(aDefinition.name);
	glisp_rep(aDefinition.def,true);  // read-eval-print - echo to stdin
	/* if(glisp.error === 0) */
	glisp_push_def(symb,aDefinition.def); // replace or append	
	return symb;
	}

var _definitions = function(env) { // show the Definitions'a array , as is 
env = env || glisp.user;
	var defs = glisp.defs;
	var line,name,symb,def;
	for(var i = 0; i < defs.length; i++) {
		name = defs[i].name ;
		/* CHECK NYI
		symb = glisp_look_symbol(name) ;
		if(symb === null) continue;
		*/
		def = defs[i].def  ; 
		// if(!def) continue; // undefined : show it
		writeln(defs[i].toString() , _STYLE.plist["store"]);
		line = name  + " : " + def ; // NO abbrev
	}
	return glisp.defs.length;
} // definitions



////////////////
// EDITING
//////////////////
var _edit = function (symb, env) {
		if(! isSymbol(symb)) return glisp_error(35,symb,"edit") ;
		var aDefinition = glisp_find_def(symb);
		if( aDefinition === null ) return glisp_error (36,symb,"edit");
		var line = aDefinition.def ;
		// set_stdin(__cell_stdin(__cell_open(line)));
		var newcell = __cell_open(line);
		setTimeout(function() {set_stdin(__cell_stdin(newcell));},10) ;
		return symb;
}

///////////////////////
// STDIN/OUT functions
/////////////////////
var _style = function (top, argc)
	{
	if(argc === 0) return _symbol_plist(_STYLE) ;
	var obj = _stack[top++] ;
	var name = nameToString(obj);
	if(argc === 1) return _STYLE.plist[name] || _false ;
	var style = nameToString(_stack[top]) ;
	if(style.indexOf(":") === -1) glisp_error(78,style,"style");
	_STYLE.plist[name] = style ;
	return obj;
	}
	
// deprecated 
var _tty_lines = function (top,argc) {
	return 0 ;
}

// NYI 
var _stdout_lines = function(nlines) { 
	sysout.maxlines =  nlines ;
	}
	

var _plot_size = function (top, argc) {
	var width, height ;
	if(argc === 0) return  [GPlotter.canvas.width,GPlotter.canvas.height] ;
	width =  _stack[top++] ; // wanted value
	if(! (typeof width === "number")) glisp_error(22,width,"plot-size");
	height = (argc > 1) ? _stack[top] : width ;
	if(! (typeof height === "number")) glisp_error(22,height,"plot-size");
	
	width = Math.min(2000,(Math.max(200,width)));
	height = Math.min(2000,(Math.max(200,height)));
	
	GPlotter.canvas.width= width;
    GPlotter.canvas.height=height;
	
	var graph = __cell_graph(GPlotter.cell);
/*
console.log("graph",graph);
	var gwidth =  parseInt(window.getComputedStyle(graph).width);
	var gheight = parseInt(window.getComputedStyle(graph).height);
console.log(">>rsize",gwidth,gheight);
*/
	graph.style.height =  Math.max(360,height) + 'px' ; // sliders
	graph.style.width =  (width + 160) + 'px' ;
console.log("<<rsize",graph.style.width,graph.style.height);
	return  [GPlotter.canvas.width,GPlotter.canvas.height] ;
}

	
var _stdout_color = function (color) {
	color = nameToString(color);
	stdout.style.color = color;
	return __void;
}

var _stdout_background = function (color) {
	color = nameToString(color);
	stdout.style.backgroundColor = color;
	return __void;
}

var _stdout_font_size = function (top,argc) {
	var size ; 
	if(argc === 0) return window.getComputedStyle(stdout).fontSize ;
	size = _stack[top];
	stdout.style.fontSize = '' + size + 'px' ;
	return size ;
}

var _stdout_font = function (top,argc) {
	if(argc === 0) return window.getComputedStyle(stdout).fontFamily ;
	var font = nameToString(_stack[top]);
	stdout.style.fontFamily  = font ;
	return font;
}

var _stdin_color = function (color) {
	color = nameToString(color);
	stdin.style.color = color;
	return __void;
}

var _stdin_background = function (color) {
	color = nameToString(color);
	stdin.style.backgroundColor = color;
	return __void;
}

var _stdin_font_size = function (top,argc) {
	var size ; 
	if(argc === 0) return window.getComputedStyle(stdin).fontSize ;
	size = _stack[top];
	stdin.style.fontSize = '' + size + 'px' ;
	return size ;
}

var _stdin_font = function (top,argc) {
	if(argc === 0) return window.getComputedStyle(stdin).fontFamily ;
	var font = nameToString(_stack[top]);
	stdin.style.fontFamily  = font ;
	return font;
}


// 0 to inhibit
var _stdin_autocomplete_delay = function (top, argc) {
	var msec =  (argc === 1) ? _stack[top] : glisp.autocomplete ;
	if(! typeof msec === "number" || msec < 0 || msec > 1000)
			 glisp_error(24,msec,"delay(msec)");  // bad range
	glisp.autocomplete = msec ;
	return glisp.autocomplete ;
}

// FFox : 0 Chrome-Safari 2
var _autocomplete_top = function ( dh) {
	hiliter.style.top = dh + "px" ;
	return __void ;
}

/*-----------------------------
HOME
------------------------------*/
function __io_get_home() { //-> empty string of *home*
	var home = glisp.user.get("*home*");
	if(home && (typeof home === "string")) return home;
	return "";
}

/*------------------------------
FILES
https://developer.mozilla.org/en-US/docs/Using_files_from_web_applications
if _FILE_TO_STRING : calls onsuccess proc, else read/eval/print
-------------------------------*/
var _FILE_TO_STRING = null;

function fileSelect() { // click "Load"
	var infiles = document.getElementById("FILES");
	infiles.click(); // -> handleFiles()
	return _true;
	} 
	
function handleFiles () { // from browser file select control
var infiles = document.getElementById("FILES");
_reader_rem_proc(true); // standard reader
		var files = infiles.files; 
		if (! files) return false;
		var file = files[0];
		if (! file) return false;
		
		var readAbort = function () { 
			_FILE_TO_STRING = null;
			writeln ("Cannot read : " + file.name, _STYLE.plist["warning"]);
			} ;
		
		var reader = new FileReader();
		reader.onabort = readAbort;
		reader.onerror = readAbort;
		reader.onload = function(e) { // ON LOAD event

			if(_FILE_TO_STRING === "worksheet") {
				__worksheet_import(e.target.result) ;
				}
			else if(_FILE_TO_STRING) { // USER
				writeln(file.name + " -> string " ,_STYLE.plist["store"])  ;
				__ffuncall([_FILE_TO_STRING , [file.name ,[e.target.result, null]]], glisp.user) ; 
				// new cell ???? NYI NYI NYI
				}
			else { // EVAL
				writeln ("Load: "  + file.name, _STYLE.plist["store"]);
    			glisp_rep (e.target.result,true);  // batch mode
    			}
    		_FILE_TO_STRING = null;
    		infiles.value = null; // chrome (read twice same file)
			};
			
    	reader.readAsText(file); // UTF-8
    	return true;
	}
	
/*---------------
test cors-everywhere (firefox)
----------------------*/
var _url_to_string = function (onsuccess,url,env) {
var req = new XMLHttpRequest();
req.onload = function() {
// console.log(this.responseText);
__ffuncall([onsuccess ,[url , [this.responseText, null]]],env) ; 
};
 
req.open('get', url , true);
req.send();
return _true;
}

/*---------------------------------------
AJAX : load a .glisp, .txt file from server ./lib/
		Or a .json file from ./notebook
https://thiscouldbebetter.wordpress.com/2014/06/06/a-stock-ticker-in-javascript-using-the-yahoo-finance-api/
https://blog.nraboy.com/2014/08/bypass-cors-errors-testing-apis-locally/

/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --disable-web-security
https://blog.nraboy.com/2014/08/bypass-cors-errors-testing-apis-locally/
--------------------------------*/
function __loadXMLfile(name, onsuccess, env, deftype, defdir) // (load url) // asynchronous
{
var xmlhttp;
var rawname = name;
name = __io_get_home() + name;
defdir = defdir || "lib" ;
deftype = deftype || ".glisp";

	if(name.indexOf(".") === -1) name += deftype;
	// if (!name.endsWithAny('.txt','.htm','.html','.json','.glisp')) filename += deftype;
	if(name.indexOf("http") === -1 && name.indexOf("file:") === -1) { 
			name = "./" + defdir + "/" + name ;
			}

	_reader_rem_proc(true); // standard reader
	xmlhttp=new XMLHttpRequest();
// console.log("XHR",xmlhttp);

	xmlhttp.onreadystatechange= function() {
  	if (xmlhttp.readyState==4 && xmlhttp.status==200) {
  	
    	if(onsuccess) { // USER (file->string proc2:2 [name])
    			writeln(name + " -> string",_STYLE.plist["store"])  ;
    			// calls onsuccess proc
				__ffuncall([onsuccess ,[rawname , [xmlhttp.responseText, null]]],env) ; 
				// new cell ?? NYI NYI NYI
				}
				
		else if(defdir === "notebook") { // come from (worksheet-import [name])
				__worksheet_import(xmlhttp.responseText) ;
				}
				
		else { // load and rep a file (load ...)
				writeln("Loaded : " + rawname,_STYLE.plist["store"])  ;
    			glisp_rep (xmlhttp.responseText,true);  // batch mode
    			}
    	return ;
    	} // status OK
    
    if (xmlhttp.readyState > 2  && xmlhttp.status !== 200) {
    	writeln("[" + xmlhttp.status + "] Cannot load : " + name  , _STYLE.plist["warning"]) ;
    	}
    
    console.log ("xml.status",xmlhttp.status,name,"state",xmlhttp.readyState,xmlhttp.statusText);
  	} // state change

	try {
	xmlhttp.open("GET",name,true); // async
	xmlhttp.send();
	}
	catch (err) {
	writeln("❗ " + err.name + ' : ' + err.message,_STYLE.plist["error"]);
	}
	return _true;
}
	
// (load) --> local files dialog
// (load name) -> remote
var _load_file = function (top, argc, env) {
var name;
	_FILE_TO_STRING = null;
	if (argc === 0) return fileSelect();
	name = nameToString(_stack[top],"load-file");
	return __loadXMLfile(name,null,env,".glisp","lib");
	}
	
var _worksheet_import = function(top,argc,env) {
var name;
	_FILE_TO_STRING = "worksheet";
	if (argc === 0) return fileSelect(); // NYI NYI NYI - see handleFiles
	name = nameToString(_stack[top],"worksheet-import");
	return __loadXMLfile(name,null,env,".json","notebook");
	}

	
// file->string proc:2 [file] --> calls proc(file.name, text)
var _file_to_string = function (top,argc,env) {
	var name, proc = _stack[top++];
	checkProc (proc,1,2,"file->string") ;
	if(argc === 1) {
		_FILE_TO_STRING = proc;
		fileSelect(); // browser dialog
		return _true;
	}
	name = nameToString(_stack[top]);
	__loadXMLfile(name,proc,env,".txt","lib");
	return _true;
}


/*--------------------------------
http://www.html5rocks.com/en/tutorials/cors/
// Create the XHR object.
------------------------*/

/* FileSaver.js
 *  A saveAs() & saveTextAs() FileSaver implementation.
 *  2014-06-24
 *
 *  Modify by Brian Chen
 *  Author: Eli Grey, http://eligrey.com
 *  License: X11/MIT
 *    See https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md
 */

/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */

var saveAs = saveAs
  // IE 10+ (native saveAs)
  || (typeof navigator !== "undefined" &&
      navigator.msSaveOrOpenBlob && navigator.msSaveOrOpenBlob.bind(navigator))
  // Everyone else
  || (function (view) {
      "use strict";
      // IE <10 is explicitly unsupported
      if (typeof navigator !== "undefined" &&
          /MSIE [1-9]\./.test(navigator.userAgent)) {
          return;
      }
      var
            doc = view.document
            // only get URL when necessary in case Blob.js hasn't overridden it yet
          , get_URL = function () {
              return view.URL || view.webkitURL || view;
          }
          , save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a")
          , can_use_save_link = !view.externalHost && "download" in save_link
          , click = function (node) {
              var event = doc.createEvent("MouseEvents");
              event.initMouseEvent(
                  "click", true, false, view, 0, 0, 0, 0, 0
                  , false, false, false, false, 0, null
              );
              node.dispatchEvent(event);
          }
          , webkit_req_fs = view.webkitRequestFileSystem
          , req_fs = view.requestFileSystem || webkit_req_fs || view.mozRequestFileSystem
          , throw_outside = function (ex) {
              (view.setImmediate || view.setTimeout)(function () {
                  throw ex;
              }, 0);
          }
          , force_saveable_type = "application/octet-stream"
          , fs_min_size = 0
          , deletion_queue = []
          , process_deletion_queue = function () {
              var i = deletion_queue.length;
              while (i--) {
                  var file = deletion_queue[i];
                  if (typeof file === "string") { // file is an object URL
                      get_URL().revokeObjectURL(file);
                  } else { // file is a File
                      file.remove();
                  }
              }
              deletion_queue.length = 0; // clear queue
          }
          , dispatch = function (filesaver, event_types, event) {
              event_types = [].concat(event_types);
              var i = event_types.length;
              while (i--) {
                  var listener = filesaver["on" + event_types[i]];
                  if (typeof listener === "function") {
                      try {
                          listener.call(filesaver, event || filesaver);
                      } catch (ex) {
                          throw_outside(ex);
                      }
                  }
              }
          }
          , FileSaver = function (blob, name) {
              // First try a.download, then web filesystem, then object URLs
              var
                    filesaver = this
                  , type = blob.type
                  , blob_changed = false
                  , object_url
                  , target_view
                  , get_object_url = function () {
                      var object_url = get_URL().createObjectURL(blob);
                      deletion_queue.push(object_url);
                      return object_url;
                  }
                  , dispatch_all = function () {
                      dispatch(filesaver, "writestart progress write writeend".split(" "));
                  }
                  // on any filesys errors revert to saving with object URLs
                  , fs_error = function () {
                      // don't create more object URLs than needed
                      if (blob_changed || !object_url) {
                          object_url = get_object_url(blob);
                      }
                      if (target_view) {
                          target_view.location.href = object_url;
                      } else {
                          window.open(object_url, "_blank");
                      }
                      filesaver.readyState = filesaver.DONE;
                      dispatch_all();
                  }
                  , abortable = function (func) {
                      return function () {
                          if (filesaver.readyState !== filesaver.DONE) {
                              return func.apply(this, arguments);
                          }
                      };
                  }
                  , create_if_not_found = { create: true, exclusive: false }
                  , slice
              ;
              filesaver.readyState = filesaver.INIT;
              if (!name) {
                  name = "download";
              }
              if (can_use_save_link) {
                  object_url = get_object_url(blob);
                  save_link.href = object_url;
                  save_link.download = name;
                  click(save_link);
                  filesaver.readyState = filesaver.DONE;
                  dispatch_all();
                  return;
              }
              // Object and web filesystem URLs have a problem saving in Google Chrome when
              // viewed in a tab, so I force save with application/octet-stream
              // http://code.google.com/p/chromium/issues/detail?id=91158
              if (view.chrome && type && type !== force_saveable_type) {
                  slice = blob.slice || blob.webkitSlice;
                  blob = slice.call(blob, 0, blob.size, force_saveable_type);
                  blob_changed = true;
              }
              // Since I can't be sure that the guessed media type will trigger a download
              // in WebKit, I append .download to the filename.
              // https://bugs.webkit.org/show_bug.cgi?id=65440
              if (webkit_req_fs && name !== "download") {
                  name += ".download";
              }
              if (type === force_saveable_type || webkit_req_fs) {
                  target_view = view;
              }
              if (!req_fs) {
                  fs_error();
                  return;
              }
              fs_min_size += blob.size;
              req_fs(view.TEMPORARY, fs_min_size, abortable(function (fs) {
                  fs.root.getDirectory("saved", create_if_not_found, abortable(function (dir) {
                      var save = function () {
                          dir.getFile(name, create_if_not_found, abortable(function (file) {
                              file.createWriter(abortable(function (writer) {
                                  writer.onwriteend = function (event) {
                                      target_view.location.href = file.toURL();
                                      deletion_queue.push(file);
                                      filesaver.readyState = filesaver.DONE;
                                      dispatch(filesaver, "writeend", event);
                                  };
                                  writer.onerror = function () {
                                      var error = writer.error;
                                      if (error.code !== error.ABORT_ERR) {
                                          fs_error();
                                      }
                                  };
                                  "writestart progress write abort".split(" ").forEach(function (event) {
                                      writer["on" + event] = filesaver["on" + event];
                                  });
                                  writer.write(blob);
                                  filesaver.abort = function () {
                                      writer.abort();
                                      filesaver.readyState = filesaver.DONE;
                                  };
                                  filesaver.readyState = filesaver.WRITING;
                              }), fs_error);
                          }), fs_error);
                      };
                      dir.getFile(name, { create: false }, abortable(function (file) {
                          // delete file if it already exists
                          file.remove();
                          save();
                      }), abortable(function (ex) {
                          if (ex.code === ex.NOT_FOUND_ERR) {
                              save();
                          } else {
                              fs_error();
                          }
                      }));
                  }), fs_error);
              }), fs_error);
          }
          , FS_proto = FileSaver.prototype
          , saveAs = function (blob, name) {
              return new FileSaver(blob, name);
          }
      ;
      FS_proto.abort = function () {
          var filesaver = this;
          filesaver.readyState = filesaver.DONE;
          dispatch(filesaver, "abort");
      };
      FS_proto.readyState = FS_proto.INIT = 0;
      FS_proto.WRITING = 1;
      FS_proto.DONE = 2;

      FS_proto.error =
      FS_proto.onwritestart =
      FS_proto.onprogress =
      FS_proto.onwrite =
      FS_proto.onabort =
      FS_proto.onerror =
      FS_proto.onwriteend =
          null;

      view.addEventListener("unload", process_deletion_queue, false);
      saveAs.unload = function () {
          process_deletion_queue();
          view.removeEventListener("unload", process_deletion_queue, false);
      };
      return saveAs;
  }(
	   typeof self !== "undefined" && self
	|| typeof window !== "undefined" && window
	|| this.content
));
// `self` is undefined in Firefox for Android content script context
// while `this` is nsIContentFrameMessageManager
// with an attribute `content` that corresponds to the window

if (typeof module !== "undefined" && module !== null) {
    module.exports = saveAs;
} else if ((typeof define !== "undefined" && define !== null) && (define.amd != null)) {
    define([], function () {
        return saveAs;
    });
}

String.prototype.endsWithAny = function () {
    var strArray = Array.prototype.slice.call(arguments),
    $this = this.toLowerCase().toString();
    for (var i = 0; i < strArray.length; i++) {
        if ($this.indexOf(strArray[i], $this.length - strArray[i].length) !== -1) return true;
    }
    return false;
};

var saveTextAs = saveTextAs
|| (function (textContent, fileName, charset) {
    fileName = fileName || 'download.txt';
    charset = charset || 'utf-8';
    textContent = (textContent || '').replace(/\r?\n/g, "\r\n");
    if (saveAs && Blob) {
        var blob = new Blob([textContent], { type: "text/plain;charset=" + charset });
        saveAs(blob, fileName);
        return true;
    } else {//IE9-
        var saveTxtWindow = window.frames.saveTxtWindow;
        if (!saveTxtWindow) {
            saveTxtWindow = document.createElement('iframe');
            saveTxtWindow.id = 'saveTxtWindow';
            saveTxtWindow.style.display = 'none';
            document.body.insertBefore(saveTxtWindow, null);
            saveTxtWindow = window.frames.saveTxtWindow;
            if (!saveTxtWindow) {
                saveTxtWindow = window.open('', '_temp', 'width=100,height=100');
                if (!saveTxtWindow) {
                    window.alert('Sorry, download file could not be created.');
                    return false;
                }
            }
        }

        var doc = saveTxtWindow.document;
        doc.open('text/html', 'replace');
        doc.charset = charset;
        if (fileName.endsWithAny('.htm', '.html')) {
            doc.close();
            doc.body.innerHTML = '\r\n' + textContent + '\r\n';
        } else {
            if (!fileName.endsWithAny('.txt')) fileName += '.txt';
            doc.write(textContent);
            doc.close();
        }

        var retValue = doc.execCommand('SaveAs', null, fileName);
        saveTxtWindow.close();
        return retValue;
    }
})

/*---------------
Echo API
(save-text-as obj file-name[.txt] )
--------------------*/
var _save_as = function (obj , filename) {
	if(obj instanceof Object && obj.toText)	
		obj = obj.toText();
		else
		obj = glisp_message(obj,"");
		
	filename = nameToString(filename,"save-as");
	if (!filename.endsWithAny('.txt','.htm','.html','.json')) filename += '.txt';
	return saveTextAs(obj,filename) === true ? _true : _false ;
}
	



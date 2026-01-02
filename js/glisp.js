/* 
EchoLisp (C) Echolalie and G. Brougnard and Jacques Tramu - 2014 
https://developers.google.com/speed/articles/tech-talks
Notations conventions :
		_GLOBAL  : _PI, etc.. const or var
		_append : js native function mapped to EchoLisp function
		__append : internal to implement the above
		isSomething : js predicate -> true|false
		_type_p : EchoLisp predicate -> _true or _false
		_true : symbol #t
*/
//"use strict";

// #define
const _NBSP = "&nbsp;" ;
const _NL = "<br>"  ;
const _TAB = "&nbsp;&nbsp;&nbsp;&nbsp;";

/*---------------------
ECMA6 compatibility
-----------------------------*/
if (!String.prototype.codePointAt) String.prototype.codePointAt =   String.prototype.charCodeAt ;
if (!String.prototype.fromCodePoint) String.prototype.fromCodePoint = String.prototype.fromCharCode ;

function lastOf(anArray) { // should be Array.lastOf NYI
	if(anArray.length === 0) return undefined;
	return anArray[anArray.length-1] ;
}

/*******************
G L O B S
******************************/
var  _PRODUCTION = true; // should be in config.js : first loaded - NYI 
var  _VERSION =  _PRODUCTION ? "EchoLisp - 4.52" : "EchoLisp - 4.52 &beta; " ;
var _NUM_VERSION = 4.52;
var _DEBUG = 0;
var _MATH_PRECISION = 1.e-6 ; // epsilon for computations
var _DECIMALS = 0 ; // output all decimals
var _KEY_EVAL = 13 ; // char code (13 = default)
var _KEY_EVAL_META = 0 ; // RFU
var _SCORE = {} ; // auto-complete strings score

// background ops locks
var _PRETTY_PRINT = false; // bypass length in stdout-flush
var _PLOTTING = false; // plot.lib
var _COMPUTING = false;
var _ANIMATING = false;
var _TIMING = false; // timer.lib
var _MULTI_TASKING = false; // tasks.lib
var _CONTEXT = null; // a symbol : last user call = (symbol ...)
var _INFIX_REPL = false; // top level infix loop

// js mode
function __js_mode() {
	var mode = (eval("var __temp = 666"), (typeof __temp === "undefined")) ? 
   		 "  (strict)": 
   		 "  (non-strict)";
   	return mode;
   	}
    
_VERSION = _PRODUCTION ?  _VERSION : _VERSION + __js_mode();

/*
U T I L I T I E S
*/

Storage.prototype.setObj = function(key, obj) {
    return this.setItem(key, JSON.stringify(obj)) ;
}

Storage.prototype.getObj = function(key) {
    return JSON.parse(this.getItem(key)) ;
}

/*-----------------
cursor handling
---------------------*/
function glisp_cursor(elem,cursor) {
	elem = document.getElementById(elem);
	if (elem && elem.style) elem.style.cursor=cursor;
}

/*-----------------
Change eval key
---------------------*/
var _tty_key_eval = function(key) {
	return __void;
}

/*--------------------
* load library = js script on server
* option charset : NYI
-------*/
var _KNOWN_LIBS = ["plot.lib","math.lib","bigint.lib","words.lib","web.lib","struct.lib","timer.lib","dico.fr","dico.fr.tags","dico.en","match.lib","json.lib","idb.lib","usage.lib","tree.lib","graph.lib","gloops.lib","list.lib","matrix.lib","compile.lib","hash.lib","heap.lib","sql.lib","print.lib","match.lib","types.lib", "sets.lib","tasks.lib","sequences.lib","dico.fr.no-accent","amb.lib","big-int.lib", "audio.lib","vlib.lib","infix.lib","interface.lib","three.lib","threeX.lib","plot-3d.lib"];
var _LIB = {}; // loaded

// (require 'json | '(compile heap))
function _require_1 (name) {
	name = nameToString(name,"require");
	if(name.indexOf(".") === -1) name += ".lib" ;
	if(! _LIB[name]) glisp_error(70,name,"require") ;
	return _true;
}
var _require = function (names) {
	if(notIsList(names)) return _require_1(names);
	__jsmapc(_require_1,names);
	return _true;
	}


function __libload(name) {
var element;
	try {
	glisp.pack = "system" ;
    element = document.createElement("script");
    /* does not work
    element.onlaad = function() {
    	writeln("*Lib: " + name + ": loaded.",_STYLE.plist["store"]);} ; */
    element.onerror = function () {
    	_LIB[name] = false;
        writeln("*Lib: "+ name + ": loading error.",_STYLE.plist["error"]);};
        
	element.id = name;
    element.src = "./js/" + name + ".js"; // load
// console.log("libload ",element.src,element);
    
    // if(name.indexOf(".fr") > 0 ) element.charset = "ISO-8859-1"; // try
    document.body.appendChild(element); 
    
    var t0 = Date.now();
    var progress = function () {
    	if (_LIB[name])
			writeln("Lib: " + name + " loaded.",_STYLE.plist["store"]);
		else if((Date.now() - t0) > 5000 )	 // !!!! NYI
    		 writeln("Error when loading: "+name,_STYLE.plist["error"]);
    	else setTimeout(progress,200) ;
    	}
    progress();
    return __void ;
    }
    
    catch (err) {
    writeln("lib:load:" + err.name + ' : ' + err.message,_STYLE.plist["error"]);
    glisp.pack = null;
    return __void ;
    }
} // __libload

// internal up to now .lib mandatory in name
var _import = function(name) { // external - re-importable
	name = nameToString(name,"import");
	var elem = document.getElementById(name);
	if(elem) document.body.removeChild(elem); // remove script ???
	
	_LIB[name] = false;
	__libload(name);
	_LIB[name] = true;
	return __void;
	}
	
var _lib = function(name, env ,mute) {
	name = nameToString(name,"lib");
	if(name.indexOf(".") === -1) name += ".lib" ;
	
	if (_LIB[name]) {
		if(mute) return __void ;
		writeln("Lib: " + name + " already here.");
		return __void;
		}
		
	if(_KNOWN_LIBS.indexOf(name) === -1) {
		writeln("Unknown lib name: " + name,"color:#cc6633");
		return __void;
		}
		
		return __libload(name);
}


function isDigit( s ) { // ailleurs NYI
var nums='1234567890.';
return nums.indexOf(s) != -1;
}

function ascii (a)  {return a.charCodeAt(0); }
function isUpper(c) {return  /[A-Z]/.test(c); }
function isLower(c) {return  /[a-z]/.test(c); }
function isAlpha(c) {return isUpper(c) || isLower(c) || c === '_' || c === '*';} 
function isWord(s)  {return  /^[A-Z][a-z]/.test(s); }
function isDigit09(c) {return /[0-9]/.test(c);}


/*****
D I A L O G S 
// window.innerHeight
// window.innerWidth
***/

// Modal Dialog

function dlgShow(msg, color)
{
color = color || 'orange' ;
  var dlg = document.getElementById("overlay");
  var elmsg = document.getElementById("dlgMsg");
  var elimg = document.getElementById("dlgImg");
  
  elimg.src = "./images/b4.png" ; // Xparent NYI
  
// center it
  var width = 400; // final width (innerWidth gives actual)
  dlg.style.top = '' +  Math.floor(window.innerHeight/4) + 'px';
  dlg.style.left = '' + Math.floor((window.innerWidth - width)/2) + 'px' ;
  
  elmsg.innerHTML = msg;
  dlg.style.backgroundColor = color;
  dlg.style.visibility = "visible";
  dlg.classList.add('overlay-zoom');
  setTimeout(dlgHide,5000); // 5000 NYI
}

function dlgHide()
{
  var dlg = document.getElementById("overlay");
  dlg.classList.remove('overlay-zoom');
  dlg.style.visibility = "hidden";
}

/*
D O M widgets
*/
var __logo_blink = true;
function logo_new (src) {
	var logo = document.getElementById("logo"); // ball [b1.jpg .. b8.jpg]
	logo.src = "./images/" + src ;
}
function _logo_blink () { // preload necessary NYI NYI
	if(__logo_blink) logo_new("b5.jpg"); else logo_new("b4.jpg");
	__logo_blink = ! __logo_blink;
}

function setOpacity(elem, opacity, gamma) {
gamma = gamma || 0.5 ; // quick at 0
	  opacity= Math.min(1,opacity);
	  if(opacity < 0.1) opacity = 0 ;
	  opacity = Math.pow(opacity,gamma); // Quick at 0
	  elem.style.opacity = '' + opacity ;
	 // opacity= Math.floor(opacity*100);
	// elem.style.filter  = 'alpha(opacity=' + opacity   + ')'; // IE fallback
}

/*---------------------
User interface
-------------------------*/

var _exit = function () {
	doButton("RESET");
	return 0;
}

var _UI = {
		printer : false, // hide pages
		printer_echo : true , // stdin lines to printer
		tty_echo : true // stdin lines to stdout
}

var GPrinter = null ; // new Book('printer') ;

/*-----------
B U T T O N S 
----------*/
function btn_enable(btn) {
	btn.classList.remove('disabled');
}
function btn_disable(btn) {
	btn.classList.add('disabled');
}
function doButton(cmd) {
dlgHide();
var btn = document.getElementById(cmd);
if (btn && btn.classList.contains('disabled')) return;

	switch(cmd) {
	case 'HELP' : glisp_help(); break;
	case 'RESET' : if(confirm("Reload EchoLisp: OK?")) location.reload() ; break; 
	case 'NEW' :  __init_cells() ; __new_worksheet() ; break;
	case 'SAVE' : __save_worksheet(); break;
	case 'EVAL' : __eval_worksheet(); break;
	}
    window.setTimeout(function() {stdin.focus();}, 100); 
	updateButtons();
}

function updateButtons() { // unplugs if code==OK
// var bsave = document.getElementById('save');
// btn_enable(bsave);
// btn_enable(bundo);
}

/*-------------
PANEL
*/
var stdpanel;
function stdpanel_write (line,style) { }
/* if(_LIB["plot.lib"] && GPlotter.status) {
	line = line.replace(/\n/g," | ");
	line = htmlEntities(line);
	if(style)
	stdpanel.innerHTML = "<span style='"  + style + "'>" + line + "</span>" ;
	else stdpanel.innerHTML = line;
	}
*/


/**********************
H E L P window
*************** */
var _HelpWin = null;
function glisp_help(url) {
url = url || "./help.html" ;
		try {
		if(_HelpWin) _HelpWin.close(); // not Chrome needed test me NYI
		_HelpWin = window.open(url,"HelpWin");
		_HelpWin.focus();
		}
		catch (err)   { };
}

/****************
S T D I N
********/
/*
I've just faced same problem. There is at least one difference Chrome handles the keypress and keydown/keyup events. keypress event in Chrome is not fired for arrow keys, whereas for keydown and keyup it is.
*/
var _CLEAR_KEY = -1 ;
var _AUTO_COMPLETE_KEY = 40 ; // old 39

function codeKeyDown(e) {
        if (typeof e === 'undefined' && window.event) { e = window.event; }
        var key = e.keyCode;
//console.log("KEYDOWN code/char",e.keyCode,e.charCode);
//        if (e.keyCode === 8)   stdin_autocomplete_undo(); // backspace
//        if (e.keyCode === 46)  stdin_autocomplete_stop(); // suppr
// _TAB and arrows
        if 
        (key === 33 ||key === 34 || key === 35 || key === 36  || key === 27 
        	|| (key === _CLEAR_KEY && stdin_clear()) // suppr with no select
        || key === 9
        	|| (( key === 9 || key === _AUTO_COMPLETE_KEY) && _auto_last_matcher)) {
         e.stopPropagation();
         e.preventDefault(); 
         return false; 
         }// recall last
    
	} // DOWN
  
// ( ) are 40/41 [] are 91/93  "->" is keyCode 39 blink {} NYI

// http://symbolcodes.tlt.psu.edu/bylanguage/greekchart.html
// http://stackoverflow.com/questions/2940882/need-to-set-cursor-position-to-the-end-of-a-contenteditable-div-issue-with-sele/2943242#2943242

function codeKeyPress(e) { // $=36, !=33
var enter = false;
//console.log("KeyPress",e.charCode,e.keyCode, e.ctrlKey,e.altKey,e.shiftKey,e.metaKey);
        if (typeof e === 'undefined' && window.event) { e = window.event; }
		if(e.charCode === 41) stdin_blink('(',')');
		if(e.charCode === 93) stdin_blink('[',']');
		if(e.charCode === 0 && e.keyCode === 13 ) enter = true; // Ffox
		if(e.charCode  === 13) enter = true;
		
		if(enter && (e.shiftKey || e.ctrlKey || e.altKey)) { // wants eval
				if(! stdin_well_formed()) return; // missing pars 
				e.stopPropagation();
				e.preventDefault();
				stdin_eval(); 
				return false;
				}
				
		if(enter) {
					__set_dirty_worksheet () ;
					stdin_adjust();
					}
				
		
		if(e.charCode === 99 && e.ctrlKey) stdin_ctrl_c();
		
		if((e.ctrlKey && _META_KEY === "ctrl") 
		   || (e.altKey && _META_KEY === "alt")  
		   || (e.metaKey && _META_KEY === "cmd")
		   || (e.metaKey && _META_KEY === "meta")) { 
		var charStr = String.fromCharCode(e.charCode);
        var greek = _GREEK_CHARS[charStr]; // see reader
        if( greek)  {
          			stdin_insertAtCursor(greek);
        			return false;
       				}
       	}

    } // PRESS
    
function codeKeyUp(e) {
var stdin = document.getElementById('stdin');
        if (typeof e === 'undefined' && window.event) { e = window.event; }
 		var key = e.keyCode;
 		
// console.log("KeyUp",e.charCode,e.keyCode, e.ctrlKey,e.altKey,e.shiftKey,e.metaKey );

        if (key === 34)  stdin_histo(666) // recall last
        if (key === 33)  stdin_histo(-666) ; // recall first
        if (key === 35)  stdin_histo(+1) ; // recall next
        if (key === 36)  stdin_histo(-1) ;  // recall prev
        if (key === 27)  stdin_escape(); 
        
        if (key === 9)   stdin_tab();
        if (key === _AUTO_COMPLETE_KEY)  stdin_right_arrow(); // ->  only if autocomplete
        	
         if 
        (key === 33 ||key === 34 || key === 35 || key === 36  || key === 27
        	|| key === _CLEAR_KEY
            || key === 9
        	|| ( key === _AUTO_COMPLETE_KEY && _auto_last_matcher)) {
         e.stopPropagation();
         e.preventDefault(); 
         return false; 
         }// recall last
         
    } // UP
    
/*
* S T D I N
*/
var stdin = null ; // glisp DOM element
var hiliter = null; // DOM
var wrapper = null;

var sysin = { // for history
	lines : new Array(),
	last : 0,
	clear : true
	} ;
	
function get_nextSibling(n) {
    n = n.nextSibling;
    while (n && n.nodeType !== 1) {
        n = n.nextSibling;
    	}
    return n;
} 

function get_firstChild(n) {
	if(! n) return null;
    n = n.firstChild;
    while (n && n.nodeType !== 1) {
        n = n.nextSibling;
    	}
    return n;
} 

// onfocus event
function set_stdin(elem) {
//console.log("set-stdin");
	if(elem === stdin) { 
			stdin.focus(); 
			return ;
			} 
// click in new cell
var cell ;
	if(stdin) stdin_autocomplete_stop();
	stdin = elem || document.getElementById('stdin');
	
	hiliter = get_nextSibling(stdin) ; // GLOB
	wrapper =  stdin.parentNode ; // GLOB
	cell = stdin.parentNode.parentNode;
	
	stdin.onkeydown = codeKeyDown;
	stdin.onkeypress = codeKeyPress;
	stdin.onkeyup = codeKeyUp;
	stdin_autocomplete_start();
	stdin.focus();
// set stdout 
	stdout = get_Child(cell,"stdout") ; // GLOB
// its plotter
	__cell_focus_plotter(cell) ; // sets GPlotter
}

function stdin_help() {
	glisp_help();
	stdin.value = "";
}

function stdin_prompt(prompt) {
prompt = prompt || ">" ;
	stdin.placeholder = prompt ;
}

function stdin_insertAtCursor  (text) {
  text = text || '';
  if (document.selection) { // IE
    stdin.focus();
    var sel = document.selection.createRange();
    sel.text = text;
  } else if (stdin.selectionStart || stdin.selectionStart === 0) {
    var startPos = stdin.selectionStart;
    var endPos = stdin.selectionEnd;
    stdin.value = stdin.value.substring(0, startPos) +
      text +
      stdin.value.substring(endPos, stdin.value.length);
    stdin.selectionStart = startPos + text.length;
    stdin.selectionEnd = startPos + text.length;
  } else {
    stdin.value += text;
  }
};

function stdin_escape() {
 	stdin.value = "" ;
	stdout.innerHTML = _NBSP;
	stdin.focus() ;
}

function  stdin_ctrl_c() {
 if(_COMPUTING || _PLOTTING || _TIMING || _MULTI_TASKING) writeln("*stopped*","color:red");
 _COMPUTING = _PLOTTING = _TIMING =  _MULTI_TASKING = false; // stop ops
}

function stdin_clear() { // suppr key if enabled
// console.log("clear",stdin.selectionStart,stdin.selectionEnd);
  if( stdin.selectionStart === stdin.selectionEnd) {
  			stdin.value = "";
  			 return true ;}
  	return false; 
}

// deprecated- see  (edit 'foo)
function stdin_put(text) {
		stdin.value = text ;
		sysin.clear = false;
}

function stdin_histo(disp) { // history call
		var nlines = sysin.lines.length;
		if(nlines <= 0 ) return;
		
		sysin.last += disp;
		if   (disp === -666) sysin.last = 0;
		else if(disp === 666) sysin.last = nlines-1;
		else  if(sysin.last < 0) sysin.last = nlines-1;
		else  if(sysin.last >= nlines) sysin.last = 0 ;
		stdin.value = sysin.lines[sysin.last] ;
}

/////////////////
// ()  & [] BLINK
///////////////////
function stdin_hilite_clear() {
	hiliter.innerHTML = _NBSP;
	stdin_autocomplete_start();
}

function stdin_well_formed() { // count () before ENTER count {} itou
	var i, str= stdin.value, pars = 0, lg= str.length, instring = false;
	for(i=0;i < lg; i++) {
		if(instring && str[i] === "\\") { i++ ; continue;}
		if(str[i] === '"') instring= ! instring;
		if(instring) continue;
		
		if(str[i] === '(' || str[i] === '[' || str[i] === '{' ) pars++;
		else if(str[i] ===')' || str[i] === ']' ||  str[i] === '}' ) pars--;
		}
	return (pars <= 0);
}

function stdin_blink(open,close) { // call me when user types ')' or ']'
	if(stdin.value.length === 0) return;
	var i;
	// if(stdin.value[stdin.value.length -1] === ')') {
	var pars = 1;
	var str = stdin.value;
//console.log("SEL", str.length, stdin.selectionStart);
//	for  ( i = str.length -1; i >=0 ; i --) {
for  ( i = stdin.selectionStart; i >=0 ; i --) {
		if(str[i] === close) pars++;
		if(str[i] === open) pars--;
		if(pars === 0)  break;
		} // i 
		if(pars < 0) return;
		if (pars > 0)
			str = str + "<span_class='herror'>)</span>" ;
		if (pars === 0)
			str = str.substr(0,i) + "<span_class='hilite'>(</span>" + str.substr(i+1);
		stdin_autocomplete_stop();
		// hiliter = hiliter || document.getElementById("hiliter");
		
		str = str.replace(/(\r\n|\n|\r)/gm,"<br>"); // check ME NYI
		str = str.replace(/\s/g,_NBSP);
		str= str.replace(/span_/g,"span ");
//	console.log("stdin:blink",str);
		hiliter.innerHTML = str;
		setTimeout(stdin_hilite_clear,500);
		
} // blink

//////////////////
// A U T O C O M P L E T E
////////////////////

var _auto_timer = null;
var _auto_last_replace = null;
var _auto_last_matcher = null;
var _auto_stopped = false;
var _auto_choice = 0 ; // multiple choices (-> key)

function stdin_autocomplete_start() {
	stdin_autocomplete_stop() ;
	if(glisp.autocomplete) {
		_auto_timer = setInterval(stdin_autocomplete,glisp.autocomplete);
		_auto_stopped = false;
		_auto_last_matcher = null;
		}
	}
	
function stdin_autocomplete_stop() {
	_auto_stopped = true;
	clearInterval(_auto_timer);
	_auto_timer = null;
	_auto_choice = 0; 
}

function stdin_tab() {
	if(! _auto_last_matcher) {
			var sel = stdin.selectionStart ;
			stdin.value = 
                  [stdin.value.slice(0, stdin.selectionStart), "    ", 
                  		stdin.value.slice(stdin.selectionStart)].join('');
                stdin.selectionStart  = sel+ 4 ;
                stdin.selectionEnd = sel + 4;
				return; }
				
//	stdin.value += _auto_last_matcher + " " ;
	stdin_insertAtCursor  (_auto_last_matcher + " ") ;
	hiliter.innerHTML = _NBSP;
}

// patches ending line iff last char === \n
function stdin_autotab() {
	stdin.value = stdin.value.replace(/(\n            .*\n)$/,"$1            ");
	stdin.value = stdin.value.replace(/(\n        .*\n)$/,"$1        ");
	stdin.value = stdin.value.replace(/(\n    .*\n)$/,"$1    ");
}

function stdin_right_arrow() {
	if(! _auto_last_matcher) return;
	_auto_choice++;
	stdin_autocomplete();
}

function _score_compare (a, b) { //a,b are strings
	var sa = _SCORE[a], sb = _SCORE[b];
	if(sa === sb) return 0;
	if(sa === undefined) return  1 ;
	if(sb === undefined) return -1 ;
	return (sa > sb) ? -1 : 1;
}

function stdin_score_sort (matches) { // sort jsarray of strings f(_SCORE)
	matches.sort(_score_compare);
}

// returns trailer 
function stdin_to_complete() {
	var str = stdin.value;
if(str === undefined) return;
	var idxto = stdin.selectionStart ; // index of char before cursor
	var idxfrom , trailer ,c ;
	
	if  (str[idxto] === '\n' || (idxto === str.length)) {
	idxto--;
		for(idxfrom = idxto; idxfrom >= 0; idxfrom--) {
			c = str[idxfrom] ;
			if(c === ' ' || c === '(' || c === '\n') { // quote ??
									 idxfrom++ ;
									 break; 
									 }
			if( /[\*|a-z|A-Z|0-9|\-|\>\!]/.test(c) === false) return null;
			}
		
		if(idxfrom >= idxto) return null ; // 2 char at least
		trailer = str.substring(idxfrom,idxto+1);
		return trailer;
		}
	return null ;
	}

// prevent pattern \"abc$  
// will be strange in (define ...)
function stdin_autocomplete () {
if(_auto_stopped) return;
	var regexp,protect_trailer;
if(!hiliter) return;
	hiliter.innerHTML = _NBSP;
	_auto_last_matcher = null;
	
	var trailer = stdin_to_complete();
	if(trailer === null) return ;
	
	// look for it
	protect_trailer = trailer.replace("*","\\*","g"); // look for *calendar*
	regexp = new RegExp ("^" +  protect_trailer,"i"); // case insensitive
	// could use a cache : NYI NYI
	var matches =  glisp_matcher_symbols(regexp,glisp.user) ; // look in  user+global
	
	if(!matches || matches.vector.length === 0 ) return;
	if(matches.vector.length > 1) { 
			stdin_score_sort(matches.vector) ;
			info(glisp_message(matches,"")) ;}
	if(_auto_choice >= matches.vector.length) _auto_choice = 0;
	var matcher = matches.vector[_auto_choice] ;
	
//console.log("trailer",trailer,"matcher",matcher);
	if(matcher === trailer) return;
// trailer = envir
// matcher = environment
	_auto_last_matcher = matcher.substring(trailer.length);
// matcher =  "onment" : to append
	var str = stdin.value.substr(0,stdin.selectionStart) ;
	str = str + "<span_class='complete'>" + _auto_last_matcher + "</span>";
	str = str.replace(/(\r\n|\n|\r)/gm,"<br>"); // check ME NYI
	str = str.replace(/\s/g,_NBSP);
	str= str.replace(/span_/g,"span ");
	hiliter.innerHTML = str;
	
	// setTimeout (function() {stdin.focus();}, 0) ; // Chrome - blink ?
	
} // stdin_autocomplete


/*--------------------
I N P U T
-------------------------*/
 // called by CR key or resize events
function stdin_adjust (height) {
//console.log("stdin_adjust");
if(!hiliter) return;
	
	function resize () {
		stdin_autotab();
		var h = height || stdin.scrollHeight - 2  ; // padding
		h = h + 'px' ;
        stdin.style.height = 'auto';
        stdin.style.height = h;
        hiliter.style.height = 'auto';
        hiliter.style.height = h;
        wrapper.style.height = 'auto';
        wrapper.style.height = h;
        }
	
	window.setTimeout(resize, 0);
}

function stdin_remember() { // last 16
var numl = sysin.lines.length;
	if(stdin.value.length <= 1) return;
	if(numl  &&  sysin.lines[numl-1] === stdin.value) return;
	if(numl > 15) sysin.lines.shift(); 
	sysin.lines.push(stdin.value);
	sysin.last = sysin.lines.length - 1 ;
}
	

function stdin_eval() { // called by [Eval]Key or ❗️Eval button 
	if(_PLOTTING || _COMPUTING) { writeln ("Busy..",_STYLE.plist["warning"]); return; }
	var rc , cell = stdin.parentNode.parentNode;
	var console = (cell.dataset.console === "true") ; // 📠  💻
	if(stdin.value.length === 0) return;
	
	if(glisp.doc) {} // no echo
		else if(console) 
			writeln(stdin.value ,_STYLE.plist["echo"]);
		else stdout_clear(true);

// JS debug ?					
	if(stdin.value.charAt(0) === '€' && stdin.value.length > 0) { // javascript eval debug
		var ret = '' + eval(stdin.value.substring(1));
		writeln(ret,_STYLE.plist["javascript"]);
		stdin.value = '€'; //  for next command
		} // js eval
	
	else { // glisp eval
		rc = glisp_top(stdin.value); // read/eval/print
		stdin_remember(); // last  command (OK or not)
		if(console && rc === 0)
			stdin.value = "" ;
		}
	
	window.setTimeout(function() {stdin.focus();}, 100);
	stdin_autocomplete_start();
} // stdin_eval


/*--------------------
S T D O U T
----------------------*/

var stdout = null ; // global: element
var sysout = {
		maxlines : 1000 , 
		buf : ""
		} ;
		
function set_stdout(elem) {
	stdout = elem || document.getElementById('stdout');
}
		
// writeln : input jstring, no HTML NO HTML, NO HTML
// use _STYLE_ macros or "\\n" to style
// writelen(' ') is (newline)

// htmlEntities("_STYLE_color:red_SPAN_define_SPAN_") 
//        -> "<span style='color:red'>define</span>"

function htmlEntities(str) {
//console.log("STR>",str);
	str = str.replace(/ /gm,"&nbsp;") ;
	str = str.replace(/'/gm,"&#39;");
    str = str.replace(/</gm, '&lt;').replace(/>/gm, '&gt;') ; // .replace(/"/g, '&quot;');
    str = str.replace(/_STYLE_(.*?)_SPAN_/g,"<span style='$1'>");
    str = str.replace(/_SPAN_/g,'</span>');
//console.log("STR<",str);
    return str;
}

function writeln(line,style) {
// count lines && check overflow NYI
var h =  stdout.clientHeight ;
		var html = stdout.innerHTML ;
		var outline = htmlEntities(line); 
		outline = outline.replace(/\n/gm,"<br>") ;
		
		if(h > 10000) html = "[...]<br>" ; // (stdout-lines ) function NYI NYI
		
		if(style)
				html += "<span style='" + style  +"'>"
						 + outline
						 + "</span><br>";
				else
				html += outline + '<br>' ;
				
//console.log("writeln:html",html);
		stdout.innerHTML = html ;
		stdout.scrollTop = stdout.scrollHeight;
} // writeln

function stdout_flush(line)  {
	line = sysout.buf + line;
	if(line === "") return ;
	writeln(line);
	sysout.buf = ""; 
}

function stdout_cat( str) { // accumulates
	sysout.buf += str + " " ;
}

function stdout_clear(noversion) {
	if(stdout === null) set_stdout(); // init time
	stdout.innerHTML =   _NBSP ;
	sysout.buf = "" ;
	if(noversion) return;
	stdout.innerHTML = _VERSION + "<br>" ;
}

var _stdout_clear = function () {
	stdout.innerHTML =   _NBSP ;
	sysout.buf = "" ;
	return __void;
	}

// UTIL
// integer clamp
function clamp(n,nfrom,nto) { // [nfrom ... nto] allowed
n = n || 0 ;
if(typeof n === 'number') 
		    n = Math.floor(n);
		    else
			n = nto ;
return (n < nfrom) ? nfrom : (n > nto) ? nto : n ;
}

/*
S T A T U S line
*/
var _INFO_LOCK = false;

function glisp_status(dt) {
if(_INFO_LOCK) return;
var text='' ;
		text +=  "evals: " + glisp.ncycle ;
		if(glisp.time > 1)
		text +=  "&nbsp;&nbsp;&nbsp;gpu: " + round10(glisp.ncycle/(dt*1.0)) + ' KHz' ;
		text +=  "&nbsp;&nbsp;&nbsp;time: " + dt + 'ms' ;
		info(text);
}
	
/***************
TOP = calls REP
updates UI
returns 0 : OK 
************/

function glisp_top(line) { // top level eval
	var t0 = Date.now() ;
	glisp_status(0); // _INFO_LOCK to false
	// window.scrollTo(0,0);
	logo_new('red.jpg'); // busy
	
	if(_PLOTTING)   {writelen("PLOTTING",_STYLE.plist["error"]); return 68;}
	if(_COMPUTING)  {writelen("COMPUTING",_STYLE.plist["error"]); return 68;} // NYI DBG

	glisp.ncycle = 0 ;
	glisp_rep(line); // read/eval/print
	if(glisp.stopped) writeln('Stopped.',_STYLE.plist["error"]);
	
	if(glisp.error)
		logo_new('orange.jpg') ;
		else { 
				logo_new('green.jpg');
				if(! _INFO_LOCK) glisp_status(Date.now() - t0);
				}
	return glisp.error; 
} // TOP !!!

/*-------------------
styles
---------------------------*/
function init_styles() {
_STYLE.plist = {
 
	"echo" : "color:gray" ,
	"error" : "color:red" ,
	"jserror" : "color:magenta",
	"regexp" : "color:magenta",
	"warning" : "color:orangered" ,
	"trace" : "color:gray" ,
	"store" : "color:green" ,
	// "string" : "color:darkslategray" ,
	"function" : "color:blue" ,
	"syntax" : "color:green" , // symbol.syntax
	"closure" : "color:blue" , // symbol.formal
	"complex"  :  "color:brown",
	"bigint" : "color:green",
	"javascript" : "color:black" ,
	"mark" : "color:red" ,
	"hash" : "color:magenta" ,
	"calendar" : "color:blue" ,
	"array" : 'font-family:"Menlo, Monaco, Courier New", Courier, monospace' ,
	
	"printer-trace" : "font-style:italic;color:blue" ,
	"printer-echo" : "font-style:italic;margin-left:0px",
	"printer-load" : "color:green",

	
	"lambda" : "color:blue;font-weight:bold",
    "&lambda;" : "color:blue;font-weight:bold",
	}
}
/****************
* I N I T ( CMD-R)
*************/
var _G_REF ; // see struct.lib

function __new_worksheet() {
	 var notebook = _notebook();
	 var sheets = _length(notebook) + 1 ;
	 while (_member ("worksheet-" + sheets, notebook) !== _false) sheets++ ;
	 __set_current_worksheet("worksheet-" + sheets);
	 __set_date_edited(new Date());
}

function doInit()  {//  Reload 
localStorage.setObj("ECHOLALIE-ECHOLISP-APPNAME",_VERSION) ;
glisp_init(); // boot sysfuns and sets env glisp.user

logo_new('green.jpg'); 
_PLOTTING = _ANIMATING = _COMPUTING = _TIMING = _MULTI_TASKING = false;
_G_REF = {} ; // see struct.lib

	GPrinter = new Book() ;
	init_styles(); // _restore NYI
	
	hiliter = document.getElementById('hiliter');
	stdout = document.getElementById('stdout');
	// dlgShow(_VERSION,"lightblue");
	
	/*----------------------
	BROWSER PATCHES
	--------------------------*/
	if( navigator.userAgent.toLowerCase().indexOf('firefox') > -1 ){
	_autocomplete_top(0) ;
	}
	else // chrome/safari OK
	_autocomplete_top(2);
	/*------------------------
	END BROWSER PATCHES
	----------------------------*/

	__init_cells();
	__local_create_db();
	 _local_get_symb("system.calendar"); // MUTE - global symbol _CALENDAR - null if none
	 
	__local_make_store("notebook",false);
	__local_make_store("notedates",false);
	__new_worksheet();
	 __fill_open_select() ;
	
	 glisp_preferences(); // load/compile(batch)/funcall if any
} // RELOAD

function doSlider(slider,num, value) {
	if(! _LIB["plot.lib"]) return;
	__plot_slider(slider,num, value);
}
function doPlotReset(btn) {
	if(! _LIB["plot.lib"]) return;
	__plot_button_reset(btn);
}


window.onload = doInit;
window.onresize = stdin_adjust;





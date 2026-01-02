/* 
EchoLisp (C) Echolalie and G. Brougnard and Jacques Tramu - 2014 
https://developers.google.com/speed/articles/tech-talks
Notations conventions :
		_GLOBAL  : _PI, etc.. const or var
		_append : js function seen as EchoLisp function
		__append : internal to implement the above
*/

// #define
const _NBSP = "&nbsp;"
const _NL = "<br>"  ;
const _TAB = "&nbsp;&nbsp;&nbsp;&nbsp;";


/*******************
G L O B S
******************************/
var  _VERSION = "EchoLisp - 2.4.6 - &beta;" ;
var _DEBUG = 0;
var _MATH_PRECISION = 1.e-6 ;
var __math_precison = _MATH_PRECISION ; // eradicate me NYI NYI
var _KEY_EVAL = 13 ; // char code (13 = default)
var _KEY_EVAL_META = 0 ; // RFU

// background ops locks
var _PLOTTING = false;
var _COMPUTING = false;
var _ANIMATING = false;

/*-----------------
Change eval key
---------------------*/
var _tty_key_eval = function(key) {
	if(typeof key === "number") _KEY_EVAL = key;
	if(typeof key === "string") _KEY_EVAL = key.charCodeAt(0) ;
	writeln ("Eval key is : #\\" + 
			String.fromCharCode(_KEY_EVAL) + " ascii: " + _KEY_EVAL,"color:lightgreen") ;
	return __void;
}

/*--------------------
* load library
* option charset : NYI
-------*/
var _KNOWN_LIBS = ["plot.lib","math.lib","bigint.lib","words.lib","web.lib","struct.lib","timer.lib"];
var _LIB = {}; // loaded

var _require = function (name) {
	name = '' + name;
	if(! _LIB[name])
		glisp_error(70,name,"require")
	return _true;
}

var _lib = function(name, mute) {
	var element;
	name = '' + name;
	if (_LIB[name]) {
		writeln("lib: " + name + " already here.");
		return __void;
		}
	if(_KNOWN_LIBS.indexOf(name) === -1)
		writeln("Unknown lib name: " + name,"color:orange");
//glisp_trace("loading",name,"lib");
	try {
    element = document.createElement("script");
    element.src = "./js/" + name + ".js";
    if(name.indexOf(".fr") > 0 ) element.charset = "ISO-8859-1"; // try
    document.body.appendChild(element); 
    
    var t0 = Date.now();
    var progress = function () {
    	if (_LIB[name])
			writeln("Lib: " + name + " loaded.","color:lightgreen");
		else if((Date.now() - t0) > 5000 )	
    		 writeln("Error when loading: "+name,"color:red");
    	else setTimeout(progress,200) ;
    	}
    progress();
    return __void ;
    }
    catch (err) {
    writeln("lib:load:" + err.name + ' : ' + err.message,'color:red');
    return __void ;
    }
}


/**************
U T I L I T I E S
*/

Storage.prototype.setObj = function(key, obj) {
    return this.setItem(key, JSON.stringify(obj))
}

Storage.prototype.getObj = function(key) {
    return JSON.parse(this.getItem(key))
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
  
  elimg.src = "./images/b5.jpg" ; // Xparent NYI
  
// center it
  var width = 400; // final width (innerWidth gives actual)
  dlg.style.top = '' +  Math.floor(window.innerHeight/4) + 'px';
  dlg.style.left = '' + Math.floor((window.innerWidth - width)/2) + 'px' ;
  
  elmsg.innerHTML = msg;
  dlg.style.backgroundColor = color;
  dlg.style.visibility = "visible";
  dlg.classList.add('overlay-zoom');
  setTimeout(dlgHide,5000);
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
	case 'EXEC' :  stdin_eval(); break;
	// doInit() does not work because packages
	case 'RESET' : if(confirm("Reload EchoLisp: OK?")) location.reload() ; break; 
	case 'CLEAR' :  stdin.value = "" ;  stdout_clear(); break;
				  

	case 'PRINTER' : 
			var printerImg = document.getElementById('printer-img');
			var printer = document.getElementById('printer');
			toggle_visibility(printer);
			_UI.printer = ! _UI.printer;
			printerImg.src = (_UI.printer)? "./images/printer-on.png" : "./images/printer-off.png" ;
			break;
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
function stdpanel_write (line,style) {
line = line.replace(/\\n/g," | ");
if(style)
	stdpanel.innerHTML = "<span style='"  + style + "'>" + line + "</span>" ;
	else stdpanel.innerHTML = line;
}

/**********************
H E L P window
*************** */
var _HelpWin = null;
function glisp_help(url) {
url = url || "./help.html" ;
		if(_HelpWin) _HelpWin.close(); // not Chrome needed test me NYI
		_HelpWin = window.open(url,"HelpWin");
		_HelpWin.focus();
}

/****************
S T D I N
********/
/*
I've just faced same problem. There is at least one difference Chrome handles the keypress and keydown/keyup events. keypress event in Chrome is not fired for arrow keys, whereas for keydown and keyup it is.
*/

function codeKeyDown(e) {
        if (typeof e === 'undefined' && window.event) { e = window.event; }
        var key = e.keyCode;
//console.log("KEYDOWN code/char",e.keyCode,e.charCode);
//        if (e.keyCode === 8)   stdin_autocomplete_undo(); // backspace
//        if (e.keyCode === 46)  stdin_autocomplete_stop(); // suppr
// _TAB and arrows
        if 
        (key === 33 ||key === 34 || key === 35 || key === 36  || key === 27 
        	|| (key === 46 && stdin_clear()) // suppr with no select
        || key === 9
        	|| (( key === 9 || key === 39) && _auto_last_matcher)) {
         e.stopPropagation();
         e.preventDefault(); 
         return false; 
         }// recall last
    
	} // DOWN
  
// ( ) are 40/41 [] are 91/93  "->" is keyCode 39
function codeKeyPress(e) { // $=36, !=33
var stdin = document.getElementById('stdin');
var enter = false;
// console.log("KeyPress",e.charCode,e.keyCode, e.ctrlKey,e.altKey,e.shiftKey,e.metaKey,_KEY_EVAL );
        if (typeof e === 'undefined' && window.event) { e = window.event; }
		if(e.charCode === 41) stdin_blink('(',')');
		if(e.charCode === 93) stdin_blink('[',']');
		if(e.charCode === 0 && e.keyCode === 13 && _KEY_EVAL === 13) enter = true; // Ffox
		if(e.charCode  === _KEY_EVAL) enter = true;
		if(enter && (e.shiftKey || e.ctrlKey || e.altKey)) return; // Maj-Enter
		if(enter && ! stdin_well_formed()) return; // missing pars
		if(enter) {  
        				stdin_eval();  // $ = 36 : EXEC
						e.preventDefault();
						return false;
					}
		if(e.charCode === 63 && stdin.value.length <= 1) { // ?
							stdin_help();
							e.preventDefault();
							return false;
							}
		if(e.charCode === 99 && e.ctrlKey) stdin_ctrl_c();
		
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
        if (key === 27)  stdin_escape(); // && _LIB["plot.lib"])   plot_toggle();
        
        if (key === 9)   stdin_tab();
        if (key === 39)  stdin_right_arrow(); // ->  only if autocomplete
        	
         if 
        (key === 33 ||key === 34 || key === 35 || key === 36  || key === 27
        	|| key === 46
    || key === 9
        	|| (( key === 9 || key === 39) && _auto_last_matcher)) {
         e.stopPropagation();
         e.preventDefault(); 
         return false; 
         }// recall last
         
    } // UP
/*
* S T D I N
*/
var stdin; // glisp DOM element
var hiliter = null;
var sysin = {
	lines : new Array(),
	last : 0,
	clear : true,
	prompt : ''
	} ;
	
function stdin_help() {
	glisp_help();
	stdin.value = "";
}

function stdin_escape() {
 if (_LIB["plot.lib"])   plot_toggle();
}
function  stdin_ctrl_c() {
 _COMPUTING = _PLOTTING = false; // stop ops
}

function stdin_clear() { // suppr key
// console.log("clear",stdin.selectionStart,stdin.selectionEnd);
  if( stdin.selectionStart === stdin.selectionEnd) {
  			stdin.value = "";
  			 return true ;}
  	return false; 
}

function stdin_put(text) {
		stdin = document.getElementById('stdin');
		stdin.value = text ;
		sysin.clear = false;
}

function stdin_histo(disp) { // history call
		stdin = document.getElementById('stdin');
		var nlines = sysin.lines.length;
		if(nlines <= 0 ) return;
		
		sysin.last += disp;
		if   (disp === -666) sysin.last = 0;
		else if(disp === 666) sysin.last = nlines-1;
		else  if(sysin.last < 0) sysin.last = 0;
		else  if(sysin.last >= nlines) sysin.last = nlines-1 ;
		stdin.value = sysin.lines[sysin.last] ;
}

/////////////////
// ()  & [] BLINK
///////////////////
function stdin_hilite_clear() {
	hiliter.innerHTML = _NBSP;
	stdin_autocomplete_start();
}

function stdin_well_formed() { // count () before ENTER
	var i, str= stdin.value, pars = 0, lg= str.length, instring = false;
	for(i=0;i < lg; i++) {
		if(str[i] === '"') instring= ! instring;
		if(instring) continue;
		
		if(str[i] === '(' || str[i] === '[') pars++;
		else if(str[i] ===')' || str[i] === ']') pars--;
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
		hiliter = hiliter || document.getElementById("hiliter");
		
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
	
function stdin_tab() {
	if(! _auto_last_matcher) {
				stdin.value = stdin.value + "    " ;
				return; }
	stdin.value += _auto_last_matcher + " " ;
	hiliter.innerHTML = _NBSP;
}

function stdin_right_arrow() {
	if(! _auto_last_matcher) return;
	_auto_choice++;
	stdin_autocomplete();
}

// prevent pattern \"abc$  
// will be strange in (define ...)
function stdin_autocomplete () {
if(_auto_stopped) return;
	var regexp;

	stdin = document.getElementById('stdin');
	hiliter = hiliter ||   document.getElementById('hiliter'); 
	hiliter.innerHTML = _NBSP;
	_auto_last_matcher = null;
	
// forbidden cases
	if(stdin.value.indexOf("\"") !== -1) return; // in string

	var trailer_exp = /([a-z|A-Z|\-]*)$/; // ... (spaces)* abc EOL
	var words = trailer_exp.exec(stdin.value);
	var trailer = words[1];
	if(! trailer || trailer.length === 0) return;
	
	if( trailer.length === 1 ) return ; // too short : too many matches
	
	// look for it
	regexp = new RegExp ("^" +  trailer,"i"); // case insensitive
	var matches =  glisp_matcher_symbols(regexp,glisp.user) ; // look in  user+global
	
	if(!matches || matches.vector.length === 0 ) return;
	if(matches.vector.length > 1) { info(glisp_message(matches,"")) ; /*return;*/}
	if(_auto_choice >= matches.vector.length) _auto_choice = 0;
	var matcher = matches.vector[_auto_choice] ;
	
//console.log("trailer",trailer,"matcher",matcher);
	if(matcher === trailer) return;
// trailer = envir
// matcher = environment
	_auto_last_matcher = matcher.substring(trailer.length);
// matcher =  "onment" : to append
	var str = stdin.value ;
	str = str + "<span_class='complete'>" + _auto_last_matcher + "</span>";
	str = str.replace(/(\r\n|\n|\r)/gm,"<br>"); // check ME NYI
	str = str.replace(/\s/g,_NBSP);
	str= str.replace(/span_/g,"span ");
//console.log("stdin:blink",str);
	hiliter.innerHTML = str;
	
} // stdin_autocomplete

/*
function stdin_autocomplete_undo() { // Backspace key (not in timer)
console.log("in undo");
	stdin_autocomplete_stop();
	if(_auto_last_replace == stdin.value) 
		{
		console.log("undo replace",_auto_last_replace,"by",_auto_last_line);

		stdin.value = _auto_last_line ;
		_auto_last_replace = null;
		}
		
	if(stdin.value.length === 0 || stdin.value === "(") // pattern best NYI
			stdin_autocomplete_start();
}
*/
function stdin_autocomplete_stop() {
	_auto_stopped = true;
	clearInterval(_auto_timer);
	_auto_timer = null;
	_auto_choice = 0; 
}


/*--------------------
I N P U T
-------------------------*/

function stdin_adjust () { // use ? check me NYI

	stdin = document.getElementById('stdin');
	var wrapper =  document.getElementById('wrapper');
	hiliter =  document.getElementById('hiliter');
	var h =window.getComputedStyle(stdin).height;
	wrapper.style.height = h;
	hiliter.style.height = h ;
/*
	var w  =window.getComputedStyle(stdin).width;
console.log("stdin adjust",h,w);
	wrapper.style.width = w;
	hiliter.style.width = w;
*/
}

function stdin_remember() { // last 16
var numl = sysin.lines.length;
	if(stdin.value.length <= 1) return;
	if(numl  &&  sysin.lines[numl-1] === stdin.value) return;
	if(numl > 15) sysin.lines.shift(); 
	sysin.lines.push(stdin.value);
	sysin.last = sysin.lines.length - 1 ;
}
	
function stdin_delete_enter_key () {
if(_KEY_EVAL === 13) return ;
	var reg = "\\x" + _KEY_EVAL.toString(16) ;
	var exp = new RegExp(reg,"g");
	stdin.value= stdin.value.replace(exp,"");
}


function stdin_eval() { // called by [Eval]Key or Eval button 
	if(_PLOTTING || _COMPUTING) { wrileln ("Busy..","color:orange"); return; }
	var rc ;
// if(glisp.something === null) {doInit(); writeln("reboot..");} // SAFARI ipad
	stdin = document.getElementById('stdin');
	if(stdin.value.length === 0) return;
	

	stdin_delete_enter_key () ;
	
	sysin.clear = true; // default : wants clear sysin after eval
	if(_UI.tty_echo) 
		writeln(stdin.value ,'color:lightgray;font-style:italic;'); // ECHO
		
			
// JS debug ?					
	if(stdin.value.charAt(0) === '€' && stdin.value.length > 0) { // javascript eval debug
		var ret = '' + eval(stdin.value.substring(1));
		writeln(ret,'white');
		stdin.value = '€'; //  for next command
		} // js eval
	
	else { // glisp eval
	rc = glisp_top(stdin.value); // read/eval/print
	stdin_remember(); // last  command (OK or not)
	if(rc === 0) {
			if(sysin.clear) stdin.value = "" ; // clear for next command
			}
		else stdin_delete_enter_key () ; 
	}
	
	window.setTimeout(function() {stdin.focus();}, 100);
	stdin_autocomplete_start();
} // stdin_eval

/****************
S T D O U T
**************/
/*
<script type="text/javascript" >

var textArea = document.getElementById('outputTextResultsArea');
textArea.scrollTop = textArea.scrollHeight;
</script>
*/

var stdout; // global: element
var sysout = {
		lines : new Array() ,
		styles: new Array() ,
		maxlines : 24 , //<--  (tty-lines nn)
		height : 0, // tty resize
		buf : ""
		} ;
		
// writeln : input jstring, no HTML
// writelen(' ') is (newline)

function writeln(line,style) {
		stdout = document.getElementById('stdout');
		
// split new lines
		var lines = line.split("\\n"); // (values ..) output
		if(lines.length > 1) {
			for(var i=0; i< lines.length;i++)
				writeln(lines[i],style);
		return;
		}
		
		var lineHeight =  parseFloat(window.getComputedStyle(stdout).lineHeight) ;
		var winHeight =  stdout.offsetHeight;
		// dynamic adjust : see (tty-lines nn)

		while (sysout.lines.length >=  sysout.maxlines) {
				sysout.lines.shift();
			    sysout.styles.shift();}
			    
// mask html tags
		var outline = line.replace(/</g,'&lt;').replace(/>/g,'&gt;')  ;
			       //  .replace(/\\n/g,'<br>') ; // printer NYI
			       
		sysout.lines.push(outline);
		sysout.styles.push(style);
		var text = '<span id = "outlines">'; 
		for (var i= 0; i< sysout.lines.length; i++)
		if(!sysout.styles[i])
			text += sysout.lines[i] + '<br>' ;
			else
			text+= "<span style='" + sysout.styles[i]  +"'>"
						 +sysout.lines[i]
						 + "</span><br>";
			text += "</span>" ;
		stdout.innerHTML = text ;

	var outlines = document.getElementById("outlines");
	var outHeight = outlines.offsetHeight;
// console.log("outHeight",outHeight,winHeight,line.length);

// overflow: suppress lines fifo style
	if(outHeight && winHeight) // pb in plot mode
	if(outHeight >= winHeight && sysout.lines.length > 1) {
		sysout.lines.shift();
		sysout.styles.shift();
		sysout.lines.pop();
		sysout.styles.pop();
		writeln(line,style);
	}
	
	if(outHeight && winHeight)
	if(outHeight >= winHeight && sysout.lines.length <=  1) { // cut half size
		var lg = line.length;
		var start = Math.floor(lg * 0.25); // cut interval
		var end = Math.floor(lg * 0.75);
// console.log("CUT",start,end,lg,outHeight,winHeight);
		for(;start < lg ; start++) if(line[start] === ' ') break;
		for(;end > 0; end--) if(line[end] === ' ') break;
//		console.log("CUT",start,end,lg);
		if(end > start) {
						sysout.lines = [];
						sysout.styles= [];
						line= line.substring(0,start+1) + " [...] " + line.substring(end) ;
						writeln(line,style);
						}
	} // cut

// console.log(stdout.offsetHeight, sysout.maxlines, window.getComputedStyle(stdout).lineHeight);
} // writeln

function stdout_flush(line)  {
	line = sysout.buf + line;
	if(line === "") return ;
	writeln(line);
	GPrinter.write(line);
	sysout.buf = ""; 
}

function stdout_cat( str) { // accumulates
	sysout.buf += str + " " ;
}

function stdout_clear() {
	stdout = document.getElementById('stdout');
	stdout.innerHTML = _NBSP ;
	sysout.lines = new Array();
	sysout.styles = new Array();
	sysout.buf = "" ;
	writeln(_VERSION + "  (? for help)");
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
function glisp_status(dt) {
text='' ;
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
	glisp_status(0);
	// window.scrollTo(0,0);
	logo_new('red.jpg'); // busy
	
	if(_PLOTTING)   {writelen("PLOTTING",'color:red'); return 68;}
	if(_COMPUTING)  {writelen("COMPUTING",'color:red'); return 68;} // NYI DBG

	glisp.ncycle = 0 ;
	glisp_rep(line); // read/eval/print
	if(glisp.stopped) writeln('Stopped.','color:red');
	// do'nt clear command line if glisp.error 
	if(glisp.error)
		logo_new('orange.jpg') ;
		else { 
				logo_new('green.jpg');
				glisp_status(Date.now() - t0);
				}
	return glisp.error; 
} // TOP !!!

/****************
* I N I T ( CMD-R)
*************/
function doInit()  {//  Reload user last user words
localStorage.setObj("ECHOLALIE-ECHOLISP-APPNAME",_VERSION) ;
glisp_init(); // boot sysfuns and sets env glisp.user

logo_new('green.jpg'); // green
_PLOTTING = _ANIMATING = _COMPUTING = false;
	stdin = document.getElementById('stdin');
	stdpanel = document.getElementById('stdpanel');
	stdout = document.getElementById('stdout');
	stdin.onkeydown = codeKeyDown;
	stdin.onkeypress = codeKeyPress;
	stdin.onkeyup = codeKeyUp;
	stdin.value = '';
	stdin_autocomplete_start();
	stdout_clear();
	dlgShow(_VERSION,"lightblue");
	stdin.focus();
	glisp_preferences(); // load if any
} // RELOAD

function doSlider(num, value) {
	if(! _LIB["plot.lib"]) return;
	__plot_slider(num, value);
}
function doPlotReset() {
	if(! _LIB["plot.lib"]) return;
	__plot_button_reset();
}


window.onload = doInit;
window.onresise = stdin_adjust;





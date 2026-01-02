/*
EchoLisp interace.lib
© G. Brougnard, Simon Gallubert, Jacques Tramu 2016
*/

// http://www.alsacreations.com/tuto/lire/1409-formulaire-html5-type-number.html

function ui_top_click(ev,ui) {
	set_stdin(__cell_stdin(ui.parentNode)) ; // && stdout
	ev.stopPropagation();
	ev.preventDefault();
	return false;
	}
	
/*---------------
UI API
---------------------*/
var _stdin = function () {
	return stdin;
	}
var _stdout = function () {
	return stdout;
	}
var _ui = function () {
	return get_UI();
}

var _ui_get_element = function(id) {
	return document.getElementById(nameToString(id,"ui-get-element"));
}

var _ui_attributes = function(elem) {
	if(typeof elem !== "object") glisp_error(153,elem,"ui-attributes") ;
	var attrs = elem.attributes;
	attrs = Array.prototype.slice.call(attrs);
	var props = [] ;
	attrs.forEach (function (item) {props.push( [item.name,[item.value,null]])} ) ;
	return __array_to_list(props) ; // A TESTé
}
	
var _ui_create_element = function (tag, props) {
var elem, propval;
	tag = nameToString(tag,"ui-create-element");
	if (! isListOrNull(props)) glisp_error(20,props,"ui-create-element");
	elem = document.createElement(tag) ;
	while(props) {
		propval = props[0];
		if (notIsList(propval)) glisp_error(20,propval,"ui-create-element:property");
		_ui_set_attribute(elem,propval[0],propval[1][0]);
		props = props[1];
		}
	elem.classList.add("uielement");
	return elem ;
}

// setters 

var _ui_set_attribute = function (elem, attr, val) {
	if(typeof elem !== "object") glisp_error(153,elem,"ui-set-attribute") ;
	attr = nameToString(attr,"ui-set-attribute");
	if(! (typeof val === "number")) val = nameToString(val,"ui-set-attribute") ;
	elem.setAttribute(attr, '' + val); // num???
	return elem.getAttribute(attr); // check
}

var _ui_set_style = function (elem, attr, val) {
	if(typeof elem !== "object") glisp_error(153,elem,"ui-set-style") ;
	attr = nameToString(attr,"ui-set-style");
	if(! (typeof val === "number")) val = nameToString(val,"ui-set-style") ;
	elem.style[attr] = '' + val; 
	return elem.style[attr]; // check
}

var _ui_get_style = function (elem, attr) {
	if(typeof elem !== "object") glisp_error(153,elem,"ui-get-style") ;
	attr = nameToString(attr,"ui-get-style");
	return elem.style[attr]; 
}

var _ui_set_html = function(elem, html) {
	elem.innerHTML = html;
	return html;
}
var _ui_set_value = function (elem, val) {
	return (elem.value = '' + val) ;
}

var _ui_clone = function (elem) {
	if(typeof elem !== "object") glisp_error(153,elem,"ui-clone") ;
	return elem.cloneNode(true) ;
}

var _ui_set_name = function (elem, name) {
	if(typeof elem !== "object") glisp_error(153,elem,"ui-set-name") ;
	name = nameToString(name,"ui-set-name");
	return (elem.dataset.name = name) ;
}
var _ui_get_name = function (elem) {
	if(typeof elem !== "object") glisp_error(153,elem,"ui-get-name") ;
	name = nameToString(name,"ui-get-name");
	return elem.dataset.name || elem.toString();
	}


//  document.getElementById("myDiv").style["marginTop"] = "0px";
// getters

var _ui_get_attribute = function (elem, attr) {
	return elem.getAttribute(nameToString(attr,"ui-get-attribute"));
}
var _ui_get_value = function (elem) {
	if(typeof elem !== "object") glisp_error(153,elem,"ui-get-value") ;
	return elem.value ;
}
var _ui_get_numvalue = function (elem) {
	var val =  parseFloat(elem.value);
	if(isNaN(val)) return _false ;
	return val;
}

// appearance
var _ui_disable = function (elem,what) {
	if (typeof elem !== "object") glisp_error(153,elem,"ui-disable") ;
	elem.disabled = (what === _false) ? false : true ;
	return __void;
}
var _ui_focus = function (elem) {
	if (typeof elem !== "object") glisp_error(153,elem,"ui-focus") ;
	elem.focus();
	return __void;
}

// events
var _ui_on_change = function (elem , f ) {
	if(typeof elem !== "object") glisp_error(153,elem,"ui-on-change") ;
	f = checkProc(f,2,2,"ui-on-change") ;
	elem.addEventListener (
		"change" ,
		function(ev) {
		 // set_stdin(__cell_stdin(elem.parentNode.parentNode)) ; // && stdout
		 var val = this.value;
		 var call = [f,[this,[null,null]]] ;
		 if (! isNaN (parseFloat(val))) val = parseFloat(val); // DUBIOUS, really
		 call[1][1][0]= val;
		 __ffuncall(call,glisp.user);
		  ev.stopPropagation();
		} ,
		false) ;
	return elem;
}

var _ui_on_click = function (elem , f ) {
// console.log("ui-clicked",elem);
	if(typeof elem !== "object") glisp_error(153,elem,"ui-on-change") ;
	f = checkProc(f,1,1,"on-click") ;
	elem.addEventListener ( 
		"click" ,
		function(ev) {
		//  set_stdin(__cell_stdin(elem.parentNode.parentNode)) ; // && stdout
		 var call = [f,[this,null]] ;
		 __ffuncall(call,glisp.user);
		  ev.stopPropagation();
		} ,
		false) ;
	return elem;
}

// https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Forms/Data_form_validation
// see elaborated CSS

var _ui_on_focus = function (elem , f ) {
	if(typeof elem !== "object") glisp_error(153,elem,"ui-on-focus") ;
	f = checkProc(f,1,1,"ui-on-focus") ;
	elem.addEventListener ( 
		"focus" ,
		function(ev) {
		 // set_stdin(__cell_stdin(elem.parentNode.parentNode)) ; // && stdout
		 var call = [f,[this,null]] ;
		 __ffuncall(call,glisp.user);
		  ev.stopPropagation();
		} ,
		false) ;
	return elem;
}

var _ui_on_blur = function (elem , f ) {
	if(typeof elem !== "object") glisp_error(153,elem,"ui-on-blur") ;
	f = checkProc(f,2,2,"ui-on-blur") ;
	elem.addEventListener ( 
		"blur" ,
		function(ev) {
		 // set_stdin(__cell_stdin(elem.parentNode.parentNode)) ; // && stdout
		 var call = [f,[this,[this.value,null]]] ;
		 __ffuncall(call,glisp.user);

		  ev.stopPropagation();
		} ,
		false) ;
	return elem;
}


// managing elements inside ui of stdin cell

var _ui_add = function (elem) { // last
	if(typeof elem !== "object") glisp_error(153,elem,"ui-add") ;
	var ui = get_UI(); // of stdin
	__toggle_visibility(ui,"true");
	ui.appendChild(elem);
	return elem;
}

var _ui_clear = function () {
	var ui = get_UI();
	__elem_remove_children(ui) ;
	__toggle_visibility(ui,"false");
	return __void ;
	}
	
var _ui_remove = function (elem) {
	var ui = elem.parentNode;
	ui.removeChild(elem);
	return __void;
}

var _ui_hide = function (elem, what) { 
	if(typeof elem !== "object") glisp_error(153,elem,"ui-hide") ;
	__toggle_visibility(elem, (what === _false)  ? "false" : "true");
	return _void ;
}

var _ui_insert_before = function (elem , ref) {
	ref.parentNode.insertBefore(elem,ref) ;
	return _void ;
}
var _ui_insert_after = function (elem , ref) {
	insertAfter(elem,ref);
	return _void ;
}


function boot_interfacelib() {
		define_sysfun(new Sysfun ("ui.ui-attributes",_ui_attributes,1,1));
		define_sysfun(new Sysfun ("ui.ui-get-element",_ui_get_element,1,1)); // by Id DOC NYI
		
		define_sysfun(new Sysfun ("ui.ui-create-element",_ui_create_element,2,2)); // (tag (props))
		define_sysfun(new Sysfun ("ui.ui-get-attribute",_ui_get_attribute,2,2));
		define_sysfun(new Sysfun ("ui.ui-get-value",_ui_get_value,1,1));
		define_sysfun(new Sysfun ("ui.ui-get-numvalue",_ui_get_numvalue,1,1));
		define_sysfun(new Sysfun ("ui.ui-get-style",_ui_get_style,2,2));
		
		define_sysfun(new Sysfun ("ui.ui-set-attribute",_ui_set_attribute,3,3));
		define_sysfun(new Sysfun ("ui.ui-set-style",_ui_set_style,3,3));
		define_sysfun(new Sysfun ("ui.ui-set-value",_ui_set_value,2,2));
		define_sysfun(new Sysfun ("ui.ui-set-html",_ui_set_html,2,2));
		
		define_sysfun(new Sysfun ("ui.ui-set-name",_ui_set_name,2,2));
		define_sysfun(new Sysfun ("ui.ui-get-name",_ui_get_name,1,1));
		
		define_sysfun(new Sysfun ("ui.ui-clone",_ui_clone,1,1));
		define_sysfun(new Sysfun ("ui.ui-add",_ui_add,1,1));
		define_sysfun(new Sysfun ("ui.ui-insert-after",_ui_insert_after,2,2));
		define_sysfun(new Sysfun ("ui.ui-insert-before",_ui_insert_before,2,2));
		define_sysfun(new Sysfun ("ui.ui-hide",_ui_hide,1,1));
		define_sysfun(new Sysfun ("ui.ui-remove",_ui_remove,1,1));
		define_sysfun(new Sysfun ("ui.ui-clear",_ui_clear,0,0));
		
		define_sysfun(new Sysfun ("ui.ui-on-change",_ui_on_change,2,2));
		define_sysfun(new Sysfun ("ui.ui-on-click",_ui_on_click,2,2));
		define_sysfun(new Sysfun ("ui.ui-on-focus",_ui_on_focus,2,2));
		define_sysfun(new Sysfun ("ui.ui-on-blur",_ui_on_blur,2,2));
		
		define_sysfun(new Sysfun ("ui.ui-focus",_ui_focus,1,1));
		define_sysfun(new Sysfun ("ui.ui-disable",_ui_disable,2,2));

		define_sysfun(new Sysfun ("ui.stdin",_stdin,0,0));
		define_sysfun(new Sysfun ("ui.stdout",_stdout,0,0));
		define_sysfun(new Sysfun ("ui.ui",_ui,0,0));
		
     	_LIB["interface.lib"] = true;
     	writeln("interface.lib v1.14 ® EchoLisp","color:green");
     	}

boot_interfacelib();
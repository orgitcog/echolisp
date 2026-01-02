// "use strict";

var ___mode = (eval("var __temp = 666"), (typeof __temp === "undefined")) ? 
    "strict": 
    "non-strict";
console.log ("*MODE*" , ___mode);

/*---------------
wksheet globals
---------------------*/
var _WK_NAME = null ; // name string
const _STDIN_HEIGHT = 48 ;

/*-----------------
mouse over stdout
------------------------*/
function stdout_click(evt,elem) {
        var rect = elem.getBoundingClientRect();
        var x = evt.clientX - rect.left;
        var y = evt.clientY - rect.top;
		if( x < 30) stdout_hide(elem);
		evt.stopPropagation();
		return false;
}

function stdout_move(evt,elem) {
        var rect = elem.getBoundingClientRect();
        var x = evt.clientX - rect.left;
        var y = evt.clientY - rect.top;
        elem.style.cursor =  (x < 30) ? 'zoom-out' : 'auto' ;
        evt.stopPropagation();
        return false;
}


/*-----------
cell getters

DOM  :: = brother,  -> = son
cell ->  btns  (-> btn :: btn::) :: wrapper ( -> stdin :: hiliter ) :: stdout :: xstdout [graph 0:1]
graph := sliders (-> slider :: slider ..)  :: canvas
cell.data-plotter = graph-name #g:xxx

OBJECTS  
Plotter.name = graph-name
Plotter.graph = graph element
Plotter.sliders = sliders elem

GLOBAL
GPlotters[graph-name] = graph element

------------------*/
function get_Children (elem) {
if(typeof elem === "string") elem = document.getElementById(elem);
elem = get_firstChild(elem) ;
var i = 0;
	while(elem) {
	console.log(i++,elem);
	elem = get_nextSibling(elem);
	}
	return i ;
}

function __elem_remove_children (elem) {
if(elem === null) return;
	var child= get_firstChild(elem);
		while(child) {
		elem.removeChild(child);
		child = get_firstChild(elem);
		}
}

// get a child by name  : data-name = '...'
function get_Child(elem,name) {
	elem = get_firstChild(elem) ;
	while(elem) {
		if(elem.dataset.name === name) return elem ;
		elem =get_nextSibling(elem);
		}
	return null ;
}

function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, get_nextSibling(referenceNode));
}

function __toggle_visibility(e , force) {
       if(e === null) return;
       if(force === "true")  { e.style.display = 'block'; e.dataset.hidden = "false" ;return;}
       if(force === "false") { e.style.display = 'none';  e.dataset.hidden = "true"; return;}
       if(e.style.display === 'block' || e.style.display === "" )
          { e.style.display = 'none';  e.dataset.hidden = "true"; return;}
       else
         { e.style.display = 'block'; e.dataset.hidden = "false" ;return;}
    }  // toggle_visibility(elem)

function __click_cell0() {
	var cells = document.getElementById("cells");
	var cell0 = get_firstChild(cells);
	set_stdin(__cell_stdin(cell0));
	return cell0;
}

function get_UI () { // of stdin
	return get_Child(stdin.parentNode.parentNode,"ui");
}

function __btn_cell ( btn) {
	return btn.parentNode.parentNode ;
	}
	
function __cell_show_button(cell, n, on ) {
	var  btns = get_firstChild(cell) ;
	var btn = get_firstChild(btns);
	while(btn && n--) btn = get_nextSibling(btn);
	if(! btn) return;
	if(on)	btn.style.display = 'inline';
			else   btn.style.display = 'none' ;
}

function __cell_set_button(cell,n,text) {
	var  btns = get_firstChild(cell) ;
	var btn = get_firstChild(btns);
	while(btn && n--) btn = get_nextSibling(btn);
	if(! btn) return;
	btn.innerHTML = text;
}
	
function __cell_wrapper(cell) {
	var  btns = get_firstChild(cell) ;
	return get_nextSibling(btns);
}

function __cell_stdin(cell) {
	return  get_firstChild(__cell_wrapper(cell));
}

function __cell_stdout(cell) {
	return  get_Child(cell,"stdout");
}
function __cell_xstdout(cell) {
	return  get_Child(cell,"xstdout") ;
}

function __cell_graph(cell) {
	return get_Child(cell,"graph");
}
function __cell_ui(cell) {
	return get_Child(cell,"ui");
}



// boot time or new worksheet or open worksheet
function __init_cells() {
	var cells = document.getElementById("cells");
	var cell0 = get_firstChild(cells);
	var cell = get_nextSibling(cell0);
	var graph0 = __cell_graph(cell0);
	var ui0 = __cell_ui(cell0);
	
		while(cell) {
			cells.removeChild(cell);
			cell = get_nextSibling(cell0);
			}
			
	if(graph0) { cell0.removeChild(graph0) ; GPlotter = null; }
	 __elem_remove_children(ui0); 
	 __toggle_visibility(ui0,"false");
	
	cell0.dataset.console = "true" ;
	__cell_update_buttons(cell0);
	set_stdin(); // null to force first
	stdout_clear(); // version
	stdin.value = "" ;
	stdin_adjust(_STDIN_HEIGHT) ;
	}
	
// 🔻 📦 💾 🔳  🔲  📌 💻 📠 📜 
function __cells_update_buttons()  {
	var cell = get_firstChild(cells);
	while(cell) {
		__cell_update_buttons(cell) ;
		cell = get_nextSibling(cell);
	}
}

function __cell_update_buttons(cell) {
	var cell0 = get_firstChild(cells);
	var maximized =  (cell.dataset.hidden === "false") ;
	for (var b=1; b < 5 ; b++) 
			__cell_show_button(cell,b,maximized);
			
	// header text info
		if(maximized) __cell_show_button(cell,5,false);
		else {
			header = __cell_stdin(cell).value + "\n" ;
			header =  header.substr(0, header.indexOf("\n"));
			__cell_set_button(cell,5,header);
			__cell_show_button(cell,5,true);
			}
	
	
	// set first button
	if(maximized)
		{
		__cell_set_button(cell,7,"⚪️&nbsp;") ;
		__cell_show_button(cell,3,_LIB["plot.lib"]);
		}
		else
		__cell_set_button(cell,7,"🔵&nbsp;") ;
		
	if (cell.dataset.console === "true")
		__cell_set_button(cell,0,"📠 ") ;
		else
		__cell_set_button(cell,0,"📌 ") ;
	
	if(cell === cell0) 
		__cell_show_button(cell0, 6, false); //  delete btn
		else
		__cell_show_button(cell, 6, true);
		
	__cell_show_button(cell,8, _LIB["plot-3d.lib"] && g3D && __cell_stdin(cell) === stdin) ;
}
	
// sets shox graph && sets GPlotter
function __cell_focus_plotter(cell) {
	if(! _LIB["plot.lib"]) return;
	var graph = __cell_graph(cell) ;
	if( ! graph) return ;
	__toggle_visibility(graph,"true") ;
	var plotter = GPlotters[cell.getAttribute("data-plotter")] ;
	if(plotter)  GPlotter = plotter ;
	else  {
glisp_error(1,"undef plotter","plotter");
}
	return plotter;
}

// new cell with contents (do'nt activate)
function __cell_open(text) {
	var  cell = stdin.parentNode.parentNode;
	var  newcell = cell.cloneNode(true); // cloning current one
	__cell_stdin(newcell).value = text ;
	__cell_stdout(newcell).innerHTML = _NBSP;
	newcell.dataset.console = "false" ; 
	__cell_update_buttons(newcell);
	insertAfter(newcell,cell);
	return newcell;
}

/*-------------------
mouse clicks
---------------------------*/
function stdout_hide(elem) {
	var cell = elem.parentNode ;
	__toggle_visibility(__cell_stdout(cell),"false");
	__toggle_visibility(__cell_xstdout(cell),"true");
	__cell_update_buttons(cell);
	}
	
function xstdout_hide(elem) {
	var cell = elem.parentNode;
	__toggle_visibility(__cell_stdout(cell),"true");
	__toggle_visibility(__cell_xstdout(cell),"false");
	__cell_update_buttons(cell);
	}
	
/*------------------------
buttons
var computedFontSize = window.getComputedStyle(document.getElementById("foo")).fontSize;

console.log(computedFontSize);
-------------------------------*/
function cell_add(btn) {
	var cell = btn.parentNode.parentNode ;
	var  newcell = cell.cloneNode(true); // cloning current one
	var stdin =   __cell_stdin(newcell) ;
	var  stdout = get_Child(newcell,"stdout") ;
	
	// remove graph <div> if any
	var graph = get_Child(newcell,"graph");
			if(graph) newcell.removeChild(graph);
	// ui is always here : clear it
	var ui = get_Child(newcell,"ui") ;
			__elem_remove_children(ui);
			
	__toggle_visibility(stdin,"true");
	stdout.innerHTML = _NBSP;
	__toggle_visibility(stdout,"true");
	__toggle_visibility(__cell_xstdout(newcell),"false");
	
	set_stdin(stdin); // focus & global stdin & global stdout
	stdin.value = "" ;
	hiliter.innerHTML = _NBSP;
	stdin_adjust(_STDIN_HEIGHT) ;
	newcell.dataset.console = "false" ; 
	newcell.dataset.hidden = "false" ; 
	__cell_update_buttons(newcell);
	insertAfter(newcell,cell);
	stdin.focus();
	_save_worksheet(); // autosave
	return true;
}

function cell_clear(btn) {
	var cell = btn.parentNode.parentNode ;
	var stdin = __cell_stdin(cell);
	var stdout = __cell_stdout(cell) ;
	stdin.value = "" ;
	stdout.innerHTML = _NBSP;
	stdin_adjust(_STDIN_HEIGHT) ;
	stdin.focus() ;
	__autosave();
}

// 🔴 🔵 ◽️ ▪️ 🔺 🔻 📦 💾 🔳 📌 💻 📠 📜 

function cell_min_max(btn) {
	var cell = __btn_cell ( btn)  ;	
	cell.dataset.hidden =
		(cell.dataset.hidden !== "true") ?   "true" : "false" ;
		__cell_update_buttons(cell) ;
		
	// cell becomes visible - force all visible
	if(cell.dataset.hidden === "false") {
			__toggle_visibility(__cell_wrapper(cell),"true");
			__toggle_visibility(__cell_stdout(cell),"true");
			__toggle_visibility(__cell_xstdout(cell),"false");
			
			set_stdin(__cell_stdin(cell));
			__cell_focus_plotter(cell) ; // if any
			}
	// cell becomes invisible - hide graph
	else  {
			__toggle_visibility(__cell_wrapper(cell),"false");
			__toggle_visibility(__cell_stdout(cell),"false");
			__toggle_visibility(__cell_xstdout(cell),"false");
			__toggle_visibility(__cell_graph(cell),"false");
			
			// find a new one to activate
			cell = get_nextSibling(cell); // activate next
			if(cell && cell.dataset.hidden === "false") {
				set_stdin(__cell_stdin(cell));
				return;
				}
				else __click_cell0(); // dubious- may be hidden
			}
}

function cell_eval(btn) {
	var cell = btn.parentNode.parentNode ;
	set_stdin(__cell_stdin(cell));
	stdin_eval();
	__autosave();
}

function cell_toggle_mode(btn) {
	var cell = btn.parentNode.parentNode ;
	if (cell.dataset.hidden === "true") return cell_min_max(btn);
	cell.dataset.console = (cell.dataset.console === "true") ? "false" : "true" ;
	__cell_update_buttons(cell) ;
	set_stdin(__cell_stdin(cell));
}

function cell_remove(btn) {
// should remove its plotter form GPlotters NYI NYI NYI
	var cells = document.getElementById("cells");
	var cell = btn.parentNode.parentNode ;
	var cell0 = get_firstChild(cells);
	if(cell === cell0) return ; 
	cells.removeChild(cell); 
	__autosave();
}


function cell_toggle_plotter(btn) {

	var cell = btn ? btn.parentNode.parentNode : stdin.parentNode.parentNode ;
	set_stdin(__cell_stdin(cell));

	var graph = __cell_graph(cell) ;
	if (! graph) { // a new one, and make current and visible
			GPlotter = new Plotter(cell);
			}
	else { 
		__toggle_visibility(graph);
		if(graph.dataset.hidden === "false") // activates as current if visible
				GPlotter = GPlotters[cell.getAttribute("data-plotter")] ;
if(GPlotter === undefined) {
glisp_error(1,"undef plotter","plotter");
}
		}
}

function hsliders_click(btn) {
	var graph = btn.parentNode;
	var sliders = get_Child(graph,"sliders");
	__toggle_visibility(sliders);
	btn.innerHTML = (sliders.dataset.hidden === "true") ?  "🔵" :  "⚪️" ;
}

/*-----------------------------
worksheet helpers
-----------------------------------*/
var _WK_SHEET = null ; // js Object
function __set_dirty_worksheet () { // called by <CR> key
	_WK_SHEET = _WK_SHEET || document.getElementById("worksheet");
	 __set_date_edited(new Date()) ;
	 __set_current_worksheet(_WK_NAME,true);
}

function __set_date_edited(date) {
date = date || new Date();
var edited = document.getElementById('edited');
	edited.innerHTML = _date_to_string(date) ;
}

function __set_current_worksheet(name,dirty) {
	_WK_SHEET = _WK_SHEET || document.getElementById("worksheet");
	_WK_NAME = name;
	if(dirty)  name += "*" ;
	_WK_SHEET.innerHTML = name;
}

// returns json  object
function __wksheet_to_json () {
	var json = { name : _WK_NAME, cells : [] , status : [] };
	var cells = document.getElementById("cells");
	var cell = get_firstChild(cells);
		while(cell) {
			json.cells.push(__cell_stdin(cell).value);
			json.status.push(cell.dataset.hidden) ;
			cell= get_nextSibling(cell);
			}
	return json ;
}

// jsonObject to cells
function __wksheet_to_cells(wksheet) {
	var cells = document.getElementById("cells");
	var cell = get_firstChild(cells), newcell;

	 var status = wksheet.status || [] ;
	 wksheet = wksheet.cells; // array of strings
	__init_cells(); // set cell0 params
	__cell_stdin(cell).value = wksheet[0];
	__cell_stdout(cell).innerHTML = _NBSP;
	
	for(var c=1; c < wksheet.length ; c++) {
		newcell = cell.cloneNode(true);
		insertAfter(newcell,cell);
		__cell_stdin(newcell).value = wksheet[c];
		__cell_stdout(newcell).innerHTML = _NBSP;
		newcell.dataset.console = "false" ;
		
		// status === hidden ? "true" : "false"
		if (! status[c] || status[c] === "true") {
			newcell.dataset.hidden = "true" ;
			__toggle_visibility(__cell_wrapper(newcell),"false");
			__toggle_visibility(__cell_stdout(newcell),"false");
			}
		else {
				 newcell.dataset.hidden = "false" ;
				__toggle_visibility(__cell_wrapper(newcell),"true");
				__toggle_visibility(__cell_stdout(newcell),"true");
			}
			
		__toggle_visibility(__cell_xstdout(newcell),"false");
		__toggle_visibility(__cell_graph(newcell),"false");
		__cell_update_buttons(newcell) ;
		cell = newcell ;
		}
}

// async call inside loadXMLFile
function __worksheet_import(jsonstr) {
	var name, wksheet ;
	try {
	 	wksheet = JSON.parse (jsonstr);
		name = wksheet.name ;
		__set_date_edited(null) ;
// fill cells
		__wksheet_to_cells(wksheet) ;
		__set_current_worksheet(name);
		return _true;
		} catch(e) {
		console.log("Worksheet parsing error",e);
		writeln("Cannot parse JSON worksheet file","color:red");
		return _false;
		}		
}

/*-----------------------------
worksheet API
-----------------------------------*/
var _plot_on = function () { 
	var cell =  stdin.parentNode.parentNode ;
	var graph = __cell_graph(cell) ;
	if (! graph) { // a new one, and make current and visible
			GPlotter = new Plotter(cell);
			}
	else { 
		__toggle_visibility(graph,"true");
		GPlotter = GPlotters[cell.getAttribute("data-plotter")] ;
		}
}

var _plot_off = function () {
	var cell =  stdin.parentNode.parentNode ;
	var graph = __cell_graph(cell) ;
	__toggle_visibility(graph,"false");
    return __void;
    }
    
var _stdin_hide = function (what) {
var cell = stdin.parentNode.parentNode;
	what = (what === _false) ? "true" : "false" ;
	__toggle_visibility(stdin.parentNode,what);
	__cell_update_buttons(cell) ;
	return __void;
}

var _stdout_hide = function (what) {
var cell = stdout.parentNode;
	what = (what === _false) ? "true" : "false" ;
	__toggle_visibility(stdout,what);
	__toggle_visibility(__cell_xstdout(cell),"false");
	__cell_update_buttons(cell) ;
	return __void;
}


var _save_worksheet  = function (name) {
	var cells,cell;
	name = name || _WK_NAME ; // autosave
	name = nameToString(name,"save-worksheet");
	
	 wksheet = __wksheet_to_json() ; // a JSON object
//console.log("save",wksheet);
	 __local_put(name,wksheet,"notebook",false); // replace
// date
	 __local_put("date-" + name,glisp_jsonify(new Date()),"notedates",false) ;
	 __set_current_worksheet(name);
	 __set_date_edited(null); // current
	 __fill_open_select()  ;
	 return _true;
}

function __autosave() {
	if (_WK_NAME.indexOf("worksheet") === 0) return;
	_save_worksheet();
}

// from name in local db
var _open_worksheet = function (name) {
	name =   nameToString(name,"open-worksheet");
	var wksheet = __local_get(name,"notebook"); // a  JSON object
	
	if(! wksheet) {
		writeln("Unknown worksheet: "+ name,"color:green");
		return _notebook();
		}
// display date from db
	var date = __local_get("date-" + name,"notedates");
	__set_date_edited(glisp_unjsonify(date)) ;
// fill cells
	__wksheet_to_cells(wksheet) ;
	__set_current_worksheet(name);
	return _true ;
}

var _remove_worksheet = function (name) {
	name = nameToString(name,"remove-worksheet") ;
	__local_delete(name, "notebook") ;
	__fill_open_select() ;
	return _notebook();
}

var _notebook = function () {
	var keys = __local_keys("notebook").splice(0) ;
	return _reverse(__array_to_list(keys)) ;
}

// NO DOC - YET - NYI NYI NYI
// (worksheet-import [./notebook/].file) in io.js
var _worksheet_export = function () {
var text = JSON.stringify(__wksheet_to_json(),null,2) ;
	return _save_as(text,_WK_NAME + ".json");
}

/*----------------
select/choices
http://stackoverflow.com/questions/17001961/javascript-add-select-programmatically
http://www.w3schools.com/jsref/dom_obj_select.asp
-------------*/
function __fill_open_select() {
	var select = document.getElementById("SELECT");
	var option0 = get_firstChild(select);
	option0 = get_nextSibling(option0); // blank
	var option = get_nextSibling(option0); 
		while(option) {
			select.removeChild(option);
			option = get_nextSibling(option0);
			}
	var options = _notebook();
	if(options === null) {
			select.disabled = true;
			return ;
			}
	select.disabled = false;
	while(options) {
		option = new Option(options[0], options[0]) ;
		select.appendChild(option);
		options = options[1];
	}
}

/*-------------
main buttons
------------------*/
function doSelectOpen() {
	var select = document.getElementById("SELECT");
	if  (select.selectedIndex < 2) {
			select.selectedIndex = "0";
			return _false;
			}
	var name = select.value;
	select.selectedIndex = "0";
	// if(name === _WK_NAME) return _true;
	_open_worksheet(name);
	__click_cell0();
	return _true;
}

function __save_worksheet() {
	var name = prompt("Please enter a worksheet name",_WK_NAME );
	if(name) _save_worksheet(name);
	__click_cell0();
	__fill_open_select() ;
	writeln(glisp_message(_notebook(),"(notebook) →"),"color:green");
}

// Eval button
function __eval_worksheet () {
	var cells = document.getElementById("cells");
	var cell = get_firstChild(cells);

	while(cell) {
		set_stdin(__cell_stdin(cell));
		stdin_eval();
		cell = get_nextSibling(cell) ;
		}
}


/* COMPAT */
function Book (id) {
			this.writeHTML = function(html) { } ;
			this.newpage = function () { } ;
			this.clear = function () { };
			this.font = function () {};
			this.write = function () {};
}
			





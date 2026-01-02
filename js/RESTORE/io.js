/*
GLisp

	I/O functions
*/

var GPrinter = new Book('printer') ;

// constant args #
var _read = function () {
var line = prompt("GLisp:read()","666                                                           ");
	var form = (line) ? glisp_read(line) : null ;
	return form;
}

/////////////////////////
// INPUT OUTPUT
/////////////////////////////
var _newline = function () {
	writeln('');
	return null;
}

var _write = function(obj) { // for reader
	writeln(glisp_tostring(obj,'-- ')); // NYI ab --> "ab" etc ..
	return null;
}

var _display = function(top,argc) { 
//console.log("_write",top,argc,_stack[top],_stack[top+1]);
	var obj = _stack[top];
	var style = (argc === 2) ? _stack[top+1] : undefined ;
	if(! typeof style === "string") style = undefined; // error here
//console.log("_write",obj,style);
	writeln(glisp_tostring(obj,'-- '),style);
	return null;
}

/*
///////////////////////////
// jsonify :
// replaces funrefs by {fun : _name} objects
// replace symbols by {id : name}    objects
// NYI : shared lists will not be shared ....
// NYI : circular lists
// circular : https://github.com/douglascrockford/JSON-js/blob/master/cycle.js
////////
function glisp_jsonify(obj) {
	if(typeof obj === "function") return {fid :obj.glfun.name} ;
	if(obj instanceof Symbol)     return {id : obj.name} ;
	if(obj instanceof Formal)     return {pid : obj.name, block : obj.block , idx : obj.index} ; // Value NYI
	if(obj instanceof Vector)     return {vector : obj.vector} ; // NYI : any depth ...
	if(obj instanceof Integer) return    {bigint : obj.bigint} ;
	if(obj === null)              return null;
	if(typeof obj === "string" )  return obj;
	if(typeof obj === "number" )  return obj;
	if(Array.isArray(obj)) { // lists, promises, boxes, rationals
		var clone = obj.slice(0);
		var length = obj.length;
		for (var i = 0 ; i < length ; i++) // length may be > 2 (descriptor)
			clone[i] = glisp_jsonify(obj[i]) ;
		return clone;
	}
	glisp_error(1,obj,"toJSON");
} // jsonify

// unjsonify (obj)
// chirurgy
function glisp_unjsonify(obj, env) {
	if(obj === null)              return null;
	if(typeof obj === "string" )  return obj;
	if(typeof obj === "number" )  return obj;
	if(Array.isArray(obj)) { // lists, Q-numbers, ..
		var length = obj.length;
		for (var i = 0 ; i < length ; i++) // length may be > 2 (descriptor)
			obj[i] = glisp_unjsonify(obj[i],env) ;
		return obj ;
	}
	if(obj.bigint) { var anInteger = new Integer(obj.bigint);
					// anInteger.bigint = obj.bigint;
					return anInteger;
					}
	if(obj.vector) { var aVector = new Vector(0); 
					aVector.vector = obj.vector;
					return aVector;
					}
	if(obj.id) return new  Symbol(obj.id) ; // long : searches all symbols or creates
	if(obj.pid) return new Formal(obj.pid,obj.block,obj.idx) ; // long : searches all symbols or creates
	if(obj.fid) { // must exits (jsfunc)
				var _funxxx = env.get(obj.fid);
				if(! _funxxx) glisp_error(26,obj.fid,"restore-fun") ; // NYI bad mess
				return _funxxx;
				}
	glisp_error(26,obj,"restore-obj");
} // UNjsonify
*/

///////////////
// find a def from a symbol
// returns -1 or index in glisp.defs
//////////////////
function glisp_find_def(symb) {
	var defs = glisp.defs ;
	for(var i= 0; i < defs.length; i++)
		if(defs[i][0] === symb.name) return  i;
return -1;
}

///////////////
// push_def: remember definitions (ordered)
// defs := [[name,line] [name,line] ..]
////////////////
function glisp_push_def(symb, line) {
console.log('pushdef',symb,line);
	var i = glisp_find_def (symb);
	if(i >= 0) { // override
			glisp.defs[i][1] = line;
			return;
			}
	glisp.defs.push([symb.name,line]);
}

//////////////////////////////
// save definitions
// (save 'key)
// save new or modified defs : (no package) or defs in same pack
// save format is [[name define-string] [name define-string] ....]
////////////////////////////
// SAVE only in pack : skey or pack = null 
// do not save undef or bound to null (_undefined) NYI

var _save_definitions = function( skey) {
///// CHECK skey : must be symbol or string . Bogue (save 'assoc) NYI
skey = '' + skey;
	var toSave = [] ;
	var defs = glisp.defs ;
	
	for(var i= 0; i < defs.length; i++) { // patch defs[0] in memory with qualified name
			var adef = defs[i];
			var name = adef[0];
			if(packName(name)  && packName(name) !== skey) continue;
			if(packName(name) === null) adef[0] = skey + "." + name ;
console.log("save-def",adef[0]);
			toSave.push(adef);
	}
	
	var jarray = JSON.stringify(toSave) ;
	localStorage.setItem("GLISP-DEFS-" + skey, jarray);
	
	var d = new Date();
	var strDate = d.toLocaleDateString() + " " + d.toLocaleTimeString();
	localStorage.setItem("GLISP-DATE-" + skey, strDate);
return toSave.length ;
}

///////////////////
// import definitions
// above existings defs
////////////////////////

var _import_definitions = function(skey,env) {
skey = '' + skey;
var adef, symb;
	var jarray = localStorage.getItem("GLISP-DEFS-" + skey);
	if(!jarray) return glisp_error(37,skey,"import-definitions") ; // unknown key
	writeln("Definitions '" + skey + "' (" + localStorage.getItem("GLISP-DATE-" + skey) +")") ; 
	
	jarray = JSON.parse(jarray);
	var nums = jarray.length ;
	// creates symbols for this package
		for(var i = 0; i < nums ; i++)  { // scan (name value) a-list
		adef = jarray[i];
		new Symbol(adef[0]);
console.log("_import_create_",adef[0]);
		}

	// compile definitions
	for(var i = 0; i < nums ; i++)  {// scan (name value) a-list
		var adef = jarray[i];
		symb = new Symbol(adef[0]);
		glisp.pack = skey; // look for symbols in this package - see new Symbol()
		glisp_rep(adef[1],true);  // batch read-eval-print
		glisp.pack = null;
		if(glisp.error === 0) 
				glisp_push_def(symb,adef[1]); // replace or append
				
		}  // all defs
	writeln(glisp_tostring(_environment_bindings(env) ,skey + " --> ") , "color:lightgreen") ;
return nums ;
}

var _definitions = function(env) {
env = env || glisp.user;
	var defs = glisp.defs;
	var line,name,symb,def;
	for(var i = 0; i < defs.length; i++) {
		name = defs[i][0];
		symb = glisp_look_symbol(name) ;
console.log("_defs",name,symb);
		if(symb === null) continue;
		def = defs[i][1] ; // env.get(name);
		
		line = symb.toString() + " : " + def  ; // abbrev NYI
		writeln(line);
		
		line = symb.toString() + " : " + def ; // NO abbrev NYI
		GPrinter.write(line); 
	}
	return glisp.defs.length;
} // definitions

////////////////
// EDITING
//////////////////
var _edit = function (symb, env) {
		if(! isSymbol(symb)) return glisp_error(35,symb,"edit") ;
		var i = glisp_find_def(symb);
		if( i == -1) return glisp_error (36,symb,"edit");
		var line = glisp.defs[i][1];
		stdin_put(line);
		return symb;
}

///////////////////////
// STDIN/OUT functions
/////////////////////
var _stdout_lines = function(nlines) {
	nlines= Math.floor(nlines);
	if(!nlines || isNaN(nlines) || nlines < 2 || nlines > 100) 
			return glisp_error(24,nlines,_stdout_lines);  // bad range
	var LH =  parseFloat(window.getComputedStyle(stdout).lineHeight) ;
	LH = Math.floor(LH);
	var H = nlines * LH ; // multiple round
	stdout.style.height = '' + H + 'px';
	sysout.maxlines = nlines;
	return nlines ;
	}
	
// 0 to inhibit
var _stdin_autocomplete_delay = function ( msec) {
	if(! (typeof msec) === "number")
			return glisp_error(24,msec,_stdin_autocomplete_delay);  // bad range
		glisp.autocomplete = msec ;
	return msec;
}


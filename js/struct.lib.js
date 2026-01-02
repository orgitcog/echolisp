/*--------------------------
GLisp
struct.lib
(C) Echolalie & Jacques Tramu 11/02/2015
http://docs.racket-lang.org/guide/define-struct.html
------------------------------------*/

var _Metas = [] ;

/*--------------
utils called form type.lib and _compile
-------------------------------*/

// macro to patch body
// replace symb-name.slotname by (_slot_ref symb-name idx) 
// getter = [_struct_get ,[param  , [ idx, null]]] ;
// see SQL.LIB for possible conflict ? NYI NYI NYI
// type := "struct"

function struct_resolve_dot_ref(body,symb,type,meta) {
var idx,key,dotref;
	if(notIsList(body)) return;
	if(Array.isArray(symb)) symb = symb[0] ; // (name default) arg
	 for (;body !== null ; body= body[1]) {
	 		if(notIsList(body)) return; // (a . b)
			struct_resolve_dot_ref(body[0],symb,type,meta) ;
			
			dotref = body[0]; // a.b
			if(! (dotref instanceof Symbol)) continue;
			if(! (packName(dotref.name) === symb.name)) continue; // a
			key = simpleName(dotref.name) ; // b
			
			idx = meta.idxslot[key];
			if(idx === undefined) glisp_error(111,dotref.name,"dot-ref:"+ meta.name);
			body[0] = [_struct_get, [symb ,[idx, null]]] ;
			} // for			
} // resolve dot_ref

// _define (NO TYPES.LIB)
// parsing struct:name
// get rid of struct types in  formals symb list
function glex_resolve_dot_refs(body,formals) {
var tn ,formal , symb, meta ; 
		
		for (; formals !== null ; formals = formals[1]) {
		if(notIsList(formals)) return; // (a b . rest)
		
		formal = formals[0] ;
		if(Array.isArray(formal)) formal = formal[0]; //(formal defo-value)
		if(! (formal instanceof Symbol)) glisp_error(23,formal,"define:arg-name");
		
		tn = formal.name.split(":");
		if(tn.length === 1) continue;
		if(tn.length === 2)  {
			meta = __find_meta(tn[0]); 
			if(meta === null) glisp_error(149,formal.name,"define:arg-type"); // DBG, else ignore ?
			symb = new Symbol(tn[1]);
			// go patch body
			struct_resolve_dot_ref(body,symb,"struct",meta);
			
		if(Array.isArray(formals[0])) 
			formals[0][0] = symb;
			else formals[0] = symb ;
			}}
} // resolve_dot_refs



/*----------------
utils
---------------*/

function __find_meta (name) {
	if(!name) return null;
	// for(var i=0;i< _Metas.length;i++)
	for(var i=_Metas.length-1;i>=0;i--)
		if(_Metas[i].name === name) return _Metas[i];
	// glisp_error(63,name,"struct");
	return null;
}


function __slot_check(meta,idx,val,env) { // just after push - 
	var t_status = __type_check (val , meta.signature[idx].t_expr,env);
	if (t_status !== true) {
			 			_CONTEXT = meta.name + ":" + meta.slots[idx];
			 			glisp_error(145, t_status, meta.signature[idx].name);
			 			}
	}


function _struct_make ( meta , fvals ,env) {
	var astruct = new Struct (meta ) ; // empty slots
	var nslots = meta.slots.length;
// set init values
	for(var idx = 0; idx < nslots ; idx++) {
		var val = fvals ? fvals[0] : meta.initforms[idx] ? meta.initforms[idx] : 0 ;
		if(fvals) fvals = fvals[1];
		if(val && meta.signature) {
			__slot_check(meta,idx,val,glisp.user) ;
			}
		astruct.slots.push(val) ;
		}
		
// call chain of initializers
		var supers = [] ;
		var call = [null,[astruct,null]] ;
		while(meta) { supers.push(meta) ; meta = meta.msuper ; }
// console.log("INIT",supers) ;
		while(supers.length) {
			meta = supers.pop();
				if(meta.initialize) {
					call[0] = checkProc(meta.initialize,1,1,"struct:init:" + meta.name) ;
					__ffuncall(call,env);
					}}
		
	return astruct; 
}


/*-----------------
Meta : define slots and slots props
-----------------------------*/
// (struct point [super-ref]  (x y z)) ->new MetaStruct
// achtung : slots = jsarray
// input slot := symbol | (symb default) | type.symb | (type.symb default)

function MetaStruct (name, slots, superstruct, initialize, tostring) {
var slot,slotname,defval,tn,onchange ;
	this.msuper =  superstruct ; // instance of MetaStruct or null
	this.supercount = this.msuper ? 2 * this.msuper.supercount : 1 ;
	this.name = name ;
	
	this.slots = [] ;   // jsarray of strings
	this.initforms = [] ; // jsarray of values (0 is default)
	this.onchange = [] ; //  array of lisp proc or null
	this.signature = null; // a js array of types - see types.lib
	
	this.tostring = tostring ; // lisp proc or null
	this.initialize = initialize ; // lisp proc
	
	this.idxslot = {} ; // idxslots[slotname] -> i
	
	for(var i=0;i< slots.length;i++) {
				slot = slots[i];
				defval = 0;
				slotname = slot ;
				onchange = null;
				
				if(Array.isArray(slot)) {
				slotname =  slot[0] ;
				slot = slot[1];
				defval =  slot[0] ;
				slot = slot[1];
// keywords after (name default ...)
					while(slot) {
					if (slot[0] === keyword("#:onchange")) {
					slot = slot[1];
					onchange = slot[0]; // proc (instance oldvalue newvalue)
					onchange = checkProc(onchange,3,3,"struct #:onchange");
					slot=slot[1];
					}}} // slot = list

				if(_LIB["types.lib"]) {
					if(! this.signature) this.signature = [];
					tn =  __type_name(slotname); // ->  { type : a Type , arg : symb}
					slotname = tn.arg ;
 					this.signature.push (tn.type);
					}
	
				slotname = nameToString(slotname,"struct");
				this.slots.push (slotname); 
				if(slotname.indexOf(":") >=0) glisp_error(149,slotname,"struct:"+name);
				this.initforms.push (defval) ;
				this.onchange[i] = onchange;
				} // all slots
				
	if(this.msuper) {
				this.slots = this.msuper.slots.concat(this.slots) ;
				this.initforms = this.msuper.initforms.concat(this.initforms) ;
				if(this.signature && this.msuper.signature)
					this.signature = this.msuper.signature.concat(this.signature); 
				}
	// after super concat		
	for(var i=0;i< this.slots.length;i++) this.idxslot[this.slots[i]] = i;
	
	this.generate();
	_Metas.push(this); // needed to save/restore instances
}

MetaStruct.prototype.hname = function () { // super:super:...:name
		var name = this.name;
		var msuper =  this.msuper;
		while(msuper) {
						name = msuper.name+ ":" + name;
						msuper = msuper.super;
						}
		return name;
		}
		
MetaStruct.prototype.toString = function () 
		{return "#struct:" + this.hname() + " [" + this.slots.join(" ") +"]";} ;
				
				
MetaStruct.prototype.jsonify = function () {
				var msupername = this.msuper ? this.msuper.name : null ;
				return {
						_instanceof : "MetaStruct",
						metastruct : this.name,
						slots: this.slots, // array of strings - no json translate
						msuper :  msupername };} ;
						
MetaStruct.unjsonify = function (obj) { // dont create clone (keep newer in memory)
			var mstruct = __find_meta(obj.metastruct);
			return mstruct ? mstruct : new MetaStruct(obj.metastruct,obj.slots,obj.msuper);
			}
			
var _structp = function (obj) {
	return (obj instanceof MetaStruct) ? _true : _false;
}
			
/*---------------------------
getters and setters
to generate :
struct:point --> MetaClass object
(make-point ...)
(point-x <point>)
(set-point-x! <point>)
(point? <point>)
---------------------------------*/

var _struct_instancep = function (obj, meta) {
	return (obj instanceof Struct && obj.hasMeta(meta)) ? _true:_false;
}

var _struct_get = function ( obj, idx) {
	if (obj instanceof Struct) return obj.slots[idx] ;
	if(Array.isArray (obj)) return obj[idx] ; // table record - used in where functions
	glisp_error(77,obj,"struct-get");
}

//  #:onchange = proc  (instance oldval newval) --> [modified] new value
var _struct_set  = function ( obj , idx , val) {
	if (! (obj instanceof Struct)) glisp_error(77,obj,"struct-set");
	var meta = obj.meta ;
	
	if( meta.onchange[idx]) {
			var call = [meta.onchange[idx] , [ obj ,  [obj.slots[idx] , [ val , null]]]] ;
			val = __ffuncall(call,glisp.user);
			}
			
	if(meta.signature) {
			__slot_check(obj.meta,idx,val,glisp.user) ;
			}
			
	obj.slots[idx] = val;
	return val ;
}

// (lambda  slots (_struct_cons meta slots))
function __struct_make_constructor(name, meta) { // homme #struct:homme
	var symb = new Symbol(name);
	var param = new Symbol("x");
	var constructor = [_struct_make ,[meta, [ param , null]]] ;
	var lambda = [_lambda ,[ param , [constructor , null]]] ;
	
	lambda[TAG_LAMBDA_DEF] = symb;
	symb.fval = lambda ;
	glisp_compile([lambda,null],lambda,glisp.user); 
	glisp.user.set(name,lambda);
}

// (lambda  (list)  (_struct_cons meta list))
function __struct_make_constructor_from_list(name, meta) {
	name = "list->" + name ;
	var symb = new Symbol(name);
	var param = new Symbol("x");
	var constructor = [_struct_make ,[meta, [ param , null]]] ;
	var lambda = [_lambda ,[ [param,null] , [constructor , null]]] ;
	
	lambda[TAG_LAMBDA_DEF] = symb;
	symb.fval = lambda ;
	glisp_compile([lambda,null],lambda,glisp.user); 
	glisp.user.set(name,lambda);
}

// meta : RFU
function __struct_make_getter( name, meta, idx) { // homme-jambes #struct:homme 2
	var symb = new Symbol(name);
	var param = new Symbol("struct-ref");
	var getter = [_struct_get ,[param  , [ idx, null]]] ;
	var lambda = [_lambda , [[param,null], [getter , null]]] ;
	
	lambda[TAG_LAMBDA_DEF] = symb;
	glisp_compile([lambda,null],lambda,glisp.user); 
	symb.fval = lambda ;
	symb.constant = true;
	glisp.user.set(name,lambda);
}

function __struct_make_setter( name, meta, idx) { // homme-jambes #homme 2
	var symb = new Symbol(name);
	var param = new Symbol("struct-ref");
	var val = new Symbol ("struct-value") ;
	var setter = [_struct_set ,[param , [ idx, [val ,null]]]] ;
	var params = [param , [val, null]] ;
	var lambda = [_lambda , [params , [setter, null]]] ;
	
	lambda[TAG_LAMBDA_DEF] = symb;
	glisp_compile([lambda,null],lambda,glisp.user); 
	symb.fval = lambda ;
	symb.constant = true; // Z !! cannot redefine
	glisp.user.set(name,lambda);
}

function __struct_make_predicate( name, meta, idx) { // homme? #homme 
	var symb = new Symbol(name + '?');
	var param = new Symbol("x");
	var pred = [_struct_instancep , [param , [meta , null]]] ;
	var params = [param ,null] ;
	var lambda = [_lambda , [params , [pred, null]]] ;
	
	lambda[TAG_LAMBDA_DEF] = symb;
	glisp_compile([lambda,null],lambda,glisp.user); 
	symb.fval = lambda ;
	glisp.user.set(name + '?' ,lambda);
	
	// load types BEFORE stuct DOC NYI NYI NYI
	// if type.lib , creates a type name= struct.name super = super.Type
	if (_LIB["types.lib"]) {
		var supername = meta.msuper ? meta.msuper.name : null ;
		define_struct_type(name ,meta, __find_Type (supername,"make-struct"),lambda);
	}
}

MetaStruct.prototype.generate = function() { 
		var arity = this.slots.length;
		var meta = this;
		var name = meta.name , slot , i, slot_ref;
		// best in glisp.user NYI
		define_variable("struct:" + name, this); // struct:point --> this
		
// constructors
		__struct_make_constructor (name, meta);
		__struct_make_constructor_from_list(name, meta);
// getters & setters
		for( i= 0; i < meta.slots.length;i++) {
			slot = meta.slots[i];
			__struct_make_getter(name + "-" + slot,meta,i);
			__struct_make_setter( "set-" + name + "-" + slot + "!" ,meta,i) ;
			
// generate keywords for SQL
			slot_ref = "#:" + meta.name + "." + slot; // constant
			 // constant symbol
			if(! glisp_look_keyword(slot_ref)) _Keywords.push(new Symbol(slot_ref,true));
			glisp.user.set(slot_ref,i);
			}
// predicate
			__struct_make_predicate (name , meta);
		} ; // generate
		
		
// _G_REF["g342"] -> instance of structure ref : 342
/*-------------------------
structs instances
---------------------------------*/
// Structure
function Struct (meta , slots , ref) {
		this.meta = meta ; // object (not name)
		this.slots = slots ? slots : [] ; // js array
		this.ref = ref || 0 ; // used by json only
		this.tojson = false;
		}

		
Struct.prototype.toString = function () {
// is meta.string function provided ?
	if(this.meta.tostring) {
			var call = [checkProc(this.meta.tostring,1,1,"struct:tostring") , [ this, null]] ;
			var  val = __ffuncall(call,glisp.user); // any obj
// too much recurse  if val includes ref to this !!! NYI NYI NYI
			return glisp_message (val, ""); 
		}

		var slots = __array_to_list(this.slots);
		if(this.ref)
		return "#<" + this.meta.name + ":" + this.ref + "> " + glisp_message(slots,"") ;
		else
		return "#<" + this.meta.name + "> " + glisp_message(slots,"") ;
		}
			
Struct.prototype.hasMeta = function (ameta) {
		var meta = this.meta ;
		while (meta) {
			if(meta === ameta) return true;
			meta = meta.msuper;
		}
	return false;		
}

Struct.prototype.jsonify = function () {
				if(! this.ref) this.ref = __new_id() ;
				if(this.tojson) return  {
							_instanceof : "Struct",
							struct : this.meta.name,
							ref : this.ref ,
							slots : null
							} ;
							
				this.tojson = true;
				var slots = __lisp_array_to_json_array(this.slots) ;
				this.tojson = false;
				return    {
						_instanceof : "Struct",
						struct : this.meta.name,
						ref : this.ref ,
						slots : slots
						} ;
			} 
						
// REM : NOT proto
Struct.unjsonify = function (obj) {	
					var meta = __find_meta(obj.struct) ;
					if( ! meta) glisp_error(63,obj.struct,"load:struct"); // unknown meta
					var ref = _G_REF["g"+ obj.ref] ;

					if (!ref)   {
								ref =  new Struct (meta, null ,obj.ref) ;
								_G_REF["g" + obj.ref] = ref;
								}
//console.log("UNJ",obj.ref,ref.slots);
					
					var slots = (obj.slots) ?
								 __json_array_to_lisp_array(obj.slots) : null;
					
					if(slots)  ref.slots = slots ;
//console.log(">UNJ",ref.slots);
					return ref;
			}	
			
/*--------------------
 (deep) copy
----------------------*/
function __copy_struct (clone) {
	var slots = [];
	for(var i=0; i< clone.slots.length;i++)
		slots[i] = _copy(clone.slots[i]) ;
	return new Struct (clone.meta , slots) ;
}
			

					
/*------------------------------
(struct ref  [super] (slots) #tostring: ..)
--------------------------------------*/
var _struct = function (self,env) { 
	var args = self[1];
	var name =args[0] , slots, super_id = null , superstruct = null , arg;
	var initialize = null, tostring = null ;
	
		name = nameToString(name);
		if(sysfun(name))  glisp_error(19,name,"struct-def") ;
		_CONTEXT = name;
		
		args = args[1] ; arg = args[0];
		if(arg instanceof Symbol) { super_id  = arg; args = args[1] ;}
		slots = args[0] ;
		if(slots && notIsList(slots)) glisp_error(20,slots,"struct");
// scan keywords
		args = args[1];
		while(args) {

		if (args[0] === keyword("#:tostring")) {
			args = args[1];
			tostring = args[0];
			// proc to be resolved later - may use struct type
			if(!(tostring instanceof Symbol)) glisp_error(23,tostring,"#:tostring") ;
			}
			
		if (args[0] === keyword("#:initialize")) {
			args = args[1];
			initialize = args[0];
			if(!(initialize instanceof Symbol)) glisp_error(23,initialize,"#:initialize") ;
			}

		args = args[1];
		} // while args
			
	
	if(super_id)  { 
				super_id = nameToString(super_id);
				superstruct = __find_meta(super_id) ;
				if(superstruct === null) glisp_error(63,super_id,"struct");
				}
	return new MetaStruct(name, __list_to_array(slots) ,superstruct, initialize, tostring);
}
		
				

function struct_boot() {
		
		// define_special (new Sysfun("struct.make-struct",_struct,2,7)) ;
		define_special (new Sysfun("struct.struct",_struct,2,7)) ;
		define_sysfun  (new Sysfun ("struct.struct?",_structp,1,1)) ; // a Meta ?
		
		define_sysfun  (new Sysfun ("struct-make",_struct_make,2,2)); // (meta (slot-values))
		define_sysfun  (new Sysfun ("struct-get",_struct_get,2,2));
		define_sysfun  (new Sysfun ("struct-set",_struct_set,3,3));
		define_sysfun  (new Sysfun ("struct-instance?",_struct_instancep,2,2)); // (obj meta)
		
		if(_LIB["types.lib"]) define_type ("Struct",null,_structp,true);

		writeln("struct.lib v1.4 ® EchoLisp","color:green");
		_LIB["struct.lib"] = true;
		}
struct_boot();

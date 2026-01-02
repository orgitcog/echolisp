/*
GLOOPS.LIB
(C) G. Brougnard, Jacques Tramu, Simon Gallubert 2015


http://home.adelphi.edu/sbloch/class/archive/272/spring1997/tclos/tutorial.html
http://www.gnu.org/software/mit-scheme/documentation/mit-scheme-sos.pdf ==> slots properties ...
*/



var _MetaClasses = {} ;
/*----------------
utils
---------------*/
// find (.... :kwd value ...) inlist
// return null or value

function __kwd_value (list , kwd, sender ) {
var symb;
	while(list) {
	symb = list[0];
		if((symb instanceof Symbol) && symb.name === kwd) {
			if(list[1] === null) glisp_error(114,kwd,sender) ;
			return list[1][0];
			}
	list = list[1];
	}
	return null;
}

function __find_metaclass (name) {
	if(!name) return null;
	return _MetaClasses[name] || null ;
}

// 
function __class_make_constructor(name, meta) { // homme class:homme
	var symb = new Symbol(name);
	var param = new Symbol("slots");
	var constructor = [_class_make_instance_raw ,[meta, [ param , null]]] ;
	var lambda = [_lambda ,[ param , [constructor , null]]] ;
	symb.fval = lambda ;
	glisp_compile([lambda,null],lambda,glisp.user); 
	glisp.user.set(name,lambda);
}



function __class_make_predicate( name, meta, idx) { // homme #homme 
	var symb = new Symbol(name);
	var param = new Symbol("instance");
	var pred = [_class_instancep , [param , [meta , null]]] ;
	var params = [param ,null] ;
	var lambda = [_lambda , [params , [pred, null]]] ;
	
	glisp_compile([lambda,null],lambda,glisp.user); 
	symb.fval = lambda ;
	glisp.user.set(name,lambda);
}

// isSlotKey : checks :slot-name
// returns  slot-idx

function isSlotKey(key, meta) {
		if(key[0] !== ":") glisp_error(111,key,"make-instance-kwd") ;
		key = key.substring(1);
		var idx = meta.idxslot[key] ;
		if(idx === undefined) glisp_error(111,key,"make-instance");
		return idx;
}

// make an instance : raw method
// (<class> init_1 ... init_n) 
// constructor call
// assumes fvals = list of slot values, from 0
// no initform, initialize..

function _class_make_instance_raw ( meta , fvals) {
	var instance = new Instance (meta ) ; // empty slots
	var nslots = meta.slots.length;
	while(fvals && nslots--) {
		instance.slots.push(fvals[0]) ;
		fvals = fvals[1];
		}
	// if(nslot !== 0) glisp_error(xx,meta.name,"make-class") ; NYI
	while(nslots-- > 0 ) instance.slots.push("❓"); // default kwd NYI
	return instance; 
}

// make an instance
// (make-instance foo :name ....)
// initialize generic will be here NYI
// signature = (initialize-instance instance ) - slots are already filled by constructor
// http://home.adelphi.edu/sbloch/class/archive/272/spring1997/tclos/source/initargs.scm

var _class_make_instance = function (self , env) {
var i;
	self = self[1];
	var meta = self[0] ;
	if(! (meta instanceof MetaClass)) {
		 meta = nameToString(meta,"make-instance");
		 meta = _MetaClasses[meta] ;
		 if(meta === undefined) glisp_error(108,self[0],"make-instance")
	}
	
	var instance = new Instance (meta ) ; // [] slots created empty
	var nslots = meta.slots.length;
	
	// 1) initforms
	for(i=0;i<nslots;i++)
		instance.slots[i] = __eval(meta.initforms[i],env) ;

	// 2) scan all pairs :slot value
	var pairs  = self[1];
	while(pairs) {
				 slot = pairs[0] ; // :name
				 slot = nameToString(slot,"make-instance");
				 idx = isSlotKey(slot,meta); // abort if not found
				 pairs = pairs[1];  // check expected value
				 if(notIsList(pairs)) glisp_error(67,slot,"make-instance:" + meta.name) ; 
				 instance.slots[idx] = __eval(pairs[0],env);
				 pairs = pairs[1];
	}

	// look for 'initialize' method
	// will run init of super if not found
	var ginit = _GENERICS["initialize"]; // should be always gere (boot)
	var lambda  = ginit.find_method_lambda([instance , null]) ;
	if(lambda)  __flambda_call(lambda,[instance , null],glisp.user) ;
	return instance; 
}

/*-----------------
Meta : define direct-slots and slots props
-----------------------------*/
// (define-class point ([super-id])  (x y z)) ->new  MetaClass
// achtung : input slots = list
// achtung

function MetaClass (name, slots, superclass) {
var i,slot,slotname,initform;
	this.msuper =  superclass ; // instance of MetaClass or null
	this.supercount = this.msuper ? 1 + this.msuper.supercount : 1 ;
	this.name = name ;
	this.slots = []; // jsarray of names = strings
	this.initforms = [] ; // jsarray of init's
	this.idxslot = { }; // idxslot[slotname] -> slot index [0..#slots-1]
	
	// init slots 
	// slot := name | (name :initform form)
	i = 0;
	while(slots) {
				initform = "❓";
				slotname = slot = slots[0];
				if(isList(slot)) {
						slotname = slot[0];
						initform = __kwd_value(slot,":initform","make-class") ;
						if(initform === undefined) initform = "❓";
						}
				
				this.slots[i] =  nameToString(slotname,"make-class") ;
				this.initforms[i] = initform;
				
				slots= slots[1];
				i++;
				}
				
	if(this.msuper)
				{
				this.slots = this.msuper.slots.concat(this.slots) ;
				this.initforms = this.msuper.initforms.concat(this.initforms) ;
				}
	// check dups !! NYI
	// set idxslot
	for( i=0;i< this.slots.length;i++) this.idxslot[this.slots[i]] = i;
	
	 // class:name -> this
	this.generate();
	
	_MetaClasses[this.name] = this; // needed to save/restore instances
}

MetaClass.prototype.hname = function () { // super:super:...:name
		var name = this.name;
		var msuper =  this.msuper;
		while(msuper) {
						name = msuper.name+ ":" + name;
						msuper = msuper.super;
						}
		return name;
		}
		
MetaClass.unjsonify = function (obj) { // dont create clone (keep newer in memory)
			var mclass = __find_metaclass(obj.metaclass);
			return mclass ? mclass : new MetaClass(obj.metaclass,obj.slots,obj.msuper);
			}
	
/*
protos applies to instances of MetaClass
*/
MetaClass.prototype.toString = function ()  {
				return "#class:" + this.hname() + " [" + this.slots.join(" ") +"]";
				}
				
MetaClass.prototype.jsonify = function () {
		var msupername = this.msuper ? this.msuper.name : null ;
		return {
				_instanceof : "MetaClass",
				metaclass : this.name,
				slots: this.slots, // array of strings - no json translate
				msuper :  msupername };
		}
				
						
MetaClass.prototype.generate = function() { 
		var arity = this.slots.length;
		var meta = this;
		var name = meta.name , slot , i;
		// best in glisp.user NYI
		define_variable("class:" + name, this); // class:person --> this DOC !!!
		
// constructor
		__class_make_constructor (name, meta);
// predicate
		__class_make_predicate (name + '?', meta);
		} ; // generate
		
/*------------------------------
(make-class 'id  'super|(super)|null  '(slots) )
(define-class id (super) (slots))
creates a new MetaClass
super is a name (string) 
--------------------------------------*/
var _make_class = function (name,superclass,slots) { 
	var super_id;
		name = nameToString(name,"define-class");
		if(sysfun(name))  glisp_error(19,name,"define-class") ;
				
		// accept (super) or super
		if(isList(superclass))  superclass = superclass[0] ; 
		if(!isListOrNull(slots)) glisp_error(20,slots,"define-class");

	if(superclass)  { 
				super_id = superclass = nameToString(superclass,"define-class");
				superclass = __find_metaclass(superclass) ;
				if(superclass === null) glisp_error(108,super_id,"define-class"); // unk class
				}
				
	return new MetaClass(name,  slots ,superclass);
}

// (define-class symb [super [slots]])
var _define_class = function(self,env) {
	self = self[1] ;
	var symb = self[0];
	if(! (symb instanceof Symbol)) glisp_error(23,symb,"define-class") ;
	self = self[1];
	var superclass = (self) ? self[0] : null ;
	self = (self) ? self[1] : null ;
	var slots = (self) ? self[0] : null ;
	var theclass = _make_class(symb.name,superclass,slots);
	// bind
	env.set(symb.name, theclass) ;
	return theclass;
}

var _classp = function (obj) {
	return (obj instanceof MetaClass) ? _true : _false;
	}
/*--------------------
Instances
---------------------------*/
var _class_instancep = function (obj, meta) {
	return (obj instanceof Instance  && obj.hasMetaClass(meta)) ? _true:_false;
}

// New instance of meta : (make ...)
function Instance (meta , slots , id) {
		this.meta = meta ; // object (not name)
		this.slots = slots ? slots : [] ; // slots values
		this.id = id || 0 ;
		this.tojson = false;
		}

		
Instance.prototype.toString = function () {
// look for 'tostring' method
			var gstring = _GENERICS["tostring"]; // should be always gere (boot)
			var lambda  = gstring.find_method_lambda([this , null]) ;
			if(lambda)
				return __flambda_call(lambda,[this , null],glisp.user) ;
// default
			var slots = __array_to_list(this.slots);
// add this.id if jsonify NYI
			return "#<" + this.meta.name  + " > " + glisp_message(slots,"") ;
			}
			
Instance.prototype.hasMetaClass = function (ameta) {
		var meta = this.meta ;
		while (meta) {
			if(meta === ameta) return true;
			meta = meta.msuper;
			}
	return false;		
}

Instance.prototype.jsonify = function () {
				if(! this.id) this.id = __new_id() ;
				if(this.tojson) return  {
							_instanceof : "Instance",
							classname : this.meta.name,
							id : this.id ,
							slots : null
							} ;
							
				this.tojson = true;
				var slots = __lisp_array_to_json_array(this.slots) ;
				this.tojson = false;
				return    {
						_instanceof : "Instance",
						class : this.meta.name,
						id : this.id ,
						slots : slots
						} ;
			}
						
						
Instance.unjsonify = function (obj) {	
					var meta = __find_metaclass(obj.classname) ;
					if( ! meta) glisp_error(108,obj.class,"load:class"); // unknown
					var ref = _G_REF["g"+ obj.id] ;

					if (!ref)   {
								ref =  new Instance (meta, null ,obj.id) ;
								_G_REF["g" + obj.id] = ref;
								}
//console.log("UNJ",obj.id,ref.slots);
					
					var slots = (obj.slots) ?
								 __json_array_to_lisp_array(obj.slots) : null;
					
					if(slots)  ref.slots = slots ;
//console.log(">UNJ",ref.slots);
					return ref;
			}	
					
/*--------------------
Instance access functions (basic)
----------------------------*/
var _slot_ref = function (instance , name) {
	if(! (instance instanceof Instance)) glisp_error(110,instance,"slot-ref");
	if(name instanceof Symbol) name = name.name ; // wants a string;
	var idx = instance.meta.idxslot[name];
	if(idx === undefined) glisp_error(111,name,instance.meta.name);
	
	return instance.slots[idx];
}
var _slot_ref_by_idx = function (instance , idx) {
	return instance.slots[idx];
}

var _slot_set = function (instance , name , value) {
	if(! (instance instanceof Instance)) glisp_error(110,instance,"slot-set!");
	if(name instanceof Symbol) name = name.name ; // wants a string;
	var idx = instance.meta.idxslot[name];
	if(idx === undefined) glisp_error(111,name,instance.meta.name);
	
	instance.slots[idx] = value;
	return value;
}
var _slot_set_by_idx = function (instance , idx , value) {
	instance.slots[idx] = value;
	return value;
}


/*-----------------------
METHODS
----------------------------*/
function Method (name ,types , lambda , argnames) {
	this.name = name;
	this.types = types; // jsarray [ class, <number> ,. ] of specializers names (strings)
	this.argnames = argnames;
	this.lambda = lambda;
}

Method.prototype.toString = function () {
// default
		// var types = __array_to_list(this.types);
		return "#<Method " + this.name + ":" + this.types.join(":") +" >";
		}

var _methodp = function (obj) {
	return (obj instanceof Method) ? _true : _false ;
}

/*-------------------------
MACRO-EXPAND class.slot
-------------------------------*/
// slot-set! class 'name value
// slot-set! class.slot value
// set! class.slot value

function isSlotSet (item) {
	return (isListNotNull(item) 
		&& (item[0] instanceof Symbol)
		&& (item[0].name === "set!" || item[0].name === "slot-set!")) ;
	}
	
// input : classref : formal symbol of type meta
function glex_replace_slot_set(classref,meta,body) {
var idx,item,setter,value;
	if(notIsList(body)) return;
	while(body) {
			setter= body[0];
			if(isSlotSet(setter)) {
				setter = setter[1];
				item = setter[0];
				setter = setter[1];
				value = setter[0] ;
				glex_replace_slot_set(classref,meta,value) ;
				
				if ((item instanceof Symbol) && (packName(item.name) === classref.name)) {
					idx = meta.idxslot[simpleName(item.name)];
					if(idx === undefined) glisp_error(111,item.name,"make-method:"+meta.name);
					body[0] = [_slot_set_by_idx, [classref ,[idx, [value , null]]]] ;
					}
				} // isSlotSet
			glex_replace_slot_set(classref,meta,setter) ;
			body = body[1];
		}
}

// input : classref : formal symbol of type meta
function glex_replace_slot_ref(classref,meta,body) {
var idx,item;
	if(notIsList(body)) return;
	while(body) {
			item = body[0];
			if ((item instanceof Symbol) && (packName(item.name) === classref.name)) {
				idx = meta.idxslot[simpleName(item.name)];
				if(idx === undefined) glisp_error(111,item.name,"make-method:"+meta.name);
				body[0] = [_slot_ref_by_idx, [classref ,[idx, null]]] ;
			}
			glex_replace_slot_ref(classref,meta,item) ;
			body = body[1];
		}
}

/*
input : types = js array of class names
input : (lambda (x y ..) body)
replaces : (set! x.slot-name val) by ...  (_slot_set_by_idx x i val)
replaces : x.slot-name by (_slot_ref_by_idx x i)
output : lambda*
*/

// loops on all lambda formals (which are class refs)
// # of formals must be >= # of types in method definition

function __make_method_lambda(name,types,lambda) {
var formals,types,body,type,meta,formal, argc=0 ;
	lambda = lambda[1];
	formals = lambda[0];
	body = lambda[1];
	while (formals && argc < types.length) {
		if(notIsList(formals)) glisp_error(20,args,"make-method-lambda:"+name);
		type = types[argc++];
		meta = _MetaClasses[type];
		formal= formals[0];
		if(! (formal instanceof Symbol)) glisp_error(23,formal,"make-method-lambda:"+name);
		glex_replace_slot_set(formal,meta,body);
		glex_replace_slot_ref(formal,meta,body);
		formals = formals[1];
	}
}

// (make-method 'name '(type type ... ) lambda)
// type := class 

var _make_method = function (name,types,lambda,env) {
var i,type,meta,method;
	name = nameToString(name,"define-method");
	if(notIsList(types)) glisp_error(20,types,"define-method");
	var numtypes = __length(types);

	if (!isLambda (lambda)) glisp_error(116,lambda,"define-method")

	types = __list_to_array(types);
	for(i=0; i< numtypes;i++) {
		type = types[i];
		type = nameToString(type,"define-method");
		meta = _MetaClasses[type]; // user class ?
		if(!meta)  glisp_error(108,type,"define-method") ;
		types[i] = type;
		}
		
	/// Preprocess lambda here
// glisp_trace(name,lambda,"make-method", true);
	__make_method_lambda(name,types,lambda) ;
//glisp_trace(name,lambda,"make-method", true);
	
	/// install lambda
	glisp_compile([lambda,null],lambda,env);
//glisp_trace(name,lambda,"make-method", true);
	method =  new Method (name, types, lambda);
	__add_method(name,method); // add to generic - create it if needed
	return method ;
}

var _define_method = function (self,env)
	{
	self = self[1];
	var name = self[0];
	self = self[1];
	var types = self[0];
	self = self[1];
	var lambda = self[0];
	return _make_method(name,types,lambda,env);
	}
	
/*-------------------------
GENERICS
-------------------------------*/
var _GENERICS = {} ;

function Generic (name) {
	this.name = name;
	this.dispatcher = {method : null };  
	this.methods = [] ; // js array of Methods - informative
	//
	this.cache = null ; // a lambda
	this.key = null ; // cache key
	
	_GENERICS[name] = this;
	// best define_user_variable NYI NYI 
	define_variable("generic:" + name, this); 
	return this;
}

Generic.prototype.toString  = function () {
	return glisp_message (__array_to_list(this.methods) , "#<Generic: " + this.name + " > ") ;
}

Generic.prototype.add_method = function (method) {
	var types = method.types;
	var i, type , numtypes = types.length , next;
	var dispatcher = this.dispatcher;
	for (i=0 ; i < numtypes; i++) {
		type = types[i];
		if(dispatcher[type] === undefined)  dispatcher[type] = {method : null } ;
		dispatcher = dispatcher[type] ;
		}
		
	if(dispatcher.method) i = this.methods.indexOf(dispatcher.method);
						   else i = -1;
	dispatcher.method = method ; // add or replace
	if (i >=0 ) this.methods[i] = method; // replace
	            else this.methods.push(method);
	            
	this.key = null ; // reset cache
}

// signature := glisp list of instances/lisp objects
// out : method.lambda or null

Generic.prototype.find_method_lambda = function (signature, wants_super) {
	var dispatcher = this.dispatcher, c_dispatcher, type , meta , msuper ,method = null ;
	var argc = 0;
	var c_signature = signature;
	while(signature)  {
		type = signature[0] ;
		if(! (type instanceof Instance)) break;
		meta = type.meta;
		if(argc === wants_super) { // (run-super ...)
				meta = meta.msuper;
				if(!meta) return null;
				}
		type = meta.name;
console.log("find-method",argc,this.name,"type",type);
		c_dispatcher = dispatcher ; // save current
		dispatcher = dispatcher[type];
		if(dispatcher === undefined) { // look in super
								msuper = meta.msuper ;
								while(msuper) {
								console.log("find-super",argc,"msuper",msuper.name);
										dispatcher = c_dispatcher[msuper.name];
										if(dispatcher) break;
										msuper = msuper.msuper;
										}
								if(!dispatcher && argc>0 && wants_super === undefined)
								return  this.find_method_lambda(c_signature,argc-1) ;
									 }
		if(dispatcher === undefined) break;
		signature = signature[1];
		argc++;
	}
	if(dispatcher) method = dispatcher.method;
	/*
	if(! method) {
		// should backtrack on wants_super = arg# NYI
		if(!wants_super)
				return this.find_method_lambda(c_signature,true) ;
			return null; 
			}
	*/
	if(! method) return null;
// cache update here iff !wants-super
	return method.lambda;
}

// assert form[0] === this
// perform call or error 113
Generic.prototype.call = function (form, env) {
// cons..uming :  get rid of __evlis with special __lambda_bind NYI NYI NYI
		var values = __evlis(form[1],env) ;
		var lambda = this.find_method_lambda(values) ;
		if(lambda === null) glisp_error(113,form[1],"generic:"+this.name);
		return __flambda_call(lambda,values,env) ;
}

// (run-super generic instance args ...)
var _run_super = function (self, env) {
	self = self[1];
	var generic = _GENERICS[nameToString(self[0],"run-super")];
	if(!generic) glisp_error(112,self[0],"run-super");
	self = self[1];
	var values = __evlis(self,env);
	var lambda = generic.find_method_lambda(values,0) ; // super for argc === 0
	if(! lambda) glisp_error(115,self[0],"run-super");
	return __flambda_call(lambda,values,env) ;
}

// (make-generic name)
var __make_generic = function (name) {
	name = nameToString(name,"make-generic");
	var generic = _GENERICS[name];
	if(generic) return generic;
	return new Generic(name);
}

// __add-method (generic|generic-name method)
function __add_method  (generic , method) {
	if(!(generic instanceof Generic))
		generic = __make_generic(generic) ; // safe if already here
	if(! (method instanceof Method)) glisp_error(112,method,"add-method");
	generic.add_method(method);
	return method;
}

/*
// (add-method mailto (define-method mailto (person  writer ...)  proc-name|lambda)
var _add_method = function (self,env) {
	self = self[1];
	var generic = nameToString(self[0],"add-method") ;
	self = self[1];
	var method = __eval(self[0],env);
	return __add_method(generic,method);
}
*/


function gloops_boot() {
// boot classes system
	
	__make_generic('tostring');
	__make_generic('initialize');
	
// classes
	define_sysfun (new Sysfun("gloops.make-class",_make_class,3,3)) ;
	define_special(new Sysfun("gloops.define-class",_define_class,1));
	define_sysfun (new Sysfun ("gloops.class?",_classp,1,1)) ;
		
// instances
	define_sysfun   (new Sysfun ("class-make-instance-raw",_class_make_instance_raw,2,2)) ;
	define_special  (new Sysfun ("gloops.make-instance",_class_make_instance,1)); 
	define_sysfun   (new Sysfun ("gloops.class-instance?",_class_instancep,2,2)); 
		
	// define-sysfun  (new Sysfun ("gloops.class-of",_class_of,1,1));
	define_sysfun  (new Sysfun ("gloops.slot-ref",_slot_ref,2,2)); 
	define_sysfun  (new Sysfun ("gloops.slot-set!",_slot_set,3,3)); 
	// (run-super generic self args ...)
	define_special (new Sysfun ("gloops.run-super",_run_super,2)); 
	
// instances internal
	define_sysfun  (new Sysfun ("slot-ref-by-idx",_slot_ref_by_idx,2,2)); 
	define_sysfun  (new Sysfun ("slot-set-by-idx!",_slot_set_by_idx,3,3)); 

	
// generics and methods
	//define_sysfun (new Sysfun("gloops.make-method",_make_method,3,3)) ;
	define_special (new Sysfun("gloops.define-method",_define_method,3,3));
	// define_special (new Sysfun("gloops.add-method",_add_method,2,2)) ;

	_LIB["gloops.lib"] = true;
	writeln("gloops V1.2","color:green");
	}

		
gloops_boot();




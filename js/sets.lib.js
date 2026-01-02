/*----------------------
Sets
© Echolisp and Simon Gallubert 2015
http://www.math.uqam.ca/pdf/Ensembles-FBergeron.pdf

------------------------*/

function checkSet (obj,sender) {
	if(! (obj instanceof Set)) glisp_error(133,obj,sender);
	return obj;
}

function Set (superset , name, def  , interval  ) {
	this.name = name ; // or null
	this.superset = superset ; // or null
	this.extent =null ; // js array or null
	 // interval in super : a cons = [min,max]
	this.interval = interval ; // may be null
	
	// funcall
	this.def = def  ?  [checkProc(def,1,1,"make-set"), [null, null]] : null ;
	}
	
//  ⊂ ⊃⊄⊆⊇ ∅ ∈ ∉ Ω
Set.prototype.toString = function () {
	if (this === _EMPTY_SET) return "∅" ;
	var supername = null, superset = this.superset, interval ;
	while(superset) {
			supername = superset.name;
			if(supername) break;
			superset = superset.superset;
			}
	interval = this.interval ? " [" + this.interval[0] + " .. " + this.interval[1] +"]" : "" ;
	supername = supername ? "x  ∈ " + supername + " | " : "" ;
	return "#{ " + supername + (this.name || "&lambda;(x)") + interval + "}" ;
}

// this.subsetof (someset) -> set | false
Set.prototype.subsetOf = function (asuper) {
	if(! (asuper instanceof Set)) return false;
	var superset = this.superset;
	while (superset) {
		if(asuper === superset) return asuper ;
		superset = superset.superset;
		}
	return false;
}

// -> intersects all supers intervals
Set.prototype.getInterval = function () {
	var smin = this.interval[0];
	var smax = this.interval[1];
	var superset = this.superset;
	while (superset) {
			if(superset.interval) {
				smin = Math.max( smin, superset.interval[0]);
				smax = Math.min( smax, superset.interval[1]);
				}
			superset = superset.superset;
			}
	return (smin <= smax) ? [smin,smax] : null;
}

// API
var _setp = function (obj) {
	return (obj instanceof Set) ? _true : false;
	}
	
var _make_Set = function (top , argc) {
	var superset = checkSet(_stack[top++],"make-set");
	var pred =     checkProc(_stack[top++],1,1,"make-set");
	var interval = (argc > 2) ? _stack[top++] : null ; // check format (min . max) for to day
	var name = (argc > 3) ? nameToString(_stack[top],"make-set") : null ;
	return new Set(superset,name, pred,interval);
}

var _get_interval = function (aset) {
	checkSet(aset,"get-interval");
	return aset.getInterval();
	}
	

// Base sets
	var _S = new Set (null,"S*",_stringp,null);
	var _R = new Set (null,"R",_numberp,null); // js number
	var _Z = new Set (_R, "Z",_integerp,null);
	var _N = new Set (_Z, "N",_positivep,null);
	var _NPLUS = new Set(_N,"N+",_spositivep,null);
	var _EMPTY_SET = new Set(null,"∅",null);
	
function sets_boot () {
	bind_symbol (new Symbol("∅",true),_EMPTY_SET);
	bind_symbol (new Symbol("S*",true),_S);
	bind_symbol (new Symbol("R",true),_R);
	bind_symbol (new Symbol("Z",true),_Z);
	bind_symbol (new Symbol("N",true),_N);
	bind_symbol (new Symbol("N+",true),_NPLUS);
	
	define_sysfun(new Sysfun ("Set?",_setp,1,1));
	define_sysfun(new Sysfun ("make-Set",_make_Set,2,4)) ; // (super pred  [interval] [name])
 

	_LIB["sets.lib"] = true;
	 writeln("sets.lib v1.1 ® EchoLisp","color:green");
}

sets_boot();
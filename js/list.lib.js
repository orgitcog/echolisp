/*
LIST.LIB
(C) G. Brougnard, Jacques Tramu, Simon Gallubert 2015
*/

// returns new list
function __list_rotate_1_new(list, m)  { // left rotate (right rot if m < 0)
	if(list === null) return null ;
	var first , n = Math.abs(m) ;
	list = __list_to_array(list);
	n = n % list.length ;
	if (m < 0) n = list.length - n ;
	while (n--) {
		first = list[0];
		list = list.slice(1) ;
		list.push(first);
		}
	return __array_to_list (list);
}
// returns nothing
function __list_rotate_1(list)  { // left rotate 1
	if(list === null) return null ;
	var first = list[0], next;
	while(list) {
		next = list[1];
		if(next === null) {list[0] = first; return;}
		list[0] = next[0];
		list = list[1];
		}
}
function __list_rotate_right_1(list)  { // right rotate 1
	if(list === null) return null ;
	var arr = __list_to_array(list), i = 0;
	list[0] = arr[arr.length-1] ;
	list = list[1];
	while(list) {
		list[0] = arr[i++] ;
		list = list[1];
		}
}

function __levenshtein (list1, list2, mem) {
var key,cost=1,score;
	if(list1 === null) return __length(list2);
	if(list2 === null) return __length(list1);
	
    key = list1.toString() + "|" + list2.toString();
	if(mem[key]) return mem[key] ;

	if(list1[0] === list2[0]) cost = 0;
    score = Math.min(
    		__levenshtein(list1[1],list2,mem) +1,
    		__levenshtein(list1,list2[1],mem) +1,
    		__levenshtein(list1[1],list2[1],mem) + cost) ;
    mem[key] = score;
    return score;
    }
    
var _list_distance = function  (list1 , list2) {
	if(! isListOrNull (list1)) glisp_error(20,list1,"list-distance");
	if(! isListOrNull (list2)) glisp_error(20,list2,"list-distance");
	var mem = {};
    return __levenshtein (list1, list2, mem) ;
}


// same as filter but returns ( ok-list, ko-list)-
function  __list_partition_1  (list , proc, env ) {
	proc = checkProc(proc,1,1,"list-partition");
	var left=[], right = [] ;
	var call =  [proc ,[null, null]] ;
	while(list) {
		call[1][0] = list[0];
		if (__funcall(call,env) !== _false)
			left.push(list[0]);
			else
			right.push(list[0]);
			list = list[1];
			}
	return [__array_to_list(left), [__array_to_list(right), null]];
	}

function __list_partition_2  (list , proc, pivot, env ) {
	proc = checkProc(proc,2,2,"list-partition");
	var left=[], right = []  ;
	var call =  [proc ,[null, [pivot,null]]] ;
	while(list) {
		call[1][0] = list[0];
		if (__funcall(call,env) !== _false)
			left.push(list[0]);
			else
			right.push(list[0]);
			list = list[1];
			}
	return [__array_to_list(left), [__array_to_list(right), null]];
	}
	
/*-------------------
API
------------------------*/
var _list_partition = function (top,argc,env) {
	var list = _stack[top++];
	var proc = _stack[top++];
	var pivot = (argc > 2) ? _stack[top] : undefined ;
	if(notIsList (list)) glisp_error(20,list,"list-partition");
	return (pivot === undefined) ?
		__list_partition_1(list,proc,env) :
		__list_partition_2(list,proc,pivot,env);
}
	


// in : perm = permutation  list or vector of 0 .. length-1
var _list_permute = function (list , perm) {
var i,j, ret , length,  plength ;
	if(notIsList (list)) glisp_error(20,list,"list-permute");
	if(list[TAG_CIRCULAR]) glisp_error(80,list,"list-permute");
	list = __list_to_array(list);
	if(perm instanceof Vector) perm = perm.vector ;
	else if (Array.isArray(perm)) perm = __list_to_array(perm);
	else glisp_error(20,perm,"list-permute") ;
	plength = perm.length;
	length = list.length;
	
	ret = [];
	for(i=0;i<plength;i++) {
		j = perm[i];
		if(j >= length) glisp_error(24,j,"list-permute:wrong index");
		ret.push(list[j]);
		}
		return __array_to_list(ret);
}

// MUSSTsssT return a new one - return false if not found
// delete only one item
var _list_delete = function (list , old) {
	if(notIsList (list)) glisp_error(20,list,"list-delete");
	if(list[TAG_CIRCULAR]) glisp_error(80,list,"list-delete");
	var ret = [];
	while (list) {
			if(list[0] === old) 
				old = undefined ;
				else ret.push(list[0]);
			list = list[1];
			}
	if(old === undefined) return __array_to_list(ret);
	return _false;
	}

// replace one
var _list_replace = function (list , old, newval) {
	if(notIsList (list)) glisp_error(20,list,"list-replace!");
	if(list[TAG_CIRCULAR]) glisp_error(80,list,"list-replace!");
	var c_list = list;
	while(list) {
		if(list[0] === old) { // eq?
				list[0] = newval;
				return c_list;
				}
		list = list[1];
		}
	return _false;
	}
	


var _list_insert = function (list,item,after) {
	if(notIsList (list)) glisp_error(20,list,"list-insert!");
	if(list[TAG_CIRCULAR]) glisp_error(80,list,"list-insert!");
	var c_list = list;
	while(list) {
		if(list[0] === after) { // eq?
			list[1] = [item,list[1]] ;
			return c_list;
			}
		list = list[1];
		}
	glisp_error(92,after,"list-insert!");
	}

var _list_rotate = function (list , n) {
	if(! isListOrNull (list)) glisp_error(20,list,"list-rotate!");
	if(list[TAG_CIRCULAR]) glisp_error(80,list,"list-rotate!");
	if(! isJSInteger(n))   glisp_error(48,n,"list-rotate!");
	if(n < 0) return _list_rotate_right (list , -n) ;
	while (n--) __list_rotate_1(list);
	return list;
}

var _list_rotate_new = function (list , n) {
	if(! isListOrNull (list)) glisp_error(20,list,"list-rotate");
	if(list[TAG_CIRCULAR]) glisp_error(80,list,"list-rotate");
	if(! isJSInteger(n))   glisp_error(48,n,"list-rotate");
	return  __list_rotate_1_new(list, n);
}
var _list_rotate_right = function (list , n) {
	if(! isListOrNull (list)) glisp_error(20,list,"list-rotate-right!");
	if(list[TAG_CIRCULAR]) glisp_error(80,list,"list-rotate-right!");
	if(! isJSInteger(n))   glisp_error(48,n,"list-rotate-right!");
	if(n < 0) return _list_rotate_left (list , -n) ;
	while (n--)  __list_rotate_right_1(list);
	return list;
}

/*--------------------------
sublists 2^N
--------------------------------*/
/*
(define (power-set e) 
	(cond ((null? e) 
		(make-set (list ∅)))
		(else (let [(ps (power-set (cdr e)))]
		(make-set
		 (append ps (map set-cons (circular-list (car e)) ps)))))))

*/

function __sublists (list) {
	if(list === null) return[null,null] ;
	var ps = __sublists(list[1]) ;
	var _ps = ps , last = null ;
	var pps = [] ;
	while(_ps) {
		pps.push ([list[0],_ps[0]]) ;
		if(_ps[1] === null) last = _ps ;
		_ps = _ps[1];
		}
	last[1] = __array_to_list(pps) ; // append
	return ps ;
}

var _sublists = function (list) {
	if(list === null) return[null,null] ;
	if(notIsList(list)) glisp_error(20,list,"sublists");
	return __sublists(list) ;
}

/*-----------------------
permutations
http://www.cut-the-knot.org/Curriculum/Combinatorics/JohnsonTrotter.shtml
-------------------------------*/
// returns ((i .j) . vstate) 
// state is a vector of [+/-1 .. +/-n]

function __permutations (vstate) {
var i,j,k,kadj,mob,maxmob,tmp,n,state;
// initialize
	if(vstate === _false) return _false;
	if(isSmallSmallInteger(vstate)) {
			 n = vstate;
			 vstate = new Vector(n);
			 for (i=0;i<n;i++) vstate.vector[i] = - (1 + i);
			 return [[0,0] , vstate] ;
			}
	else if (! (vstate instanceof Vector)) glisp_error(16,vstate,"permutations");
	
	state = vstate.vector ;
	n = state.length;
	
// find index k of max mobile
	maxmob = 0; // value
	k = -1; // index
	
	for(i=0;i<n;i++) {
		if(state[i] < 0) j = i-1; else j = i+1;
		mob = Math.abs(state[i]);
		if(j >= 0 && j < n  
			&& (mob > Math.abs(state[j]))
			&& (mob > maxmob)) { maxmob = mob ; k = i ; kadj = j; }}
			
	if(k === -1) return _false ;
	// swap
	tmp = state[k]; state[k] = state[kadj]; state[kadj] = tmp;
	// reverse dir
	for(i=0;i<n;i++) if (Math.abs(state[i]) > maxmob) state[i] = - state[i] ;
	
	return [[k,kadj],vstate] ; // swap indexes returned , abs(vstate) = perm
}

var _permutations = function (list) {
	if(list === null) return null;
	if(notIsList(list)) glisp_error(20,list,"permutations");
	var perms = [];
	var perm = __list_to_array(list);
	var state = perm.length ;
	var i,j,next,swap,tmp;
		while(true) {
			 next = __permutations(state);
			 if(next === _false) break;
			 state = next[1];
			 swap = next[0];
			 i = swap[0]; j = swap[1];
			 tmp = perm[i];perm[i]=perm[j];perm[j]=tmp;
			 perms.push(__array_to_list(perm));
			 }
		return __array_to_list (perms);
}

// perm state Vectors are 1-based
function __perm_state_to_list(state) {
	state = state.vector.slice(0);
	var n = state.length, i;
	for(i=0;i<n;i++) {
			if(state[i] < 0) state[i] = -state[i];
			state[i]= state[i] - 1;
			}
	return __array_to_list(state);
}

function __in_permutations (state) {
	if(! (state instanceof Vector)) return _false;
	var newperm = __permutations(state);
	if (! Array.isArray (newperm)) return _false;
	return [__perm_state_to_list(newperm[1]),newperm[1]] ;
}

var _in_permutations = function (n) {
	if(! isSmallSmallInteger(n)) glisp_error(24,n,"in-permutations");
	var newperm = __permutations(n); // [[i,j] state Vector]
	return new Stream (__perm_state_to_list(newperm[1]), __in_permutations, null, newperm[1]);
}


/*---------------------------
combinations
http://www.kcats.org/csci/464/doc/knuth/fascicles/fasc3a.pdf
-----------------------------------*/

function __comb_init (state,n,k) {
	state.c = [] ;
	state.k = k ;
    for (var i=0; i < k; i++) state.c.push(i);
    state.first = true;
    return state;
} // __comb_init 

function __comb_next (state) {
	var n = state.n ;
	var k = state.k ;
	var c = state.c;
	
	var finished = false;
	var changed = false;
	var i,j;
	
	if(state.first) {
		state.first = false;
		return true;
	}
   
        for (i = k - 1; !finished && !changed; i--) {
            if (c[i] < (n - 1) - (k - 1) + i) {
               //  Increment this element 
                c[i]++;
                if (i < k - 1) {
                    // Turn the elements after it into a linear sequence 
                    for (j = i + 1; j < k; j++) {
                        c[j] = c[j - 1] + 1;
                    }
                }
               changed = true ;
            }
            finished = ( i === 0 );
        }
    return changed  ;
} // __comb_next

var _combinations = function (list , k) {
	if(list === null) return null;
	if(notIsList(list)) glisp_error(20,list,"combinations");
	if(k === 0) return [null,null] ;
	var fromSet = list[TAG_SET];
	list = __list_to_array(list);
	
	var n = list.length;
	if(! isSmallSmallInteger(k) || k < 0 || k > n)
				glisp_error(102,k,"combinations") ;
	
	// remember jsarray for Combinator
	state = { c : [], n : n , k : k , first : true , array : list } ;
	state = __comb_init(state,n,k) ;
	
	var i, comb , combs= [] ; // out
	
		while(true) {
			 comb = [] ;
			 next = __comb_next(state); // sets new state
			 if(next === false) break;

			for(i=0; i< k; i++) comb.push(list[state.c[i]]) ;
			 comb = __array_to_list(comb) ;
			 if(fromSet) comb[TAG_SET] = true;
			 combs.push(comb);
			 }
		combs  = __array_to_list (combs);
		if(fromSet) combs[TAG_SET] = true;
		return combs;
}

/*---------------------------
combinations with repetition
-----------------------------------*/

function __comb_rep_init (state,n,k) {
	state.c = [] ;
	state.k = k ;
    for (var i=0; i < k; i++) state.c.push(0);
    state.first = true;
    return state;
} // __comb_init 

function __comb_rep_next (state) {
	var n = state.n ;
	var k = state.k ;
	var c = state.c;
	
	var finished = false;
	var changed = false;
	var i,j;
	
	if(state.first) {
		state.first = false;
		return true;
	}
   
        for (i = k - 1; !finished && !changed; i--) {
            if (c[i] < (n - 1))  {
               //  Increment this element 
                c[i]++;
                if (i < k - 1) {
                    // Turn the elements after it into a linear sequence 
                    for (j = i + 1; j < k; j++) {
                        c[j] = c[i] ;
                    }
                }
               changed = true ;
            }
            finished = ( i === 0 );
        }
    return changed  ;
} // __comb_rep_next

var _combinations_with_rep = function (list , k) {
	if(list === null) return null;
	if(notIsList(list)) glisp_error(20,list,"combinations/rep");
	list = __list_to_array(list);
	
	var n = list.length;
	if(! isSmallSmallInteger(k) || k <= 0 )
				glisp_error(102,k,"combinations/rep") ;
	
	// remember jsarray for Combinator
	state = { c : [], n : n , k : k , first : true , array : list } ;
	state = __comb_rep_init(state,n,k) ;
	
	var i, comb , combs= [] ; // out
	
		while(true) {
			 comb = [] ;
			 next = __comb_rep_next(state); // sets new state
			 if(next === false) break;

			for(i=0; i< k; i++) comb.push(list[state.c[i]]) ;
			 combs.push(__array_to_list(comb));
			 }
		return __array_to_list (combs);
}


/*--------------------------------
A P I
----------------------------------*/

function boot_list() { 
	define_sysfun(new Sysfun ("list.list-partition",_list_partition,2,3)) ; // (list proc [pivot])
	define_sysfun(new Sysfun ("list.list-permute",_list_permute,2,2)) ; 
	define_sysfun(new Sysfun ("list.list-rotate",_list_rotate_new,2,2)) ; // left
	define_sysfun(new Sysfun ("list.list-rotate!",_list_rotate,2,2)) ; // left
	define_sysfun(new Sysfun ("list.list-rotate-right!",_list_rotate_right,2,2)) ;
	define_sysfun(new Sysfun ("list.list-insert!",_list_insert,3,3)) ; // list,item,after
 	define_sysfun(new Sysfun ("list.list-replace!",_list_replace,3,3)) ; // list,old,new
 	define_sysfun(new Sysfun ("list.list-delete",_list_delete,2,2)) ;
 	define_sysfun(new Sysfun ("list.list-distance",_list_distance,2,2)) ;
 	
 	define_sysfun(new Sysfun ("list.sublists",_sublists,1,1)) ;
 	define_sysfun(new Sysfun ("list.permutations",_permutations,1,1)) ;
 	define_sysfun(new Sysfun ("list.in-permutations",_in_permutations,1,1)) ; //-> stream
 	
 	define_sysfun(new Sysfun ("list.combinations",_combinations,2,2)) ; // (list k)
 	define_sysfun(new Sysfun ("list.combinations/rep",_combinations_with_rep,2,2)) ; // (list k)
 
 	
  _LIB["list.lib"] = true;
  writeln("list.lib v1.3 ® EchoLisp","color:green");
 }
   boot_list();
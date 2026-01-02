
/*
UN/DIRECTED GRAPHS LIBRARY
graph.lib
(C) G. Brougnard & Echolalie 2015

graph := (label v0 ..... vn) : list of all vertices
vertex : (label vi ...vk ..) : adjacent vertices
*/
// user
const  T_MARK = 3 ; // internal here
const  T_PARENT = 4;


/*---------------------
sorting in place an adj. list
input : (label u0 ...un)
out : (label ui  .. uk)
----------------------------*/
function __sort_alist (alist) {
if(! alist[1]) return alist;

function asort(a,b) {
	if(a[0] === b[0]) return 0;
	if(a[0] < b[0]) return -1 ;
	return 1;
}
	var a = __list_to_array (alist[1]);
	a.sort(asort);
	a = __array_to_list(a);
	alist[1]= a;
	return alist;
}

var _graph_sort = function (g) {
	var next = g[1] ;
	while(next) {
			__sort_alist(next[0]);
			next = next[1];
			}
	__sort_alist (g);
	return g;
}

/*----------------------
GRAPHS and DIGRAPHS
------------------------------*/

function isGraph (graph) {
return isListNotNull(graph) && graph[TAG_GRAPH] ;
	}

var _graph_p = function (graph) {
	return isGraph(graph) ? _true: _false;
}

var _make_graph = function (label ) {
	var graph =  [label, null];
	graph[TAG_GRAPH] = true;
	return graph;
}

var _graph_order = function (graph) {
	return __length(graph) - 1;
	}
	
var _graph_size = function (graph) { // count arcs
	return 666 ; // NYI
	}

// nopish if already exits : null
var _graph_make_vertex = function (graph , label) {
if(! isGraph(graph)) glisp_error(107,graph,"graph-make-vertex") ;
	var vertex = _graph_vertex_ref(graph,label) ;// already here ?
	if(vertex) return vertex;
	vertex = [label,null];
	graph[1] = [vertex , graph[1]]; // reverse order add
	return vertex;
}

/*---------------
DIRECTED "adjacent from"
--------------------*/
// two times if already here ....
// return pair of labels
var _graph_make_arc = function (graph , vfrom , vto) {
if(! isGraph(graph)) glisp_error(107,graph,"graph-make-arc") ;
	if(vfrom === null || vto === null) return _false;
	vfrom[1] = [vto , vfrom[1]]; // reverse order add
	return [ vfrom[0], vto[0]] ;
}

var _graph_delete_arc = function (graph , vfrom , vto) {
if(! isGraph(graph)) glisp_error(107,graph,"graph-delete-arc") ;
if(vfrom === null || vto === null) return _false;
	var prec = vfrom; // skip label
	var next = prec[1];
	while(next) {
		if(next[0] === vto) {
							prec[1] = next[1];
							return _true;
							}
		 prec = next;
		 next = next[1];
		 }
	return _false;
	}
	
/*---------------
UNDIRECTED "adjacent with"
--------------------*/
var _graph_make_edge = function (graph , vfrom , vto) {
if(! isGraph(graph)) glisp_error(107,graph,"graph-make-edgec") ;
	vfrom[1] = [vto , vfrom[1]]; // reverse order add
	if(vfrom !== vto) vto[1] = [vfrom, vto[1]] ;
	return [ vfrom[0], vto[0]] ;
}

var _graph_delete_edge = function (graph , vfrom , vto) {
if(! isGraph(graph)) glisp_error(107,graph,"graph-delete-edge") ;
	_graph_delete_arc = (graph , vfrom , vto) ;
	return _graph_delete_arc = (graph , vto , vfrom) ;
}

/*----------------
ALL
----------------*/
var _graph_delete_vertex = function (graph , vdelete) {
	if(vdelete === null) return _false;
	var vx = graph[1];
		while(vx) {
				if(vx !== vdelete) 
				    _graph_delete_arc(graph,vx[0],vdelete);
				vx = vx[1];
				}
	if(_graph_delete_arc(graph,graph,vdelete)) // remove top v list
			return vdelete[0];
			return _false;
	} 
	

// search for label
// stops on first found
// return vertex or null  - uses equal?

var _graph_vertex_ref = function (graph,label) {
	if(! isGraph(graph)) glisp_error(107,graph,"graph-vertex-ref") ;
	var vx = graph[1];
		while(vx) {
				if(vx[0][0] === label) return vx[0]; // eq?
				vx = vx[1];
		}
	return null;
}

var _vertex_set_label = function (vertex , label) {
	if(vertex === null) return _false;
	vertex[0] = label;
	return label; // DOC NYI NYI
}
var _vertex_label = function (vertex ) {
	if(!vertex) return null;
	return vertex[0];
}



// (vertex:out vertices)
var _graph_vertex_out = function (graph,vertex ) {
	if(!vertex) return null;
	return vertex[1];
}
// (vertex:outdegree)
var _graph_vertex_outdegree = function (graph,vertex ) {
	if(!vertex) return 0;
	return __length(vertex[1]);
}
// (graph-out-sort G (proc u v))
var _graph_out_sort = function (graph, proc, env) {
	proc = checkProc(proc,2,2,"graph-out-sort");
	var vfroms = graph[1], out ;
	while(vfroms) {
		out = vfroms[0][1] ; 
		out = __list_to_array(out);
		__array_sort(proc,out,env);
		out = __array_to_list(out);
		vfroms[0][1] = out ;
	vfroms= vfroms[1];
	}
return __void ;
}

// (vertex:in vertices)
// by construction only one edge u-v : DOC and vocabulary
var _graph_vertex_in = function (graph,vertex) {
		if(!vertex) return null;
		var ret=[],vnext,vfroms = graph[1]; // candidates
		while(vfroms) {
			vfrom = vfroms[0];
			vnext = vfrom[1];
			while(vnext) {
				if(vnext[0] === vertex) {ret.push(vfrom); break;}
				vnext = vnext[1];
			}
		vfroms = vfroms[1];
		}
	return __array_to_list(ret);
}

// (vertex:to vertex)
var _graph_vertex_indegree = function (graph,vertex) {
		if(!vertex) return 0;
		var ret=0,vnext,vfroms = graph[1]; // candidates
		while(vfroms) {
			vfrom = vfroms[0];
			vnext = vfrom[1];
			while(vnext) {
				if(vnext[0] === vertex) {ret++ ; break;}
				vnext = vnext[1];
			}
		vfroms = vfroms[1];
		}
	return ret ;
}

// compute all in-degree -
// store them in T_MARK
// returns sum (not used)
function __graph_indegree_all (graph) {
	var vnext,vfroms = graph[1], ret= 0; // candidates
	__graph_mark_all(graph,0);
		while(vfroms) {
			vfrom = vfroms[0];
			vnext = vfrom[1];
			while(vnext) {
				vnext[0][T_MARK]++;
				ret++;
				vnext = vnext[1];
			}
		vfroms = vfroms[1];
		}
return ret;
}

/*------------------------
map functions
----------------------*/
// (proc:1 vertex)
var _graph_for_each = function (proc, graph , env) {
	if(! isGraph(graph)) glisp_error(107,graph,"graph-for-each") ;
	proc = checkProc(proc,1,1,"graph-for-each");
	var call = [proc , [null ,null]] ;
	var vx = graph[1];
		while(vx) {
				call[1][0] = vx [0][0];
				__ffuncall(call,env);
				vx = vx[1];
		}
	return null;
}

/*---------------------
cycles
--------------------------*/

// usage : unmark AFTER each g visit (mandatory : AFTER)
// internal marks
function __graph_mark_all (graph, value) {
	graph= graph[1];
	while(graph) {
		graph[0][T_MARK] = value;
		graph[0][T_PARENT] = value;
		graph = graph[1];
	}
}
function __graph_unmark_all (graph) {
	__graph_mark_all(graph, undefined);
}

// (graph-cycle graph [vertex])
// find 1 cycle (random)
var _graph_cycle = function (top, argc) {
var graph = _stack[top++];
if(! isGraph(graph)) glisp_error(107,graph,"graph-cycle") ;

if(argc === 2)
	return _graph_cycle_from_vertex (graph, _stack[top]) ;
	var next = graph[1], cycle = null;
	while(next) {
		cycle = _graph_cycle_from_vertex (graph,next[0]);
		if(cycle) return cycle;
		next= next[1];
	}
	return null ;
}

// returns list (v_0 .... v_n) or null
// (v0 v0) is not a cycle
// cannot use a node several times DOC u_i !== u_k
function _graph_cycle_from_vertex (graph, vertex) {
	var cycle = [];
	if(! isGraph(graph)) glisp_error(107,graph,"graph-cycle") ;
	_graph_cycle_1(vertex,vertex,cycle);
	__graph_unmark_all(graph) ;
	return __array_to_list(cycle);	// or null	
}

function _graph_cycle_1 (vertex, target, cycle) {
var next;
	if(vertex[T_MARK]) return ((vertex === target) && (cycle.length > 1));
	vertex[T_MARK] = true;
	cycle.push(vertex); // label
	next = vertex[1];
		while(next) {
		if( _graph_cycle_1 (next[0], target, cycle)) return true;
		next = next[1];
		}
	cycle.pop();
	return false;
}

/*--------------------------
VISITS
-------------------------*/
// Moores's breadth-first search
// out : shortest u-v path if one exists

var _graph_min_path  = function (g , u, v) { // DOC DOC DOC
if(! isGraph(g)) glisp_error(107,g,"graph-min-path") ;
if(u === v) return null;

	var x,y,k,next;
	var Q = [] , path = [];
	u[T_MARK] = 0 ; // undef = infinite for other
	Q.push(u);

	while (Q.length) { // 0 means no path found
	x = Q.shift();
	next = x[1];
		while(next) {
		y = next[0];
			if(y[T_MARK] === undefined) {
				y[T_PARENT] = x ;
				y[T_MARK] = x[T_MARK] + 1 ;
				Q.push(y);
				}
		next = next[1];
		}
	if (v[T_MARK] !== undefined) break;
	} // Q
	
	if(Q.length) {
	k = v[T_MARK];
	path[k] = v ;
	while(k) {
				path[k-1] = path[k][T_PARENT] ;
				k = k-1 ;
			  }
		} // Q.length : path found
			  
	// clean up
	__graph_unmark_all(g) ;
	return __array_to_list(path) ;
} // min-path

// set v[T_MARK] = d(u,v) for all v reachable from u
// d === undefined if not reachable
// must clean graph after usage !!!
// RFU RFU RFU
function __distances (g ,u) {
	var Q = [] , path = [];
	var x,y,next;
	u[T_MARK] = 0 ; // undef = infinite for other
	Q.push(u);
	
	while (Q.length) { // 0 means no path found
	x = Q.shift();
	next = x[1];
		while(next) {
		y = next[0];
			if(y[T_MARK] === undefined) {
				y[T_MARK] = x[T_MARK] + 1 ;
				Q.push(y);
				}
		next = next[1];
		}
	} // Q
// distances are set here
}

// dag topological sort
var _graph_dag_sort = function ( g ) {
var Q=[],next,u,v, sort= [] , unsort= [];
		if(! isGraph(g)) glisp_error(107,g,"graph-dag-sort") ;
		__graph_indegree_all(g); // T_MARK
// push all degree 0
		next= g[1];
		while(next) {
				u = next[0];
				if (u[T_MARK] === 0) Q.push(u) ;
				next= next[1];
				}
		while(Q.length) {
			u = Q.shift(0);
			next= u[1];
			while(next) {
				v = next[0];
				v[T_MARK]--;
				if(v[T_MARK] === 0) Q.push(v);
				next = next[1];
				}
			sort.push(u);
			} // Q
			
// check all done
			next= g[1];
			while(next) {
				u = next[0];
				if (u[T_MARK] !== 0) unsort.push(u[0]); // label
				next= next[1];
				}
// clean
			__graph_unmark_all(g);
		if(unsort.length) 
		return glisp_warning("cycle(s) found",__array_to_list(unsort),"graph-dag-sort") ;
		return __array_to_list(sort);
}


/*-----------------------
printing
-----------------------------*/
// vertex format : label : to-label-1 .....
var _graph_print_vertex = function(graph,vertex) {
var outline, to ;
	if(! isGraph(graph)) glisp_error(107,graph,"graph-print-vertex") ;
	outline = (glisp_message(vertex[0],""));
	
	var vx = vertex[1]; // to vertices
	if(vx) outline += " : ";
	while(vx) {
	to = vx[0];
		outline +=  (glisp_message (to[0],"")) +  ":" +
		_graph_vertex_indegree(graph,to) + ":"  + _graph_vertex_outdegree(graph,to)+ " ";
		vx = vx[1];
	}
	writeln(outline);
	GPrinter.write(outline); 
return __void;
}

var _graph_print = function(graph) {
	if(! isGraph(graph)) glisp_error(107,graph,"graph-print") ;
	var outline = glisp_message(graph[0],"♺") ;
	
	writeln(outline,"color:green");
	GPrinter.write(outline); 
	
	var vx = graph[1];
	while(vx) {
		_graph_print_vertex(graph,vx[0]);
		vx = vx[1];
	}
return __void;
}

	
/*---------------
library
-------------*/
function graph_boot() {
		define_sysfun  (new Sysfun ("graph.graph?",_graph_p,1,1)); 
		define_sysfun  (new Sysfun ("graph.make-graph",_make_graph,1,1)); 
		define_sysfun  (new Sysfun ("graph.graph-sort",_graph_sort,1,1)); 
		define_sysfun  (new Sysfun ("graph.graph-make-vertex",_graph_make_vertex,2,2)); 
		define_sysfun  (new Sysfun ("graph.graph-make-arc",_graph_make_arc,3,3)); // digraph from-to
		define_sysfun  (new Sysfun ("graph.graph-make-edge",_graph_make_edge,3,3)); // graph from-to

		define_sysfun  (new Sysfun ("graph.vertex-set-label",_vertex_set_label,2,2));	
		define_sysfun  (new Sysfun ("graph.vertex-label",_vertex_label,1,1));
		define_sysfun  (new Sysfun ("graph.graph-vertex-ref",_graph_vertex_ref,2,2));	
		define_sysfun  (new Sysfun ("graph.graph-delete-arc",_graph_delete_arc,3,3));	
		define_sysfun  (new Sysfun ("graph.graph-delete-edge",_graph_delete_edge,3,3));	

		define_sysfun  (new Sysfun ("graph.graph-delete-vertex",_graph_delete_vertex,2,2));	
		// define_sysfun  (new Sysfun('graph-fold',_graph_fold,3,3));
		// define_sysfun  (new Sysfun('graph-for-each',_graph_for_each,2,2));
		define_sysfun  (new Sysfun("graph.graph-order",_graph_order,1,1)); 
		//define_sysfun  (new Sysfun('graph-size',_graph_size,1,1)); 
		
		define_sysfun  (new Sysfun ("graph.graph-vertex-out",_graph_vertex_out,2,2)); 
		define_sysfun  (new Sysfun ("graph.graph-vertex-outdegree",_graph_vertex_outdegree,2,2));
		define_sysfun  (new Sysfun ("graph.graph-vertex-in",_graph_vertex_in,2,2)); 
		define_sysfun  (new Sysfun ("graph.graph-vertex-indegree",_graph_vertex_indegree,2,2));
		// (out-sort G (cmp-proc g u v))
		define_sysfun  (new Sysfun ("graph.graph-out-sort",_graph_out_sort,2,2)); // NEW !! DOC !!

		// visits
		define_sysfun  (new Sysfun ("graph.graph-for-each",_graph_for_each,2,2)); // vertex
		define_sysfun  (new Sysfun ("graph.graph-cycle",_graph_cycle,1,2)); //-> null | node-list
		define_sysfun  (new Sysfun ("graph.graph-min-path",_graph_min_path,3,3));
		define_sysfun  (new Sysfun ("graph.graph-dag-sort",_graph_dag_sort,1,1)); 

		define_sysfun  (new Sysfun ("graph.graph-print",_graph_print,1,1)); 
		define_sysfun  (new Sysfun ("graph.graph-print-vertex",_graph_print_vertex,2,2)); 
		
		_LIB["graph.lib"] = true;
		writeln("graph.lib v1.2 ® EchoLisp","color:green");
		}
		
graph_boot();

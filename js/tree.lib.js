/*
Tree library
(C) G. Brougnard & Echolalie 2015

node := (datum [node ...])
(car node) = datum
(cdr node) = forest | null = leaf node
*/

/*-----------------
queues
-----------------------*/
var _dequeue = function (symb) {
	if(! (symb instanceof Symbol)) glisp_error(23,symb,"dequeue");
	if(symb.queue === undefined) return _false;
	var value = symb.queue.shift();
	return (value === undefined) ? _false : value;
}
var _set_queue_empty = function (symb) { // creation
	if(! (symb instanceof Symbol)) glisp_error(23,symb,"set-queue-empty!");
	symb.queue = [] ;
	return symb ;
}
var _queue_to_list = function (symb) {
	if(! (symb instanceof Symbol)) glisp_error(23,symb,"queue");
	if(symb.queue === undefined) return null;
	return __array_to_list(symb.queue) ; // top on right
}
var _queue_length = function (symb) {
	if(! (symb instanceof Symbol)) glisp_error(23,symb,"queue");
	if(symb.queue === undefined) return 0;
	return symb.queue.length ;
}
var _list_to_queue = function (list ,symb) {
	if(! isListOrNull (list)) glisp_error(20,list,"list->queue");
	if(! (symb instanceof Symbol)) glisp_error(23,symb,"list->queue");
	symb.queue = (list === null) ? [] : __list_to_array(list) ;
	return symb  ;
}
var _enqueue = function (symb, value) {
	if(! (symb instanceof Symbol)) glisp_error(23,symb,"enqueue");
	if(symb.queue === undefined) symb.queue = [];
	symb.queue.push(value) ;
	return value;
}
var _queue_empty = function (symb) { // predicate
	if(! (symb instanceof Symbol)) glisp_error(23,symb,"queue-empty");
	return (symb.queue === undefined || symb.queue === null || symb.queue.length === 0) ? 
			_true : _false ;
	}
var _queue_top = function (symb) {
	if(! (symb instanceof Symbol)) glisp_error(23,symb,"queue-top");
	if (symb.queue === undefined || symb.queue === null || symb.queue.length === 0)  return _false;
	return symb.queue[0];
	}
var _queue_swap = function (symb) {
	if(! (symb instanceof Symbol)) glisp_error(23,symb,"queue-swap");
	if (symb.queue === undefined || symb.queue === null || symb.queue.length <= 1)  return _false;
	var tmp =  symb.queue[1];
	symb.queue[1] = symb.queue[0];
	symb.queue[0] = tmp;
	return tmp; // new top
	}

/*----------------------
TREES
node structure : (datum son son son ....)
------------------------------*/

function isTree (root) {
return isListNotNull(root) && root[TAG_TREE];
	}
	
var _tree_p = function (root) {
	return isTree(root) ? _true: _false;
}

var _make_tree = function ( datum ) {
	var root =  [datum, null];
	root[TAG_TREE] = true;
	return root;
}

// tree-ref
// search for datum
// stops on first found
// return node or null  - uses equal?

var _tree_ref = function (root,datum) {
	if(! isTree(root)) glisp_error(104,root,"tree-ref") ;
	return __tree_ref_1(root,datum) ;
	}
	
function __tree_ref_1 (node, datum) {
var hit ;
	if(!node) return null;
	if (__equal (datum,node[0])) return node;
	node= node[1];
	while(node) {
		if((hit = __tree_ref_1(node[0],datum))) return hit;
		node= node[1];
	}
	return null ;
}

/*
// tree-path
// search for datum
// stops on first found
// return list of data

var _tree_path = function (root,datum) {
	if(! isTree(root)) glisp_error(104,root,"tree-ref") ;
	var path = [] ;
	 __tree_path_1(root,datum,path) ;
	 return __array_to_list(path) ;
	}
	
function __tree_path_1 (node, datum,path) {
var hit ;
	if(!node) return false;
	if (__equal (datum,node[0])) { path.push(datum); return true; }
	var ndatum = node[0];
	node= node[1];
	while(node) {
		if( __tree_path_1(node[0],datum,path)) { path.push(ndatum); return true; }
		node= node[1];
	}
	return false ;
}
*/



// replaces node by tree
// cannot replace root (will not be found)
// return tree[0] = root datum
var _tree_replace_node = function (node, /*old*/ olnode , /* new */ tree) {
	if(! node) return null;
	node = node[1] ;
		while (node ) { 
			if(node[0] === olnode) {node[0] = tree ; return tree[0]; }
			if(_tree_replace_node(node[0],olnode,tree)) return tree[0];
			node = node[1] ;
		}
	return tree[0];
}

// tree-delete
// delete node and all subnodes
// returns #t or #f
// cannot delete root (check me)
var _tree_delete_node = function (node, /*old*/ olnode) {
var prec ;
		if(! node) return null;
		prec = node ;
		node = node[1] ;

		while (node ) { 
		if(node[0] === olnode) {prec[1] = node[1] ; return _true ; }
		if(_tree_delete_node(node[0],olnode) === _true) return _true;
		prec = node;
		node = node[1];
		}
	return _false;
}

/*------------
map ops
-----------------*/
// proc(node-datum,acc) -> acc
// return acc
// DEPTH FIRST - PRE-ORDER for a tree (DOC) NYI NYI
// DEPTH FIST -  IN-ORDER -SYMMETRIC for a bin tree
// https://en.wikipedia.org/wiki/Tree_traversal

var _tree_fold = function(proc, acc, root, env) {
	if(! isTree(root)) glisp_error(104,root,"tree-fold") ;
	proc = checkProc(proc,2,2,"tree-fold") ;
	var fcall = [proc, [null , [null ,null]]];
	if(root[TAG_BIN_TREE])
			return __tree_fold_symmetric (fcall,acc, root, env) ;
		else
			return __tree_fold_pre_order (fcall,acc, root, env) ;
}

function __tree_fold_pre_order (fcall, acc, node, env) {
	if(!node) return acc;
	var sons = node[1];
// me
	fcall[1][0] = node[0]; // not node
	fcall[1][1][0] = acc;
	acc = __ffuncall(fcall, env);
// sons
	while(sons) {
		acc = __tree_fold_pre_order (fcall, acc, sons[0], env) ;
	 	sons = sons[1];
	 	}
return acc;
}

function __tree_fold_symmetric (fcall, acc, node, env) {
	if(!node) return acc;
	var sons = node[1];
// left
	if(sons) { acc = __tree_fold_symmetric (fcall , acc, sons[0], env) ;
			 sons= sons[1]; 
			 }
// me
	fcall[1][0] = node[0]; // not node
	fcall[1][1][0] = acc;
	acc = __ffuncall(fcall, env);
// right
	while(sons) {
		acc = _tree_fold_symmetric (fcall, acc, sons[0], env) ;
	 	sons = sons[1];
	 	}
return acc;
}

// return void
// proc(node)
var _tree_for_each = function (proc, root, env) {
	if(! isTree(root)) glisp_error(104,root,"tree-for-each") ;
	proc = checkProc(proc,1,1,"tree-for-each") ;
	var fcall = [proc, [null ,null]]; 
	if(root[TAG_BIN_TREE])
			__tree_for_each_symmetric (fcall, root, env) ;
		else
			__tree_for_each_pre_order (fcall, root, env) ;
return __void ;
}

// post-order
function __tree_for_each_pre_order (fcall ,node, env) {
	if(!node) return;
	var sons = node[1];
// me
	fcall[1][0] = node; // not datum !
	__ffuncall(fcall, env);
// sons
	while(sons) {
	 __tree_for_each_pre_order (fcall ,sons[0], env) ;
	 sons = sons[1];
	}
}

// will produce sorted list if binary tree
function __tree_for_each_symmetric (fcall ,node, env) {
	if(!node) return;
	var sons = node[1];
// left
	if(sons) {  __tree_for_each_symmetric (fcall ,sons[0], env) ; 
		sons= sons[1]; 
		}
// me
	fcall[1][0] = node; // not datum !
	__ffuncall(fcall, env);
// right
	while(sons) {
	 __tree_for_each_symmetric (fcall ,sons[0], env) ;
	 sons = sons[1];
	}
}

/*---------------
counting
---------------------*/
// returns pair (count . maxheight)
function _tree_count(root) {
if(!isTree(root)) glisp_error(104,root,"tree-count") ;
if(root[TAG_BIN_TREE]) return __bin_tree_count(root);
var count = 0;
var height = 0;
var maxheight = 0;
	function __tree_count_1 (node) {
		if(!node) return;
		count++ ; // nodes
		if(height > maxheight) maxheight = height ;
		node = node[1];
		height++;
		while(node) {
				__tree_count_1 (node[0]) ;
				node= node[1];
				}
		height--;
		}
	__tree_count_1(root);
	return [count , maxheight] ;
}

/*--------------
node
-------------------*/
// add a tree to a node
// use tree = (make-tree datum) to add a leaf
// adds rightmost son

// physical : DOC !!!
var _node_add_tree = function ( node , tree) {
if(!isTree(tree)) glisp_error(104,tree,"node-add-tree") ;
	tree[TAG_TREE] = undefined ; // because we are inside
	return __node_add_tree_1 (node, tree) ;
}

// returns node
function __node_add_tree_1 ( node , tree) {
if(! isList(node)) glisp_error(104,node,"node-add-tree") ;
	 while (true) {
	 if(node[1] === null) { 
	 		node[1] = [tree,null];
	 		return tree ; 
	 		}
	 node = node[1];
	 }
}

var _node_add_leaf = function ( node , datum) {
	return __node_add_tree_1 (node, [datum,null]) ;
}

var _node_set_datum = function (node , datum) {
	if(node === null) return _false;
	node[0] = datum;
	return datum; // DOC NYI NYI
}
var _node_datum = function (node ) {
	if(!node) return null;
	return node[0];
}

var _node_sons = function (node) {
	if(!node) return null;
	return node[1];
}

// BAD : check no sons or all sons === null
var _node_leaf_p = function (node) {
	return (node[1] === null) ? _true : _false ;
}
var _node_left = function (node) {
	if(!node) return null ;
	if(!node[1]) return null;
	return node[1][0] ; // may be null
	}
	
// LAST right son (works also for binary)
// null if only one son  ????  DOC NYI NYI
var _node_right = function (node) {
var right = null;
	if(!node) return null ;
	node = node[1]; // first
	if(!node) return null ;
	node = node[1];
	while(node) {
		right = node[0];
		node= node[1];
		}
	return right;
	}


/*------------------
binary tree
node = ((key . value) left-node|null right-node|null)
node[0][0] is key , node[0][1] is value (not null)
node[1][0] is left
node [1][1][0] is right
toot[TAG_BIN_TREE][0] count number of insertions

deleted node : node[0][1] (= value) = null
assert (node[0] !== null)
---------------------*/
var _BALANCED = 0;

function isBinTree (root) {
	return isListNotNull(root) && Array.isArray(root[TAG_BIN_TREE]) ;
	}
	
var _bin_tree_stats = function (root) {
	if(!isBinTree(root)) glisp_error(105,root,"tree-stats") ;
	return "nodes: " + root[TAG_BIN_TREE][0] + 
		" depth: " +  root[TAG_BIN_TREE][1]  + 
		" balanced: " + _BALANCED ;
}

// returns root = tree
var _make_bin_tree = function (key ,value) {
	var tree = [[key , value],[null, [null, null]]] ;
	tree[TAG_BIN_TREE] = [1 , 0 ]; // node count , last computed depth 
	tree[TAG_TREE] = true;
	_BALANCED = 0;
	return tree;
}

function __bin_tree_count(root) { // Looooong
	_bin_tree_balance(root);
	return root[TAG_BIN_TREE][0];
}

var _bin_tree_empty = function (root) {
	if(!isBinTree(root)) glisp_error(105,root,"bin-tree-empty?") ;
	if (root[TAG_BIN_TREE][0] === 0) return _true;
	return __bin_tree_first_1(root) === null ? _true : _false ;
}

// returns key
var _bin_tree_insert = function (root , key, value) {
var counter, depth;
	if(typeof key !== "number") key = nameToString(key,"bin-tree-insert") ; // 3/4 will not work NYI
	if(!isBinTree(root)) glisp_error(105,root,"bin-tree-insert") ; 
	if(value === null)  glisp_error(60,key,"bin-tree-insert");
	counter = root[TAG_BIN_TREE] ;

	if(root[0][0] === null) { // empty one
				root[0] = [key, value];
				counter[0] = 1;
				counter[1] = 0;
				return key ;
				}
	
	depth =  __bin_tree_insert_1 (root, key,value,0) ; 
	if(depth === -1) return _false; // already here
	
	if(depth > counter[1]) counter[1] = depth;
	counter[0]++;
	
	 // balancing needed ?
	 if		(counter[0] % 100 === 0  // sampling rate : each n inserts
	 		&&  (counter[1] > Math.ceil(Math.log2 (counter[0]))))
	 	_bin_tree_balance(root);
	 // returns a 0 depth : updated by insert
	 
	 return key;
}

// returns #t
// bumps node counter ...
var _bin_tree_delete = function (root , key) {
	if(typeof key !== "number") key = nameToString(key,"bin-tree-delete") ; // 3/4 will not work NYI
	if(!isBinTree(root)) glisp_error(105,root,"bin-tree-delete") ; 
	
	if (__bin_tree_search_1 (root , key) === null) 
					return _false; // deleted or unk key
	
	__bin_tree_insert_1 (root, key,null,0) ; // will be physically erased by balance
	return _true;
}

// return max-depth or -1 if already here
function __bin_tree_insert_1 (node , key, value, depth) {
	var left, right ,itskey  ; 
	itskey = node[0][0] ;
	if (itskey === key) {
						if(node[0][1] === value) return -1; // eq? predicate
						node[0][1] = value; 
						return depth; 
						}
	else if(key < itskey) {
			left = node[1][0];
			if(left === null) { 
						node[1][0] = [[key , value],[null, [null, null]]] ;
						return depth;
						}
			return __bin_tree_insert_1 (left , key, value, depth+1) ;
			}
	else {
			right = node[1][1][0];
			if(right === null) { 
						node[1][1][0] = [[key , value],[null, [null, null]]] ;
						return depth;
						}
			return __bin_tree_insert_1 (right , key, value, depth+1) ;
			}
}

// return value
// uses eq?
var _bin_tree_search = function (root , key) {
	if(typeof key !== "number") key = nameToString(key,"bin-tree-search") ; // 3/4 will not work NYI
	if(!isBinTree(root)) glisp_error(105,root,"bin-tree-search") ; 
	return __bin_tree_search_1 (root, key) ; 
}

function __bin_tree_search_1 (node , key) {
	while (node) {
		if(node[0][0] === key) return node[0][1]; // value or null if deleted
		else if (key < node[0][0]) node = node[1][0] ;
		else node = node[1][1][0] ;
	}
return null;
}

// return (key . val)
var _bin_tree_first = function (root ) {
	if(!isBinTree(root)) glisp_error(105,root,"bin-tree-first") ; 
	return  _node_datum (__bin_tree_first_1 (root)) ; 
}
var _bin_tree_last = function (root ) {
	if(!isBinTree(root)) glisp_error(105,root,"bin-tree-first") ; 
	return _node_datum (__bin_tree_last_1 (root)) ; 
}
var _bin_tree_pop_first = function (root ) {
	if(!isBinTree(root)) glisp_error(105,root,"bin-tree-first") ; 
	var node = __bin_tree_first_1 (root) ; 
	if(node === null) return null;
	var kvalue = node[0] ;
	node[0][1] = null; // deleted
	return kvalue;	
}
var _bin_tree_pop_last = function (root ) {
	if(!isBinTree(root)) glisp_error(105,root,"bin-tree-first") ; 
	var node = __bin_tree_last_1 (root) ; 
	if(node === null) return null;
	var kvalue = node[0] ;
	node[0][1] = null; // deleted
	return kvalue;		
}

// returns a node
function __bin_tree_first_1 (node) {
	if(node === null) return null;
	if(node[0][1] !== null) { // not deleted
				if(node[1][0] === null) return node ; // no left
				else return __bin_tree_first_1(node[1][0]) || node ;
				}
	// deleted
		return  __bin_tree_first_1 (node[1][0]) 
				 || __bin_tree_first_1 (node[1][1][0])  ; // left or right
}


// returns a node
function __bin_tree_last_1 (node) {
	if(node === null) return null;
	if(node[0][1] !== null) { // not deleted
				if(node[1][1][0] === null) return node ; // no right
				else return __bin_tree_last_1(node[1][1][0]) || node ;
				}
	// deleted
		return  __bin_tree_last_1 (node[1][1][0]) 
				 || __bin_tree_last_1 (node[1][0])  ; // right or left
}


/*----------------
converting
---------------------*/
function __tree_to_array(root) {
	var alist = [] ;
	if(root[TAG_BIN_TREE])
			__bin_tree_to_array_1 (root, alist);
		else
	 		__tree_to_array_1 (root , alist) ;
	return alist;
}

function __tree_to_array_1 (node , alist) {
	if(node === null) return;
	var sons = node[1];
// left
	if(sons) {  __tree_to_array_1 (sons[0],alist) ; sons= sons[1]; }
// me
	if(node[0] !== null ) alist.push(node[0]); // skip deleted
// right
	while(sons) {
	 __tree_to_array_1 (sons[0], alist) ;
	 sons = sons[1];
	}
}

function __bin_tree_to_array_1 (node , alist) {
	if(node === null) return;
	var left  = node[1][0];
// left
	if(left)   __bin_tree_to_array_1 (left,alist) 
// me
	if(node[0][1] !== null ) alist.push(node[0]); // skip deleted
// right
	var right  = node[1][1][0];
	if(right)   __bin_tree_to_array_1 (right,alist) ;
}

var _tree_to_list = function(root) {
	if(!isTree(root)) glisp_error(104,root,"tree->list") ;
	var alist = [] ;
	return __array_to_list( __tree_to_array (root));
}

/*----------------
balancing
------------------*/

// must keep same root !!!
// returns key.value [0]
function _bin_tree_balance (root) {
var balance_count = _BALANCED ; // save
var balanced;
	if(!isBinTree(root)) glisp_error(105,root,"bin-tree-balance") ; 
	if(root[0] === null) return [0 ,0] ; // empty
//console.log(">bin-tree-balance", root[TAG_BIN_TREE]);
	var alist =  [] ;
	__bin_tree_to_array_1(root,alist); // array of [key,value]
	var nodes = alist.length;
	
	if (nodes === 0) 
		balanced = [[null , null],[null, [null, null]]] ;
	else if(nodes === 1) 
		balanced = [alist[0],[null, [null, null]]] ;
	else
	balanced =  __tree_balance_1(null,0,nodes-1,alist);
	
// patch old root
	root[0] = balanced[0];
	root[1] = balanced[1];
	// dummy depth - update by next insert
	root[TAG_BIN_TREE] = [nodes, 0]; 
//console.log("<bin-tree-balance", root[TAG_BIN_TREE]);
	_BALANCED = ++balance_count;
	return root[TAG_BIN_TREE] ;
}

// returns new root
function __tree_balance_1(root,tmin,tmax,alist) {
	if(tmin > tmax) return root ;
	var mid = Math.floor((tmin+tmax) / 2);
	if(root === null)
			root = _make_bin_tree (alist[mid][0],alist[mid][1]);
			else __bin_tree_insert_1 (root,alist[mid][0],alist[mid][1]); // no balance
	__tree_balance_1(root,tmin,mid-1,alist);
	__tree_balance_1(root,mid+1,tmax,alist);
	return root;
}

/*---------------
library
-------------*/

function tree_boot() {
		define_sysfun (new Sysfun('dequeue', _dequeue,1,1)); 
		define_sysfun (new Sysfun('enqueue', _enqueue,2,2)); 
		define_sysfun (new Sysfun('q-pop', _dequeue,1,1)); // (q-pop symb) 
		define_sysfun (new Sysfun('q-push', _enqueue,2,2)); // (q-push symb val)
		define_sysfun (new Sysfun('queue->list', _queue_to_list,1,1)); // (queue->list symb )
		define_sysfun (new Sysfun('list->queue', _list_to_queue,2,2)); // (list->queue list symb ) 
		define_sysfun (new Sysfun('queue', _set_queue_empty,1,1)); // (queue symb )
		define_sysfun (new Sysfun('queue-empty?', _queue_empty,1,1)); 
		define_sysfun (new Sysfun('queue-top', _queue_top,1,1)); 
		define_sysfun (new Sysfun('queue-swap', _queue_swap,1,1)); 
		define_sysfun (new Sysfun('queue-length', _queue_length,1,1));
	
		define_sysfun  (new Sysfun ("tree?",_tree_p,1,1)); 
		define_sysfun  (new Sysfun ("make-tree",_make_tree,1,1)); 
		define_sysfun  (new Sysfun ("node-set-datum",_node_set_datum,2,2));	
		define_sysfun  (new Sysfun ("node-datum",_node_datum,1,1));
		define_sysfun  (new Sysfun ("tree-ref",_tree_ref,2,2));	
		define_sysfun  (new Sysfun ("tree-replace-node",_tree_replace_node,3,3));
		define_sysfun  (new Sysfun ("tree-delete-node",_tree_delete_node,2,2));	
		define_sysfun  (new Sysfun('tree-fold',_tree_fold,3,3));
		define_sysfun  (new Sysfun('tree-for-each',_tree_for_each,2,2));
		define_sysfun  (new Sysfun('tree-count',_tree_count,1,1)); // -> ( count. height)
		
		define_sysfun  (new Sysfun ("node-add-tree",_node_add_tree,2,2));  
		define_sysfun  (new Sysfun ("node-add-leaf",_node_add_leaf,2,2));  
		define_sysfun  (new Sysfun ("node-sons",_node_sons,1,1)); // forest = list of sons
		define_sysfun  (new Sysfun ("node-leaf?",_node_leaf_p,1,1));
		define_sysfun  (new Sysfun ("node-left",_node_left,1,1));
		define_sysfun  (new Sysfun ("node-right",_node_right,1,1));
		
		define_sysfun  (new Sysfun ("make-bin-tree",_make_bin_tree,2,2)); 
		define_sysfun  (new Sysfun ("bin-tree-insert",_bin_tree_insert,3,3)); 
		define_sysfun  (new Sysfun ("bin-tree-delete",_bin_tree_delete,2,2)); 
		define_sysfun  (new Sysfun ("bin-tree-search",_bin_tree_search,2,2)); 
		define_sysfun  (new Sysfun ("bin-tree-balance",_bin_tree_balance,1,1)); 
		define_sysfun  (new Sysfun ("bin-tree-first",_bin_tree_first,1,1)); 
		define_sysfun  (new Sysfun ("bin-tree-last",_bin_tree_last,1,1)); 
		define_sysfun  (new Sysfun ("bin-tree-pop-first",_bin_tree_pop_first,1,1)); 
		define_sysfun  (new Sysfun ("bin-tree-pop-last",_bin_tree_pop_last,1,1)); 
		
// tree-empty to implement
		define_sysfun  (new Sysfun ("bin-tree-empty?",_bin_tree_empty,1,1)); // DOC NEW
		define_sysfun  (new Sysfun ("tree->list",_tree_to_list,1,1)); // DOC NEW
		
// debug
	define_sysfun  (new Sysfun ("bin-tree-stats",_bin_tree_stats,1,1));
		
		
		writeln("tree.lib v1.3 ® EchoLisp","color:green");
		_LIB["tree.lib"] = true;
		}
tree_boot();

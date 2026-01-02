/*
heap.lib
adapted from http://eloquentjavascript.net/1st_edition/appendix2.html
*/

function Heap (cmp_proc){
  this.content = [];
  this.cmp_proc = cmp_proc;
  
  this.compare = [cmp_proc ,[ null, [null , null]]] ;
}

Heap.prototype = {

  toString : function () {
  	return "#heap:坨:" + this.content.length;
  },
  
  push: function(element) {
    // Add the new element to the end of the array.
    this.content.push(element);
    // Allow it to bubble up.
    this.bubbleUp(this.content.length - 1);
    return element;
  },

  pop: function() {
  	var elems = this.content.length;
  	if (elems === 0) return _false;
    // Store the first element so we can return it later.
    var result = this.content[0];
    // Get the element at the end of the array.
    var end = this.content.pop();
    // If there are any elements left, put the end element at the
    // start, and let it sink down.
    if (elems > 1) {
      this.content[0] = end;
      this.sinkDown(0);
    }
    return result;
  },

/*
  remove: function(node) {
    var length = this.content.length;
    // To remove a value, we must search through the array to find
    // it.
    for (var i = 0; i < length; i++) {
      if (this.content[i] != node) continue;
      // When it is found, the process seen in 'pop' is repeated
      // to fill up the hole.
      var end = this.content.pop();
      // If the element we popped was the one we needed to remove,
      // we're done.
      if (i == length - 1) break;
      // Otherwise, we replace the removed element with the popped
      // one, and allow it to float up or sink down as appropriate.
      this.content[i] = end;
      this.bubbleUp(i);
      this.sinkDown(i);
      break;
    }
  },
*/

  size: function() {
    return this.content.length;
  },
  
  top: function() {
   return this.content.length > 0 ? this.content[0] : _false ;
  },
  
  isempty : function () {
  	return this.content.length === 0 ? _true : _false ;
  },
  
  toList : function () {
  	return __array_to_list(this.content) ;
  },
  
  toText : function () {
  	return glisp_tostring (this.toList(), "") ;
  },
  
  fromList : function (array) {
  	this.content = array;
  	var n = this.content.length >> 1, i;
  		for(i=n;i >=0; i--) this.sinkDown(i);
  	return this;
  	},
  	

  bubbleUp: function(n) {
    // Fetch the element that has to be moved.
    var element = this.content[n];  //score = this.scoreFunction(element);
    this.compare[1][0] = element;  // loop invariant
    // When at 0, an element can not go up any further.
    while (n > 0) {
      // Compute the parent element's index, and fetch it.
      //var parentN = Math.floor((n + 1) / 2) - 1,
      var parentN = ((n + 1) >> 1) - 1,
      parent = this.content[parentN];
      // If the parent has a lesser score, things are in order and we
      // are done.
              this.compare[1][1][0] = parent;
              if(__funcall(this.compare,glisp.user) === _false) break;

// if(__funcall(this.compare,glisp.user) !== _false 
//   && element >=parent) console.log('UP',element,parent);
//if (element >= parent) break;

      // Otherwise, swap the parent with the current element and
      // continue.
      this.content[parentN] = element;
      this.content[n] = parent;
      n = parentN;
    }
  },
  

  sinkDown: function(n) {
    // Look up the target element and its score.
    var length = this.content.length,
    element = this.content[n];
   
    while(true) {
      // Compute the indices of the child elements.
      var child2N = (n + 1) * 2, child1N = child2N - 1;
      // This is used to store the new position of the element,
      // if any.
      var swap = null;
      var swapper ;
      // If the first child exists (is inside the array)...
      if (child1N < length) {
        // Look it up and compute its score.
        var child1 = this.content[child1N];
        //child1Score = this.scoreFunction(child1);
        // If the score is less than our element's, we need to swap.
         	  this.compare[1][0] = element;
              this.compare[1][1][0] = child1 ;
              if(__funcall(this.compare,glisp.user) === _false)  swap = child1N;
//if(__funcall(this.compare,glisp.user) !== _false && element >= child1) //console.log('sink1',element,child1,"--",this.compare[1][0],this.compare[1][1][0]);

// if (element >= child1) swap = child1N;;

      }
      // Do the same checks for the other child.
      if (child2N < length) {
        var child2 = this.content[child2N];
        swapper = (swap === null ? element : child1) ;

         this.compare[1][1][0] = child2 ;
         this.compare[1][0] = swapper ;
       
         if(__funcall(this.compare,glisp.user) === _false) swap = child2N;
//if(__funcall(this.compare,glisp.user) !== _false &&  swapper >= child2) console.log('sink2',element,swapper) ;
//if (swapper >= child2)  swap = child2N;
      }

      // No need to swap further, we are done.
      if (swap == null) break;

      // Otherwise, swap and continue.
      this.content[n] = this.content[swap];
      this.content[swap] = element;
      n = swap;
    }
  }
};

/*
API
*/
var _make_heap = function (proc) {
		prock = checkProc(proc,2,2,"make-heap");
		return new Heap(proc);
		}
var _heap_p = function (object) {
		return (object instanceof Heap) ? _true : _false ;
		}
var _heap_pop = function (heap) {
		if(! (heap instanceof Heap)) glisp_error(127,heap,"heap-pop");
		return heap.pop();
		}
var _heap_push = function (heap, obj) { 
		if(! (heap instanceof Heap)) glisp_error(127,heap,"heap-push");
		return heap.push(obj);
		}
var _heap_top = function (heap) { 
	   if(! (heap instanceof Heap)) glisp_error(127,heap,"heap-top");
		return heap.top();
		}
var _heap_length = function (heap) { 
	   if(! (heap instanceof Heap)) glisp_error(127,heap,"heap-length");
		return heap.size();
		}
var _heap_empty_p = function (heap) {
	  if(! (heap instanceof Heap)) glisp_error(127,heap,"heap-empty?");
	   return heap.isempty();
	   }
var _heap_to_list = function (heap) { 
	 if(! (heap instanceof Heap)) glisp_error(127,heap,"heap->list");
	 return heap.toList();
	 }
var _list_to_heap = function (list,heap) { 
	 if(notIsList(list)) glisp_error(20,list,"list->heap");
	 if(! (heap instanceof Heap)) glisp_error(127,heap,"list->heap");
	 return heap.fromList(__list_to_array(list));
	 }

function heap_boot () {
	define_sysfun (new Sysfun('heap.make-heap', _make_heap,1,1));
	define_sysfun (new Sysfun('heap.heap?', _heap_p,1,1));
	define_sysfun (new Sysfun('heap.heap-pop', _heap_pop,1,1)); // (heap) -> #f or obj
	define_sysfun (new Sysfun('heap.heap-push', _heap_push,2,2)); // (heap obj)
	define_sysfun (new Sysfun('heap.heap-top', _heap_top,1,1)); // (heap ) -> #f or obj
	define_sysfun (new Sysfun('heap.heap-length', _heap_length,1,1)); // (heap ) 
	define_sysfun (new Sysfun('heap.heap-empty?', _heap_empty_p,1,1)); // (heap ) -> #f or #t
	define_sysfun (new Sysfun('heap.heap->list', _heap_to_list,1,1)); // ( )
	define_sysfun (new Sysfun('heap.list->heap', _list_to_heap,2,2)); // (list , heap)
	
	_LIB["heap.lib"] = true;
	 writeln("heap.lib v1.3 ® EchoLisp","color:green");
	}
	
heap_boot();
	
	
	

	
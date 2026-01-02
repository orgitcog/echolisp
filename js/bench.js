/*
bench perfs
*/

var bench_lst =null ;
function bench_init_1 () {
// new list 100 items : numbers and symbs
	bench_lst = [0, null];
for(var i = 0; i < 20 ; i++) {
	var item = (i & 1) ? i : new Formal("+" + i + "_" + "x",0,i) ;
	bench_lst = [item, bench_lst];
	}
	glisp_trace(bench_lst,i,"bench:start");
}
function bench_init_2 () {
// new list 100 items : numbers and strings
	bench_lst = [0, null];
for(var i = 0; i < 20 ; i++) {
	var item = (i & 1) ? i : "+" + i + "_" + "y" ;
	bench_lst = [item, bench_lst];
	}
	glisp_trace(bench_lst,i,"bench:start");
}

function bench_1(loops) { // Formal
	loops *= 1000 ;
	bench_init_1();
	var val = 0;
	var t0 = Date.now();
	for(var i = 0; i < loops; i++) {
	var form = bench_lst ;
		for(var j = 0; j < 20; j++) {
		var expr = form[0];
		if(expr instanceof Formal) val = val + expr.index ;
		form = form[1];
		} // j loops
		} // i loops
	var tf = Date.now();
// console.log("loops*20",loops*20,"tf",tf,"t0",t0,"dt(sec)",(tf-t0)/1000);
	var f = (20 * loops) / ((tf - t0)/1000) ;
	f = Math.floor(f/1000);
	glisp_trace(f,val,"bench_1 (symb)") ;
}

function bench_2(loops) { // strings
	loops *= 1000 ;
	bench_init_2();
	var val = 0;
	var t0 = Date.now();
	for(var i = 0; i < loops; i++) {
	var form = bench_lst ;
		for(var j = 0; j < 20; j++) {
		var expr = form[0];
		if(typeof expr === "string") val = val + parseInt(expr);
		form = form[1];
		} // j loops
		} // i loops
	var tf = Date.now();
// console.log("loops*20",loops*20,"tf",tf,"t0",t0,"dt(sec)",(tf-t0)/1000);
	var f = (20 * loops) / ((tf - t0)/1000) ;
	f = Math.floor(f/1000);
	glisp_trace(f,val,"bench_2 (str)") ;
}

function bench_3(loops) { // numbers
	loops *= 1000 ;
	bench_init_2();
	var val = 0;
	var t0 = Date.now();
	for(var i = 0; i < loops; i++) {
	var form = bench_lst ;
		for(var j = 0; j < 20; j++) {
		var expr = form[0];
		if(typeof expr === "number") val = val +  expr;
		form = form[1];
		} // j loops
		} // i loops
	var tf = Date.now();
// console.log("loops*20",loops*20,"tf",tf,"t0",t0,"dt(sec)",(tf-t0)/1000);
	var f = (20 * loops) / ((tf - t0)/1000) ;
	f = Math.floor(f/1000);
	glisp_trace(f,val,"bench_3 (numbers)") ;
}

function bench_stack(loops) {
	loops *= 1000;
	var f1 = new Formal("x",0,0);
	var f2 = new Formal("y",0,1);
	var save_top = _top;
	var symb, sidx; 
	var v1,v2;
	var t0 = Date.now();

	//var newenv = __flambda_bind(params,values,env); // increases top
	
	for(var i=0;i<loops;i++) {
	save_top = _top;
	_stack[_top++] = i;
	_stack[_top++] = i+1;
	_blocks[++_topblock] = save_top;
	
	symb = f1 ;
	sidx = symb.index + _blocks[_topblock - symb.block]; // N hours bogue - cf LET NYI
	v1 = _stack[sidx];
	symb = f2 ;
	sidx = symb.index + _blocks[_topblock - symb.block]; // N hours bogue - cf LET NYI
	v2 = _stack[sidx];
	symb = f1 ;
	sidx = symb.index + _blocks[_topblock - symb.block]; // N hours bogue - cf LET NYI
    _stack[sidx] = v1 + v2;
    _top = save_top;
	_topblock--;

} // i loop
	var tf = Date.now();
	var f =  loops / ((tf - t0)/1000) ;
	f = Math.floor(f/1000);
	glisp_trace(f,_stack[0],"bench_stack Khz") ;
}

function bench_env(loops) {
	loops *= 1000;
	var f1 = new Symbol("x");
	var f2 = new Formal("y");
	var v1,v2;
	var env= new GLenv(glisp.user,"foo");
	var t0 = Date.now();

	//var newenv = __flambda_bind(params,values,env); // increases top
	
	for(var i=0;i<loops;i++) {
	//env = new GLenv(glisp.user,"foo");
	env.set(f1.name,i);
	env.set(f2.name,i+1);
	
	v1 = env.get(f1.name);
	v2 = env.get(f2.name);
	env.set(f1.name,v1+v2);

} // i loop
	var tf = Date.now();
	var f =  loops / ((tf - t0)/1000) ;
	f = Math.floor(f/1000);
	glisp_trace(f,env.get(f1.name),"bench_env Khz") ;
}


function bench(loops) {
	bench_stack(loops);
	bench_env(loops);
}
		
		


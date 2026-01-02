/*--------------------------
task manager
© EchoLisp 2015
http://rosettacode.org/wiki/Concurrent_computing
http://greenteapress.com/semaphores/downey08semaphores.pdf

/*------------------
special _funcall
-------------------------*/
// in common pool NYI
function __make_lambda(source,params, body) {
	var lambda =  [_lambda, [params, body]] ;
	lambda[TAG_CLOSURE] = source[TAG_CLOSURE];
	lambda[TAG_CLOSING] = source[TAG_CLOSING];
	lambda[TAG_ENV] = source[TAG_ENV];
	return lambda;
}

function isWait(expr) {
	return _MULTI_TASKING && Array.isArray(expr) && (expr[0] === _wait);
	}
function isSleep(expr) {
	return _MULTI_TASKING && Array.isArray(expr) && (expr[0] === _sleep);
	}

// lambda MUST be lambda(x [x def]..] NOT lambda x nor lambda (x . y) DOC NYI
function __x_call(lambda,values,env) {
	var save_top = _top, ret ;
	var memory = -1; // remember idx 
	var params = lambda[1][0], body = lambda[1][1], newenv = env ;
	var remember = lambda[TAG_REMEMBER]; // array or null
	var sem, state , msec , stack_shot = [] , s;
	var next ;

	if(lambda[TAG_CLOSURE])  		 newenv = lambda[TAG_ENV] ;
	else if(lambda[TAG_CLOSING])	 newenv =  new GLenv(env,"C"); 
	// else newenv = env;
	
//glisp_trace(params,values,"BIND",true);
//glisp_trace(lambda,"","LAMBDA",true);
	 __flambda_bind(params,values,env,newenv); // increases top
	 	
	_blocks[++_topblock] = save_top;
	
	// var ret =  __begin(body,newenv);
	for(var expr = body ; expr != null ; expr = expr[1]) {
	
	// call _wait (sem, env,proc_state,awake)
	// optimmize me : no use of make-lambda if sem count > 0 NYI
	// for info : task = env.get("_TASK") here
	
	if (isWait(expr[0])) {
		    	sem = __eval(expr[0][1][0], newenv);

		    	for(s = save_top ; s < _top ; s++) 
		    		stack_shot.push(_stack[s]);
		    	if (_wait (sem , env , stack_shot,  __make_lambda (lambda,params, expr[1]))) // awake addr.
		    		  { ret = state ; break; }
		   		 } // isWait
		   		 
		 else if (isSleep(expr[0])) {
		 		msec =  __eval(expr[0][1][0], newenv);

		    	for(s = save_top ; s < _top ; s++) 
		    		stack_shot.push(_stack[s]) ;
		 		if (_sleep (msec, env, stack_shot,  __make_lambda (lambda,params, expr[1])))
		 		 		{ ret = state ; break; }
		 		} // isSleep
		 		
		else ret = __eval(expr[0],newenv);
		}
		
	_top = save_top;
	_topblock--;
	return ret;
} // __x_call

	
/*-------------------
Semaphores
-------------------------*/

function Semaphore (count) {
	this.count = count ;
	this.tasks = [] ; // waiting tasks 
	this.queue = [];
	}
	
Semaphore.prototype.signal = function () {
var task;
	this.count++ ;
	while (this.tasks.length > 0) {
		// task = this.tasks.pop(); // may have been stopped = terminated
		task = this.tasks.shift(); // FIFO may be better
		if(task.status === "waiting") { task.status = "running" ; return;}
		}
}

Semaphore.prototype.wait = function (task, stack_shot, awake) {
// glisp_trace("sem-wait",task,this,true);
	if(task.status !== "running") glisp_error(137,task,"wait") ;
	this.count--;
	if(this.count < 0) {
				task.status = "waiting" ;
				this.tasks.push(task);
				task.awake = awake;
				task.stack_shot = stack_shot;
				return true;
				}
	return false;
}
	
Semaphore.prototype.toString = function () {
	return "#semaphore:count:" + this.count + " queue:" + this.queue.length + 
		   glisp_tostring(__array_to_list(this.tasks)," 🎌 tasks: ") ;
	}
	
Semaphore.prototype.pop = function () {
	var value = this.queue.shift();
	return (value === undefined) ? _false : value;
}

Semaphore.prototype.push = function (msg) {
	this.queue.push(msg) ;
	return msg;
	}
	
Semaphore.prototype.empty = function () {
	return (this.queue.length === 0) ? _true : _false;
	}

/*---------------------------
Tasks
-----------------------------*/

// var_MULTI_TASKING in glisp globs
var _TASKS = [];
var _TASK_TIME_SLICE = 1000 ;

function Task (proc , init_state , env ) {
	this.id = __new_id();
	this.proc = proc;
	this.proc_state = init_state;
	this.init_state = init_state;
	this.stack_shot = null ;
	this.awake = null ; // a lambda
	this.status = "init" ; // running | stopped | waiting
	this.timer = null;
	this.time_slice =  Math.floor ( _TASK_TIME_SLICE * (1+  Math.random()/10)) ; // + 10%
	this.env = new GLenv (env);
	this.sleeping = 0; // sleeping if > 0
	this.time = null ; // set by (sleep)
	
	this.env.set("_TASK",this);
	// _TASKS.push(this); // use ?? : (stop-tasks) (show-tasks)
	}
	
Task.prototype.toString = function () {
	return "#task:id:" +  this.id + ":" + this.status ; 
}

Task.prototype.state = function  () {
	return this.proc_state ;
}

// RFU - dubious usage
Task.prototype.set_state = function  (astate) {
	if(this.status === "running") glisp_error(138,this,"set-state!") ;
	this.proc_state = (astate === undefined) ? thos.init_state : astate;
	if(this.stack_shot) this.stack_shot[0] = astate;
	return this.proc_state;
}


Task.prototype.stop = function () {
	clearTimeout(this.timer);
	this.status = "stopped" ;
	this.timer = null;
	return this ;
	// _TASKS.splice(idx,1);
}

Task.prototype.sleep = function (msec, stack_shot,awake) {
	if(this.status !== "running") glisp_error(137,this,"sleep") ;
	if(msec < this.time_slice) return false;
	this.status = "waiting";
	this.sleeping = msec;
	this.time = Date.now();
	this.awake = awake;
	this.stack_shot = stack_shot;
	return true;
}


// run a "waiting" or "init" task
Task.prototype.run = function () {
	_MULTI_TASKING = true; // reset by any error or CTRL-C
	if(this.status === "running") return _false;
	
	if(this.status === "stopped") { // restart it
				// this.proc_state = this.init_state;
				this.awake = null;
				this.sleeping = 0;
				this.status = "init" ;
				}
	
	if(this.status === "init") {
	this.status = "running" ;
	var that = this;
	var call = [this.proc, [this.proc_state, null]] ;
	
	var step = function () {
	var proc,values,state;
		if(! _MULTI_TASKING) {this.stop(); return;}
		if(that.status === "stopped") return;
		
		if(that.sleeping > 0) { // status is "waiting"
				if((Date.now() - that.time) >= that.sleeping) { 
								that.status = "running" ; 
								that.sleeping = 0;
								}}
							
		if(that.status === "waiting") {
							that.timer = setTimeout(step,that.time_slice) ;
							return ;
							}
							
		that.status = "running" ;
		if(that.proc_state === _false) {that.stop(); return;}
		
		proc = that.proc ;
		values = [that.proc_state,null] ;
		
		if(that.awake) {
					proc = that.awake ;
					values = __array_to_list(that.stack_shot);
					that.stack_shot = null;
					that.awake = null; }
					
		state  = __x_call(proc,values,that.env); // critical section
		if(state === _false) {that.stop(); return;}
		that.proc_state = state;
		that.timer = setTimeout(step,that.time_slice) ;
		} // step
		
	this.timer = setTimeout(step, this.time_slice) ;
	} // init
	
	if(this.status === "waiting") this.status = "running" ;
	return this ;
}


/*------------------------
API
-----------------------------------*/

function checkSemaphore (sem, sender) {
	sender = sender || "dispatcher" ;
	if(! (sem instanceof Semaphore)) glisp_error(136,sem,sender);
	return sem;
}

var _make_semaphore = function (count) {
	if(! isSmallSmallInteger(count)) glisp_error(48,count,"make-semaphore")
	return new Semaphore(count) ;
}

var _semaphore_pop = function(sem) {
		checkSemaphore(sem,"semaphore-pop");
		return sem.pop();
}
var _semaphore_push = function(sem, msg) {
		checkSemaphore(sem,"semaphore-push");
		return sem.push(msg);
}
var _semaphore_empty_p = function(sem) {
		checkSemaphore(sem,"semaphore-empty?");
		return sem.empty();
}


/*
inside a task, and only inside a task
*/
var _signal = function (sem) {
	checkSemaphore(sem,"signal");
	if(! _MULTI_TASKING ) return _false;
	sem.signal();
	return _true;
}

// (wait sem) calls :
var _wait = function (sem, env, stack_shot, awake_lambda) {
//console.log("_wait",proc_state,sem);
	checkSemaphore(sem, "wait");
	var task =  env.get("_TASK") ;
	task = checkTask(task,"wait");
	return sem.wait(task, stack_shot ,awake_lambda); // true = must wait
}

// (sleep msec) calls :
var _sleep = function (msec, env, stack_shot, awake_lambda) {
//console.log("_sleep",proc_state,msec);
var task =  env.get("_TASK") ;
	task = checkTask(task,"sleep");
	return task.sleep(msec, stack_shot ,awake_lambda) ;
}



/* T A S K S   API */

function checkTask (task, sender) {
	sender = sender || "task-manager" ;
	if(! (task instanceof Task)) glisp_error(135,task,sender);
	return task ;
}

var _make_task = function (proc, init, env) {
	proc = checkProc(proc,1,1,"make-task");
	return new Task (proc, init, env);
}

var _task_run = function (top,argc) {
	var task = _stack[top++];
	task.time_slice = (argc > 1) ? _stack[top] : task.time_slice ;
	task.time_slice = task.time_slice || _TASK_TIME_SLICE ;
	checkTask(task,"task-run");
	return task.run();
}

var _task_stop = function (task) {
	checkTask(task,"task-stop");
	return task.stop();
}


var _task_stop_all = function () {
	_MULTI_TASKING = false;
	return _true;
}

/*
(define S (make-semaphore 1))
(semaphore-push S 666)
(define (p1 n)
	(wait S)
	(writeln _TASK 't1 n S (semaphore-pop S))
	(semaphore-push S n)
	(signal S)
	(+ n 7))
	
(define (p2 n)
	(wait S)
	(writeln _TASK 't2 n S (semaphore-pop S))
	(sleep 2000)
	(semaphore-push S n)
	(signal S)
	(+ n 100))
(define T1 (task-run (make-task p1 0)))
(define T2 (task-run (make-task p2 0)))
*/

function boot_tasks () {
		define_sysfun(new Sysfun ("make-semaphore",_make_semaphore,1,1)) ; 
		define_sysfun(new Sysfun ("semaphore-pop",_semaphore_pop,1,1)) ; 
		define_sysfun(new Sysfun ("semaphore-push",_semaphore_push,2,2)) ; 
		define_sysfun(new Sysfun ("semaphore-empty?",_semaphore_empty_p,1,1)) ; 
		
		define_sysfun(new Sysfun ("wait",_wait,1,1)); //  (sem)
		define_sysfun(new Sysfun ("signal",_signal,1,1)); //  (sem)
		define_sysfun(new Sysfun ("sleep",_sleep,1,1)); //  (msec)
		
		define_sysfun(new Sysfun ("make-task",_make_task,2,2)); 
		define_sysfun(new Sysfun ("task-run",_task_run,1,2)); //  (task [time-slice])
		define_sysfun(new Sysfun ("task-stop",_task_stop,1,1));
		define_sysfun(new Sysfun ("task-stop-all",_task_stop_all,0,0));
		
    	writeln("tasks.lib v1.5 ® EchoLisp","color:green");			
     	_LIB["tasks.lib"] = true;
     	}

boot_tasks();
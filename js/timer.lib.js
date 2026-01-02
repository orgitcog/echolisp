/*
EchoLisp
timer.lib
V 4.2.16
(C) Echolalie & Georges Brougnard
*/

/*--------------------
sounds
-------------------------*/
var _SOUND = {
	"ok" : new Audio("./sounds/snd-ok.wav"),
    "ko" : new Audio("./sounds/snd-ko.wav"),
    "beep" : new Audio("./sounds/snd-beep.wav"), 
    "tick" : new Audio("./sounds/snd-tick.wav"), 
    "tack" : new Audio("./sounds/snd-tack.wav"), 
    "digit" : new Audio("./sounds/snd-digit.wav"), 
    "woosh" : new Audio("./sounds/snd-woosh.wav")
    } ;
    
    
var _play_sound = function ( snd) {
	snd = nameToString(snd);
	var w = _SOUND[snd];
	if( ! w) glisp_error(79,snd,"play-sound");
	w.play();
	return __void;
}

var _blink = function () {
	_logo_blink();
	return _true;
}

/*------------------
calendar
	every 1 sec : process calendar
-----------------------*/
function __glisp_timer () {
	__calendar_process();
}


var _TIMERS = [] ;

var _timer_clear = function (timer) {
	clearTimeout(timer);
	clearInterval(timer);
	return _true;
	}
	
	
// (wait milli-secs proc:0) - stops if returns #f or CTRL-C
// calls (proc milli-seconds)

var _wait = function (msec , proc,  env) {
msec = 0 + msec ;
if(!isSmallInteger (msec)) glisp_error(48,sec,"wait"); // checkInterval best NYI NYI
	proc = checkProc(proc,1,1,"waity");
	_TIMING = true; // CTRL-C
	
	if(msec < 1) msec = 1;

	var call = [proc ,  null];
	var  timer ;
	
	var step = function () {
		__ffuncall(call,env);
		}
		
	timer =  setTimeout(step,msec) ;
	return timer;
	}
	
	
// (at-every milli-secs proc:1) - stops if returns #f or CTRL-C
// calls (proc milli-seconds)

var _IN_EVERY = false;
var _at_every = function (msec , proc,  env) {
msec = 0 + msec ;
if(!isSmallInteger (msec)) glisp_error(48,sec,"every"); // checkInterval best NYI NYI
	proc = checkProc(proc,1,1,"every");
	_TIMING = true; // CTRL-C
	_IN_EVERY = false;
	
	if(msec < 1) msec = 1;

	var call = [proc , [0 , null]];
	var  timer ;
	
	var step = function () {
		if( !_TIMING)  { clearInterval(timer); return;} // CTRL-C
		if (_IN_EVERY) return;
		_IN_EVERY = true;
		call[1][0] = Date.now()  ; 
		var ret = __ffuncall(call,env);
		if(ret === _false ) clearInterval(timer);
		_IN_EVERY = false;
		}
		
	timer =  setInterval(step,msec) ;
	return timer;
	}
	
function __date_bump (date, msec)  { // returns same object
	date.setTime(date.getTime() + msec) ;
	return date;
	}
	
/*----------------
AT
----------------------*/

// calendar is ((date event) (date event) (null null) (date event) ..)
// global _CALENDAR -> symbol system.calendar

// (at date proc|string)
// (at multiplier unit proc)
// (at unit proc)

var _at = function (top , argc) {
	var date, mult = 1 , unit, fproc ;
	if(argc === 3) mult = _stack[top++];
	date = _stack[top++]; // or unit
	proc = _stack[top];
	
	if(! (date instanceof Date)) {
		date = nameToString(date,"at");
		date = __named_date(date,mult);
		if(date === undefined)
			date = _string_to_date(date); // error 76 if bad
console.log("AT", date);
		//  glisp_error(76,date,"at");
		}

    if (typeof proc === "string") { }
    else { // (at date 'xalert) proc must be a symb (not lambda) to be local_saved
    		if (isLambda(proc)) proc = proc[TAG_LAMBDA_DEF] ; // (at date xalert)
    		if(! (proc instanceof Symbol)) glisp_error(99,proc,"at") ;
			checkProc(proc,0,0,"at");
			_local_put_proc (proc) ; // user named proc
			}
	
	var calendar = glisp.user.get("system.calendar");
	if(notIsList(calendar)) calendar = null ;
	calendar =  [[date , [ proc , null]] , calendar] ; // cons
	glisp.user.set(_CALENDAR,calendar);
	_local_put(_CALENDAR);
	return _date_to_string(date);
	
} // AT

function __calendar_process () {
	var calendar = glisp.user.get("system.calendar");
	if(notIsList(calendar)) return;
	if(calendar === null) return;
	var now = Date.now();
	var hit = false;
	while(calendar) {
		var date = calendar[0][0];
		var action = calendar[0][1][0];
		
		if(date && action && (date.getTime() < now)) { // not cleared
		
		calendar[0][0] = null; // clear
		calendar[0][1][0] = null;
		hit = true;
		
		writeln (_date_to_string(date) + " : " + action  ,_STYLE.plist["calendar"]);
		if ((action instanceof Symbol)  && (action.fval  ||  _local_get_proc(action))) 
				{
				action = checkProc(action,1,1,"calendar:at") ;
				__ffuncall([action,null],glisp.user) ;
				}
		}
	calendar = calendar[1]; // next entry
	} // all entries
	if (!hit) return; 
	
	calendar = glisp.user.get("system.calendar");
	while(calendar && calendar[0][0] === null) calendar = calendar[1]; // compress
	glisp.user.set("system.calendar",calendar);
	_local_put(_CALENDAR);
}
	
function boot_timer() { // all units are seconds
 	define_sysfun(new Sysfun ("timer.play-sound",_play_sound,1,1));
 	define_sysfun(new Sysfun ("blink",_blink,0,0));
 	define_sysfun(new Sysfun ("timer.at",_at,2,3)); // (at date proc:0)
 	define_sysfun(new Sysfun ("timer.at-every",_at_every,2,2)); // (every milli-seconds proc:1)
 	define_sysfun(new Sysfun ("timer.wait",_wait,2,2)); // (wait milli-seconds proc:1)
  _LIB["timer.lib"] = true;
 }
 
 boot_timer();
 setInterval(__glisp_timer,1000); // process calendar every second
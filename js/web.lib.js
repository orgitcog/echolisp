/*
https://oeis.org/search?q=1%2C2%2C3%2C6%2C11%2C23%2C47&language=english&go=Search
https://oeis.org/search?q=brougnard&sort=&language=english&go=Search

http://oldweb.cecm.sfu.ca/cgi-bin/isc/lookup?number=3.1415926535&lookup_type=simple
https://primes.utm.edu/nthprime/index.php#nth  <-----
*/
/*----------------------
WEB LIB
	(string->url str)
	(open-url url)
	(oeis list|vector|name)
	(inverter number)
---------------------------------*/

var _oeis_url = 
"https://oeis.org/search?q=PARAM&language=english&go=Search";
var _inverter_url = "http://isc.carma.newcastle.edu.au/";
// old
// "http://oldweb.cecm.sfu.ca/cgi-bin/isc/lookup?number=PARAM&lookup_type=simple";


function _url ( url) {  //	(string->url)
		url = nameToString(url);
		url = encodeURI(url);
		url = url.replace(/\,/g,"%2C") ; // for oeis
		if(url.indexOf("http") === -1) url = "http://" + url ;
		return url;
}

var _EchoWin = null ;
var _EchoWinTimer = null;
function _www (url, name ) { // (open-url)
name = name || "EchoWin" ;
	var  t0 = Date.now();
	// if(_EchoWin && _EchoWin.location) oldloc = _EchoWin.location.href;
	if(_EchoWin && _EchoWin.closed === false) _EchoWin.close();
/*
	function progress () {
	if(Date.now() - t0 > 10000) { clearTimeout (_EchoWinTimer); return ; }
	if(_EchoWin && _EchoWin.closed === false) {
		//	&& _EchoWin.location &&  _EchoWin.location.href !== oldloc) // cannot access
		writeln ("Loaded - EchoWin : " + (Date.now()- t0 )) ;
		clearTimeout (_EchoWinTimer);
		return;
		}
	_EchoWinTimer = setTimeout(progress,400) ;
	}
*/
	_EchoWin = window.open(url,name);
	try {
	_EchoWin.focus();
	}
	catch (err) { } 
	// progress() ;
	return url;
}

function _oeis(what) {
	var param = isListNotNull(what) ? _string_join(what,",") : __str_convert(what) ;
	var url =  _oeis_url.replace("PARAM",param);
	return _www(_url(url),"OEIS");
}
function _inverter( num) {
	var param ='' + num ;
	var url =  _inverter_url.replace("PARAM",param);
	return _www(_url(url),"INVERTER");
}

function __mailp (str) {
var regmail = /\S+@\S+\.\S+/;
	return regmail.test(str);
}

var _mail = function (address,subject,body) {
	address = nameToString(address,'mail');
	if(! __mailp(address)) glisp_error(101,address,"mail");
	var link = 'mailto:' + address;
	link += '?subject='  + nameToString(subject,'mail');
	body = glisp_message(body,"");
	body += "\n-------------------\n" + _VERSION;
	body = '&body=' + encodeURI(body);
	link += body ;
	window.open(link,"ECHOMAIL");
	return _true;
}


function boot_web() {
        define_sysfun(new Sysfun ("string->url",_url,1,1));
        define_sysfun(new Sysfun ("open-url",_www,1,1));
        define_sysfun(new Sysfun ("oeis",_oeis,1,1));
        define_sysfun(new Sysfun ("inverter",_inverter,1,1));
        define_sysfun(new Sysfun ("mail",_mail,3,3));
        _LIB["web.lib"] = true;
        }


boot_web() ;
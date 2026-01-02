/* http://www.pallier.org/ressources/dicofr/liste.de.mots.francais.frgut.txt */
/* http://www.dicollecte.org/download.php?prj=fr */   
/* http://monsu.desiderio.free.fr/curiosites/elision.html */
/*
LIB : words.lib
*/
/*
Tags (file words.<lang>.tags.js)
*/
/*
#define Nom 1
#define Ver 2
#define Adj 4
#define Mas  8
#define Fem 16
#define SG 32
#define PL 64
#define P3 128
#define Det 256 //aucun
#define Pat 512 // albert
#define Adv 1024 // à, durant
#define Pre 2048 // mais , et
#define Pro 4096 // il elle
#define Con 8192
#define Int 16384
*/
/*
 _tags_table.array = ["#TAGS","nom","verbe","adj","masc","fem",
"sg","pl","p3",
"det","pat","adv","prep",
"pronom","conj","int!","pronominal","intransitif","infinitif"];
*/

_lib('sql', null,true);

const _KWD_ANY = define_keyword("#:any");

/*---------
tags utilities
-----*/

function __array_flatten(array) {
	var ret = [] ;
	for(var i=0; i< array.length;i++) ret.push(array[i][0]);
	return ret;
	}
	
function __word_to_string (word) {
		if(typeof word === "string") return word ;
		if(word instanceof Symbol) return word.name;
		glisp_error(51,word,"words") ;
}

// list of tags --> 32-bits number
function __tags_to_num (tags) {
	var i,tag,num = 0;
	if(! isListOrNull(tags)) glisp_error(20,tags,"word-select") ;
	
console.log ("tags table",_tags_table.array) ;
	while(tags) {
		 tag = __word_to_string(tags[0]);
		 i = __array_flatten(_tags_table.array).indexOf(tag);
console.log("tag", tag,i);
		 if(i >  0) num += _WBIT[i] ;
		 tags = tags[1];
	}
	return num;
}
// list of ^tags --> 32-bits number
function __xtags_to_num (tags) {
	var i,tag,num = 0;
	if(! isListOrNull(tags)) glisp_error(20,tags,"word-select") ;
	while(tags) {
		 tag = __word_to_string(tags[0]);
		 if(tag.indexOf("^") === 0 || tag.indexOf("-") === 0 ) { // not op
		 	i = __array_flatten(_tags_table.array).indexOf(tag.substring(1));
		 	if(i >  0) num += _WBIT[i] ;
		 	}
		 tags = tags[1];
	}
	return num;
}

/*------
words table access
-----------*/
var _word_index = function(w) { // -1 = not found
	w = __word_to_string(w).toLowerCase();
	var i = _words_table.search(w,0)  ;
	return i === _false ? -1 : i ;  // search field 0
}

var _word_ref = function (i) {
	if(!(typeof i === "number"))      glisp_error(22,i,"word-ref");
	if (i >=0 && i < _words_table.array.length)   return _words_table.array[i][0] ;
	return _false;
}

/*----------------
i-functions = f(index)
-------------*/

var _iword_tags  = function (i) { // --> list of _tags_table.array by index
if(i === -1) return null;
	var wtags = _words_table.array[i][1] || 0 ,lst = null ; //  ["#tags" , null];
	var t, e = 1, n = _tags_table.array.length ;
	for(t=1 ; t <= n; t++, e*=2) 
		if(wtags & e) lst = __snoc(_tags_table.array[t][0],lst);
return lst; 
}

function _iword_addtag (i, tag) { 
if(i === -1) return;
	var itag = __array_flatten(_tags_table.array).indexOf(__word_to_string(tag)) ;
	if(itag === -1) glisp_error(52,tag,"word-addtag") ;
	_words_table.array[i][1] |= _WBIT[itag] ;
}

// tag := tagname | ^tagname (not present)
// ignore if unknown tag

function _iword_hastag (i, tag) { 
var present = true;
if(i === -1) return false;
	tag = __word_to_string(tag) ;
	if(tag.indexOf("^") === 0) {
				tag = tag.substring(1);
				present = false;
				}
								
	var itag = __array_flatten(_tags_table.array).indexOf(tag);
	if(itag === -1) return true; // ignore unk tag NYI msg
	return (_words_table.array[i][1] & _WBIT[itag] ) ? present : !present;
}

function _iword_remtag (i, tag) { 
if(i === -1) return;
	var itag = __array_flatten(_tags_table.array).indexOf(__word_to_string(tag));
	if(itag === -1) glisp_error(52,tag,"word-remtag") ;
	if( _words_table.array[i][1] & _WBIT[itag])   _words_table.array[i][1] ^= _WBIT[itag];
}

// GLisp functions

var _word_tags  = function (w) { // list of _tags_table.array by word
	var i = _word_index(w);
	if(i === -1) return null;
	return _iword_tags(i);
}

function _word_addtag(w,tag) {
	var i = _word_index(w);
	_iword_addtag(i,tag);
	return _iword_tags(i) ;
}
function _word_addtags(w,tags) {
	if(notIsList(tags)) glisp_error(20,tags,"word-addtags");
	var i = _word_index(w);
		while(tags) {
		_iword_addtag(i,tags[0]);
		tags = tags[1];
		}
	return _iword_tags(i) ;
}

function _word_remtag(w,tag) {
	var i = _word_index(w);
	_iword_remtag(i,tag);
	return _iword_tags(i) ;
}


function __word_new (w) { // returns existing  i or new i
	w = __word_to_string(w) ;
	var i = _word_index(w);
	if(i === -1) {
				  i = _words_table.array.length;
				  _words_table.array.push([w , 0]);
				  }
	_words_table.index = undefined ;
	return i ;
}


function _wordp( w) {
	w = __word_to_string(w) ;
	var i = _word_index(w) ;
	if (i >= 0) return [w , _iword_tags(i)];
	return _false ;
}


// (words-insert  tag ...)
var _words_insert = function (self,env) { // creation with tags - NO EVAL
	self = self[1];
	var w = __word_to_string(self[0]);
	var i = __word_new(w);
	var tags = self[1], tag ;

	while(tags) { // warn unk tag
				tag = __word_to_string(tags[0]);
				if(__array_flatten(_tags_table.array).indexOf(tag) > 0)
					 _iword_addtag(i,tag);
					else writeln("words:unknow tag : " + tag, _STYLE.plist["warning"]) ;
				tags= tags[1] ;
				}
	return [w , _iword_tags(i)];
} // word-record

var _word_tagp = function (w, tag) {
	return _iword_hastag (_word_index(w),tag) ? _true : _false ;
}

var _word_tagsp = function (w, tags) {
	if(notIsList(tags)) glisp_error(20,tags,"word-tags?");
	var i = _word_index(w);
	if(i === -1) return _false;
		while(tags) { // AND op
		if ( ! _iword_hastag (i,tags[0])) return _false ;
		tags = tags[1] ;
		}
	return _true ;
}

/*------------
filterig
(word-select regexp [ (tag ...) [ limit ]])
(word-random regexp [ (tag ...)])
-------*/
 function __symb_to_regexp(re) { // symb|string|#any --> regexp|true|null
 	if(re === _KWD_ANY) return true;
 	if(isSymbol(re)) re = re.name;
	return __regexp (re , "i");
 }

// ntag : must be here
// xtag : not here
function __iword_match_ntag(i,ntag,xtag) { // subset of tags
	return (_words_table.array[i][1] & ntag) === ntag && ((_words_table.array[i][1] & xtag) === 0)
}

function __word_match_regexp(word,regexp) {
	if(regexp === true) return true;
	if(!regexp) return false;
	if(regexp instanceof RegExp) return regexp.test(word) ;
	return word.indexOf(regexp) === 0 ;
}

// (word-match word regexp|#any [tags])
var _word_match = function (top, argc) { // checks NYI
	var word , i , regexp, tags = null , ntag, xtag;
	
// args
	word  = _stack[top++];
	i = _word_index(word) ;
	regexp = __symb_to_regexp(_stack[top++]); // --> regexp or true
	if(argc >= 2)  tags = _stack[top++];
	if(! isListOrNull(tags)) glisp_error(20,tags,"word-match") ;

// selection
		ntag = __tags_to_num(tags); // must be here
		xtag = __xtags_to_num(tags); // must not be here
console.log("MATCH-FILTER",regexp,tags,ntag,xtag);
		return ( __iword_match_ntag(i,ntag,xtag) && __word_match_regexp(word,regexp)) ?
			_true : _false;
	}

// must accept (word-select regexp limit) NYI
// (word-select regexp|#:any [ tags [ limit [ cursor-from]]] ) --> list | _false
var _word_select = function (top, argc) { // checks NYI
	var regexp, tags = null, limit = 999999, cursor = 0 ;
	var res = [], word, hit=0, ntag,xtag;
	var i, n = _words_table.array.length;
	
// args
	regexp = __symb_to_regexp(_stack[top++]); // --> regexp or true
	if(argc >= 2)  tags = _stack[top++];
	if(! isListOrNull(tags)) glisp_error(20,tags,"word-select") ;
	if(argc >= 3) limit = 0 + _stack[top++];
	if(argc >= 4) cursor =  0 + _stack[top++];

// selection
	ntag = __tags_to_num(tags);
	xtag = __xtags_to_num(tags); // must not be here

console.log("WORD-SELECT-FILTER",regexp,tags,limit,ntag,xtag);

	for(i=cursor; i< n; i++) {
		word = _words_table.array[i][0];
		if( __iword_match_ntag(i,ntag,xtag) && __word_match_regexp(word,regexp)) {
			hit++;
			res.push(word) ;
			}
		if(hit > limit) break;
	}
	return(res.length === 0 ) ? _false : __array_to_list(res) ;
}

// (word-random regexp|#:any [ tags]) --> word | false
var _word_random = function (top, argc) { // checks NYI
	var regexp, tags = null ;
	var  word, hit=0, ntag,xtag;
	var i,r, n = _words_table.array.length;
	
// args
	if(argc === 0) return _words_table.array[__random(n)][0] ;
	regexp = __symb_to_regexp(_stack[top++]); // --> regexp or true
	if(argc >= 2)  tags = _stack[top];
	if(! isListOrNull(tags)) glisp_error(20,tags,"word-random") ;

// selection
	ntag = __tags_to_num(tags);
	xtag = __xtags_to_num(tags); // must not be here

console.log("WORD-RANDOM-FILTER",regexp,tags,ntag,xtag);
	r= __random(n) ;
	for(i=r; i< n; i++) {
		word = _words_table.array[i][0];
		if( __iword_match_ntag(i,ntag,xtag) && __word_match_regexp(word,regexp)) return word;
		}
	for(i=r-1; i >=0 ; i--) {
		word = _words_table.array[i][0];
		if( __iword_match_ntag(i,ntag) && __word_match_regexp(word,regexp)) return word;
		}
	return _false;
}

// internal : to build from old format
// NYI : english : no TAGS

var _words_save_as = function (name, limit) {
	var items = ['['] , i ;
	limit = limit || _words_table.length;
	for(var i= 0 ; i<limit; i++) {
		item = '["' + _words_table[i] + '",' + _words_table_tags_table.array[i] + ']' ;
		if(i !== limit-1) item += "," ;
		items.push(item);
		}
	items.push(']');
	items = items.join("\n");
	
	writeln ("words: " + _words_table.length + " tags: " + _words_table_tags_table.array.length);
	return _save_as(items, name) ;
}


////////////
// BOOT
/////////
var _words_struct, _words_table , _tags_table, _tags_struct ;
var _WBIT;
function boot_wordslib() {
// actions
		_require_1 ("struct");
		_require_1("sql");
		
		_words_struct = new MetaStruct ("word" , ["name", "tags"]) ;
		_words_table = new Table (_words_struct );
		bind_symbol (new Symbol ("*words*") , _words_table);
		
		_tags_struct = new MetaStruct ("tag" , ["name"]) ;
		_tags_table = new Table (_tags_struct );
		bind_symbol (new Symbol ("*tags*") , _tags_table);

		
		_words_table.array = [["albert",2], ["simone",5]] ;
		_tags_table.array = [["#TAGS"], ["female"] , ["male"] , ["worker"]]; // MUST NOT BE SORTED !!!!!
		
// init bits
		_WBIT = [];
		_WBIT[0]= 0; _WBIT[1]=1; // _WBIT[i] = 2** (i-1);
		for(var i=2;i<64;i++) _WBIT.push(2 * _WBIT[i-1]);
			
		
// functions
     	define_sysfun(new Sysfun ("words.word-random",_word_random,0,2)); 
		define_sysfun(new Sysfun ("words.word-ref",_word_ref,1,1)); // --> word or #f
		define_sysfun(new Sysfun ("words.word-index",_word_index,1,1)); // --> idx
	
     	define_sysfun(new Sysfun ("words.word?",_wordp,1,1)); // -> record
     	define_special(new Sysfun ("words.words-insert",_words_insert,1,undefined)); // (word (tags))

     	define_sysfun(new Sysfun ("words.word-tags",_word_tags,1,1)); 
     	define_sysfun(new Sysfun ("words.word-set-tag",_word_addtag,2,2)); 
     	define_sysfun(new Sysfun ("words.word-set-tags!",_word_addtags,2,2)); 
     	define_sysfun(new Sysfun ("words.word-remove-tag",_word_remtag,2,2)); 
     	define_sysfun(new Sysfun ("words.word-tag?",_word_tagp,2,2)); 
     	define_sysfun(new Sysfun ("words.word-tags?",_word_tagsp,2,2)); 
     	
     	define_sysfun(new Sysfun ("words.word-match",_word_match,2,3)); 
     	define_sysfun(new Sysfun ("words.words-select",_word_select,1,3)); 
    	
		
// temporary
		define_sysfun(new Sysfun ("words-save-as",_words_save_as,2,2)); 
    	writeln("words.lib v1.3 ® EchoLisp","color:green");			
     	_LIB["words.lib"] = true;
     	}

boot_wordslib();
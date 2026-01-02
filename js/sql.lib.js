"use strict";
// http://sql.sh/cours/jointures/inner-join

/*--------------------
sql.lib for EchoLisp
© 2015 Jacques Tramu, Georges Brougnard, Simon Gallubert
------------------------*/

_lib ("print", null ,true); // mute

/*-------------------------
T A B L E S
auto-increment id when = 0
-------------------------------*/
function Table(meta) {
		this.meta = meta ; // Metastruct
		this.array = [] ; // js array of js arrays
		this.numfields = meta.slots.length ;
		this.auto = meta.slots.indexOf("id") ; // auto-increment field num index or -1
		this.index = undefined; // field num
		}
		
Table.prototype.toString = function () {
	return "#table:" + this.meta.toString() +
		( this.index ? " index:" + this.meta.slots[this.index] : "" ) +
		 ":[" + this.array.length + "]";
}

Table.prototype.toText = function () { // saveAs
	return glisp_tostring (_table_to_list (this) ,"") ;
}

Table.prototype.toList = function (n) { // (take table n)
	return __array_to_list (__jsmaparray(__array_to_list,this.array.slice(0,n)));
}


Table.prototype.insert = function (record) {
	var index  = this.array.length;
	
	this.index = undefined;
	if (record instanceof Struct)
			record = record.slots;
			else
			record =  this.__listinsert(record);
			
	if(this.auto >= 0 && record[this.auto] === 0) record[this.auto] = __new_id();
	this.array.push(record); // insert from struct or gloops
	return index;
}

// fill with default false
Table.prototype.__listinsert = function (list) { // returns a record
	if(notIsList (list)) glisp_error(20,list,"table:insert");
	var record = __list_to_array(list);
	while(record.length < this.numfields) record.push (_false);
	/*
	if(record.length !== this.numfields) 
			glisp_error(131,list,"list->record["+this.numfields+"]") ;
	*/
	return record;
}

// check compile NYI
Table.prototype.getref = function (rownum) {
	var record = this.array[rownum];
	if(! record) return _false;
	return  new Struct(this.meta,record,rownum); //cf clash with JSON ref - NYI
}

Table.prototype.getxref = function (rownum , colnum) {
	var record = this.array[rownum];
	return (record === undefined) ? _false : record[colnum] ;
}

Table.prototype.setref = function (rownum, struct) { // replaces
	if(! this.array[rownum]) glisp_error(24,rownum,"table-set!") ; 
	this.array[rownum] = struct.slots;  // .slice(0) if copy needed
	this.index = undefined;
	return struct;
}

Table.prototype.setxref = function (rownum, colnum, value ) { // replaces
	var record = this.array[rownum];
	if (record === undefined)  return _false ;
	return (record[colnum] = value) ;
}

Table.prototype.print = function (nfrom , nto) {
	nto = Math.min (this.array.length,nto);
	__2D_print(this.array,this.numfields,nfrom,nto,true) ; // with row nums
	return __void;
	}
	
Table.prototype.toHTML = function () {
	return __array_to_html(this.array,this.array.length,this.array[0].length) ;
}
	
// proto
Table.prototype.jsonify = function () {
				var i,records = this.array.slice(0);
				for(i=0;i<records.length;i++)
					records[i] =  __lisp_array_to_json_array(records[i]);
				return    {
						_instanceof : "Table",
						struct : this.meta.name,
						records : records
						} ;
			} 
// no proto	 !!! 						
Table.unjsonify = function (obj) {	
		var i,records,table,meta;
		meta = __find_meta(obj.struct) ;
		if( ! meta) glisp_error(63,obj.struct,"load:table"); // unknown meta
		
		table =  new Table (meta) ;
		records =  obj.records;
		for(i=0;i<records.length;i++)
			records[i] =  __json_array_to_lisp_array(records[i]);
		table.array = records;
		return table ;
		}
			
Table.prototype.make_index = function (field) {
		__array_sort_records_by_fields([field],this.array) ; // in place
		this.index = field;
		return this;
		}	
		
// bin-search 
Table.prototype.search  = function (val, field) {
	var a = this.array;
  	var mid, lo = 0, hi = a.length, vref;
  	
  	if(field !== this.index) this.make_index(field);
 
  while (hi > lo) {
    mid   = (hi + lo) >>> 1 ;  //  (hi + lo) / 2 >>> 0;
    vref =  a[mid][field] ;
    if (vref === val) // eq?
    	return  mid ; // new Struct(this.meta,a[mid],mid) ;
    else if (vref > val) { hi = mid ; } 
    else  { lo = mid + 1; } 
  	} // while
  return _false ;
  } // search
  
/*-------------------
sorting
sortf (struct, struct) returns -1,0,1
-------------------------*/
Table.prototype.sort = function (sortf , env) {
env = env || glisp.user;
  	var call = [sortf, [null , [null, null]]] ;
  	var arg1 = call[1];
  	var arg2 = call[1][1];
  	var meta = this.meta ;
  	var arr = this.array;
 	function jssort ( a, b) { // closure on env && call
 		arg1[0] = new Struct(meta,a,0);
 		arg2[0] = new Struct(meta,b,0);
 		return  __ffuncall(call,env) ;
 		}
 	this.index = undefined ;
 	arr.sort(jssort) ;
 	return this ;
}

			
/*---------------------
S Q L
---------------------------*/

const _GROUP_BY = define_keyword("#:group-by"); // a symbol
const _WHERE = define_keyword("#:where");
const _ORDER_BY = define_keyword("#:order-by");
const _FROM = define_keyword("#:from");
const _ALL = define_keyword("#:all");
const _DESC = define_keyword("#:desc");
const _ASC = define_keyword("#:asc");
const _DISTINCT = define_keyword("#:distinct");
const _INTO = define_keyword("#:into");
const _LIMIT = define_keyword("#:limit");
const _SUM = define_keyword("#:sum");
const _MIN = define_keyword("#:min");
const _MAX = define_keyword("#:max");
const _SQL_KWDS = [_GROUP_BY,_WHERE,_ORDER_BY,_FROM,
		_ALL,_DESC,_ASC,_DISTINCT,_INTO,_LIMIT,_SUM,_MIN,_MAX];

const _ALL_COLS =   "*" ; // special field index

/*--------------
SQL aggregation functions
	a = current record field value
	b = accumulator field value
--------------------*/
function __sql_nop (a , b) {return a;}
function __sql_min (a , b) {return (a < b) ? a : b ;}
function __sql_max (a , b) {return (a > b) ? a : b ;}
function __sql_sum (a , b) {return a + b ;}
function __sql_count(a , b) {return b + 1 ;}

const _SQL_OPS = 
	{ "min" : __sql_min, "max" : __sql_max , "sum" : __sql_sum, "count" : __sql_count } ;



function isGroup(arr) {
	return Array.isArray(arr) && arr.group;
	}
	
// #:distinct or distinct : ok
// #:emp.name : KO
function isSqlKwd (obj) {
	if (obj instanceof Symbol) {
	var kwd = glisp_look_keyword (obj.name ) || glisp_look_keyword ("#:" + obj.name) ;
	return   _SQL_KWDS.indexOf(kwd) >= 0;
	}
	return false;
}

// array_apply = map proc:1 on self
// array[i] := proc(array[i],env)
function __array_apply (proc, arr, env) {
	var call = [proc, [null, null]];
	var length= arr.length, i;
	for(i=0;i<length;i++) {
		call[1][0] = arr[i];
		arr[i] = __ffuncall(call,env);
	}
	return arr; // in place
}
	

// in: array of records sorted by fields
// out : array of arrays of records,  flagged as group,
// no more than limit by group

function __array_group_records_by_fields(fields,limit,arr) {
	var ret = [] ;
	var length = arr.length;
	if(length === 0) return[] ;
	var group = [arr[0]];
	var a,b;
	var numf = fields.length ,i, j, f , cmp;
	
	for(i=1;i<length;i++) {
			a = arr[i-1];
			b = arr[i];
			
			cmp = 	true;
 			for(j=0;j<numf;j++) {
 				f = fields[j];
 				if(a[f] !== b[f]) { cmp = false; break; } // eq?
 				}
 
 			if(cmp) { // goes in same group
 					if (limit === undefined  || group.length < limit) group.push(b); 
 					}
				else {
					ret.push(group); 
//console.log("GROUP: ", group.length , ret.length,"limit",limit);
					group = [b];
					}
			} // i loop
				
	if(group.length) { // last one
			ret.push(group);
//console.log("GROUP: ", group.length , ret.length);
			}
	ret.group = true;
	return ret ;
	}


// array items are records
// sorts on fields : fields[0], .. fields[numf-1]
// sorts arr in place
// field may be < 0 : sort desc
// dates ?? NYI

function __array_sort_records_by_fields (fields ,arr) { // in place
var numf = fields.length;
 	function jssort ( a, b) {
 		var j,f;
 		for(j=0;j<numf;j++) { 
 		f = fields[j];
 		if( f < 0) { // descending
 					f = -f;
 					if(a[f] === b[f]) continue; // eq?
 					if(a[f] < b[f]) return 1;
 					else  return -1;
 				   }
 			else { // ascending
 				if(a[f] === b[f]) continue; // eq?
 				if(a[f] < b[f]) return -1;
 				else  return 1;
 				}
 			} // for f
 		return 0;
 		} // jssort
 		
 	arr.sort(jssort) ;
 }
 
// in :  record
// out : record with numselect columns
function  __select_record_fields(record,select) {
	var ret = [] ;
	var numfields = record.length; // dbg only
	var numselect= select.length,i,f;
	
	if(numselect === 1 && select[0] === _ALL_COLS)
		return record ;
	else
	for(i=0;i < numselect; i++) {
		f = select[i];
		if( f === _ALL_COLS)   // "*"
			ret = record.slice(0); // make a shallow copy
		else if(f >= numfields) 
			glisp_error(24,f,"select:field[0…" + (numfields-1) +"]");
		else  
			ret.push(record[f]);
		}
	return ret;
}

// returns same array, with selected columns in  records
// recurses on groups

function __array_apply_select_record_fields(select,arr) {
	var length = arr.length, i ;
	if(arr.group) {
	for(i = 0; i< length; i++) 
			arr[i] = __array_apply_select_record_fields(select,arr[i]);
// console.log("group-select",arr);
		return arr;
		}
	// else
	for ( i = 0; i< length ; i++)
		arr[i] = __select_record_fields(arr[i],select);
	return arr;
}

/*----------------
aggregates
	aggreg = [[field op][field op] ....]
	op = jsfunction (record[field], acc[field])
---------------------*/
// in : record and accumular
// out : new accumulator
// returns acc

function  __aggregate_record_fields(record,aggreg, /*into*/ acc) {
	var ret = [] ;
	var numselect= aggreg.length,i,f;
	
// init acc with first record value
// init acc with 0 if count
if(acc[0] === undefined) console.log("acc0 init");
	if(acc[0] === undefined) 
		for(i=0;i < numselect; i++)  {
				f = aggreg[i]; //  [ fnum , op]
				acc.push (f[1] === __sql_count ? 1 : record[f[0]]) ;
		}
	else
	for(i=0;i < numselect; i++) {
		f = aggreg[i];
		acc[i] = f[1] (record[f[0]],acc[i]) ;
		}
console.log("acc ",acc);
	return acc ;
}

// returns array with one element for each group
// recurses on groups

function __array_apply_aggregate_record_fields(aggreg,arr) {
	var length = arr.length, i;
	var acc = [] ;
	
	if(arr.group) {
		for(i=0; i< length; i++)
		arr[i] = __array_apply_aggregate_record_fields(aggreg,arr[i]) ;
		return arr;
	}
	
	for(i = 0; i< length; i++) 
		__aggregate_record_fields(arr[i],aggreg,acc);
		
	return [acc] ;
	}


// distinct :
// in : 1 sorted array of original records
// out a new, reduced array

function __select_distinct_records_by_fields(distinct,arr) {
var out = [];
var length = arr.length;
var numf = distinct.length ;
var i,j,f,a,b,hit ;
if(length <= 1) return arr;

	out.push(arr[0]);
		for(i=1;i<length;i++) {
			a = arr[i-1];
			b = arr[i];
			hit = true; // assume eq?
				for(j=0;j<numf;j++) {
				f = distinct[j];
				if(a[f] !== b[f]) { hit = false; break;}
				}
			if(! hit) out.push(b);
		} // i
	return out;
}

// in := array of original records xor array of groups
// distinct := array of field# (no *)
// eliminates consecutive eq? 
// out : reduced arrays

function __array_distinct_records_by_fields (distinct,arr) {
	var length = arr.length, i ;
	if(arr.group) {
	for(i =0; i< length; i++) 
			arr[i] = __select_distinct_records_by_fields(distinct,arr[i]);
	 	 return arr; 
	 	 }
	 	 
	 return __select_distinct_records_by_fields(distinct,arr);
}

/*-----------------
into clause
into := format (= null / not used)
----------------------*/
// arr = array of records
// out : js array
function __records_convert_into_list (format , arr) {
	return __jsmaparray(__array_to_list,arr) ;
}

// arr = array of records xor groups
// out : js array of lists or lists of lists
function __array_convert_into_list (format , arr) {
	var length = arr.length, i ;
	if(arr.group) {
		for(i=0; i<length; i++) 
			arr[i] = __array_to_list (__records_convert_into_list (format ,arr[i]));
		return arr;
		}
	 return __records_convert_into_list (format ,arr);
}
 
// arr = array of records xor groups
// out : js array of jsarrays (flattened groups)

function __array_convert_into_table ( arr , /* into */ out) {
	var length = arr.length, i ;
	if(arr.group) {
console.log("group into table");
		for(i=0; i<length; i++) {
			__array_convert_into_table ( arr[i] , out) 
			}
		return out; 
		}
	 	for(i=0; i<length; i++) {
	 		 out.push(arr[i]) ;
	 		 }
	return out ;
}

// append mode !
function __array_into_table(arr , table) {
	table.array = table.array.concat(arr) ;
	return table;
}
 
 
/*----------------
run_select
-----------------------*/
// input params : js arrays
var _ROW_NUM;
var _row_num = function () {
	return _ROW_NUM ;
}

function __run_delete(tables,where,env)  {
var table = tables[0]; // one table version
var length , i  ;
var out = [];
var call,args,proc,record,array;

array = table.array ; 
length = array.length;

// WHERE clause
proc = where[0]; 
	if(proc) {
	_CONTEXT = "delete:where" ;
	record = new Struct (table.meta , null, 1 ); // dummy one for proc

		call = [proc, [record, [null ,null]]];
		args = call[1];
		for(i=0;i<length;i++) {
			record.slots = array[i]; // pass record as struct
			_ROW_NUM = i ; // (row-num)
			
			args[1][0] = (where[1] === undefined) ? null : where[1] ;
			if(__ffuncall(call,env) !== _true) out.push(array[i]);
			}
			
		table.array = out ;
		} // WHERE
		
	else { // no where
			var ok = confirm("SQL.delete: " + array.length + " records will be deleted.");
			if(ok) table.array = [] ;
			}
	return table;
}

function __run_select(select,aggreg,distinct,tables,where,group,sort,limit,into,env)  {
var table = tables[0]; // one table version
var length , i = 0  ;
var out = [];
var call,args,proc,record,numfields,meta, where_limit;

numfields = table.numfields;
meta = table.meta;

table = table.array ; // table becomes an array
length = table.length;

// WHERE clause
proc = where[0]; // proc
limit = limit[0]; // applies to groups if group-by
where_limit = (group[0]) ? 0 : limit;

	if(proc) {
	_CONTEXT = "select:where" ;
	record = new Struct (meta , null, 1 ); // dummy one for proc

		call = [proc, [record, [null ,null]]];
		args = call[1];
		for(i=0;i<length;i++) {
			record.slots = table[i]; // pass record as struct
			_ROW_NUM = i ; // (row-num)
			
			args[1][0] = (where[1] === undefined) ? null : where[1] ;
			if(__ffuncall(call,env) !== _false) out.push(table[i]);
			if(where_limit && out.length >= where_limit) break;
			}
		} // WHERE
// no where proc :
		else if (where_limit)
			out = table.slice(0 , where_limit );
		else
			out = table.slice(0) ; // no where : copy needed 
				
// ORDER CLAUSE - using sort list
		if(sort[0] !== undefined) {
		_CONTEXT = "select:order" ;
		__array_sort_records_by_fields (sort ,out);
		} // ORDER
		
// GROUP CLAUSE
		if(group[0] !== undefined) {
		_CONTEXT = "select:group" ;
		out =__array_group_records_by_fields (group ,limit, out);
		out.group = true;
		} // GROUP
		
// AGGREGATES
		if(aggreg[0]) {
		_CONTEXT = "select:aggregate";
		out = __array_apply_aggregate_record_fields(aggreg,out) ;
		}
		
		else {
// DISTINCT CLAUSE - make it simple
		_CONTEXT = "select:distinct" ;
		if(distinct[0]) // true|false
			out =__array_distinct_records_by_fields (sort,out);
	
		
// SELECT CLAUSE
// input := array of original records 
// xor    :=  an array of groups (= arrays of  records)
// output  .........

		_CONTEXT = "select:select" ;
		out = __array_apply_select_record_fields(select,out);
		} // no aggreg
		
// INTO CLAUSE (default)
// input : array (out) [ of arrays( group)] of arrays ( records)
// default out    : list [of lists (group)] of lists
//
	into =into[0];
		
		if(!into)
		return __array_to_list(__array_convert_into_list (null, out));
		else // a table : append records
		return __array_into_table(__array_convert_into_table( out, []), into);
}


/*----------------------
PARSER
---------------------------*/

// accept from and #:from styles kwd
function __check_kwd(expr,ksymb) {
			if(expr === null) return false;
			if(!isSymbol(expr[0])) return false;
			var kwd = expr[0].name;
			return (kwd === ksymb.name || '#:' + kwd === ksymb.name) ;
			}
			
// bumps expr pointer if kwd found
// sets flag to true|false
function __accept_kwd(expr,ksymb,/*into*/ flag) {
	flag[0] = false;
	if(expr === null) return null;
	if(__check_kwd(expr,ksymb)) {
			flag[0]= true;
			expr = expr[1];
			}
	return expr;
}

/*------------------
parse fields
	
in :  kwd  [field | (field ...)]
silent skip me if starting kwd not found
fill jsarray : vfields with [field ...] 
out : expr pointer
-------------------------*/

// returns [fnum, op]
function __check_field(field,sender,numfields,tablename) {
var fnum, op;

	if(Array.isArray(field)) { // (sum emp.salary)
		op = _SQL_OPS[nameToString(field[0],"select:aggregate")];
		
		if(op === undefined) glisp_error(132,field[0],"select:aggregate");
		fnum = __check_field(field[1][0],sender,numfields,tablename);
		fnum[1] = op;
		return fnum ;
	}
	
	else if(isSmallSmallInteger(field)) 
			fnum = field ;
	else if(isSymbol(field)) { // generated by struct|gloops
			fnum = glisp.user.get("#:" + field.name)
			if(fnum === undefined) fnum = glisp.user.get("#:" + tablename + "." + field.name) ; 
			}
	
	else glisp_error(131,field,sender);
	
	if(fnum === undefined ) glisp_error(131,field,"select:fields");
	if(fnum >= numfields ) glisp_error(129,fnum,"select:max field-index:"+ (numfields-1));
	return [fnum , __sql_nop];
}

// return fields token ptr
function __parse_1_field(fields, sender,numfields, tablename,vfields,aggreg) {
var fnum, flag = [false];
	 	fnum = __check_field(fields[0],sender,numfields,tablename); // [field , op]
	 	
	 	if(aggreg) aggreg.push(fnum);
	 	fnum = fnum[0];
	 	
	 	fields = fields[1];
	 	fields = __accept_kwd(fields,_ASC,/*into*/ flag); // nopish
	 	fields = __accept_kwd(fields,_DESC,/*into*/ flag);
	 	if(flag[0]) fnum = -fnum;
	 	vfields.push(fnum);
	 	return fields;
	 	}

// return expr token ptr
function __parse_fields(expr,ksymb,sender,numfields,tablename, /*into*/ vfields, aggreg)  {
	var fields, field, i;
	if(expr === null) return null;
	if(ksymb) { // check starting kwd
			if(! __check_kwd(expr,ksymb)) return expr;
			expr = expr[1]; // skip kwd
			}
	
	 while(expr) { // parse field .... until sql keyword
	 field = expr[0] ;
	 if(isSqlKwd(field)) break;
	 if(field === _mult || field === "*") {
	 			vfields.push(_ALL_COLS) ; // select * ok , order-by * forbidden
	 			return expr[1];
	 			}
	 expr  = __parse_1_field(expr,sender,numfields,tablename,/*into*/ vfields, aggreg);
	 }
	 
	 // set aggreg to undef if no aggregate wanted
	 var wantsAggreg = false;
	 if(aggreg) {
	 	for(i=0;i<aggreg.length;i++)
	 		if(aggreg[i][1] !== __sql_nop) wantsAggreg = true;
	 	if(! wantsAggreg) aggreg[0] = undefined ;
	 	}
	 		
	 return expr ;
}

function __parse_from(expr,ksymb,sender, /*into*/ tables, env) {
var table;
			if(! __check_kwd(expr,ksymb))  glisp_error(128,expr[0],sender); 
			expr = expr[1];
			table = __eval(expr[0],env);
			if(! (table instanceof Table)) glisp_error(130,table,sender);
			tables.push (table); // only one for now
			return  expr[1];
}

function __parse_limit(expr,ksymb,sender, /*into*/ limit, env) {
			if(expr === null) return null;
			if(! __check_kwd(expr,ksymb)) return expr ; // not mandanory
			expr = expr[1];
			limit.push (__eval(expr[0],env)) ;
			return  expr[1];
}

// where (proc:1:1)  or where (proc 2:2 arg)
function __parse_where(expr,ksymb,sender, /*into*/ where, env) {
var call ;
var arg = undefined ;
var proc ;
			if(expr === null) return null;
			if(! __check_kwd(expr,ksymb)) return expr ;
			expr = expr[1];
			call = expr[0];
			if(notIsList(call))
					glisp_error(15,call,"select:where (proc [arg])") ;
					
			proc = call[0];
			if(call[1]) arg = call[1][0];
			
			if(arg === undefined) 
				where.push (checkProc(proc,1,1,sender));
			else 
				{
				proc = checkProc(proc,2,2,sender);
				arg = __eval(arg,env); 
				where.push(proc);
				where.push(arg);
				}

	return  expr[1];
}

// use out-fields to check target table format 
function __parse_into(expr,ksymb,sender, outfields,/*into*/ into, env) {
var table ;
		if(expr === null) return null;
		if(! __check_kwd(expr,ksymb)) return expr ;
		expr = expr[1];
		table = __eval(expr[0],env) ;
		if(! (table instanceof Table))
			glisp_error(130,table,"select into <table>") ;
		if(outfields !== table.numfields)
			glisp_error(131,table,"select:" + outfields ) ;
		into.push(table);
		return expr[1];
}


/*-----------
columns  (= fields) sorting
-----------------*/
function __append_1_col ( sort , col, numfields) {
var i, length = sort.length;
			if(col === _ALL_COLS) // "*"
				for( i=0; i<numfields;i++) __append_1_col (sort, i,numfields);
							
			for(i=0; i<length;i++) 
				if(Math.abs(sort[i]) === Math.abs(col)) {
												 sort[i] = col;
												 return;
												 }
			sort.push(col);
		}
			 
function __append_unique_cols(sort, cols, numfields) {
var i, length = cols.length ;
		for( i=0; i<length; i++)
			__append_1_col(sort,cols[i], numfields);
		}
			
/*
select  fields  #:from table [group-by|order|where]* [into table] [limit n]
  -> list (of lists) of lists of into-table

record := table row = js array

field :=  number in [0 ... table.numfields [
fields := field | field ... 

select :=  fields | *
where := (where-proc:1:1)  | (where-proc:2:2  arg)
order :=  | field [desc] | field [desc] ...
group := fields
from := expr (evaluated) => table
*/

var _select = function (self,env) {
var self0;
		var select =[] ; // fields or #:all or _mult (*)
		var where = []; // proc [& arg]
		var from = []; // table(s)
		var group = []; // fields 
		var order = []; // fields 
		var into = [] ; // table
		var distinct = [];
		var limit = [];
		var sort = []; // merging of select|distinct & group & order
		var aggreg = [];
		var tablename = "" ;
		self = self[1]; // pointer to next token
		
// assumes ordered clauses
		 self = __accept_kwd(self,_DISTINCT, /*into*/ distinct);
		 self =__parse_fields(self,null,"select:fields",666, tablename,/*into*/ select, /*into*/ aggreg);
		 self =__parse_from(self,_FROM,"select:from", /*into*/ from,env);
		 tablename = from[0].meta.name ;
		 
// number of fields in from/into table
		 var numfields = from[0].numfields;
		 var outfields = (select[0] === _ALL_COLS) ? numfields : select.length ;
			
		 self =__parse_where(self,_WHERE,"select:where", /*into*/ where,env);
		 	
		 while(self) { // exclusive NYI
		 self0= self;
		self =__parse_fields(self,_GROUP_BY,"select:group-by", numfields, tablename,/*into*/ group);
		self =__parse_fields(self,_ORDER_BY,"select:order-by", numfields, tablename,/*into*/ order);
		self =__parse_into(self,_INTO,"select:into", outfields, /*into*/ into, env);
		self = __parse_limit(self,_LIMIT,"select:limit", /*into*/ limit,env);
		if(self0 === self) break;
		 }	
		 	
		  if(self !== null) glisp_error(128,self[0],"select");
		 	
// compute sort-cols := select cols + group cols + order cols 
// sort-cols will be used for DISTINCT if any

			if (distinct[0]) __append_unique_cols(sort,select,numfields);
			__append_unique_cols(sort,group,numfields);
			__append_unique_cols(sort,order,numfields);
			
		 	
// console.log("select:record:0",record);
console.log("select",select);
console.log("tablename",tablename);
console.log("group",group);
console.log("order",order);
console.log("sort",sort);
console.log("where",where);
console.log("distinct",distinct);
console.log("limit",limit);
console.log("aggreg",aggreg);

		 	return __run_select(select,aggreg,distinct,from,where,group,sort,limit,into,env) ;
}

var _delete = function (self,env) {
var self0;
		var where = []; // proc [& arg]
		var from = []; // table(s)
		self = self[1]; // pointer to next token
		
// assumes ordered clauses
		 self =__parse_from(self,_FROM,"delete:from", /*into*/ from,env);
		 self =__parse_where(self,_WHERE,"delete:where", /*into*/ where,env);		 	
		 if(self !== null) glisp_error(128,self[0],"delete");
		 	
// console.log("select:record:0",record);
console.log("where",where);

		 	return __run_delete(from,where,env) ; // -> table
}

/*---------------------------
TABLES API
----------------------------------*/
var _make_table = function (meta) {
			if(!(meta instanceof MetaStruct)) glisp_error(63,meta,"make-table");
			return new Table(meta);
}

var _table_p = function (object) {
	return (object instanceof Table) ? _true: _false ;
}

var _table_count = function (table) {
	if(! (table instanceof Table)) glisp_error(130,table,"table-count");
	return table.array.length;
}

var _table_insert = function (table, record) {
	if(! (table instanceof Table)) glisp_error(130,table,"table-insert");
	return table.insert(record);
}

var _list_to_table = function (list, table) { // inserts lists, or structs
	if(! (table instanceof Table)) glisp_error(130,table,"list->table");
	if(notIsList (list)) glisp_error(20,list,"list->table");
	var record;
	while(list) {
		record = list[0];
		table.insert(record);
		list = list[1];
		}
	return table;
}

var _table_to_list = function (table) {
	if(! (table instanceof Table))   glisp_error(130,table,"table->list");
	return __array_to_list (__jsmaparray(__array_to_list,table.array.slice(0)));
}

var _table_ref = function (table,index) {
	if(! (table instanceof Table))   glisp_error(130,table,"table-ref");
	if(! isSmallInteger(index)) glisp_error(24,index,"table-ref");
	return table.getref(index) ; // a struct or #f
}
var _table_xref = function (table,index,colnum) {
	if(! (table instanceof Table))   glisp_error(130,table,"table-xref");
	if(! isSmallInteger(index)) glisp_error(24,index,"table-xref");
	return table.getxref(index,colnum) ; // a value or undefined NYI
}


var _table_set = function (table,index, struct) {
	if(! (table instanceof Table))   glisp_error(130,table,"table-set");
	if(! isSmallInteger(index)) glisp_error(24,index,"table-set");
	if(! (struct instanceof Struct)) glisp_error(77,struct,"table-set");
	return table.setref(index,struct) ;
}

var _table_xset = function (table,index, colnum, value) {
	if(! (table instanceof Table))   glisp_error(130,table,"table-set");
	if(! isSmallInteger(index)) glisp_error(24,index,"table-set");
	return table.setxref(index,colnum,value) ;
}

var _table_print = function (top, argc) {
	var table = _stack[top++] ;
	if(! (table instanceof Table))   glisp_error(130,table,"table-print");
	var nfrom = (argc > 1) ? _stack[top++] : 0;
	var nto = (argc > 2) ? _stack[top] : table.array.length ;
	if(! isSmallInteger(nfrom)) glisp_error(24,nfrom,"table-print");
	return table.print(nfrom,nto) ;
}

var _table_to_html = function (table) {
	if(! (table instanceof Table))   glisp_error(130,table,"table->html");
	return table.toHTML() ;
}
var _table_make_index = function (table, field) {
	if(! (table instanceof Table))   glisp_error(130,table,"table-index");
	field =  __check_field(field,"table-index",table.meta.slots.length,table.meta.name) ;
	return table.make_index(field[0]) ;
}
var _table_search = function (value, table, field) {
	if(! (table instanceof Table))   glisp_error(130,table,"table-search");
	field =  __check_field(field,"table-search",table.meta.slots.length,table.meta.name) ;
	return table.search(value,field[0]) ; // row-num
}

var _table_sort = function (table, proc, env) {
	if(! (table instanceof Table))   glisp_error(130,table,"table-search");
	proc = checkProc(proc,2,2,"table-sort");
	return table.sort(proc,env);
}



// (for ((record table))  ) --> maps record := struct[i] 

function sql_boot () {
	 define_sysfun (new Sysfun("sql.make-table",_make_table,1,1));
	 define_sysfun (new Sysfun("sql.table?",_table_p,1,1)); 
	 define_sysfun (new Sysfun("sql.table-count",_table_count,1,1)); 

	 define_sysfun (new Sysfun("sql.list->table",_list_to_table,2,2)); // append mode 
	 define_sysfun (new Sysfun("sql.table->list",_table_to_list,1,1));
	 define_sysfun (new Sysfun("sql.table-print",_table_print,1,3));
	 define_sysfun (new Sysfun("sql.table->html",_table_to_html,1,1));
	 
	 define_sysfun (new Sysfun("sql.table-insert",_table_insert,2,2)); // (table struct|list)-> row-num
	 define_sysfun (new Sysfun("sql.table-ref",_table_ref,2,2)); // (table row-num) -> struct  or #f
	 define_sysfun (new Sysfun("sql.table-xref",_table_xref,3,3)); //(t row-num col-num)->item or #f
	 define_sysfun (new Sysfun("sql.table-set!",_table_set,3,3)); // (table row-num struct)
	 define_sysfun (new Sysfun("sql.table-xset!",_table_xset,4,4)); // (table row-idx col-idx value)
	 
	 define_sysfun (new Sysfun("sql.table-sort",_table_sort,2,2)); // (table proc:2:2 (struct a struct b))
	 
	 define_sysfun (new Sysfun("sql.table-make-index",_table_make_index,2,2)); // (table f-name)
	  //search ( value table  f-name ) -> row-num or #f - re-index if needed
	 define_sysfun (new Sysfun("sql.table-search",_table_search,3,3)); 
	 define_sysfun (new Sysfun("sql.row-num",_row_num,0,0)) ; // inside a where proc

	 define_special (new Sysfun('sql.sql-select', _select,1,undefined));
	 define_special (new Sysfun('sql.sql-delete', _delete,1,undefined));

	_LIB["sql.lib"] = true;
	 writeln("sql.lib v1.9 ® EchoLisp","color:green");
	}
	
sql_boot();
	
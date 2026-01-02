/*-----------------------------
print.lib

to print collections of rows
a collection is a js array coming from : table|Vector (2D array)|list
a row is one of : js array|vector|struct

table-print
matrix-print
array-print
			use __2D_print
------------------------------*/
// numcols = number of fields to print (columns)
// rownums = true|false : wants rownums
// array : js array ( = table.array or matrix.vector)

function __2D_print( array , numcols ,rowfrom, rowto, rownums) { // in [rowfrom..rowto[
	// compute max col width
	var row,i,j;
	var width,maxwidth = [] ;
	var outline;
	
// columns width
	for(i=rowfrom;i<rowto;i++) {
		row = array[i];
		
		if(row.slots) row = row.slots;
		else 
		if (row.vector) row = row.vector ;
		// else row is a jsarray (table)
		
		for(j=0;j<numcols;j++) {
		if(! maxwidth[j]) maxwidth[j]= 0;
			width = glisp_message(row[j],'').length;
			if(width > maxwidth[j]) maxwidth[j] = width;
			}}
// print
	for(i=rowfrom;i<rowto;i++) {
		outline = "";
		if(rownums)
			outline += _string_pad_right("[" + i + "]",6) ;
		row = array[i];
		
				if(row.slots) row = row.slots;
				else 
				if (row.vector) row = row.vector ;
				// else ???

		for(j=0;j<numcols;j++) {
		    	outline +=
		    	 __html_spaces (_string_pad_right(glisp_message(row[j],''),maxwidth[j]+2));
				}
			writeln(glisp_message(outline,""),_STYLE.plist["array"]);
			GPrinter.write(outline); 
			outline="";
			}
	return __void ;
	}
	
// generates <table class="matrix">   .. </table>
// n : num rows, p : num columns
// array is a js array
function __array_to_html (array, n,p) {
	var i,j,row,html=[];
	
	html.push("<table class='matrix'>");
	for(i=0;i<n;i++) {
		html.push("\n<tr>\n");
		row = array[i];
		
		if(row.slots) row = row.slots;  // array of struct
			else 
		if (row.vector) row = row.vector ; // 2D array

			for(j = 0; j<p; j++) {
			html.push("<td>" + glisp_message(row[j],'') + "</td>")
			}
		html.push("\n</tr>");
		}
	html.push("\n</table>") ;
	return html.join(" ");
}

var _PP_TYPE_1 = [_setq, _lambda , _when, _if , _unless , _define, _for , _for_star, _while] ;

// TO DO
// (define (f x) (let ((a (+ PI PI)) (b (* 888888 99999999 66666666))) (- b b b b b a) (+ a b b b b b a a a a) (* a b a b a b)))

function __indent(pp,indent) {
	while(indent--) pp.push(_TAB);
	}
	
function __pp_vector (v, indent, width,pp) {
__indent(pp ,indent);
	var line  = glisp_tostring(v,'') ;
	v = v.vector;
	var first = v[0];
	if (line.length < width || !(first instanceof Vector)) { pp.push(line); return; }

// vector of vectors
	pp.push("#( ");
	_pretty_print_1(first,indent,width,pp,true);
	for(var i=1 ; i < v.length;i++) {
		 pp.push("\n");
		_pretty_print_1(v[i],indent+1,width,pp);
	    }
	pp.push(")");
}
			
// use glisp message ; NYI NYI NYI
function _pretty_print_1(expr, indent, width , /*into*/  pp, raw ) {
	var op, line;
	
	if(expr instanceof Vector) { __pp_vector(expr,indent,width,pp) ; return; }
	
	if(! raw) __indent(pp ,indent);
	if(notIsList(expr)) { 
			pp.push(glisp_tostring(expr,'')) ; 
			return;
			}
			
// LIST case
	op = expr[0];
	if(isNumber(op)) { // list of numbers ,...
			pp.push(glisp_tostring(expr,'')) ; 
			return;
			}

	line = glisp_tostring(expr,'');
	// short line
	if (indent*4 + line.length < width) { pp.push(line); return;  }
	
	pp.push("(") ; // or "["
	if(isListNotNull(op))  {// lambda we presume
				 _pretty_print_1(op,indent,width,pp,true);
				  indent++ ; }
		else { // named lamda ?
	    		pp.push(glisp_tostring(expr[TAG_LAMBDA_DEF] || op,''));
	    		}

	// same line op & params
	if(typeof op === "function" && _PP_TYPE_1.indexOf(op) !== -1 && expr[1] ) {
			expr = expr[1];
			pp.push(" ");
			pp.push(glisp_tostring(expr[0],''));
			}
	
	if (expr) expr = expr[1];
	while(expr) {
		op = expr[0];
		pp.push("\n");
		var kwd = ((op instanceof Symbol) && (glisp_look_keyword(op) || op === _right_arrow)) ;
		_pretty_print_1(op,indent + (kwd  ? 2 : 1 ) ,width,pp);
		// keyword : same line
		if (kwd) {
			expr = expr[1];
			pp.push(" ");
			pp.push(glisp_tostring(expr[0],''));
			}
		if (expr) expr = expr[1];
		}
	// pp.push(" ");
	pp.push(")");
}

// pretty-print(sexpr [width])
var _pretty_print = function(top, argc) {
	var expr = _stack[top++];
	var width = (argc == 1 ) ? 160 : _stack[top] ;
	var pp = [], ostring ;
	_PRETTY_PRINT = true;
	_pretty_print_1(expr,0,width,pp);
	pp.push("\n");
	
	ostring = pp.join(" ");
	ostring = ostring.replace(/\) \)/g,"))");
	ostring = ostring.replace(/\( \(/g,"((");
	stdout_flush(ostring) ;
	_PRETTY_PRINT = false;
	return __void;
}


function boot_print() {
		define_sysfun(new Sysfun ("print.pretty-print",_pretty_print,1,2));
		define_sysfun(new Sysfun ("print.pp",_pretty_print,1,2));
		
     	_LIB["print.lib"] = true;
     	writeln("print.lib V1.9","color:green") ;
}
boot_print();



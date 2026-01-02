/*
EchoLisp matrix.lib
(C) G. Brougnard & Jacques Tramu & Simon Gallubert &  Echolalie 2015
*/

_lib ("print" , null, true); // mute



/*------------------------------
2-D arrays of objects
------------------------------------*/
/*
Build
*/
var _array_copy = function  (A) {
	if(! (A instanceof Vector)) glisp_error(119,A,"array-copy");
	A= A.vector;
	var n = A.length;
	var B = new Vector(n);
	var Bv = B.vector;
	
	for(var j = 0; j<n ; j++)
		Bv[j] = new Vector ( A[j].vector); // cloned
		
	return B;
}

var _vector_to_array = function (V,n,p) {
	if(! (V instanceof Vector)) glisp_error(65,V,"vector->array");
	if(! isSmallSmallInteger (n)) glisp_error(24,n,"vector->array:rows");
	if(! isSmallSmallInteger (p)) glisp_error(24,p,"vector->array:cols");
	V=V.vector;
	var A = __make_array(n,p,0);
	var i,j,row, k=0, l = V.length;
	for(i=0;i<n;i++) {
		row = A.vector[i].vector;
		for(j=0;j<p;j++) {
			if(k >= l) break;
			row[j] = V[k++];
		}}
	return A;
}

var _list_to_array = function (L,n,p) {
	if(notIsList (L)) glisp_error(20,L,"list->array");
	if(! isSmallSmallInteger (n)) glisp_error(24,n,"list->array:rows");
	if(! isSmallSmallInteger (p)) glisp_error(24,p,"list->array:cols");
	
	var A = __make_array(n,p,0);
	var i,j,row ;
	for(i=0;i<n;i++) {
		row = A.vector[i].vector;
		for(j=0;j<p;j++) {
			if(L === null) break;
			row[j] = L[0];
			L = L[1];
		}}
	return A;
}

// init may be undefined (internal use)
function __make_array(n,p,init) {
	var row, i;
	var A = new Vector(n) ;
	for(i=0;i<n;i++) {
		row = new Vector(p);
		if(init !== undefined) _vector_fill(row,init);
		A.vector[i] = row ;
		}
	return A;
	}
	
function __make_diag_array(n,diag) {
diag = diag || 1 ;
	var row, i;
	var A = new Vector(n) ;
	for(i=0;i<n;i++) {
		row = new Vector(n);
		row_i = row.vector;
		for(j=0;j<n;j++) row_i[j]=0;
		row_i[i] = diag;
		A.vector[i] = row ;
		}
	return A;
	}
	
// default init = 0
var _make_array = function (top, argc) {
	var n = _stack[top++]; // rows
	var p = _stack[top++];
	if(! isSmallInteger (n)) glisp_error(24,n,"make-array:rows");
	if(! isSmallInteger (p)) glisp_error(24,p,"make-array:cols");
	var init = (argc > 2) ? _stack[top] : 0;
	return __make_array(n,p,init);
}

// build-array
var _make_initialized_array  = function (n, p, proc, env) {
	if(! isSmallSmallInteger (n)) glisp_error(24,n,"build-array:rows");
	if(! isSmallSmallInteger (p)) glisp_error(24,p,"build-array:cols");
	proc = checkProc(proc,2,2,"build-array");
 	var call = [proc, [null , [null ,null]]];
 	var A =  __make_array(n,p);
 	var rows = A.vector,row,i,j ;
 	
 	for(i=0;i<rows.length;i++) {
		row = rows[i].vector ;
		call[1][0] =i ;
			for(j=0;j<row.length;j++) {
			call[1][1][0] = j;
			row[j] = __funcall(call,env);
		}}

 	return A;
 }
 

 /*
 REFs
 */

var _array_row = function (A,i) {
	if (i >= A.vector.length)  glisp_error(24,i,"array-row:i");
	return A.vector[i]; // reference - not cloned
}
var _array_set_row = function (A,i, row) {
	if (i >= A.vector.length)  glisp_error(24,i,"array-row:i");
	A.vector[i] = row ;
	return A; // reference - not cloned
}

var _array_set_col = function (A,j,col) {
	if(! (A instanceof Vector)) glisp_error(119,A,"array-col");
	var  rA = A.vector, n = rA.length, i ;
	col = col.vector;
	for(i=0;i<n;i++) 
		rA[i].vector[j] = (col[i] === undefined ) ? 
			 glisp_error(24,[i,j],"array-set-col!") : col[i];
	return A ;
}

var _array_col = function (A,j) {
	if(! (A instanceof Vector)) glisp_error(119,A,"array-col");
	A = A.vector;
	var col = [], n = A.length,i , aij ;
	for(i=0;i<n;i++) {
				aij = A[i].vector[j] ;
				if(aij === undefined) glisp_error(24,[i,j],"array-col")
				col.push(aij);
				}
	return new Vector(col); 
}

var _array_ref = function (A,i,j) {
	var val = A.vector[i].vector[j] ;
	return  (val === undefined) ? glisp_error(24,[i,j],"array-ref") : val ;
}
var _array_set = function (A,i,j,obj) {
	if (i >= A.vector.length)  glisp_error(24,i,"array-set:i");
	if (j >= A.vector[i].vector.length)  glisp_error(24,j,"array-set:j");
	A.vector[i].vector[j] = obj ;
	return obj;
}

// rem: __array_to_list is js-array to list
var _array_to_list = function (A) {
if(! (A instanceof Vector)) glisp_error(119,A,"array->list");
	var list = [];
	var rows = A.vector, row, i ;

	for(i=0;i<rows.length;i++) 
		list = list.concat(rows[i].vector);
	
	return __array_to_list(list) ;
}

var _array_print = function (A) {
if(! (A instanceof Vector)) glisp_error(119,A,"array-print");
	__2D_print(A.vector,A.vector[0].vector.length,0,A.vector.length);
return __void ;
}

var _array_to_html = function (A) {
if(! (A instanceof Vector)) glisp_error(119,A,"array-print");
	return __array_to_html(A.vector,A.vector.length,A.vector[0].vector.length);
}

// array-map
var _array_map = function (proc, A , env) {
	proc= checkProc(proc,1,1,"array-map");
	if(! (A instanceof Vector)) glisp_error(118,A,"array-map");
	var i,j;
	var n = A.vector.length;
	var p = A.vector[0].vector.length ;
	var B = __make_array(n,p);
	var call = [proc, [null, null]] ;
	for(i=0;i<n;i++)
		for(j=0;j<p;j++) {
			call[1][0] = _array_ref(A,i,j) ;
			_array_set(B,i,j, __ffuncall(call,env)) ;
			}
	return B;
}
 
/*--------------------------
matrix ops : 2D-arrays of numbers
-------------------------------*/
var _matrix_row_num = function (A) {
if(! (A instanceof Vector)) glisp_error(118,A,"matrix-row-num");
	return A.vector.length ;
}
var _matrix_col_num = function (A) {
	if(! (A instanceof Vector)) glisp_error(118,A,"matrix-col-num");
	A= A.vector[0];
	if(! (A instanceof Vector)) glisp_error(118,A,"matrix-col-num");
	return A.vector.length ;
}

// returns nothing
var __matrix_swap_rows = function (A_vect,i,j) {
	var k,tmp;
	var row_i = A_vect[i].vector;
	var row_j = A_vect[j].vector;
	for(k=0; k < row_i.length;k++) {
		tmp = row_i[k];
		row_i[k] = row_j[k];
		row_j[k] = tmp;
		}
}

var _matrix_swap_rows = function (A,i,j) {
	if(! (A instanceof Vector)) glisp_error(118,A,"matrix-swap-rows!");
	 __matrix_swap_rows(A.vector,i,j);
	 return A.vector[i];
	 }

var _matrix_transpose = function (A) {
	if(! (A instanceof Vector)) glisp_error(118,A,"matrix-transpose");
	var i,j;
	var n = A.vector.length;
	var p = A.vector[0].vector.length ;
	var B = __make_array(p,n);
	for(i=0;i<n;i++)
		for(j=0;j<p;j++)
			_array_set(B,j,i,_array_ref(A,i,j)) ;
	return B;
	}
	
	
// A (n m) + B (n m) -> C (n m)
var _matrix_add  = function (A ,B) {
	if(! (A instanceof Vector)) glisp_error(118,A,"matrix-add");
	if(! (B instanceof Vector)) glisp_error(118,B,"matrix-add");
	A=A.vector;
	B=B.vector;
	var n = A.length;
	if(n !== B.length) gisp_error(24,B.length,"matrix-add:# of rows") ; // bad errnum NYI
	var m = A[0].vector.length;
	if(m !== B[0].vector.length) gisp_error(24,B[0].vector.length,"matrix-add:# of cols") ; 

	var C = __make_array(n ,m);
	var C_rows = C.vector ;
	var i,j ,A_row, B_row ,C_row ;
		for( i=0;i<n;i++) {
			A_row = A[i].vector; // length m
			B_row = B[i].vector; // length m
			C_row = C_rows[i].vector; // length m
			for( j= 0; j<m ; j++) 
			 C_row[j] = A_row[j] + B_row[j] ;
		} // i
		return C ;
}

// A (n p) * B (p m) -> C (n m)
var _matrix_mult  = function (A ,B) {
	if(! (A instanceof Vector)) glisp_error(118,A,"matrix-mult");
	if(! (B instanceof Vector)) glisp_error(118,B,"matrix-mult");
	A=A.vector;
	B=B.vector;
	var n = A.length;
	var p = A[0].vector.length;
	if(p !== B.length) gisp_error(24,p,"matrix-mult:# of rows") ; // bad errnum NYI
	var m = B[0].vector.length;
	var C = __make_array(n ,m);
	var C_rows = C.vector ;
	var i,j,k ,A_row, C_row ,sum;
		for( i=0;i<n;i++) {
			A_row = A[i].vector; // length p
			C_row = C_rows[i].vector; // length m
			for( j= 0; j<m ; j++) {
			  sum = 0;
			  for( k = 0; k <p ; k++)
			  	 sum +=  (+  A_row[k]) * (+ B[k].vector[j]) ;
			C_row[j] = sum ;
			} // j
		} // i
		return C ;
}

// assumes A square
// return [P,L,U,sign(transpositions)] such as PA = LU
// A is scrambled
// Ref : dolittle_pivot.c

function __lu_decompose (A) {
	var pA = A; // save
	A = A.vector;
	var n = A.length;
	var pivot = new Array(n);
	var perm  = new Array(n); // perm of 0..n-1
	var i,j,k,p ,pmax ;
	var row_i, row_j, row_k ; // row_k = pivot row
	var trans = 1; // parity transpositions
	
	for(i=0;i<n;i++) perm[i]=i ;
	for(k=0;k<n;k++)  {
// find pivot
		pivot[k]= k;
		row_k = A[k].vector;
		pmax = Math.abs(row_k[k]);
		for(j=k+1;j<n;j++) {
			row_j = A[j].vector;
			if(pmax < Math.abs(row_j[k])) {
					pmax = Math.abs(row_j[k]);
					pivot[k]=j;
					// row_k = row_j ;
					}}
					
// exchange if needed
		if(pivot[k] !== k) {
			__matrix_swap_rows(A,k,pivot[k]);
			i = perm[k]; perm[k] = perm[pivot[k]] ; perm[pivot[k]] = i;
			trans *= -1;
			}
			
// glisp_trace(k,pivot[k],"swap",true);
		row_k = A[k].vector;
		if(row_k[k] === 0.0) glisp_error(1,k,"cannot decompose matrix");
		
// L matrix
	for(i=k+1; i<n; i++) {
		row_i = A[i].vector;
		row_i[k] /= row_k[k];
	}
	
	for(i=k+1;i<n;i++) {
		row_i = A[i].vector;
		for(j=k+1;j<n;j++)
			row_i[j] -= row_i[k] * row_k[j];
			}
	} // k
	
// make L,U,P (A becomes U)
	var L = __make_array(n,n);
	var urow,lrow ;
	for(i=0;i<n;i++) {
		urow = A[i].vector;
		lrow = L.vector[i].vector;
		for(j = 0 ; j< n; j++) {
			if(i === j) lrow[j] = 1;
			else if (i < j) lrow[j] = 0 ;
			else if (i > j) {lrow[j] = urow[j]; urow[j] = 0;}
			}}
			
// build permutation matrix from perm
	var P = __make_array(n,n,0);
	var Pv = P.vector;
	for (i=0;i<n;i++)
		Pv[i].vector[perm[i]] = 1;
	
	return [P,[L,[pA,[trans,null]]]] ;
}

var _matrix_lu_decompose = function (A) {
	if(! (A instanceof Vector)) glisp_error(118,A,"matrix-lu-decompose");
	__matrix_square_p(A,"lu-decompose");
	return __lu_decompose(_array_copy(A));
}

/*-------------------
solving AX = B
http://www.cs.mtu.edu/~shene/COURSES/cs3621/NOTES/INT-APP/CURVE-linear-system.html
A nxn B nxh X = nxh

Mij = M[i].vector[j]
----------------------------*/

/*
    for j := 1 to h do
        // do the following for each column 
        begin
             compute y1 of the current column 
            y1,j = b1,j / l1,1;
            for i := 2 to n do  process elements on that column 
                begin
                    sum := 0;  solving for yi of the current column 
                    for k := 1 to i-1 do
                        sum := sum + l[i,k] * y[k,j];
                    yi,j = (b i,j - sum)/ l i,i; 
                    end 
                    end 

/*---------------
solving B nxh = L nxn * Y nxh
---------------------------------*/
/*
http://www.caam.rice.edu/~yzhang/caam335/F09/handouts/lu.pdf
(define M (list->array '(1 0 2 2 -1 3 4 1 8) 3 3))
(define B (list->array '(-4  -6 -15 ) 3 1))
(define L (list->array '(1 0 0 2 1 0 4 -1 1) 3 3))
(define U (list->array '(1 0 2 0 -1 -1 0 0 -1) 3 3))

*/
function _matrix_solve_LY_B (L , B) {
	__matrix_square_p(L,"matrix-solve LY=B") ;
	B = B.vector;
	L = L.vector;
	var n =  L.length;
	if( n !== B.length) glisp_error(142,[n,B.length],"matrix-solve LY=B") ;
	var h = B[0].vector.length;
	var VY = __make_array(n,h) ;
	var Y = VY.vector;
	var sum,i,j,k ,Li,Bi;
	
	var L00 = L[0].vector[0] ;
	var Y0 = Y[0].vector ;
	var B0 = B[0].vector;
	
	for( j=0; j<h;j++) {
		Y0[j] = B0[j] / L00 ;
		for( i=1; i < n; i++ ) {
			sum = 0;
			Li = L[i].vector;
			Bi = B[i].vector;
			for(k=0; k <= i-1 ; k++)
				sum += Li[k] * Y[k].vector[j];
			Y[i].vector[j] = (Bi[j] - sum) / Li[i];
		} // i
	} // j
	return VY ;
}

/*
        Input: Matrix Y n×h and a upper triangular matrix U n×h
        Output: Matrix X n×h such that Y = U.X holds.
        Algorithm:
            // there are h columns 
            for j := 1 to h do
                // do the following for each column 
                begin
                    // compute xn of the current column 
                    x n,j = y n,j / u n,n;
                    for i := n-1 downto 1 do // process elements of that column 
                        begin
                            sum := 0; // solving for xi on the current column 
                            for k := i+1 to n do
                                sum := sum + ui,k  * xk,j;
                            xi,j = (yi,j - sum)/ui,i; end end 

*/

/*---------------
solving= U nxn * X nxh =  Y nxh 
input U, Y
---------------------------------*/
function _matrix_solve_UX_Y (U , Y) {
	__matrix_square_p(U,"matrix-solve UX = Y") ;
	Y = Y.vector;
	U = U.vector;
	var n =  U.length;
	if( n !== Y.length) glisp_error(142,[n,Y.length],"matrix-solve UX=Y") ;
	var h = Y[0].vector.length;
	var VX = __make_array(n,h) ;
	var X = VX.vector;
	var sum,i,j,k ;
	var Unn = U[n-1].vector[n-1] ;
	var Xn = X[n-1].vector;
	var Yn = Y[n-1].vector;
	var Ui;
	
	for(j=0;j<h;j++) {
		Xn[j] = Yn[j] / Unn ;
			for(i=n-2; i >=0 ; i--) {
			sum = 0;
			Ui = U[i].vector;
			for(k=i+1; k<n; k++)
				sum += Ui[k] * X[k].vector[j];
			X[i].vector[j] = (Y[i].vector[j] - sum) / Ui[i] ;
			} // i
	} // j
	return VX ;
	}
	
/*------------------
matrix_solve A nn X nh  = B nh
solve PAX = PB
set B := P*B
solve LUX =  B
solve LY = B
solve UX = Y
---------------------------------*/
function _matrix_solve (A , B) {
	var PLU = _matrix_lu_decompose(A);
	var P = PLU[0];
	var L = PLU[1][0];
	var U = PLU[1][1][0];
	B = _matrix_mult (P,B) ;
	var Y = _matrix_solve_LY_B(L,B);
	var X = _matrix_solve_UX_Y(U,Y);
	return X;
}

function _matrix_invert (A) {
	var B = __make_diag_array(A.vector.length);
	return _matrix_solve(A,B);
}

/*-------------------
determinants
------------------*/
function __matrix_square_p (A, sender) {
	if(! (A instanceof Vector)) glisp_error(118,A,sender);
	A = A.vector;
	var n = A.length ;
	var row = A[0];
	if(! (row instanceof Vector)) glisp_error(118,row,sender);
	row = row.vector;
	if(n !== row.length) glisp_error(121,A[0],sender);
	return n;
	}
	
function __det_2(A) {
	return A[0].vector[0]*A[1].vector[1] -  A[0].vector[1]*A[1].vector[0] ;
}

function __det_3(A) {
	return A[0].vector[0] * (A[1].vector[1]*A[2].vector[2] -  A[1].vector[2]*A[2].vector[1]) +
	A[0].vector[1] * (A[1].vector[2]*A[2].vector[0] - A[1].vector[0]*A[2].vector[2]) +
	A[0].vector[2] * (A[1].vector[0]*A[2].vector[1] - A[1].vector[1]* A[2].vector[0]) ;
}

// (define A (list->array '(7 8 -8 9 11 4 -3 66 5 6 77 88 9 44 23 -78) 4 4)) -215416

function __det_n(A) { // uses LU decompose
	A = _array_copy(A);
	A = A.vector;
	var n = A.length;
	var pivot = new Array(n);
	var i,j,k,p ,pmax ;
	var row_i, row_j, row_k ; // row_k = pivot row
	var trans = 1; // transpositions parity
	var det = 1;
	
	for(k=0;k<n;k++)  {
// find pivot
		pivot[k]= k;
		row_k = A[k].vector;
		pmax = Math.abs(row_k[k]);
		for(j=k+1;j<n;j++) {
			row_j = A[j].vector;
			if(pmax < Math.abs(row_j[k])) {
					pmax = Math.abs(row_j[k]);
					pivot[k]=j;
					// row_k = row_j ;
					}}
					
// exchange if needed
		if(pivot[k] !== k) {
			__matrix_swap_rows(A,k,pivot[k]);
			trans *= -1 ;
			}
			
		row_k = A[k].vector;
		if(row_k[k] === 0.0) return 0;
		
	for(i=k+1; i<n; i++) {
		row_i = A[i].vector;
		row_i[k] /= row_k[k];
	}
	
	for(i=k+1;i<n;i++) {
		row_i = A[i].vector;
		for(j=k+1;j<n;j++)
			row_i[j] -= row_i[k] * row_k[j];
			}
	} // k
	
// mult diagonal elements
	for(i=0;i<n;i++) det *= A[i].vector[i] ;
	det *= trans;
	
// round
	ndet = Math.round(det);
	if(Math.abs(det-ndet) < 1.e-6) return ndet;
	return det;
}


var _determinant = function (A) {
	var n = __matrix_square_p(A,"determinant");
	if(n === 1) return A.vector[0].vector[0] ;
	else if (n === 2) return __det_2(A.vector) ;
	else if (n === 3) return __det_3(A.vector) ;
	else return __det_n(A,n);
}

// OVERRIDES
function __inline_vref (aVector, args , env) {
	if (args[1]) // assumes V[i j]
		return _array_ref(aVector, __eval(args[0],env), __eval(args[1][0],env)) ;
	var val =  aVector.vector[__eval(args[0],env)] ;
 	return (val === undefined) ? glisp_error(42,args[0],"vector-ref") : val ;
	}




// MATRIX (= dim 2 array)
// A i j = j-th elem of row i - row-major order = A.vector[i].vector[j]
// A n p : n rows , p columns = Vector(n) of Vectors(p)

function boot_matrix() {
		define_sysfun(new Sysfun ("matrix.make-array",_make_array,2,undefined)); // n p [init]
		// n p proc:2:2
		define_sysfun(new Sysfun ("matrix.build-array",_make_initialized_array,3,3)); 
		define_sysfun(new Sysfun ("matrix.vector->array",_vector_to_array,3,3)); // V n p
		define_sysfun(new Sysfun ("matrix.list->array",_list_to_array,3,3)); // L n p
		define_sysfun(new Sysfun ("matrix.array->list",_array_to_list,1,1)); // L n p
		define_sysfun(new Sysfun ("matrix.array-map",_array_map,2,2)); // (proc:1:1 A)
		
// reserved for n-dims arrays (NYI)
		define_sysfun(new Sysfun ("matrix.array-ref",_array_ref,3,3)); // A i j
		define_sysfun(new Sysfun ("matrix.array-set!",_array_set,4,4)); // A i j obj
		define_sysfun(new Sysfun ("matrix.array-print",_array_print,1,1)); 
		define_sysfun(new Sysfun ("matrix.array->html",_array_to_html,1,1)); 
		define_sysfun(new Sysfun ("matrix.array-copy",_array_copy,1,1)); 
		define_sysfun(new Sysfun ("matrix.array-row",_array_row,2,2)); //(A i) -> vector
		define_sysfun(new Sysfun ("matrix.array-col",_array_col,2,2)); //(A j) -> vector
		define_sysfun(new Sysfun ("matrix.array-set-row!",_array_set_row,3,3)); // A i vect
		define_sysfun(new Sysfun ("matrix.array-set-col!",_array_set_col,3,3)); // A i vect

		define_sysfun(new Sysfun ("matrix.matrix-ref",_array_ref,3,3)); // A i j
		define_sysfun(new Sysfun ("matrix.matrix-set!",_array_set,4,4)); // A i j obj
		define_sysfun(new Sysfun ("matrix.matrix-print",_array_print,1,1)); 
		define_sysfun(new Sysfun ("matrix.matrix->html",_array_to_html,1,1)); 
		define_sysfun(new Sysfun ("matrix.matrix-copy",_array_copy,1,1)); 
		define_sysfun(new Sysfun ("matrix.matrix-row",_array_row,2,2));// (M i) -> vector
		define_sysfun(new Sysfun ("matrix.matrix-col",_array_col,2,2)); //(M j) -> vector
		define_sysfun(new Sysfun ("matrix.matrix-set-row!",_array_set_row,3,3)); // A i vect
		define_sysfun(new Sysfun ("matrix.matrix-set-col!",_array_set_col,3,3)); // A i vect

	
		
		define_sysfun(new Sysfun ("matrix.matrix-transpose",_matrix_transpose,1,1)); 
		define_sysfun(new Sysfun ("matrix.matrix-mult",_matrix_mult,2,2)); 
		define_sysfun(new Sysfun ("matrix.matrix-add",_matrix_add,2,2)); 
		define_sysfun(new Sysfun ("matrix.matrix-row-num",_matrix_row_num,1,1)); 
		define_sysfun(new Sysfun ("matrix.matrix-col-num",_matrix_col_num,1,1)); 
		define_sysfun(new Sysfun ("matrix.matrix-swap-rows!",_matrix_swap_rows,3,3)); // A,i,j
		define_sysfun(new Sysfun ("matrix.matrix-lu-decompose",_matrix_lu_decompose,1,1));
		
		define_sysfun(new Sysfun ("matrix.matrix-solve-LY=B",_matrix_solve_LY_B,2,2)); // (L B)
		define_sysfun(new Sysfun ("matrix.matrix-solve-UX=Y",_matrix_solve_UX_Y,2,2)); // (U Y)
		define_sysfun(new Sysfun ("matrix.matrix-solve",_matrix_solve,2,2)); // X : AX = B (A B)
		define_sysfun(new Sysfun ("matrix.matrix-invert",_matrix_invert,1,1)); // X : AX = I  (A)
		
		define_sysfun(new Sysfun ("matrix.determinant",_determinant,1,1));
		
     	_LIB["matrix.lib"] = true;
     	writeln("matrix.lib V1.9","color:green") ;
}

boot_matrix();
		
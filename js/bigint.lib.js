var _$_BigIntversion = 5.7 ;
var _$_BigInt = (function(module) {
// http://www.javascripter.net/math/primes/millerrabinbug-bigint54.htm FIX !!!
// http://www.javascripter.net/math/primes/millerrabinprimalitytest.htm
// http://www.javascripter.net/math/calculators/primefactorscalculator.htm

////////////////////////////////////////////////////////////////////////////////////////
// Big Integer Library v. 5.4
// Created 2000, last modified 2009
// Leemon Baird
// www.leemon.com
//
// Version history:
// v 5.4  3 Oct 2009
//   - added "var i" to greaterShift() so i is not global. (Thanks to PŽter Szab— for finding that bug)
//
// v 5.3  21 Sep 2009
//   - added randProbPrime(k) for probable primes
//   - unrolled loop in mont_ (slightly faster)
//   - millerRabin now takes a bigInt parameter rather than an int
//
// v 5.2  15 Sep 2009
//   - fixed capitalization in call to int2bigInt in randBigInt
//     (thanks to Emili Evripidou, Reinhold Behringer, and Samuel Macaleese for finding that bug)
//
// v 5.1  8 Oct 2007 
//   - renamed inverseModInt_ to inverseModInt since it doesn't change its parameters
//   - added functions GCD and randBigInt, which call GCD_ and randBigInt_
//   - fixed a bug found by Rob Visser (see comment with his name below)
//   - improved comments
//
// This file is public domain.   You can use it for any purpose without restriction.
// I do not guarantee that it is correct, so use it at your own risk.  If you use 
// it for something interesting, I'd appreciate hearing about it.  If you find 
// any bugs or make any improvements, I'd appreciate hearing about those too.
// It would also be nice if my name and URL were left in the comments.  But none 
// of that is required.
//
// This code defines a bigInt library for arbitrary-precision integers.
// A bigInt is an array of integers storing the value in chunks of bpe bits, 
// little endian (buff[0] is the least significant word).
// Negative bigInts are stored two's complement.  Almost all the functions treat
// bigInts as nonnegative.  The few that view them as two's complement say so
// in their comments.  Some functions assume their parameters have at least one 
// leading zero element. Functions with an underscore at the end of the name put
// their answer into one of the arrays passed in, and have unpredictable behavior 
// in case of overflow, so the caller must make sure the arrays are big enough to 
// hold the answer.  But the average user should never have to call any of the 
// underscored functions.  Each important underscored function has a wrapper function 
// of the same name without the underscore that takes care of the details for you.  
// For each underscored function where a parameter is modified, that same variable 
// must not be used as another argument too.  So, you cannot square x by doing 
// multMod_(x,x,n).  You must use squareMod_(x,n) instead, or do y=dup(x); multMod_(x,y,n).
// Or simply use the multMod(x,x,n) function without the underscore, where
// such issues never arise, because non-underscored functions never change
// their parameters; they always allocate new memory for the answer that is returned.
//
// These functions are designed to avoid frequent dynamic memory allocation in the inner loop.
// For most functions, if it needs a BigInt as a local variable it will actually use
// a global, and will only allocate to it only when it's not the right size.  This ensures
// that when a function is called repeatedly with same-sized parameters, it only allocates
// memory on the first call.
//
// Note that for cryptographic purposes, the calls to Math.random() must 
// be replaced with calls to a better pseudorandom number generator.
//
// In the following, "bigInt" means a bigInt with at least one leading zero element,
// and "integer" means a nonnegative integer less than radix.  In some cases, integer 
// can be negative.  Negative bigInts are 2s complement.
// 
// The following functions do not modify their inputs.
// Those returning a bigInt, string, or Array will dynamically allocate memory for that value.
// Those returning a boolean will return the integer 0 (false) or 1 (true).
// Those returning boolean or int will not allocate memory except possibly on the first 
// time they're called with a given parameter size.
//
// boolean isPrime(x [,rounds])   // small divs + Fermat(1) + Miller-Rabin (5)
// bigInt  factorShank(x)         // return x if prime or a factor
// bigInt sqrt(x)                 // x >=0 integer sqrt

// bigInt  add(x,y)               //return (x+y) for bigInts x and y.  
// bigInt  addInt(x,n)            //return (x+n) where x is a bigInt and n is an integer.
// string  bigInt2str(x,base)     //return a string form of bigInt x in a given base, with 2 <= base <= 95
// int     bitSize(x)             //return how many bits long the bigInt x is, not counting leading zeros
// bigInt  dup(x)                 //return a copy of bigInt x
// boolean equals(x,y)            //is the bigInt x equal to the bigint y?
// boolean equalsInt(x,y)         //is bigint x equal to integer y?
// bigInt  expand(x,n)            //return a copy of x with at least n elements, adding leading zeros if needed
// Array   findPrimes(n)          //return array of all primes less than integer n
// bigInt  GCD(x,y)               //return greatest common divisor of bigInts x and y (each with same number of elements).
// boolean greater(x,y)           //is x>y?  (x and y are nonnegative bigInts)
// boolean greaterShift(x,y,shift)//is (x <<(shift*bpe)) > y?
// bigInt  int2bigInt(t,n,m)      //return a bigInt equal to integer t, with at least n bits and m array elements
// bigInt  inverseMod(x,n)        //return (x**(-1) mod n) for bigInts x and n.  If no inverse exists, it returns null
// int     inverseModInt(x,n)     //return x**(-1) mod n, for integers x and n.  Return 0 if there is no inverse
// boolean isZero(x)              //is the bigInt x equal to zero?
// boolean millerRabin(x,b)       //does one round of Miller-Rabin base integer b say that bigInt x is possibly prime? (b is bigInt, 1<b<x)
// boolean millerRabinInt(x,b)    //does one round of Miller-Rabin base integer b say that bigInt x is possibly prime? (b is int,    1<b<x)
// bigInt  mod(x,n)               //return a new bigInt equal to (x mod n) for bigInts x and n.
// int     modInt(x,n)            //return x mod n for bigInt x and integer n.
// bigInt  mult(x,y)              //return x*y for bigInts x and y. This is faster when y<x.
// bigInt  multMod(x,y,n)         //return (x*y mod n) for bigInts x,y,n.  For greater speed, let y<x.
// boolean negative(x)            //is bigInt x negative?
// bigInt  powMod(x,y,n)          //return (x**y mod n) where x,y,n are bigInts and ** is exponentiation.  0**0=1. Faster for odd n.
// bigInt  randBigInt(n,s)        //return an n-bit random BigInt (n>=1).  If s=1, then the most significant of those n bits is set to 1.
// bigInt  randTruePrime(k)       //return a new, random, k-bit, true prime bigInt using Maurer's algorithm.
// bigInt  randProbPrime(k)       //return a new, random, k-bit, probable prime bigInt (probability it's composite less than 2^-80).
// bigInt  str2bigInt(s,b,n,m)    //return a bigInt for number represented in string s in base b with at least n bits and m array elements
// bigInt  sub(x,y)               //return (x-y) for bigInts x and y.  Negative answers will be 2s complement
// bigInt  trim(x,k)              //return a copy of x with exactly k leading zero elements
//
//
// The following functions each have a non-underscored version, which most users should call instead.
// These functions each write to a single parameter, and the caller is responsible for ensuring the array 
// passed in is large enough to hold the result. 
//
// void    addInt_(x,n)          //do x=x+n where x is a bigInt and n is an integer
// void    add_(x,y)             //do x=x+y for bigInts x and y
// void    copy_(x,y)            //do x=y on bigInts x and y
// void    copyInt_(x,n)         //do x=n on bigInt x and integer n
// void    GCD_(x,y)             //set x to the greatest common divisor of bigInts x and y, (y is destroyed).  (This never overflows its array).
// boolean inverseMod_(x,n)      //do x=x**(-1) mod n, for bigInts x and n. Returns 1 (0) if inverse does (doesn't) exist
// void    mod_(x,n)             //do x=x mod n for bigInts x and n. (This never overflows its array).
// void    mult_(x,y)            //do x=x*y for bigInts x and y.
// void    multMod_(x,y,n)       //do x=x*y  mod n for bigInts x,y,n.
// void    powMod_(x,y,n)        //do x=x**y mod n, where x,y,n are bigInts (n is odd) and ** is exponentiation.  0**0=1.
// void    randBigInt_(b,n,s)    //do b = an n-bit random BigInt. if s=1, then nth bit (most significant bit) is set to 1. n>=1.
// void    randTruePrime_(ans,k) //do ans = a random k-bit true random prime (not just probable prime) with 1 in the msb.
// void    sub_(x,y)             //do x=x-y for bigInts x and y. Negative answers will be 2s complement.
//
// The following functions do NOT have a non-underscored version. 
// They each write a bigInt result to one or more parameters.  The caller is responsible for
// ensuring the arrays passed in are large enough to hold the results. 
//
// void addShift_(x,y,ys)       //do x=x+(y<<(ys*bpe))
// void carry_(x)               //do carries and borrows so each element of the bigInt x fits in bpe bits.
// void divide_(x,y,q,r)        //divide x by y giving quotient q and remainder r
// int  divInt_(x,n)            //do x=floor(x/n) for bigInt x and integer n, and return the remainder. (This never overflows its array).
// int  eGCD_(x,y,d,a,b)        //sets a,b,d to positive bigInts such that d = GCD_(x,y) = a*x-b*y
// void halve_(x)               //do x=floor(|x|/2)*sgn(x) for bigInt x in 2's complement.  (This never overflows its array).
// void leftShift_(x,n)         //left shift bigInt x by n bits.  n<bpe.
// void linComb_(x,y,a,b)       //do x=a*x+b*y for bigInts x and y and integers a and b
// void linCombShift_(x,y,b,ys) //do x=x+b*(y<<(ys*bpe)) for bigInts x and y, and integers b and ys
// void mont_(x,y,n,np)         //Montgomery multiplication (see comments where the function is defined)
// void multInt_(x,n)           //do x=x*n where x is a bigInt and n is an integer.
// void rightShift_(x,n)        //right shift bigInt x by n bits.  0 <= n < bpe. (This never overflows its array).
// void squareMod_(x,n)         //do x=x*x  mod n for bigInts x,n
// void subShift_(x,y,ys)       //do x=x-(y<<(ys*bpe)). Negative answers will be 2s complement.
//
// The following functions are based on algorithms from the _Handbook of Applied Cryptography_
//    powMod_()           = algorithm 14.94, Montgomery exponentiation
//    eGCD_,inverseMod_() = algorithm 14.61, Binary extended GCD_
//    GCD_()              = algorothm 14.57, Lehmer's algorithm
//    mont_()             = algorithm 14.36, Montgomery multiplication
//    divide_()           = algorithm 14.20  Multiple-precision division
//    squareMod_()        = algorithm 14.16  Multiple-precision squaring
//    randTruePrime_()    = algorithm  4.62, Maurer's algorithm
//    millerRabin()       = algorithm  4.24, Miller-Rabin algorithm
//
// Profiling shows:
//     randTruePrime_() spends:
//         10% of its time in calls to powMod_()
//         85% of its time in calls to millerRabin()
//     millerRabin() spends:
//         99% of its time in calls to powMod_()   (always with a base of 2)
//     powMod_() spends:
//         94% of its time in calls to mont_()  (almost always with x==y)
//
// This suggests there are several ways to speed up this library slightly:
//     - convert powMod_ to use a Montgomery form of k-ary window (or maybe a Montgomery form of sliding window)
//         -- this should especially focus on being fast when raising 2 to a power mod n
//     - convert randTruePrime_() to use a minimum r of 1/3 instead of 1/2 with the appropriate change to the test
//     - tune the parameters in randTruePrime_(), including c, m, and recLimit
//     - speed up the single loop in mont_() that takes 95% of the runtime, perhaps by reducing checking
//       within the loop when all the parameters are the same length.
//
// There are several ideas that look like they wouldn't help much at all:
//     - replacing trial division in randTruePrime_() with a sieve (that speeds up something taking almost no time anyway)
//     - increase bpe from 15 to 30 (that would help if we had a 32*32->64 multiplier, but not with JavaScript's 32*32->32)
//     - speeding up mont_(x,y,n,np) when x==y by doing a non-modular, non-Montgomery square
//       followed by a Montgomery reduction.  The intermediate answer will be twice as long as x, so that
//       method would be slower.  This is unfortunate because the code currently spends almost all of its time
//       doing mont_(x,x,...), both for randTruePrime_() and powMod_().  A faster method for Montgomery squaring
//       would have a large impact on the speed of randTruePrime_() and powMod_().  HAC has a couple of poorly-worded
//       sentences that seem to imply it's faster to do a non-modular square followed by a single
//       Montgomery reduction, but that's obviously wrong.
////////////////////////////////////////////////////////////////////////////////////////

//globals
var bpe=0;         //bits stored per array element
var mask=0;        //AND this with an array element to chop it down to bpe bits
var radix=mask+1;  //equals 2^bpe.  A single 1 bit to the left of the last bit of mask.

//the digits for converting to different bases
var digitsStr='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_=!@#$%^&*()[]{}|;:,.<>/?`~ \\\'\"+-';

//initialize the global variables
for (bpe=0; (1<<(bpe+1)) > (1<<bpe); bpe++);  //bpe=number of bits in the mantissa on this platform
bpe>>=1;                   //bpe=number of bits in one element of the array representing the bigInt
mask=(1<<bpe)-1;           //AND the mask with an integer to get its bpe least significant bits
radix=mask+1;              //2^bpe.  a single 1 bit to the left of the first bit of mask
var one=int2bigInt(1,1,1);     //constant used in powMod_()

console.log("Integer:Init","bpe",bpe,"mask",mask,"radix",radix);

//the following global variables are scratchpad memory to 
//reduce dynamic memory allocation in the inner loop
var t=new Array(0);
var ss=t;       //used in mult_()
var s0=t;       //used in multMod_(), squareMod_() 
var s1=t;       //used in powMod_(), multMod_(), squareMod_() 
var s2=t;       //used in powMod_(), multMod_()
var s3=t;       //used in powMod_()
var s4=t, s5=t; //used in mod_()
var s6=t;       //used in bigInt2str()
var s7=t;       //used in powMod_()
var T=t;        //used in GCD_()
var sa=t;       //used in mont_()
var mr_x1=t, mr_r=t, mr_a=t;                                      //used in millerRabin()
var eg_v=t, eg_u=t, eg_A=t, eg_B=t, eg_C=t, eg_D=t;               //used in eGCD_(), inverseMod_()
var md_q1=t, md_q2=t, md_q3=t, md_r=t, md_r1=t, md_r2=t, md_tt=t; //used in mod_()

var primes=t, pows=t, s_i=t, s_i2=t, s_R=t, s_rm=t, s_q=t, s_n1=t,
    s_a=t, s_r2=t, s_n=t, s_b=t, s_d=t, s_x1=t, s_x2=t, s_aa=t; //used in randTruePrime_()

var rpprb=t; //used in randProbPrimeRounds() (which also uses "primes")
var gb_a =t, gb_x1=t ; // used in isPrime

////////////////////////////////////////////////////////////////////////////////////////
var squares_256 = new Array();
/*
[1,1,0,0,1,0,0,0,0,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,
 0,0,0,0,0,0,1,1,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,
 0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,1,0,0,0,0,
 0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1,0,0,0,
 0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0] ;
 */

var sq_zero = int2bigInt(0,0,2);
var sq_one = int2bigInt(1,0,2);
var sq_two = int2bigInt(2,0,2);
var sq_three = int2bigInt(3,0,2);
var sq_four = int2bigInt(4,0,2);
var sq_five= int2bigInt(5,0,2);
var sq_six = int2bigInt(6,0,2);

var _infinity = null;
function infinity() { // 10**120  for echoprimes
  if(_infinity) return _infinity;
  _infinity = int2bigInt(1,0,4);
  var e10_6 = int2bigInt(1000000,0,4);
  for (var i=0;i <= 20; i++) _infinity = mult(_infinity,e10_6);
  return _infinity;
}

var sq_x=t,sq_y=t,sq_r=t;
function sqrt(n) {
var  e;
  if(equalsInt(n,0)) return sq_zero;
  if(equalsInt(n,1)) return sq_one;
  
  if(sq_x.length != n.length) {
  sq_y = dup(n);
  sq_r = dup(n);
  sq_x = dup(n);
  }
  
  e = bitSize(n) - 1; // 2**e <= x <= 2**e+1
//  console.log("sq:e: " + e);
 
  e = (e+2) >> 1;
  for(var i=0;i< sq_x.length;i++) sq_x[i]= 0;
  sq_x[Math.floor(e / bpe)] =  1   << (e % bpe) ;
  
  
  // DBG
  //copy_(sq_y,sq_x);
  //mult_(sq_y,sq_y);
//  console.log("x0*x0 >= n : " + bigInt2str(sq_y,10));


  for(;;) {
//console.log("n: " + bigInt2str(n,10) + " x: " + bigInt2str(sq_x,10)  );
    divide_(n,sq_x,sq_y,sq_r);
//console.log(" x: " + bigInt2str(n,10) + " y: " +  bigInt2str(sq_y,10) );
    add_(sq_y,sq_x);
    rightShift_(sq_y,1);
//console.log(" x: " + bigInt2str(sq_x,10) + " y: " +  bigInt2str(sq_y,10) );
    if(greater(sq_x,sq_y)) {copy_(sq_x,sq_y); continue;}
    break;
  }
  
  return sq_x;
} // sqrt

//return array of all primes less than integer n
function findPrimes(n) {
  var i,s,p,ans;
  s=new Array(n);
  for (i=0;i<n;i++)
    s[i]=0;
  s[0]=2;
  p=0;    //first p elements of s are primes, the rest are a sieve
  for(;s[p]<n;) {                  //s[p] is the pth prime
    for(i=s[p]*s[p]; i<n; i+=s[p]) //mark multiples of s[p]
      s[i]=1;
    p++;
    s[p]=s[p-1]+1;
    for(; s[p]<n && s[s[p]]; s[p]++); //find next prime (where s[p]==0)
  }
  ans=new Array(p);
  for(i=0;i<p;i++)
    ans[i]=s[i];
  return ans;
}

/*------------------------------
 * R H O
 * -------------------------------------*/
var ro_x =t, ro_y = t, ro_q = t, ro_d = t, ro_z = t;
var ro_bx =t,  ro_by=t  , ro_tmp = t; // save values
var ro_a,ro_i; // ints
var ro_start0;
var ro_brent = true;

function str10 (x) {
  return bigInt2str(x,10);
}

/*
 *rho : check for squares (isSquare missing)
 *increase B
 */ 
var RHO_TIME_SLICE = 4000 ;
var RHO_TIME_SLEEP = 1000 ;
var RHO_TOTAL_TIME = 240000 ; // 120000 ;

function rho(n,first_call,a,x0) {
// console.log("RHO:first: " + first_call + " n: " + str10(n) );
  var gcd=0,loops=0,c;
 
  
  if(first_call) {
   _COMPUTING = true;
    ro_start0 = Date.now();
    var B = 30000 ;
    if(greater(sq_two,n)) return n;
    if(!(n[0] & 1)) return sq_two;
    if(modInt(n,3) == 0) return sq_three;
  
    if(isPrime(n)) return n;
    
    if (primes.length==0) primes=findPrimes(B);
    //check n for divisibility by small primes up to B
    for (i=2; (i<primes.length) && (primes[i]<=B); i++)
      if (modInt(n,primes[i])==0 ) return int2bigInt(primes[i],0,2);
  
  
    x0 = x0 || 2; // starter
    ro_tmp = int2bigInt(x0,0,n.length+2);
    ro_x = int2bigInt(x0,0,n.length+2);
    ro_y = int2bigInt(x0,0,n.length+2);
    ro_z = int2bigInt(x0,0,n.length+2);
    ro_bx = int2bigInt(x0,0,n.length+2);
    ro_by = int2bigInt(x0,0,n.length+2);
    ro_q = int2bigInt(1,0,n.length+2);
    ro_d= int2bigInt(0,0,n.length+2);
    
    ro_a = ro_a || 1;
    ro_brent = true;
  } // first call
  
  var t0 = Date.now();
  c = 0;
//  console.log("RHO",str10(n),"params",str10(ro_x),str10(ro_y),str10(ro_q));
  while(1 /*loops--*/) {
    
     // resuming  or time sampling starts here
    if(c === 0) {
    var percent = Math.floor((Date.now() - ro_start0)*100/RHO_TOTAL_TIME);
    if(percent >= 100) {
    		writeln("factor: aborted",_STYLE.plist["error"]);
    		_COMPUTING = false;
    		return 0; // time_out
    		}
    if(Date.now() - t0 > RHO_TIME_SLICE) {
//       console.log("rho:paused:  n: " + str10(n),loops,gcd);
            // _COMPUTING = true;
            var restart = function () { return rho(n,false,a,x0) ; }
            setTimeout(restart , RHO_TIME_SLEEP) ;
            writeln("&#x023F3; factorizing ... " + percent + "%",_STYLE.plist["warning"]);
            return 0; // paused
            }
    } // c == 0
    
    loops++; // total 
     
     if(ro_brent && (c === 0)) {
      copy_(ro_bx,ro_x);
      copy_(ro_by,ro_y);
      copyInt_(ro_z,1);
    }
    
    squareMod_(ro_x,n) ;addInt_(ro_x , ro_a); if(greater(ro_x,n)) sub_(ro_x,n);
    squareMod_(ro_y,n) ;addInt_(ro_y , ro_a); if(greater(ro_y,n)) sub_(ro_y,n);
    squareMod_(ro_y,n) ;addInt_(ro_y , ro_a); if(greater(ro_y,n)) sub_(ro_y,n);
    
    if(greater(ro_x,ro_y))
            {copy_(ro_tmp,ro_x); sub_(ro_tmp,ro_y);}
            else
            {copy_(ro_tmp,ro_y); sub_(ro_tmp,ro_x);}
 //   multMod_(ro_q,ro_tmp,n); avec i % j
     copy_(ro_q,ro_tmp);
    
    // z = PI(d_i)
    if(ro_brent) {
        if(++c < 20) {multMod_(ro_z,ro_q,n) ; continue;}
        if(c === 20) {
                copy_(ro_tmp,n);
                copy_(ro_d,ro_z);
                GCD_(ro_tmp,ro_d);
                if(equalsInt(ro_tmp ,1)) { c= 0; continue; }
    			// backup
      			ro_brent = false;
      			copy_(ro_x,ro_bx);
      			copy_(ro_y,ro_by);
      			continue; // backup
        		} // c = 20
    } // brent
    
 //  console.log("rho:iter",str10(ro_x),str10(ro_y),str10(ro_d)," loops i ",l,i);
      gcd++;
      copy_(ro_d,n);
      copy_(ro_tmp,ro_q);
 // console.log("gcd:",str10(ro_d),str10(ro_q));
      GCD_(ro_d,ro_tmp); // ro_d sractched
      
// slice return
	if(!first_call)
	if(!equalsInt(ro_d,1)) {
	 var factor = new Integer(ro_d) ;
	 var sfactor = glisp_tostring(factor);
	 
	 _COMPUTING = false;
      // if(isZero(ro_d)) return 0;
      writeln ('(factor ' + str10(n) + ") -> " + sfactor, "color:orange") ;
      glisp.results.push(factor);
      writeln("[" + (glisp.results.length-1) + "]&rarr; " + sfactor); // [n]-> + result
      return ro_d; // may be n or composite  or 0  == failure
      }
  
// normal return (div !=1 found)
    if(!equalsInt(ro_d,1)) {
     _COMPUTING = false;
      if(isZero(ro_d)) return 0;
      return ro_d ; // may be n or composite  or 0  == failure
    }
    
  } // while loops
  
  return n;
}

/*---------------------------------------------------
Shank's factorization algorithm
http://www.frenchfries.net/paul/factoring/source.html
-----------------------------------------------------*/

var sk_a=t, sk_f=t, sk_h1=t, sk_h2=t, sk_k=t, sk_p=t, sk_pp=t, sk_q=t, sk_qq=t, sk_qqq=t, sk_r=t, sk_te=t, sk_tmp=t ;
var sk_i;
var sk_start0;
function factorShank(n,first_call) { // return factor f of x
  
  console.log("SHANK:first: " + first_call + " n: " + str10(n) );
  
  
   if(first_call) {
    sk_start0 = + new Date();
    var B = 30000 ;
    if(greater(sq_two,n)) return n;
    if(!(n[0] & 1)) return sq_two;
    if(modInt(n,3) == 0) return sq_three;
  
    if(isPrime(n)) return n;
    
    if (primes.length==0) primes=findPrimes(B);
    //check ans for divisibility by small primes up to B
    for (var i=2; (i<primes.length) && (primes[i]<=B); i++)
      if (modInt(n,primes[i])==0 ) return int2bigInt(primes[i],0,2);
   

  //  if(sk_a.length < n.length) ?????
    {
      sk_a= dup(n); sk_f = dup(n); sk_h1= dup(n); sk_h2= dup(n); sk_k = dup(n);
      sk_p= dup(n); sk_pp= dup(n); sk_q = dup(n); sk_qq= dup(n); sk_qqq = dup(n);
      sk_r = dup(n); sk_te= dup(n); sk_tmp = dup(n);
    }
   
    } // n : first call
    
    var start = + new Date();
    var loops = 100; // sampling
    
    for(;;)  {
      if(first_call) {
    // check for square
        copy_(sk_k,sqrt (n));
 // console.log("sq: " + bigInt2str(sk_k,10));
        copy_(sk_tmp,sk_k);
        mult_(sk_tmp,sk_tmp); 
 // console.log("sq*sq: " + bigInt2str(sk_tmp,10));
        if(equals(sk_tmp,n)) return sk_k;
    
      sk_i = 0;
    // inits a=k; h1=k; h2=1; pp=0; qq=1; qqq=n; r=0;
    copy_( sk_a, sk_k);
    copy_( sk_h1, sk_k);
    copyInt_(sk_h2,1);
    copyInt_(sk_pp,0);
    copyInt_(sk_qq,1);
    copyInt_(sk_r,0);
    copy_(sk_qqq,n);
    first_call = false ;
    } // init or recurse
 
   // resuming starts here
    if(loops-- == 0) {
    loops = 100;
    var now = + new Date();
    if(now - start > 10000) { // 10sec NYI
            console.log("shank:i: " + sk_i + " n: " + bigInt2str(n,10) + "  dt: " + (now-sk_start0));
            return sq_zero; // paused
            }
    }
 
 // console.log("L " + bigInt2str(sk_a,10) + " " + bigInt2str(sk_h1,10) + " " + bigInt2str(sk_h2,10) + " " + bigInt2str(sk_pp,10) + " "
 //          + bigInt2str(sk_qq,10) + " " + bigInt2str(sk_qqq,10) + " " + bigInt2str(sk_r,10) );
  
    copy_(sk_p,sk_k);
    sub_(sk_p,sk_r); // p= k-r
    copy_(sk_q,sk_pp); //q = qqq + a*(pp-p);
    sub_(sk_q,sk_p);
    mult_(sk_q,sk_a);
    add_(sk_q,sk_qqq);
    
    // a = (p+k) / q; r = (p+k) % q;
    copy_(sk_tmp,sk_p);
    add_(sk_tmp,sk_k);
    divide_(sk_tmp,sk_q,sk_a,sk_r);
    
    //te = a*h1 + h2; h2 = h1; h1 = te; pp = p; qqq = qq; qq = q;
   
    sk_te = mult(sk_a,sk_h1); // allocs ..une de trop
    sk_te = add(sk_te,sk_h2);
    
    sk_h2 = sk_h1;
    sk_h1 = dup(sk_te);
    
    copy_(sk_pp,sk_p);
    copy_(sk_qqq,sk_qq);
    copy_(sk_qq,sk_q);
    
    // te = sqrt(q); if ((++i%2) != 0 || !issquare(q)) continue;
    copy_(sk_te,sqrt(sk_q));
    sk_i++;
    if(sk_i % 2  != 0) continue;
    copy_(sk_tmp,sk_te);
    mult_(sk_tmp,sk_tmp); 
    if(!equals(sk_tmp,sk_q)) continue;
    
    // f = h2-te;  f = gcd(f,n);
    sk_f = dup(sk_te); // to align sizes
    copy_(sk_f,sk_h2);
    sub_(sk_f,sk_te);
    copy_(sk_te,n);
 //   console.log("gcd " + bigInt2str(sk_f,10) + ": " +  sk_f.length + "  " + bigInt2str(sk_te,10) + ": " +  sk_te.length );
    if(greater(sk_te,sk_f)) {var xx = sk_te; sk_te = sk_f; sk_f = xx;}
    GCD_(sk_f,sk_te); //  assert f > n ? 
    
    // f (1<f && f<n) if (isprime(f)) return f;
    if(greater(sk_f,sq_one) &&  greater(n,sk_f))
          {
            if (isPrime(sk_f)) return sk_f;
                copy_(n,sk_f); // "recurse"
                first_call = true;
          }
    } // for(;;)

    
  return n; // failed
} // SHANK

function goldbach(x) { // return p : (x-p) prime. 0 is fail
  var B = 30000 ;
  if (primes.length==0) primes=findPrimes(B);  //primes <=30000
    
  if(x[0] & 1 || greater(sq_four,x)) return sq_zero; // must be even
  var p = dup(x);
  for(var i = 0; i < primes.length; i++) {
    copy_(p,x);
    addInt_(p, - primes[i]);
    if(isPrime(p,3)) return p;
  }
  return sq_zero;
} // goldbach


function nextPrime(x) {
  if(greater(sq_two,x)) return sq_two;
  if(equals(sq_two,x)) return sq_three;
  if(greater(sq_five,x)) return sq_five;
  x = expand(x,x.length+2) ;
  if(x[0] & 1) add_(x,sq_two); else add_(x , sq_one) ;
  
  while (! equals( mod(x, sq_six) , sq_one)) {
    if(isPrime(x)) return x;
    add_(x,sq_two);
  }
  
  for(;;)
    {
    if(isPrime(x)) return x;
    add_(x,sq_four);
    if(isPrime(x)) return x;
    add_(x,sq_two);
    }
} // nextPrime


function isOdd(x) {
  return x[0] & 1 ;
}
// is bigint x pseudo prime ?
// negative checked in caller

function isPrime(x,r) {
  r = r || 5 ; // rounds ?????
  var B = 30000 ;
  if (primes.length==0)
    primes=findPrimes(B);  //check for divisibility by primes <=30000
 
  var small = true;
  for (var i=1;i<x.length;i++) if (x[i]) {small = false; break;}
  
  var sq = 0;
  if(small) {
         var n = x[0];
         if(n == 2) return 1;
         if(n <= 1) return 0;
         if(! (n & 1)) return 0;
         if(n === 3) return 1;
         for (var i=1; i<primes.length; i++) { // starts primes[1] = 3
            if(n % primes[i] == 0) return 0;
            if(primes[i]*primes[i] >= n) return 1;
         }
        alert("PRIME ERROR: " + n);
        return 0;
  }
  
  if(!(x[0] & 1)) return 0; // assumes > 0 

  //check x for divisibility by small primes up to B
    for (var i=1; i<primes.length; i++) {
      if (equalsInt(x,primes[i])) return 1;
      if (modInt(x,primes[i])==0) {
//console.log("DIV NOT PRIME:"  + bigInt2str(x,10) + "  div:" + primes[i] + "  max div: " + primes[primes.length-1]);
        return 0;
      }}
 
  
    // Fermat test
    var pprime = 1;
    var base ;
    
     if (gb_x1.length!=x.length || gb_a.length!=x.length) {
      gb_x1=dup(x); // x - 1
      gb_a=dup(x);
    }
    copy_(gb_x1,x);
    addInt_(gb_x1,-1);

    for (var i=0; i<r && pprime; i++) { // must have(base,x) = 1
    base = Math.floor(Math.random() * (primes.length - 1)) ;
    base = primes[base];
    if(base < 2) base = 2;
    copyInt_(gb_a,base);
    if(greater(gb_a,gb_x1)) copyInt_(gb_a,i+7);
    ans = powMod(gb_a,gb_x1,x);
    pprime = equalsInt(ans,1);
    }
//    console.log("BIG FERMAT:" + pprime + " x:" + bigInt2str(x,10) + " base:" + base );
 
    return pprime; 
    
    
 //   
/* 
    if(pprime == 0) return 0;
   //do n rounds of Miller Rabin, with random bases less than x
   pprime = 1;
    for (var i=0; i<r && pprime; i++) {
     // base = Math.floor(Math.random() * (radix-1));
     base = primes[i];
      if(base < 2) base = 2;
      copyInt_(gb_a,base);
      pprime= millerRabin(x,gb_a) ;
    }
 console.log("BIG PRIME:" + pprime + " x:" + bigInt2str(x,10) + "  round:" + i  + " base:" + base  + "  radix:" + radix);
*/
}

//does a single round of Miller-Rabin base b consider x to be a possible prime?
//x is a bigInt, and b is an integer, with b<x
function millerRabinInt(x,b) {
  if (mr_x1.length!=x.length) {
    mr_x1=dup(x);
    mr_r=dup(x);
    mr_a=dup(x);
  }

  copyInt_(mr_a,b);
  return millerRabin(x,mr_a);
}

//does a single round of Miller-Rabin base b consider x to be a possible prime?
//x and b are bigInts with b<x
function millerRabin(x,b) {
  var i,j,k,s,e;

 //if (mr_x1.length!=x.length) { 
    mr_x1=dup(x);
    mr_r=dup(x);
    mr_a=dup(x);
 //}

  copy_(mr_a,b);
  copy_(mr_r,x);
  copy_(mr_x1,x);

  addInt_(mr_r,-1);
  addInt_(mr_x1,-1);
  
  //s=the highest power of two that divides mr_r
  /*
  k=0;
  for (i=0;i<mr_r.length;i++)
    for (j=1;j<mask;j<<=1)
      if (x[i] & j) {
        s=(k<mr_r.length+bpe ? k : 0);
         i=mr_r.length;
         j=mask;
      } else
        k++;
  */

  // FIX: replace the 9 lines commented above - with these 4 lines:
  if (isZero(mr_r)) return 0;
  for (k=0; mr_r[k]==0; k++);
  for (i=1,j=2; mr_r[k]%j==0; j*=2,i++ );
  s = k*bpe + i - 1;

  if (s)                
    rightShift_(mr_r,s); // m_r = N-1 = 2**s * q (q odd)  mr_r <-- q

  mr_a = powMod(mr_a,mr_r,x); // mr_a = b <- base**q  mod N _powMod ?? broken
  e = 0;
  if (equalsInt(mr_a,1)) return 1;
  
  if (!equalsInt(mr_a,1) && !equals(mr_a,mr_x1)) {
    j=1;
    while (j<=s-1 && !equals(mr_a,mr_x1)) {
      squareMod_(mr_a,x);
      if (equalsInt(mr_a,1)) {
        return 0;
      }
      j++;
    } // j
    if (!equals(mr_a,mr_x1)) {
      return 0;
    }
  } // if

  
  return 1;  
}

//returns how many bits long the bigInt is, not counting leading zeros.
function bitSize(x) {
  var j,z,w;
  for (j=x.length-1; (x[j]==0) && (j>0); j--);
  for (z=0,w=x[j]; w; (w>>=1),z++);
  z+=bpe*j;
  return z;
}

//return a copy of x with at least n elements, adding leading zeros if needed
function expand(x,n) {
  var ans=int2bigInt(0,(x.length>n ? x.length : n)*bpe,0);
  copy_(ans,x);
  return ans;
}

//return a k-bit true random prime using Maurer's algorithm.
function randTruePrime(k) {
  var ans=int2bigInt(0,k,0);
  randTruePrime_(ans,k);
  return trim(ans,1);
}

//return a k-bit random probable prime with probability of error < 2^-80
function randProbPrime(k) {
  if (k>=600) return randProbPrimeRounds(k,2); //numbers from HAC table 4.3
  if (k>=550) return randProbPrimeRounds(k,4);
  if (k>=500) return randProbPrimeRounds(k,5);
  if (k>=400) return randProbPrimeRounds(k,6);
  if (k>=350) return randProbPrimeRounds(k,7);
  if (k>=300) return randProbPrimeRounds(k,9);
  if (k>=250) return randProbPrimeRounds(k,12); //numbers from HAC table 4.4
  if (k>=200) return randProbPrimeRounds(k,15);
  if (k>=150) return randProbPrimeRounds(k,18);
  if (k>=100) return randProbPrimeRounds(k,27);
              return randProbPrimeRounds(k,40); //number from HAC remark 4.26 (only an estimate)
}

// randPrime (quick & dirty)
function randPrime(k) {
  return randProbPrimeRounds(k,5);
}


//return a k-bit probable random prime using n rounds of Miller Rabin (after trial division with small primes)	
function randProbPrimeRounds(k,n) {
  var ans, i, divisible, B; 
  B=30000;  //B is largest prime to use in trial division
  ans=int2bigInt(0,k,0);
  
  //optimization: try larger and smaller B to find the best limit.
  
  if (primes.length==0)
    primes=findPrimes(30000);  //check for divisibility by primes <=30000

  if (rpprb.length!=ans.length)
    rpprb=dup(ans);

  for (;;) { //keep trying random values for ans until one appears to be prime
    //optimization: pick a random number times L=2*3*5*...*p, plus a 
    //   random element of the list of all numbers in [0,L) not divisible by any prime up to p.
    //   This can reduce the amount of random number generation.
    
    randBigInt_(ans,k,0); //ans = a random odd number to check
    ans[0] |= 1; 
    divisible=0;
  
    //check ans for divisibility by small primes up to B
    for (i=0; (i<primes.length) && (primes[i]<=B); i++)
      if (modInt(ans,primes[i])==0 && !equalsInt(ans,primes[i])) {
        divisible=1;
        break;
      }      
    
    //optimization: change millerRabin so the base can be bigger than the number being checked, then eliminate the while here.
    
    //do n rounds of Miller Rabin, with random bases less than ans
    for (i=0; i<n && !divisible; i++) {
      randBigInt_(rpprb,k,0);
      while(!greater(ans,rpprb)) //pick a random rpprb that's < ans
        randBigInt_(rpprb,k,0);
      if (!millerRabin(ans,rpprb))
        divisible=1;
    }
    
    if(!divisible)
      return ans;
  }  
}

//return a new bigInt equal to (x mod n) for bigInts x and n.
function mod(x,n) {
  var ans=dup(x);
  mod_(ans,n);
  return trim(ans,1);
}


// return (x+n) where x is a bigIntin Z  and n is an integer in Z
// max n 32000 * 16000
function addInt(x,n) {
// console.log("addInt",x,n);
	if(n === 0)  return dup(x);
  var ans ;
  if(n >= 0 && !negative(x)) {
   		ans=expand(x,x.length+1);
  		addInt_(ans,n);
  		return trim(ans,1);
  		}
  // CODE ADDED 
  if(n < 0 && negative(x))  { // return negate(addInt(negate(x), -n)) ;
  		ans =expand(x,x.length+1);
  		multInt_(ans,-1);
  		addInt_(ans,-n);
  		multInt_(ans,-1);
  		ans = trim(ans,0);
  		return ans;
  		}
// n < 0 , x > 0
  if(n < 0) return subInt(x,-n);
// n > 0 , x < 0
 return negate(subInt(negate(x),n)) ; 
 /*
 			var moinsx = dup(x);
 			multInt_(moinsx,-1);
 			if(cmpInt(moinsx,n) === -1) { // return negate(n -x)
  						 ans =int2bigInt(n,0,4) ; // int to Big 
  						 sub_(ans,moinsx);
  						 return trim(ans,0);
  						 }
  			subInt_(moinsx,n);
  			multInt_(moinsx,-1);
  			return trim(moinsx,0);
*/
} // addInt

//return (x-n) where x is a bigInt in Z  and n is an integer in Z 
function subInt(x,n) { // added
//console.log("subInt","n",n,"x",x,negative(x)) ;
var ans;
  if(n === 0) return dup(x);
  if(n >= 0 && !negative(x)) { // n >=0 && x >= 0
  if(cmpInt(x,n) === -1) { // return negate(n -x)
  						 ans =int2bigInt(n,0,4) ; /* int to Big */
  						 sub_(ans,x);
  						 multInt_(ans,-1);
   						 return trim(ans,0);
  						 }
  	ans=expand(x,x.length+1);
  	if(ans[0] >= n) ans[0] -= n ;
  		else 
  		subInt_(ans,n);
  	return trim(ans,1);
  }
  
// n < 0 && x >= 0 
	if((n < 0)  && ! negative(x))  return addInt(x,-n);
  
// n >=0 && x < 0
  if(n >= 0 && negative(x))  { // return negate(addInt(negate(x), -n)) ;
  		ans =expand(x,x.length+1);
  		multInt_(ans,-1);
  		addInt_(ans,n);
  		multInt_(ans,-1);
  		ans = trim(ans,0);
  		return ans;
  		}
  		
  		  
 // n < 0 && x < 0
  if(n < 0 && negative(x)) { // return(negate(addInt(negate(x),-n))) ;
    						return addInt(x,-n);
  							}
} // subInt

//return x*y for bigInts x and y. This is faster when y<x.
function mult(x,y) {
  var ans=expand(x,x.length+y.length);
  mult_(ans,y);
  return trim(ans,1);
}

// max |n| 640000 (added)
function mulInt(x,n) {
 	var ans ;
 	if(n === 0) return int2bigInt(0,0,2);
 	if(n === 1) return dup(x);
 	if(!(negative(x))) {
 		ans=expand(x,x.length+2);
		multInt_(ans,n);
		return  (n < 0) ? trim(ans,0) : trim(ans,1);
		}
	 ans = dup(x);
 	 multInt_(ans,-1);
 	 ans=expand(ans,ans.length+2);
 	 multInt_(ans,n);
	 multInt_(ans,-1);
	 return  (n > 0) ? trim(ans,0) : trim(ans,1);
}
// max |n| BIG
function divInt(x,n) {
	if(n === 1)  return dup(x);
 	var ans ;
 	if(!(negative(x))) {
 		ans=dup(x);
 		if(n > 0) {
			divInt_(ans,n);
			return trim(ans,1);
		   }
		   else {
		   divInt_(ans,-n);
		   multInt_(ans,-1);
		   return trim(ans,0);
		   }
		}
		   
	 ans = dup(x);
 	 multInt_(ans,-1);
 	 ans=divInt(ans,n);
	 multInt_(ans,-1);
	 return  (n > 0) ? trim(ans,0) : trim(ans,1);
}


//return (x**y mod n) where x,y,n are bigInts and ** is exponentiation.  0**0=1. Faster for odd n.
function powMod(x,y,n) {
  var ans=expand(x,n.length);  
  powMod_(ans,trim(y,2),trim(n,2),0);  //this should work without the trim, but doesn't
  return trim(ans,1);
}

//return (x-y) for bigInts x and y.  Negative answers will be 2s complement
function sub(x,y) {
  var ans=expand(x,(x.length>y.length ? x.length+1 : y.length+1)); 
  sub_(ans,y);
  return trim(ans,1);
}

//return (x+y) for bigInts x and y.  
function add(x,y) {
  var ans=expand(x,(x.length>y.length ? x.length+1 : y.length+1)); 
  add_(ans,y);
  return trim(ans,1);
}

//return (x**(-1) mod n) for bigInts x and n.  If no inverse exists, it returns null
function inverseMod(x,n) {
  var ans=expand(x,n.length); 
  var s;
  s=inverseMod_(ans,n);
  return s ? trim(ans,1) : null;
}

//return (x*y mod n) for bigInts x,y,n.  For greater speed, let y<x.
function multMod(x,y,n) {
  var ans=expand(x,n.length);
  multMod_(ans,y,n);
  return trim(ans,1);
}

//generate a k-bit true random prime using Maurer's algorithm,
//and put it into ans.  The bigInt ans must be large enough to hold it.
function randTruePrime_(ans,k) {
  var c,m,pm,dd,j,r,B,divisible,z,zz,recSize;

  if (primes.length==0)
    primes=findPrimes(30000);  //check for divisibility by primes <=30000

  if (pows.length==0) {
    pows=new Array(512);
    for (j=0;j<512;j++) {
      pows[j]=Math.pow(2,j/511.-1.);
    }
  }

  //c and m should be tuned for a particular machine and value of k, to maximize speed
  c=0.1;  //c=0.1 in HAC
  m=20;   //generate this k-bit number by first recursively generating a number that has between k/2 and k-m bits
  recLimit=20; //stop recursion when k <=recLimit.  Must have recLimit >= 2

  if (s_i2.length!=ans.length) {
    s_i2=dup(ans);
    s_R =dup(ans);
    s_n1=dup(ans);
    s_r2=dup(ans);
    s_d =dup(ans);
    s_x1=dup(ans);
    s_x2=dup(ans);
    s_b =dup(ans);
    s_n =dup(ans);
    s_i =dup(ans);
    s_rm=dup(ans);
    s_q =dup(ans);
    s_a =dup(ans);
    s_aa=dup(ans);
  }

  if (k <= recLimit) {  //generate small random primes by trial division up to its square root
    pm=(1<<((k+2)>>1))-1; //pm is binary number with all ones, just over sqrt(2^k)
    copyInt_(ans,0);
    for (dd=1;dd;) {
      dd=0;
      ans[0]= 1 | (1<<(k-1)) | Math.floor(Math.random()*(1<<k));  //random, k-bit, odd integer, with msb 1
      for (j=1;(j<primes.length) && ((primes[j]&pm)==primes[j]);j++) { //trial division by all primes 3...sqrt(2^k)
        if (0==(ans[0]%primes[j])) {
          dd=1;
          break;
        }
      }
    }
    carry_(ans);
    return;
  }

  B=c*k*k;    //try small primes up to B (or all the primes[] array if the largest is less than B).
  if (k>2*m)  //generate this k-bit number by first recursively generating a number that has between k/2 and k-m bits
    for (r=1; k-k*r<=m; )
      r=pows[Math.floor(Math.random()*512)];   //r=Math.pow(2,Math.random()-1);
  else
    r=.5;

  //simulation suggests the more complex algorithm using r=.333 is only slightly faster.

  recSize=Math.floor(r*k)+1;

  randTruePrime_(s_q,recSize);
  copyInt_(s_i2,0);
  s_i2[Math.floor((k-2)/bpe)] |= (1<<((k-2)%bpe));   //s_i2=2^(k-2)
  divide_(s_i2,s_q,s_i,s_rm);                        //s_i=floor((2^(k-1))/(2q))

  z=bitSize(s_i);

  for (;;) {
    for (;;) {  //generate z-bit numbers until one falls in the range [0,s_i-1]
      randBigInt_(s_R,z,0);
      if (greater(s_i,s_R))
        break;
    }                //now s_R is in the range [0,s_i-1]
    addInt_(s_R,1);  //now s_R is in the range [1,s_i]
    add_(s_R,s_i);   //now s_R is in the range [s_i+1,2*s_i]

    copy_(s_n,s_q);
    mult_(s_n,s_R); 
    multInt_(s_n,2);
    addInt_(s_n,1);    //s_n=2*s_R*s_q+1
    
    copy_(s_r2,s_R);
    multInt_(s_r2,2);  //s_r2=2*s_R

    //check s_n for divisibility by small primes up to B
    for (divisible=0,j=0; (j<primes.length) && (primes[j]<B); j++)
      if (modInt(s_n,primes[j])==0 && !equalsInt(s_n,primes[j])) {
        divisible=1;
        break;
      }      

    if (!divisible)    //if it passes small primes check, then try a single Miller-Rabin base 2
      if (!millerRabinInt(s_n,2)) //this line represents 75% of the total runtime for randTruePrime_ 
        divisible=1;

    if (!divisible) {  //if it passes that test, continue checking s_n
      addInt_(s_n,-3);
      for (j=s_n.length-1;(s_n[j]==0) && (j>0); j--);  //strip leading zeros
      for (zz=0,w=s_n[j]; w; (w>>=1),zz++);
      zz+=bpe*j;                             //zz=number of bits in s_n, ignoring leading zeros
      for (;;) {  //generate z-bit numbers until one falls in the range [0,s_n-1]
        randBigInt_(s_a,zz,0);
        if (greater(s_n,s_a))
          break;
      }                //now s_a is in the range [0,s_n-1]
      addInt_(s_n,3);  //now s_a is in the range [0,s_n-4]
      addInt_(s_a,2);  //now s_a is in the range [2,s_n-2]
      copy_(s_b,s_a);
      copy_(s_n1,s_n);
      addInt_(s_n1,-1);
      powMod_(s_b,s_n1,s_n);   //s_b=s_a^(s_n-1) modulo s_n
      addInt_(s_b,-1);
      if (isZero(s_b)) {
        copy_(s_b,s_a);
        powMod_(s_b,s_r2,s_n);
        addInt_(s_b,-1);
        copy_(s_aa,s_n);
        copy_(s_d,s_b);
        GCD_(s_d,s_n);  //if s_b and s_n are relatively prime, then s_n is a prime
        if (equalsInt(s_d,1)) {
          copy_(ans,s_aa);
          return;     //if we've made it this far, then s_n is absolutely guaranteed to be prime
        }
      }
    }
  }
}

//Return an n-bit random BigInt (n>=1).  If s=1, then the most significant of those n bits is set to 1.
function randBigInt(n,s) {
  var a,b;
  a=Math.floor((n-1)/bpe)+2; //# array elements to hold the BigInt with a leading 0 element
  b=int2bigInt(0,0,a);
  randBigInt_(b,n,s);
  return b;
}

//Set b to an n-bit random BigInt.  If s=1, then the most significant of those n bits is set to 1.
//Array b must be big enough to hold the result. Must have n>=1
function randBigInt_(b,n,s) {
  var i,a;
  for (i=0;i<b.length;i++)
    b[i]=0;
  a=Math.floor((n-1)/bpe)+1; //# array elements to hold the BigInt
  for (i=0;i<a;i++) {
    b[i]=Math.floor(Math.random()*(1<<(bpe-1)));
  }
  b[a-1] &= (2<<((n-1)%bpe))-1;
  if (s==1)
    b[a-1] |= (1<<((n-1)%bpe));
}

//Return the greatest common divisor of bigInts x and y (each with same number of elements).
function GCD(x,y) {
var i, tmp;
  var xc = trim(x,1) ; // a copy
  var yc = trim(y,1);
  if(yc.length < xc.length) for( i = yc.length; i < xc.length; i++ ) yc[i]= 0;
  if(xc.length < yc.length) for( i = xc.length; i < yc.length; i++ ) xc[i]= 0;
  
  // check y > x
  for(i = xc.length-1; i>=0 ; i--) {
  			if(xc[i] > yc[i]) break;
  			if(yc[i] > xc[i]) {
  			tmp = yc;
  			yc = xc;
  			xc= tmp;
  			break;
  			}}
  	
  GCD_(xc,yc);
  return xc;
}

//set x to the greatest common divisor of bigInts x and y (each with same number of elements).
//y is destroyed.
function GCD_(x,y) {
  var i,xp,yp,A,B,C,D,q,sing;
  if (T.length!=x.length)
    T=dup(x);

  sing=1;
  while (sing) { //while y has nonzero elements other than y[0]
    sing=0;
    for (i=1;i<y.length;i++) //check if y has nonzero elements other than 0
      if (y[i]) {
        sing=1;
        break;
      }
    if (!sing) break; //quit when y all zero elements except possibly y[0]

    for (i=x.length;!x[i] && i>=0;i--);  //find most significant element of x
    xp=x[i];
    yp=y[i];
    A=1; B=0; C=0; D=1;
    while ((yp+C) && (yp+D)) {
      q =Math.floor((xp+A)/(yp+C));
      qp=Math.floor((xp+B)/(yp+D));
      if (q!=qp)
        break;
      t= A-q*C;   A=C;   C=t;    //  do (A,B,xp, C,D,yp) = (C,D,yp, A,B,xp) - q*(0,0,0, C,D,yp)      
      t= B-q*D;   B=D;   D=t;
      t=xp-q*yp; xp=yp; yp=t;
    }
    if (B) {
      copy_(T,x);
      linComb_(x,y,A,B); //x=A*x+B*y
      linComb_(y,T,D,C); //y=D*y+C*T
    } else {
      mod_(x,y);
      copy_(T,x);
      copy_(x,y);
      copy_(y,T);
    } 
  }
  if (y[0]==0)
    return;
  t=modInt(x,y[0]);
  copyInt_(x,y[0]);
  y[0]=t;
  while (y[0]) {
    x[0]%=y[0];
    t=x[0]; x[0]=y[0]; y[0]=t;
  }
}

//do x=x**(-1) mod n, for bigInts x and n.
//If no inverse exists, it sets x to zero and returns 0, else it returns 1.
//The x array must be at least as large as the n array.
function inverseMod_(x,n) {
  var k=1+2*Math.max(x.length,n.length);

  if(!(x[0]&1)  && !(n[0]&1)) {  //if both inputs are even, then inverse doesn't exist
    copyInt_(x,0);
    return 0;
  }

  if (eg_u.length!=k) {
    eg_u=new Array(k);
    eg_v=new Array(k);
    eg_A=new Array(k);
    eg_B=new Array(k);
    eg_C=new Array(k);
    eg_D=new Array(k);
  }

  copy_(eg_u,x);
  copy_(eg_v,n);
  copyInt_(eg_A,1);
  copyInt_(eg_B,0);
  copyInt_(eg_C,0);
  copyInt_(eg_D,1);
  for (;;) {
    while(!(eg_u[0]&1)) {  //while eg_u is even
      halve_(eg_u);
      if (!(eg_A[0]&1) && !(eg_B[0]&1)) { //if eg_A==eg_B==0 mod 2
        halve_(eg_A);
        halve_(eg_B);      
      } else {
        add_(eg_A,n);  halve_(eg_A);
        sub_(eg_B,x);  halve_(eg_B);
      }
    }

    while (!(eg_v[0]&1)) {  //while eg_v is even
      halve_(eg_v);
      if (!(eg_C[0]&1) && !(eg_D[0]&1)) { //if eg_C==eg_D==0 mod 2
        halve_(eg_C);
        halve_(eg_D);      
      } else {
        add_(eg_C,n);  halve_(eg_C);
        sub_(eg_D,x);  halve_(eg_D);
      }
    }

    if (!greater(eg_v,eg_u)) { //eg_v <= eg_u
      sub_(eg_u,eg_v);
      sub_(eg_A,eg_C);
      sub_(eg_B,eg_D);
    } else {                   //eg_v > eg_u
      sub_(eg_v,eg_u);
      sub_(eg_C,eg_A);
      sub_(eg_D,eg_B);
    }
  
    if (equalsInt(eg_u,0)) {
      if (negative(eg_C)) //make sure answer is nonnegative
        add_(eg_C,n);
      copy_(x,eg_C);

      if (!equalsInt(eg_v,1)) { //if GCD_(x,n)!=1, then there is no inverse
        copyInt_(x,0);
        return 0;
      }
      return 1;
    }
  }
}

//return x**(-1) mod n, for integers x and n.  Return 0 if there is no inverse
function inverseModInt(x,n) {
  var a=1,b=0,t;
  for (;;) {
    if (x==1) return a;
    if (x==0) return 0;
    b-=a*Math.floor(n/x);
    n%=x;

    if (n==1) return b; //to avoid negatives, change this b to n-b, and each -= to +=
    if (n==0) return 0;
    a-=b*Math.floor(x/n);
    x%=n;
  }
}

//this deprecated function is for backward compatibility only. 
function inverseModInt_(x,n) {
   return inverseModInt(x,n);
}


//Given positive bigInts x and y, change the bigints v, a, and b to positive bigInts such that:
//     v = GCD_(x,y) = a*x-b*y
//The bigInts v, a, b, must have exactly as many elements as the larger of x and y.
function eGCD_(x,y,v,a,b) {
  var g=0;
  var k=Math.max(x.length,y.length);
  if (eg_u.length!=k) {
    eg_u=new Array(k);
    eg_A=new Array(k);
    eg_B=new Array(k);
    eg_C=new Array(k);
    eg_D=new Array(k);
  }
  while(!(x[0]&1)  && !(y[0]&1)) {  //while x and y both even
    halve_(x);
    halve_(y);
    g++;
  }
  copy_(eg_u,x);
  copy_(v,y);
  copyInt_(eg_A,1);
  copyInt_(eg_B,0);
  copyInt_(eg_C,0);
  copyInt_(eg_D,1);
  for (;;) {
    while(!(eg_u[0]&1)) {  //while u is even
      halve_(eg_u);
      if (!(eg_A[0]&1) && !(eg_B[0]&1)) { //if A==B==0 mod 2
        halve_(eg_A);
        halve_(eg_B);      
      } else {
        add_(eg_A,y);  halve_(eg_A);
        sub_(eg_B,x);  halve_(eg_B);
      }
    }

    while (!(v[0]&1)) {  //while v is even
      halve_(v);
      if (!(eg_C[0]&1) && !(eg_D[0]&1)) { //if C==D==0 mod 2
        halve_(eg_C);
        halve_(eg_D);      
      } else {
        add_(eg_C,y);  halve_(eg_C);
        sub_(eg_D,x);  halve_(eg_D);
      }
    }

    if (!greater(v,eg_u)) { //v<=u
      sub_(eg_u,v);
      sub_(eg_A,eg_C);
      sub_(eg_B,eg_D);
    } else {                //v>u
      sub_(v,eg_u);
      sub_(eg_C,eg_A);
      sub_(eg_D,eg_B);
    }
    if (equalsInt(eg_u,0)) {
      if (negative(eg_C)) {   //make sure a (C)is nonnegative
        add_(eg_C,y);
        sub_(eg_D,x);
      }
      multInt_(eg_D,-1);  ///make sure b (D) is nonnegative
      copy_(a,eg_C);
      copy_(b,eg_D);
      leftShift_(v,g);
      return;
    }
  }
}


//is bigInt x negative?
function negative(x) {
  return ((x[x.length-1]>>(bpe-1))&1);
}

function negate(x) {
  var n = dup(x);
  multInt_(n, -1);
  return n ;
}



//is (x << (shift*bpe)) > y?
//x and y are nonnegative bigInts
//shift is a nonnegative integer
function greaterShift(x,y,shift) {
  var i, kx=x.length, ky=y.length;
  k=((kx+shift)<ky) ? (kx+shift) : ky;
  for (i=ky-1-shift; i<kx && i>=0; i++) 
    if (x[i]>0)
      return 1; //if there are nonzeros in x to the left of the first column of y, then x is bigger
  for (i=kx-1+shift; i<ky; i++)
    if (y[i]>0)
      return 0; //if there are nonzeros in y to the left of the first column of x, then x is not bigger
  for (i=k-1; i>=shift; i--)
    if      (x[i-shift]>y[i]) return 1;
    else if (x[i-shift]<y[i]) return 0;
  return 0;
}

//is x > y? (x and y both nonnegative)
function greater(x,y) {
  var i;
  var k=(x.length<y.length) ? x.length : y.length;

  for (i=x.length;i<y.length;i++)
    if (y[i])
      return 0;  //y has more digits

  for (i=y.length;i<x.length;i++)
    if (x[i])
      return 1;  //x has more digits

  for (i=k-1;i>=0;i--)
    if (x[i]>y[i])
      return 1;
    else if (x[i]<y[i])
      return 0;
  return 0;
}

// x > y ? (any sign)
function gt(x,y) {
	if(negative(x)) {
		if (negative(y)) return gt(negate(y),negate(x));
		return false;
		}
	if(negative(y)) return true;
	return (greater(x,y) !== 0) ;
}
function ge(x,y) {
	if(equals(x,y)) return true;
	return gt(x,y);
	}

//divide x by y giving quotient q and remainder r.  (q=floor(x/y),  r=x mod y).  All 4 are bigints.
//x must have at least one leading zero element.
//y must be nonzero.
//q and r must be arrays that are exactly the same length as x. (Or q can have more).
//Must have x.length >= y.length >= 2.
function divide_(x,y,q,r) {
  var kx, ky;
  var i,j,y1,y2,c,a,b;
  copy_(r,x);
  for (ky=y.length;y[ky-1]==0;ky--); //ky is number of elements in y, not including leading zeros

  //normalize: ensure the most significant element of y has its highest bit set  
  b=y[ky-1];
  for (a=0; b; a++)
    b>>=1;  
  a=bpe-a;  //a is how many bits to shift so that the high order bit of y is leftmost in its array element
  leftShift_(y,a);  //multiply both by 1<<a now, then divide both by that at the end
  leftShift_(r,a);

  //Rob Visser discovered a bug: the following line was originally just before the normalization.
  for (kx=r.length;r[kx-1]==0 && kx>ky;kx--); //kx is number of elements in normalized x, not including leading zeros

  copyInt_(q,0);                      // q=0
  while (!greaterShift(y,r,kx-ky)) {  // while (leftShift_(y,kx-ky) <= r) {
    subShift_(r,y,kx-ky);             //   r=r-leftShift_(y,kx-ky)
    q[kx-ky]++;                       //   q[kx-ky]++;
  }                                   // }

  for (i=kx-1; i>=ky; i--) {
    if (r[i]==y[ky-1])
      q[i-ky]=mask;
    else
      q[i-ky]=Math.floor((r[i]*radix+r[i-1])/y[ky-1]);	

    //The following for(;;) loop is equivalent to the commented while loop, 
    //except that the uncommented version avoids overflow.
    //The commented loop comes from HAC, which assumes r[-1]==y[-1]==0
    //  while (q[i-ky]*(y[ky-1]*radix+y[ky-2]) > r[i]*radix*radix+r[i-1]*radix+r[i-2])
    //    q[i-ky]--;    
    for (;;) {
      y2=(ky>1 ? y[ky-2] : 0)*q[i-ky];
      c=y2>>bpe;
      y2=y2 & mask;
      y1=c+q[i-ky]*y[ky-1];
      c=y1>>bpe;
      y1=y1 & mask;

      if (c==r[i] ? y1==r[i-1] ? y2>(i>1 ? r[i-2] : 0) : y1>r[i-1] : c>r[i]) 
        q[i-ky]--;
      else
        break;
    }

    linCombShift_(r,y,-q[i-ky],i-ky);    //r=r-q[i-ky]*leftShift_(y,i-ky)
    if (negative(r)) {
      addShift_(r,y,i-ky);         //r=r+leftShift_(y,i-ky)
      q[i-ky]--;
    }
  }

  rightShift_(y,a);  //undo the normalization step
  rightShift_(r,a);  //undo the normalization step
}

//do carries and borrows so each element of the bigInt x fits in bpe bits.
function carry_(x) {
  var i,k,c,b;
  k=x.length;
  c=0;
  for (i=0;i<k;i++) {
    c+=x[i];
    b=0;
    if (c<0) {
      b=-(c>>bpe);
      c+=b*radix;
    }
    x[i]=c & mask;
    c=(c>>bpe)-b;
  }
}

//return x mod n for bigInt x and integer n.
function modInt(x,n) {
 var i,c=0;
  if(n < 0) n = -n;
  if(negative(x)) {
  					var y = dup(x);
  					multInt_(y,-1);
  					 for (i=y.length-1; i>=0; i--)
    				c=(c*radix+y[i])%n;
    				return c;
    				}
  for (i=x.length-1; i>=0; i--)
    c=(c*radix+x[i])%n;
  return c;
}

// convert bigint to js number
function toFloat(x) {
var i,f=0, p= 1,  kx ;
	if(negative(x)) return - toFloat(negate(x)) ;
	//kx is number of elements in x, not including leading zeros
	for (kx=x.length;x[kx-1] === 0;kx--); 
//console.log("kx",kx,"lg",x.length);
	for (i=0; i< kx ; i++) {
		f += p * x[i]; // mask ??
		p *= radix; // OVFLOW NaN if tooo many digits
	}
//console.log("TOFLOAT",x,f) ;
	return f;
}

//convert the integer t into a bigInt with at least the given number of bits.
//the returned array stores the bigInt in bpe-bit chunks, little endian (buff[0] is least significant word)
//Pad the array with leading zeros so that it has at least minSize elements.
//There will always be at least one leading 0 element.
function int2bigInt(t,bits,minSize) {   
  var i,k,buff;
  k=Math.ceil(bits/bpe)+1;
  k=minSize>k ? minSize : k;
  buff=new Array(k);
  copyInt_(buff,t);
  return buff;
}

//return the bigInt given a string representation in a given base.  
//Pad the array with leading zeros so that it has at least minSize elements.
//If base=-1, then it reads in a space-separated list of array elements in decimal.
//The array will always have at least one leading zero, unless base=-1.
function str2bigInt(s,base,minSize) {
  var d, i, j, x, y, kk;
  var k=s.length;
/*
  if (base==-1) { //comma-separated list of array elements in decimal
    x=new Array(0);
    for (;;) {
      y=new Array(x.length+1);
      for (i=0;i<x.length;i++)
        y[i+1]=x[i];
      y[0]=parseInt(s,10);
      x=y;
      d=s.indexOf(',',0);
      if (d<1) 
        break;
      s=s.substring(d+1);
      if (s.length==0)
        break;
    }
    if (x.length<minSize) {
      y=new Array(minSize);
      copy_(y,x);
      return y;
    }
    return x;
  }
*/
  
  /* 123e100 or 1223e+66  must be accepted */
  // float exponent
  var zeroes = 0;
  var e = s.indexOf("e");
  		if(e > -1) {zeroes = parseInt(s.substring(e+1));  s = s.substring(0,e); }
 	if(zeroes < 0) zeroes = 0; // ill-formed
  	while(zeroes--) s += "0"  ;
   // end of e+12 exponent
   
  k = s.length;
  x=int2bigInt(0,base*k,0);
  for (i=0;i<k;i++) {
    d=digitsStr.indexOf(s.substring(i,i+1),0);
    if (base<=36 && d>=36)  //convert lowercase to uppercase if base<=36
      d-=26;
    if (d>=base || d<0) {   //stop at first illegal character (eg ".")
      break;
    }
    multInt_(x,base);
    addInt_(x,d);
  }

  for (k=x.length;k>0 && !x[k-1];k--); //strip off leading zeros
  k=minSize>k+1 ? minSize : k+1;
  y=new Array(k);
  kk=k<x.length ? k : x.length;
  for (i=0;i<kk;i++)
    y[i]=x[i];
  for (;i<k;i++)
    y[i]=0;
  return y;
}


//is bigint x equal to integer y?
//y must have less than bpe bits
function equalsInt(x,y) {
  var i;
  if (x[0]!=y)
    return 0;
  for (i=1;i<x.length;i++)
    if (x[i])
      return 0;
  return 1;
}

//are bigints x and y equal?
//this works even if x and y are different lengths and have arbitrarily many leading zeros
function equals(x,y) {
  var i;
  var k=x.length<y.length ? x.length : y.length;
  for (i=0;i<k;i++)
    if (x[i]!=y[i])
      return 0;
  if (x.length>y.length) {
    for (;i<x.length;i++)
      if (x[i])
        return 0;
  } else {
    for (;i<y.length;i++)
      if (y[i])
        return 0;
  }
  return 1;
}

//is the bigInt x equal to zero?
function isZero(x) {
  var i;
  for (i=0;i<x.length;i++)
    if (x[i])
      return 0;
  return 1;
}

// convert a bigInt into a string in a given base, from base 2 up to base 95.
// Base -1 prints the contents of the array representing the number.
// limit to 5000 low-digits
function bigInt2str(x,base) {
  var i,t,out = [];
// console.log("bigInt2Str",x.length,radix);
  if (s6.length!=x.length) 
    s6=dup(x);
  else
    copy_(s6,x);

  if (base==-1) { //return the list of array contents
  	var s = "";
    for (i=x.length-1;i>0;i--)
      s+=x[i]+',';
    s+=x[0];
    return s ;
  }
  
   //return it in the given base (small digits first)
    while (!isZero(s6)) { // O(n^2) !!!
      t=divInt_(s6,base);  //t :=s6 % base; s6 := floor(s6/base);
      out.unshift (digitsStr.substring(t,t+1));
    
// 1e100000 70 sec
     if(out.length > 50004) {
     				writeln("BigInt: too many digits (> 50000) to print ...", "color:orange") ;
     				out.unshift("...");
     				break;
     				}
    }
  
  if (out.length === 0) return "0" ;
  return out.join("") ;
}

// returns the number of digits base 10
function bigInt2length(x,base) {
  var i,t, digits=0, last ;
// console.log("bigInt2Str",x.length,radix);
//base = 10000 ; // !!!!!!

  if (s6.length!=x.length) 
    s6=dup(x);
  else
    copy_(s6,x);
  if(isZero(s6)) return 1;
  
  	if(x.length > 10000) {
  		base = 10000 ;
  		 while (!isZero(s6)) {
  		 	 last = s6[0];
     		 divInt_(s6,base);  //t= s6 % base; s6=floor(s6/base);
      		 digits++ ;
    		}
    last = '' + last;
    digits = (digits-1) * 4 +  last.length;
    return digits;
  	} // length > 10000

    while (!isZero(s6)) {
      divInt_(s6,base);  //t=s6 % base; s6=floor(s6/base);
      digits++ ;
    }
  return digits ;
}


//returns a duplicate of bigInt x
function dup(x) {
  var i;
  buff=new Array(x.length);
  copy_(buff,x);
  return buff;
}

//do x=y on bigInts x and y.  x must be an array at least as big as y (not counting the leading zeros in y).
function copy_(x,y) {
  var i;
  var k=x.length<y.length ? x.length : y.length;
  for (i=0;i<k;i++)
    x[i]=y[i];
  for (i=k;i<x.length;i++)
    x[i]=0;
}

//do x=y on bigInt x and integer n.  
function copyInt_(x,n) {
  var i,c;
  for (c=n,i=0;i<x.length;i++) {
    x[i]=c & mask;
    c>>=bpe;
  }
}

// compare bigInt any sign and integer (any sign) 
function cmpInt(x,n) {
  var i,c,y, cmp = 0 ;
  if(negative(x)) {
  	if(n >= 0) return -1;
  	return - cmpInt(negate(x),-n);
  }
  if(n < 0) return 1;
  
 for (c=n,i=0;i<x.length;i++) {
 	if(c === 0 && x[i]) return 1;
 	y = c & mask;
 	if(y > x[i]) cmp = -1;
 	else
 	if(y < x[i]) cmp = 1;
    c>>=bpe;
  }
  if( c > 0) return -1 ;
  return cmp ;
}

//right shift bigInt x by n bits.  0 <= n < bpe.
function rightShift_(x,n) {
  var i;
  var k=Math.floor(n/bpe);
  if (k) {
    for (i=0;i<x.length-k;i++) //right shift x by k elements
      x[i]=x[i+k];
    for (;i<x.length;i++)
      x[i]=0;
    n%=bpe;
  }
  for (i=0;i<x.length-1;i++) {
    x[i]=mask & ((x[i+1]<<(bpe-n)) | (x[i]>>n));
  }
  x[i]>>=n;
}

//do x=floor(|x|/2)*sgn(x) for bigInt x in 2's complement
function halve_(x) {
  var i;
  for (i=0;i<x.length-1;i++) {
    x[i]=mask & ((x[i+1]<<(bpe-1)) | (x[i]>>1));
  }
  x[i]=(x[i]>>1) | (x[i] & (radix>>1));  //most significant bit stays the same
}

//left shift bigInt x by n bits.
function leftShift_(x,n) {
  var i;
  var k=Math.floor(n/bpe);
  if (k) {
    for (i=x.length; i>=k; i--) //left shift x by k elements
      x[i]=x[i-k];
    for (;i>=0;i--)
      x[i]=0;  
    n%=bpe;
  }
  if (!n)
    return;
  for (i=x.length-1;i>0;i--) {
    x[i]=mask & ((x[i]<<n) | (x[i-1]>>(bpe-n)));
  }
  x[i]=mask & (x[i]<<n);
}

//do x=x*n where x is a bigInt and n is an integer.
//x must be large enough to hold the result.
function multInt_(x,n) {
  var i,k,c,b;
  if (!n)
    return;
  k=x.length;
  c=0;
  for (i=0;i<k;i++) {
    c+=x[i]*n;
    b=0;
    if (c<0) {
      b=-(c>>bpe);
      c+=b*radix;
    }
    x[i]=c & mask;
    c=(c>>bpe)-b;
  }
}

//do x=floor(x/n) for bigInt x and integer n, and return the remainder
function divInt_(x,n) {
  var i,r=0,s;
  for (i=x.length-1;i>=0;i--) {
    s=r*radix+x[i];
    x[i]=Math.floor(s/n);
    r=s%n;
  }
  return r;
}

//do the linear combination x=a*x+b*y for bigInts x and y, and integers a and b.
//x must be large enough to hold the answer.
function linComb_(x,y,a,b) {
  var i,c,k,kk;
  k=x.length<y.length ? x.length : y.length;
  kk=x.length;
  for (c=0,i=0;i<k;i++) {
    c+=a*x[i]+b*y[i];
    x[i]=c & mask;
    c>>=bpe;
  }
  for (i=k;i<kk;i++) {
    c+=a*x[i];
    x[i]=c & mask;
    c>>=bpe;
  }
}

//do the linear combination x=a*x+b*(y<<(ys*bpe)) for bigInts x and y, and integers a, b and ys.
//x must be large enough to hold the answer.
function linCombShift_(x,y,b,ys) {
  var i,c,k,kk;
  k=x.length<ys+y.length ? x.length : ys+y.length;
  kk=x.length;
  for (c=0,i=ys;i<k;i++) {
    c+=x[i]+b*y[i-ys];
    x[i]=c & mask;
    c>>=bpe;
  }
  for (i=k;c && i<kk;i++) {
    c+=x[i];
    x[i]=c & mask;
    c>>=bpe;
  }
}

//do x=x+(y<<(ys*bpe)) for bigInts x and y, and integers a,b and ys.
//x must be large enough to hold the answer.
function addShift_(x,y,ys) {
  var i,c,k,kk;
  k=x.length<ys+y.length ? x.length : ys+y.length;
  kk=x.length;
  for (c=0,i=ys;i<k;i++) {
    c+=x[i]+y[i-ys];
    x[i]=c & mask;
    c>>=bpe;
  }
  for (i=k;c && i<kk;i++) {
    c+=x[i];
    x[i]=c & mask;
    c>>=bpe;
  }
}

//do x=x-(y<<(ys*bpe)) for bigInts x and y, and integers a,b and ys.
//x must be large enough to hold the answer.
function subShift_(x,y,ys) {
  var i,c,k,kk;
  k=x.length<ys+y.length ? x.length : ys+y.length;
  kk=x.length;
  for (c=0,i=ys;i<k;i++) {
    c+=x[i]-y[i-ys];
    x[i]=c & mask;
    c>>=bpe;
  }
  for (i=k;c && i<kk;i++) {
    c+=x[i];
    x[i]=c & mask;
    c>>=bpe;
  }
}

//do x=x-y for bigInts x and y.
//x must be large enough to hold the answer.
//negative answers will be 2s complement
function sub_(x,y) {
  var i,c,k,kk;
  k=x.length<y.length ? x.length : y.length;
  for (c=0,i=0;i<k;i++) {
    c+=x[i]-y[i];
    x[i]=c & mask;
    c>>=bpe;
  }
  for (i=k;c && i<x.length;i++) {
    c+=x[i];
    x[i]=c & mask;
    c>>=bpe;
  }
}


//do x=x-n where x is a bigInt and n is an integer > 0
//x must be large enough to hold the result.
function subInt_(x,n) {
  var i,k,c,b;
  k=x.length;
  c=-n;
  for (i=0;i<k;i++) {
     c+=x[i];
    x[i]=c & mask;
    c>>=bpe;
  }
     for (i=k;c && i<x.length;i++) {
    c+=x[i];
    x[i]=c & mask;
    c>>=bpe;
  }
}


//do x=x+y for bigInts x and y.
//x must be large enough to hold the answer.
function add_(x,y) {
  var i,c,k,kk;
  k=x.length<y.length ? x.length : y.length;
  for (c=0,i=0;i<k;i++) {
    c+=x[i]+y[i];
    x[i]=c & mask;
    c>>=bpe;
  }
  for (i=k;c && i<x.length;i++) {
    c+=x[i];
    x[i]=c & mask;
    c>>=bpe;
  }
}

//do x=x+n where x is a bigInt > 0 and n is an integer > 0
//x must be large enough to hold the result.
function addInt_(x,n) {
  var i,k,c,b;
  x[0]+=n;
  k=x.length;
  c=0;
  for (i=0;i<k;i++) {
    c+=x[i];
    b=0;
    if (c<0) {
      b=-(c>>bpe);
      c+=b*radix;
    }
    x[i]=c & mask;
    c=(c>>bpe)-b;
    if (!c) return; //stop carrying as soon as the carry is zero
  }
}

//do x=x*y for bigInts x and y.  This is faster when y<x.
function mult_(x,y) {
  var i;
  if (ss.length!=2*x.length)
    ss=new Array(2*x.length);
  copyInt_(ss,0);
  for (i=0;i<y.length;i++)
    if (y[i])
      linCombShift_(ss,x,y[i],i);   //ss=1*ss+y[i]*(x<<(i*bpe))
  copy_(x,ss);
}

//do x=x mod n for bigInts x and n.
function mod_(x,n) {
  if (s4.length!=x.length)
    s4=dup(x);
  else
    copy_(s4,x);
  if (s5.length!=x.length)
    s5=dup(x);  
  divide_(s4,n,s5,x);  //x = remainder of s4 / n
}

//do x=x*y mod n for bigInts x,y,n.
//for greater speed, let y<x.
function multMod_(x,y,n) {
  var i;
  if (s0.length!=2*x.length)
    s0=new Array(2*x.length);
  copyInt_(s0,0);
  for (i=0;i<y.length;i++)
    if (y[i])
      linCombShift_(s0,x,y[i],i);   //s0=1*s0+y[i]*(x<<(i*bpe))
  mod_(s0,n);
  copy_(x,s0);
}

//do x=x*x mod n for bigInts x,n.
function squareMod_(x,n) {
  var i,j,d,c,kx,kn,k;
  for (kx=x.length; kx>0 && !x[kx-1]; kx--);  //ignore leading zeros in x
  k=kx>n.length ? 2*kx : 2*n.length; //k=# elements in the product, which is twice the elements in the larger of x and n
  if (s0.length!=k) 
    s0=new Array(k);
  copyInt_(s0,0);
  for (i=0;i<kx;i++) {
    c=s0[2*i]+x[i]*x[i];
    s0[2*i]=c & mask;
    c>>=bpe;
    for (j=i+1;j<kx;j++) {
      c=s0[i+j]+2*x[i]*x[j]+c;
      s0[i+j]=(c & mask);
      c>>=bpe;
    }
    s0[i+kx]=c;
  }
  mod_(s0,n);
  copy_(x,s0);
}

//return x with exactly k leading zero elements
function trim(x,k) {
  var i,y;
  for (i=x.length; i>0 && !x[i-1]; i--);
  y=new Array(i+k);
  copy_(y,x);
  return y;
}


//do x=x**y mod n, where x,y,n are bigInts and ** is exponentiation.  0**0=1.
//this is faster when n is odd.  x usually needs to have as many elements as n.
function powMod_(x,y,n) {
  var k1,k2,kn,np;
  if(s7.length!=x.length) // n hours lib bogue : n.length
    s7=dup(x);

  //for even modulus, use a simple square-and-multiply algorithm,
  //rather than using the more complex Montgomery algorithm.
  
//  if ((n[0]&1)==0) {

    copy_(s7,x); // s7 = base
    copyInt_(x,1); // x = result
    while(!equalsInt(y,0)) {
      if (y[0]&1) // y = exp
        multMod_(x,s7,n);
      divInt_(y,2);
      squareMod_(s7,n); 
    }
  
    return;
  }
/*
  //calculate np from n for the Montgomery multiplications
  
   if(s7.length!=n.length) // n hours lib bogue : n.length
    s7=dup(n);

  copyInt_(s7,0);
  for (kn=n.length;kn>0 && !n[kn-1];kn--);
  np=radix-inverseModInt(modInt(n,radix),radix);
  s7[kn]=1;
  multMod_(x ,s7,n);   // x = x * 2**(kn*bp) mod n

  if (s3.length!=x.length)
    s3=dup(x);
  else
    copy_(s3,x);

  for (k1=y.length-1;k1>0 & !y[k1]; k1--);  //k1=first nonzero element of y
  if (y[k1]==0) {  //anything to the 0th power is 1
    copyInt_(x,1);
    return;
  }
  for (k2=1<<(bpe-1);k2 && !(y[k1] & k2); k2>>=1);  //k2=position of first 1 bit in y[k1]
  for (;;) {
    if (!(k2>>=1)) {  //look at next bit of y
      k1--;
      if (k1<0) {
        mont_(x,one,n,np);
        return;
      }
      k2=1<<(bpe-1);
    }    
    mont_(x,x,n,np);

    if (k2 & y[k1]) //if next bit is a 1
      mont_(x,s3,n,np);
  }
}
*/

//do x=x*y*Ri mod n for bigInts x,y,n, 
//  where Ri = 2**(-kn*bpe) mod n, and kn is the 
//  number of elements in the n array, not 
//  counting leading zeros.  
//x array must have at least as many elemnts as the n array
//It's OK if x and y are the same variable.
//must have:
//  x,y < n
//  n is odd
//  np = -(n^(-1)) mod radix
function mont_(x,y,n,np) {
  var i,j,c,ui,t,ks;
  var kn=n.length;
  var ky=y.length;

  if (sa.length!=kn)
    sa=new Array(kn);
    
  copyInt_(sa,0);

  for (;kn>0 && n[kn-1]==0;kn--); //ignore leading zeros of n
  for (;ky>0 && y[ky-1]==0;ky--); //ignore leading zeros of y
  ks=sa.length-1; //sa will never have more than this many nonzero elements.  

  //the following loop consumes 95% of the runtime for randTruePrime_() and powMod_() for large numbers
  for (i=0; i<kn; i++) {
    t=sa[0]+x[i]*y[0];
    ui=((t & mask) * np) & mask;  //the inner "& mask" was needed on Safari (but not MSIE) at one time
    c=(t+ui*n[0]) >> bpe;
    t=x[i];
    
    //do sa=(sa+x[i]*y+ui*n)/b   where b=2**bpe.  Loop is unrolled 5-fold for speed
    j=1;
    for (;j<ky-4;) { c+=sa[j]+ui*n[j]+t*y[j];   sa[j-1]=c & mask;   c>>=bpe;   j++;
                     c+=sa[j]+ui*n[j]+t*y[j];   sa[j-1]=c & mask;   c>>=bpe;   j++;
                     c+=sa[j]+ui*n[j]+t*y[j];   sa[j-1]=c & mask;   c>>=bpe;   j++;
                     c+=sa[j]+ui*n[j]+t*y[j];   sa[j-1]=c & mask;   c>>=bpe;   j++;
                     c+=sa[j]+ui*n[j]+t*y[j];   sa[j-1]=c & mask;   c>>=bpe;   j++; }    
    for (;j<ky;)   { c+=sa[j]+ui*n[j]+t*y[j];   sa[j-1]=c & mask;   c>>=bpe;   j++; }
    for (;j<kn-4;) { c+=sa[j]+ui*n[j];          sa[j-1]=c & mask;   c>>=bpe;   j++;
                     c+=sa[j]+ui*n[j];          sa[j-1]=c & mask;   c>>=bpe;   j++;
                     c+=sa[j]+ui*n[j];          sa[j-1]=c & mask;   c>>=bpe;   j++;
                     c+=sa[j]+ui*n[j];          sa[j-1]=c & mask;   c>>=bpe;   j++;
                     c+=sa[j]+ui*n[j];          sa[j-1]=c & mask;   c>>=bpe;   j++; }  
    for (;j<kn;)   { c+=sa[j]+ui*n[j];          sa[j-1]=c & mask;   c>>=bpe;   j++; }   
    for (;j<ks;)   { c+=sa[j];                  sa[j-1]=c & mask;   c>>=bpe;   j++; }  
    sa[j-1]=c & mask;
  }

  if (!greater(n,sa))
    sub_(sa,n);
  copy_(x,sa);
}
////////////////////////////////////////////////////////////////////////////////////////
// the following work on bigints i.e Array of digits base bpe
//////////////////////////////////
module.toFloat = toFloat;
module.infinity = infinity;
module.nextPrime = nextPrime;
module.isPrime = isPrime;
module.factorShank = factorShank;
module.sqrt = sqrt;
module.randPrime = randPrime;
module.random = randBigInt ;
module.goldbach = goldbach;
module.rho = rho;
module.isOdd = isOdd;

// bigInt  add(x,y)               //return (x+y) for bigInts x and y.
module.add = add;

// bigInt  addInt(x,n)            //return (x+n) where x is a bigInt in Z and n is an integer in Z
module.addInt = addInt;			  // patched
module.subInt = subInt;			  // added's
module.cmpInt = cmpInt;
module.divInt = divInt;
module.modInt = modInt;


// n must be < 32000*32000 (JSInteger)
module.mulInt = function(x,n) {

				if(Math.abs(n) <= 32000) return mulInt(x,n);
				var ay = int2bigInt(Math.abs(n),0,4);
				if(!negative(x)) return (n >= 0) ? mult(x,ay)  : negate(mult(x,ay)); 
				var ax = negate(x);
				return (n >= 0) ?  negate(mult(ax,ay)) : mult(ax,ay) ;
				}

// string  bigInt2str(x,base)     //return a string form of bigInt x in a given base, with 2 <= base <= 95
module.bigInt2str = bigInt2str;
module.bigInt2length = bigInt2length; // number of digits in base

// int     bitSize(x)             //return how many bits long the bigInt x is, not counting leading zeros
module.bitSize = bitSize;

// bigInt  dup(x)                 //return a copy of bigInt x
module.dup = dup;

// boolean equals(x,y)            //is the bigInt x equal to the bigint y?
module.equals = function(x, y) {
  return (equals(x, y) != 0);
};

// boolean equalsInt(x,y)         //is bigint x equal to integer y?
module.equalsInt = equalsInt;

// bigInt  expand(x,n)            //return a copy of x with at least n elements, adding leading zeros if needed
module.expand = expand;

// Array   findPrimes(n)          //return array of all primes less than integer n
module.findPrimes = findPrimes;

// bigInt  GCD(x,y)               //return greatest common divisor of bigInts x and y (each with same number of elements).
module.GCD = GCD;

// boolean greater(x,y)           //is x>y?  (x and y are nonnegative bigInts)
module.greater = function(x, y) { return (greater(x, y) != 0); };
module.gt = gt ; // any sign
module.greaterOrEqual = function(x, y) { return (module.greater(x, y) || module.equals(x, y));};
module.ge = ge ; // any sign

// boolean greaterShift(x,y,shift)//is (x <<(shift*bpe)) > y?
module.greaterShift = greaterShift;

// bigInt  int2bigInt(t,n,m)      //return a bigInt equal to integer t, with at least n bits and m array elements
module.int2bigInt = int2bigInt;

// bigInt  inverseMod(x,n)        //return (x**(-1) mod n) for bigInts x and n.  If no inverse exists, it returns null
module.inverseMod = inverseMod;

// int     inverseModInt(x,n)     //return x**(-1) mod n, for integers x and n.  Return 0 if there is no inverse
module.inverseModInt = inverseModInt;

// boolean isZero(x)              //is the bigInt x equal to zero?
module.isZero = function(x) {
  return (isZero(x) != 0);
};

// boolean millerRabin(x,b)       //does one round of Miller-Rabin base integer b say that bigInt x is possibly prime? (b is bigInt, 1<b<x)
module.millerRabin = millerRabin;

// boolean millerRabinInt(x,b)    //does one round of Miller-Rabin base integer b say that bigInt x is possibly prime? (b is int,    1<b<x)
module.millerRabinInt = millerRabinInt;

// bigInt  mod(x,n)               //return a new bigInt equal to (x mod n) for bigInts x and n.
module.mod = mod;

// int     modInt(x,n)            //return x mod n for bigInt x (any sign) and integer n (any sign).
module.modInt = modInt;

// bigInt  mult(x,y)              //return x*y for bigInts x and y. This is faster when y<x.
module.mult = mult;

// bigInt  multMod(x,y,n)         //return (x*y mod n) for bigInts x,y,n.  For greater speed, let y<x.
module.multMod = multMod;

// boolean negative(x)            //is bigInt x negative?
module.isNegative = function(x) { return (negative(x) !== 0); }; // really < 0
module.isPositive = function(x) { return (negative(x) === 0); };

// bigInt  powMod(x,y,n)          //return (x**y mod n) where x,y,n are bigInts and ** is exponentiation.  0**0=1. Faster for odd n.
module.powMod = powMod;

// bigInt  randBigInt(n,s)        //return an n-bit random BigInt (n>=1).  If s=1, then the most significant of those n bits is set to 1.
module.randBigInt = randBigInt;

// bigInt  randTruePrime(k)       //return a new, random, k-bit, true prime bigInt using Maurer's algorithm.
module.randTruePrime = randTruePrime;

// bigInt  randProbPrime(k)       //return a new, random, k-bit, probable prime bigInt (probability it's composite less than 2^-80).
module.randProbPrime = randProbPrime;

// bigInt  str2bigInt(s,b,n,m)    //return a bigInt for number represented in string s in base b with at least n bits and m array elements
module.str2bigInt = str2bigInt;

// bigInt  sub(x,y)               //return (x-y) for bigInts x and y.  Negative answers will be 2s complement
module.sub = function(x, y) {
  return (module.greater(y, x) ? sub(y, x) : sub(x, y));
};

// bigInt  trim(x,k)              //return a copy of x with exactly k leading zero elements
module.trim = trim;

//CJJ
module.mul = mult;
module.clone = dup;
module.equal = module.equals;

module.make = function(v, b) {
  b = b || 10;
  return module.parse(v.toString(), b);
};


module.parse = function(s, b) {
  var isNeg = (s.charAt(0) == '-'), x, i;
  b = b || 10;
  /* usage 33#16 = 33 base 16
  if ((i = s.indexOf('#')) > 0)
  {
    var e = parseInt(s.substring(i + 1, s.length));
    var w = s.substring(isNeg ? 1 : 0, i);
    var n = module.make(w, e);
    s = (isNeg ? "-" : "") + module.stringify(n);
  }
  */
  x = str2bigInt((isNeg ? s.substring(1, s.length) : s), b);
  return (isNeg ? module.neg(x) : x);
};

module.stringify = function(x, b) {
  var isNeg = module.isNegative(x);
  b = b || 10;
  return ((isNeg ? "-" : "") + bigInt2str((isNeg ? module.neg(x) : x), b));
};


module.zero = function() { return module.make(0);};
module.one = function() {return module.make(1);};
module.two = function() {return module.make(2);};
module.three = function() {return module.make(3);};
module.four = function() {return module.make(4);};
module.five = function() {return module.make(5);};
module.six = function() {return module.make(6);};
module.seven = function() {return module.make(7);};
module.eight = function() {return module.make(8);};
module.nine = function() {return module.make(9);};


module.div = function(y, x) {
  var b = module.clone(y);
  var a = module.clone(x);
  var q = module.clone(y);
  var i = module.clone(y);
  divide_(b, a, q, i);
  return module.clone(q);
};

module.integer_div_rest = function(y, x) { // output quotient & rest
  var b = module.clone(y);
  var a = module.clone(x);
  var q = module.clone(y);
  var i = module.clone(y);
  divide_(b, a, q, i);
  return {q: module.clone(q), r: module.clone(i)} ;
};

module.powInt = function(x, e) {
  var n , t;
  if( e === 1) return x;
  if (e > 1)
  {
    var p = (module.isNegative(x) ? module.neg(x) : module.clone(x)), c = module.clone(p);
// console.log("expt", e);
	if( e & 1) {
		n = e >> 1 ;
		t = module.powInt(p , n);
		t = module.mul(t , t);
		p = module.mul(t , c);
	}
	else {
		n = e >> 1 ;
		t = module.powInt(p , n);
		p = module.mul(t , t);
	}
/*
    while (n > 1) // awful
    {
      p = module.mul(p, c);
      n--;
    }
*/

    return ((module.isNegative(x) && ((e % 2) !== 0)) ? module.neg(p) : p);
  }
  else
    return module.one();
};

module.neg = function(x) {
  var n = module.clone(x);
  return (multInt_(n, -1), n);
};

module.even = function(x) {
	return x[0] & 1 ? false : true;
	}
	
module.odd = function(x) {
	return x[0] & 1 ? true : false;
	}


return module;
})({ });


/////////////////////////////
// INTERFACE with GLISP
// the following work on Integer objects
/////////////////////////////
var __FACT = [] ;
function Inew(bigint) { // returns Integer iff necessary, else a JSInteger
}

// converts and alloc a new Integer
function Integer(v, b)
{  
  if(Array.isArray(v))
  	this.bigint = v.slice(0) ;
  else if(isJSInteger(v))  // to speed up things
  	this.bigint  = _$_BigInt.int2bigInt(v,0,3);
  else if (v instanceof Integer) 
  	this.bigint = v.bigint.slice(0) ;
  else /* v is string or anything which responds to toString() */
  	this.bigint = _$_BigInt.make(v, b);
//  console.log("Integer:Integer",v,this.bigint,this.toString());
  return this;
}

// NYI : virer les stringify !!!!!!!!!

var BigInt ;
BigInt = (
Integer.version = function() {return _$_BigIntversion;},
Integer.infinity = function() {return (new Integer(_$_BigInt.infinity())); },
Integer.value = function(v) { return ((v instanceof Integer) ?  v : 
							 isRational(v) ? new Integer (Math.floor(v.a/v.b)) :
							 new Integer(v)) ; },

Integer.random = function(x) {
		var b = Integer.bitSize(x) -1 ;
		return (new Integer(_$_BigInt.random(b))); },
Integer.randPrime = function(x) {
		var b = Integer.bitSize(x) - 1 ; 
		return (new Integer(_$_BigInt.randPrime(b))); }, 

Integer.bitSize = function(x) {return _$_BigInt.bitSize(x.bigint); },
Integer.isPrime = function(x) {return _$_BigInt.isPrime(x.bigint); },
Integer.factorShank = function(x,a) {return (new Integer(_$_BigInt.factorShank(x.bigint,a))); },
Integer.rho = function(x,start) {return (new Integer(_$_BigInt.rho(x.bigint,start))); },
Integer.goldbach = function(x) {return (new Integer(_$_BigInt.goldbach(x.bigint))); },
Integer.sqrt = function(x) {return (new Integer(_$_BigInt.sqrt(x.bigint))); },
Integer.nextPrime = function(x) {return (new Integer(_$_BigInt.nextPrime(x.bigint))); },
Integer.isOdd = function(x) { x = Integer.value(x); return _$_BigInt.isOdd(x.bigint); },
Integer.isNegative = function(x) { x = Integer.value(x); return _$_BigInt.isNegative(x.bigint); },
Integer.isZero = function(x) { x = Integer.value(x); return _$_BigInt.isZero(x.bigint); },
Integer.copy = function(x) { var n = new Integer(0); x = Integer.value(x); n.bigint = _$_BigInt.clone(x.bigint); return n; },

Integer.clone = Integer.copy,
Integer.abs = function(x) { 
			return Integer.isNegative(x) ? new Integer (_$_BigInt.neg(x.bigint)) :x; },

Integer.equal = function(a, b) { a = Integer.value(a); b = Integer.value(b); return _$_BigInt.equal(a.bigint, b.bigint); },
Integer.eq = Integer.equal,

// positives args
Integer.greaterThan = function(a, b) { a = Integer.value(a); b = Integer.value(b); return _$_BigInt.greater(a.bigint, b.bigint); },
Integer.greaterOrEqual = function(a, b) { a = Integer.value(a); b = Integer.value(b); return _$_BigInt.greaterOrEqual(a.bigint, b.bigint); },
Integer.lessThan = function(a, b) { a = Integer.value(a); b = Integer.value(b); return !_$_BigInt.greaterOrEqual(a.bigint, b.bigint); },
Integer.lessOrEqual = function(a, b) { a = Integer.value(a); b = Integer.value(b); return !_$_BigInt.greater(a.bigint, b.bigint); },


Integer.ZERO = new Integer(0),
Integer.ONE = new Integer(1),
Integer.TWO = new Integer(2),

Integer.pow = function(b, n) {
		 var p = new Integer(0);
		 b = Integer.value(b);
		 p.bigint = _$_BigInt.powInt(b.bigint, n);
		 return p; },
		 
Integer.dec = function(x, n) { n = n || Integer.ONE; x = Integer.value(x); n = Integer.value(n); return Integer.sub(x, n); },
Integer.inc = function(x, n) { n = n || Integer.ONE; x = Integer.value(x); n = Integer.value(n); return Integer.add(x, n); },

// positives args
Integer.nadd = function(a, b) { return new Integer(_$_BigInt.add(a.bigint, b.bigint)); },
Integer.nsub = function(a, b) { return new Integer(_$_BigInt.sub(a.bigint, b.bigint)); },
Integer.nmul = function(a, b) { return new Integer(_$_BigInt.mul(a.bigint, b.bigint)); },
Integer.ndiv = function(a, b) { return new Integer(_$_BigInt.div(a.bigint, b.bigint)); },
Integer.nmod = function(a, b) { return new Integer(_$_BigInt.mod(a.bigint, b.bigint)); },

Integer.npowMod = function(a, b,c)
				{ return new Integer(_$_BigInt.powMod(a.bigint, b.bigint,c.bigint)); },
				
Integer.nGCD = function(a, b) 
				{ return new Integer(_$_BigInt.GCD(a.bigint, b.bigint)); },

////////  x,y are  Integers in Z ;  i is int in Z
Integer.addInt = function(x,i) {return new Integer (_$_BigInt.addInt(x.bigint,i));},
Integer.subInt = function(x,i) {return new Integer (_$_BigInt.subInt(x.bigint,i));},
Integer.mulInt = function(x,i) {return new Integer (_$_BigInt.mulInt(x.bigint,i));},
Integer.divInt = function(x,i) {return new Integer (_$_BigInt.divInt(x.bigint,i));},
Integer.nmodInt = function(x,i) {return    _$_BigInt.modInt(x.bigint,i);},

// cmp :  -1,0,1 ;  i in Z
Integer.cmpInt = function(x,i)   {return  _$_BigInt.cmpInt(x.bigint,i);},

// x Integer in Z
Integer.neg = function(x)     { return new Integer (_$_BigInt.neg(x.bigint));},
Integer.toFloat = function(a) { return  _$_BigInt.toFloat(a.bigint) ; },
Integer.toHexa = function(a)  { return _$_BigInt.stringify(a.bigint,16) ;},
Integer.digits = function(a,base)  {return _$_BigInt.bigInt2length (a.bigint,base);},


/////////////////////////////////////////
// ARITHMETIC
// a and b are Integers
////////////////////////////////////

Integer.add = function(a, b) {
  //a = Integer.value(a); 
  //b = Integer.value(b);
  if (Integer.isNegative(a) !== Integer.isNegative(b))
  {
    if (Integer.isNegative(b))
      return Integer.sub(a, Integer.neg(b)); 
    else
      return Integer.sub(b, Integer.neg(a));
  }
  else
  {
    if (Integer.isNegative(a))
      return Integer.neg(Integer.nadd(Integer.neg(a), Integer.neg(b)));
    else
      return Integer.nadd(a, b);
  }
},


Integer.sub = function(a, b) {
  //a = Integer.value(a);
  //b = Integer.value(b);
  if (Integer.isNegative(a) === Integer.isNegative(b)) { // same sgn
    if (!Integer.isNegative(a))
    {
      if (Integer.greaterOrEqual(a, b)) // a > 0 , b > 0 ,a > b
        return Integer.nsub(a, b);
      else
       return Integer.neg(Integer.nsub(b, a));
    }
    else
      return Integer.sub(Integer.neg(b), Integer.neg(a));
  }
  else // diff sgn
  {
    if (Integer.isNegative(a))
      return Integer.neg(Integer.nadd(Integer.neg(a), b));
    else
      return Integer.nadd(a, Integer.neg(b));
  }
},


Integer.mul = function(a, b) {
  var r;
  if(!(Integer.isNegative(a) || Integer.isNegative(b)))
  		return Integer.nmul(a,b);
  r = Integer.nmul(Integer.abs(a), Integer.abs(b));
  return ((Integer.isNegative(a) !== Integer.isNegative(b)) ? Integer.neg(r) : r);
},

Integer.div = function(a, b) {
  var r;
  a = Integer.value(a);
  b = Integer.value(b);
  if(!(Integer.isNegative(a) || Integer.isNegative(b)))
  		return Integer.ndiv(a,b);
  r = Integer.ndiv(Integer.abs(a), Integer.abs(b));
  return ((Integer.isNegative(a) !== Integer.isNegative(b)) ? Integer.neg(r) : r);
},

Integer.modulo = function(a, b) { 
  var r;
  a = Integer.value(a);
  b = Integer.value(b);
  r = Integer.nmod(Integer.abs(a),b);
  return  Integer.isZero (r) ? 0 :
  		Integer.isNegative(a) ? Integer.nsub ( b ,r ) : r ;
},

Integer.modInt = function(a, b) { 
  var r;
  a = Integer.value(a);
  r = Integer.nmodInt(Integer.abs(a),b);
  return  Integer.isZero (r) ? 0 :
  		Integer.isNegative(a) ? Integer.nsub ( b ,r ) : r ;
},

Integer.powMod = function (a, b, m) {
				a = Integer.value(a);
				b = Integer.value(b);
				m = Integer.value(m);
//(writeln (glisp_message(a ,"a")));
				var r = Integer.npowMod(Integer.abs(a),b,m) ;

//(writeln (glisp_message(b ,"b")));
//(writeln (glisp_message(m ,"m")));
//(writeln (glisp_message(r ,"r")));
				return  ( ! Integer.isNegative (a)) ?  r :
				  b.even() ? r  :
				  Integer.isZero (r) ? 0 :
				  Integer.nsub(m , r) ; 
},

Integer.GCD = function(a, b) { 
  a = Integer.value(a);
  b = Integer.value(b);
  return Integer.nGCD(Integer.abs(a), Integer.abs(b));
},

Integer.Cnp = function (n , p) { // jsSmallInts in input
var num = new Integer(1) , den = new Integer(1) , i;
//console.log(n,p,num) ;
	for(i = n-p+1; i <= n ; i++) {
	// glisp_trace(num,i,"Cnp",true);
	num = Integer.mulInt(num,i) ;
	}
	for(i = 2 ; i <= p ; i++ )   den = Integer.mulInt(den,i) ;

	return Integer.ndiv (num, den);
},

Integer.factorial = function (n) { // jsSmallInt in input
var fact , i;
	if (n > 2 && n <= 10000) {
		if(__FACT[n]) return __FACT[n] ;
		if(__FACT[n-1]) { __FACT[n] = Integer.mulInt(__FACT[n-1],n); return __FACT[n];}
		if(__FACT[n+1]) { __FACT[n] = Integer.divInt(__FACT[n+1],n+1); return __FACT[n];}
	}
	fact  = new Integer(1) ;
	for(i = 2; i <= n ; i++) {
			fact = Integer.mulInt(fact,i) ;
			if(i <= 10000) __FACT[i] = fact ;
			}
	return fact ;
},
	

////////////////////
// PROTOS
////////////////////////
Integer.prototype.toString = // optional base
			function(b) { return _$_BigInt.stringify(this.bigint,b); },
Integer.prototype.valueOf = function() {return Integer.toFloat(this); },
Integer.prototype.toFloat = function() {return Integer.toFloat(this); },


Integer.prototype.factorShank = function(a) { return Integer.factorShank(this,a); },
Integer.prototype.rho = function(a) { return Integer.rho(this,a); },
Integer.prototype.isPrime = function() { return Integer.isPrime(this); },
Integer.prototype.nextPrime = function() { return Integer.nextPrime(this); },
Integer.prototype.goldbach = function() { return Integer.goldbach(this); },

Integer.prototype.isZero = function() { return   _$_BigInt.isZero(this.bigint); },
Integer.prototype.isNegative = function() { return   _$_BigInt.isNegative(this.bigint); },
Integer.prototype.isPositive = function() { return   _$_BigInt.isPositive(this.bigint); },

Integer.prototype.copy = function() { return Integer.copy(this); },
Integer.prototype.clone = Integer.prototype.copy,
Integer.prototype.abs = function() { return Integer.abs(this); },
Integer.prototype.equal = function(x) { return Integer.equal(this, x); },
Integer.prototype.eq = Integer.prototype.equal,

Integer.prototype.gt = function(x) {
		if(isJSInteger(x)) return _$_BigInt.gt(this.bigint,_$_BigInt.int2bigInt(x,0,3)) ;
		if(x instanceof Integer) return _$_BigInt.gt(this.bigint,x.bigint);
		return this.toFloat() > x ;
		},
Integer.prototype.ge = function(x) {
		if(isJSInteger(x)) return _$_BigInt.ge(this.bigint,_$_BigInt.int2bigInt(x,0,3)) ;
		if(x instanceof Integer) return _$_BigInt.ge(this.bigint,x.bigint);
		return this.toFloat() >= x ;
		},
Integer.prototype.cmpInt = function(n) {return _$_BigInt.cmpInt(this.bigint,n);},
		
Integer.prototype.lt = function(x) {return ! this.ge(x);},
Integer.prototype.le = function(x) {return ! this.gt(x);},


Integer.prototype.pow = function(e) { 
					if(isSmallInteger (e)) return Integer.pow(this, e); 
					return Math.pow(this.toFloat(), e);
					},
Integer.prototype.dec = function(n) { return Integer.dec(this, n); },
Integer.prototype.inc = function(n) { return Integer.inc(this, n); },
Integer.prototype.add = function(x) {
// console.log("add",this.bigint,x);
				if(isJSInteger(x)) return new Integer (_$_BigInt.addInt(this.bigint,x));
				if(typeof x === "number") return x + this;
				if(x instanceof Rational) return x.a/x.b + this;
				return Integer.add(this, x); },
				
Integer.prototype.sub = function(x) {
				if(isJSInteger(x)) return new Integer (_$_BigInt.subInt(this.bigint,x));
				if(typeof x === "number") return this - x;
				if(x instanceof Rational) return this - x.a/x.b;
				return Integer.sub(this, x); },
				
Integer.prototype.mul = function(x) { 
		if(isJSInteger(x)) return new Integer (_$_BigInt.mulInt(this.bigint,x));
		if(typeof x === "number") return this * x;
		if(x instanceof Rational)  {
				if(_$_BigInt.modInt(this.bigint,x.b)) return (this * x.a) /x.b; 
				return new Integer (_$_BigInt.divInt (_$_BigInt.mulInt(this.bigint,x.a), x.b)) ;
				}
		return Integer.mul(this, x); },
		
Integer.prototype.div = function(x) { 
		if(isJSInteger(x)) return new Integer (_$_BigInt.divInt(this.bigint,x));
		if(typeof x === "number") return this / x;
		if(x instanceof Rational)  {
				if(_$_BigInt.modInt(this.bigint,x.a)) return (this * x.b) /x.a; 
				return new Integer (_$_BigInt.divInt (_$_BigInt.mulInt(this.bigint,x.b), x.a)) ;
				}
		return Integer.div(this, x); },

Integer.prototype.div = function(x) { return Integer.div(this, x); },
Integer.prototype.mod = function(x) { return Integer.mod(this, x); },
Integer.prototype.GCD = function(x) { return Integer.GCD(this, x); },
Integer.prototype.neg = function()  { return Integer.neg(this); },
Integer.prototype.sqrt = function() { return Integer.sqrt(this); }, 


////////  i is int in Z
Integer.prototype.addInt = function(i) {return new Integer (_$_BigInt.addInt(this.bigint,i));},
Integer.prototype.subInt = function(i) {return new Integer (_$_BigInt.subInt(this.bigint,i));},
Integer.prototype.mulInt = function(i) {return new Integer (_$_BigInt.mulInt(this.bigint,i));},
Integer.prototype.divInt = function(i) {return new Integer (_$_BigInt.divInt(this.bigint,i));},
Integer.prototype.modInt = function(i) {return    _$_BigInt.modInt(this.bigint,i);},
Integer.prototype.equalInt = function(i) {return _$_BigInt.cmpInt(this.bigint,i) === 0 ;},

Integer.prototype.even = function() {return _$_BigInt.even(this.bigint);}, // ->true/false
Integer.prototype.odd = function() {return _$_BigInt.odd(this.bigint);},


_$_BigInt.Integer = Integer, 
_$_BigInt.Integer // BigInt
);

writeln("bigint.lib v1.4 ® Leemon Baird/EchoLisp","color:green");
_LIB["bigint.lib"] = true;
# EchoLisp Coding Patterns

## Purpose

This document provides proven coding patterns, best practices, and common use case implementations for EchoLisp development. These patterns ensure repeatability and consistency when building applications.

## Table of Contents

1. [Common Data Structure Patterns](#common-data-structure-patterns)
2. [Functional Programming Patterns](#functional-programming-patterns)
3. [Web Development Patterns](#web-development-patterns)
4. [Error Handling Patterns](#error-handling-patterns)
5. [Testing Patterns](#testing-patterns)
6. [Performance Patterns](#performance-patterns)
7. [Module Organization Patterns](#module-organization-patterns)
8. [Scheme-Specific Patterns](#scheme-specific-patterns)

---

## Common Data Structure Patterns

### 1. Association Lists (alists)

**Pattern**: Key-value storage with lists

```scheme
;; File: alist-utils.echo.scm

;; Create an alist
(define (make-alist . pairs)
  pairs)

;; Get value by key
(define (alist-ref alist key . default)
  (let ((pair (assoc key alist)))
    (if pair
        (cdr pair)
        (if (null? default) #f (car default)))))

;; Set or update value
(define (alist-set alist key value)
  (cons (cons key value)
        (remove (lambda (pair) (equal? (car pair) key))
                alist)))

;; Example usage
(define my-config
  (make-alist
    (cons 'port 8080)
    (cons 'host "localhost")
    (cons 'debug #t)))
```

### 2. Records/Structs

**Pattern**: Structured data with named fields

```scheme
;; File: records.echo.scm

;; Define a record type
(define-record-type person
  (make-person name age email)
  person?
  (name person-name set-person-name!)
  (age person-age set-person-age!)
  (email person-email set-person-email!))

;; Constructor with validation
(define (create-person name age email)
  (unless (string? name)
    (error "Name must be a string"))
  (unless (and (number? age) (>= age 0))
    (error "Age must be non-negative number"))
  (make-person name age email))

;; Copy with modifications
(define (person-with-age person new-age)
  (make-person
    (person-name person)
    new-age
    (person-email person)))
```

### 3. Hash Tables

**Pattern**: Efficient key-value storage

```scheme
;; File: hash-utils.echo.glisp

;; Create and populate hash table
(define (make-hash-from-alist alist)
  (let ((ht (make-hash)))
    (for-each
      (lambda (pair)
        (hash-set! ht (car pair) (cdr pair)))
      alist)
    ht))

;; Get with default value
(define (hash-get-or-default ht key default)
  (hash-ref ht key default))

;; Update with function
(define (hash-update! ht key fn)
  (hash-set! ht key (fn (hash-ref ht key))))
```

### 4. Trees

**Pattern**: Hierarchical data structures

```scheme
;; File: tree.echo.scm

;; Binary tree node
(define-record-type tree-node
  (make-node value left right)
  node?
  (value node-value)
  (left node-left)
  (right node-right))

;; Create leaf
(define (leaf value)
  (make-node value #f #f))

;; Tree traversal
(define (tree-map fn tree)
  (if (not tree)
      #f
      (make-node
        (fn (node-value tree))
        (tree-map fn (node-left tree))
        (tree-map fn (node-right tree)))))

;; In-order traversal
(define (tree-in-order tree)
  (if (not tree)
      '()
      (append
        (tree-in-order (node-left tree))
        (list (node-value tree))
        (tree-in-order (node-right tree)))))
```

---

## Functional Programming Patterns

### 1. Higher-Order Functions

**Pattern**: Functions that operate on functions

```scheme
;; File: functional.echo.scm

;; Composition
(define (compose f g)
  (lambda (x) (f (g x))))

;; Multiple composition
(define (compose-many . fns)
  (fold-right compose identity fns))

;; Partial application
(define (partial fn . args)
  (lambda rest
    (apply fn (append args rest))))

;; Curry (two arguments)
(define (curry2 fn)
  (lambda (x)
    (lambda (y)
      (fn x y))))

;; Example usage
(define add10 (partial + 10))
(add10 5) ;; => 15

(define (square x) (* x x))
(define (add1 x) (+ x 1))
(define square-then-add1 (compose add1 square))
(square-then-add1 5) ;; => 26
```

### 2. Monadic Patterns (Maybe/Option)

**Pattern**: Handling optional values

```scheme
;; File: maybe.echo.scm

;; Maybe type: #f for Nothing, value for Just
(define (just? x) (not (equal? x #f)))
(define (nothing? x) (equal? x #f))

;; Maybe map
(define (maybe-map fn maybe-val)
  (if (just? maybe-val)
      (fn maybe-val)
      #f))

;; Maybe bind (flatMap)
(define (maybe-bind fn maybe-val)
  (if (just? maybe-val)
      (fn maybe-val)
      #f))

;; Get with default
(define (maybe-get-or maybe-val default)
  (if (just? maybe-val)
      maybe-val
      default))

;; Chain operations
(define (safe-sqrt x)
  (if (>= x 0)
      (sqrt x)
      #f))

(define (safe-inverse x)
  (if (not (zero? x))
      (/ 1 x)
      #f))

;; Usage
(maybe-bind safe-inverse
  (maybe-bind safe-sqrt 16)) ;; => 0.25
```

### 3. Pipeline Pattern

**Pattern**: Data transformation pipelines

```scheme
;; File: pipeline.echo.scm

;; Thread-first macro
(define-syntax ->
  (syntax-rules ()
    ((_ x) x)
    ((_ x (fn . args) rest ...)
     (-> (fn x . args) rest ...))
    ((_ x fn rest ...)
     (-> (fn x) rest ...))))

;; Thread-last macro
(define-syntax ->>
  (syntax-rules ()
    ((_ x) x)
    ((_ x (fn args ...) rest ...)
     (->> (fn args ... x) rest ...))
    ((_ x fn rest ...)
     (->> (fn x) rest ...))))

;; Example usage
(->
  '(1 2 3 4 5)
  (map (lambda (x) (* x 2)))
  (filter (lambda (x) (> x 5)))
  (fold + 0))
;; => 24
```

---

## Web Development Patterns

### 1. HTTP Request Handler

**Pattern**: Processing web requests

```scheme
;; File: http-handler.echo.glisp

;; Request record
(define-record-type http-request
  (make-request method path headers body)
  request?
  (method request-method)
  (path request-path)
  (headers request-headers)
  (body request-body))

;; Response record
(define-record-type http-response
  (make-response status headers body)
  response?
  (status response-status)
  (headers response-headers)
  (body response-body))

;; Response helpers
(define (ok body)
  (make-response 200 '() body))

(define (not-found)
  (make-response 404 '() "Not Found"))

(define (json-response data)
  (make-response
    200
    '((content-type . "application/json"))
    (json-encode data)))

;; Router pattern
(define (route-handler routes)
  (lambda (request)
    (let* ((path (request-path request))
           (handler (alist-ref routes path)))
      (if handler
          (handler request)
          (not-found)))))
```

### 2. DOM Manipulation

**Pattern**: Working with browser DOM

```scheme
;; File: dom-utils.echo.glisp

;; Query selector wrapper
(define ($ selector)
  (js-eval (string-append "document.querySelector('" selector "')")))

;; Query all
(define ($$ selector)
  (js-eval (string-append "Array.from(document.querySelectorAll('" selector "'))")))

;; Create element
(define (create-element tag attrs children)
  (let ((el (js-eval (string-append "document.createElement('" tag "')"))))
    (for-each
      (lambda (attr)
        (js-eval (string-append
                   "arguments[0].setAttribute('" (car attr) "', '" (cdr attr) "')")
                 el))
      attrs)
    (for-each
      (lambda (child)
        (js-eval "arguments[0].appendChild(arguments[1])" el child))
      children)
    el))

;; Event listener
(define (on-click element handler)
  (js-eval "arguments[0].addEventListener('click', arguments[1])"
           element
           handler))
```

### 3. Async/Promise Pattern

**Pattern**: Asynchronous operations

```scheme
;; File: async.echo.glisp

;; Fetch wrapper
(define (fetch-json url)
  (js-eval
    "fetch(arguments[0])
       .then(response => response.json())"
    url))

;; Promise chain
(define (fetch-and-process url processor)
  (js-eval
    "fetch(arguments[0])
       .then(response => response.json())
       .then(data => arguments[1](data))"
    url
    processor))

;; Async/await style (using JS eval)
(define-syntax async
  (syntax-rules (await)
    ((_ (await expr) rest ...)
     (js-eval "async () => { const result = await arguments[0]; return arguments[1](result); }"
              expr
              (lambda (result) (begin rest ...))))))
```

---

## Error Handling Patterns

### 1. Try-Catch Pattern

**Pattern**: Error handling with recovery

```scheme
;; File: error-handling.echo.scm

;; Try-catch macro
(define-syntax try
  (syntax-rules (catch)
    ((_ body (catch var handler))
     (call-with-current-continuation
       (lambda (return)
         (with-exception-handler
           (lambda (err)
             (let ((var err))
               (return handler)))
           (lambda () body)))))))

;; Usage
(try
  (/ 1 0)
  (catch e
    (display "Error: division by zero")))
```

### 2. Result Type Pattern

**Pattern**: Explicit success/failure handling

```scheme
;; File: result.echo.scm

;; Result type
(define-record-type result
  (make-result success? value error)
  result?
  (success? result-success?)
  (value result-value)
  (error result-error))

;; Constructors
(define (ok value)
  (make-result #t value #f))

(define (err error)
  (make-result #f #f error))

;; Map over result
(define (result-map fn result)
  (if (result-success? result)
      (ok (fn (result-value result)))
      result))

;; Bind (flatMap)
(define (result-bind fn result)
  (if (result-success? result)
      (fn (result-value result))
      result))

;; Usage
(define (safe-divide a b)
  (if (zero? b)
      (err "Division by zero")
      (ok (/ a b))))

(result-bind
  (lambda (x) (safe-divide x 2))
  (safe-divide 10 5))
;; => Ok 1
```

---

## Testing Patterns

### 1. Unit Test Framework

**Pattern**: Basic test structure

```scheme
;; File: test-framework.echo.scm

;; Test result tracking
(define *test-results* '())

;; Assert functions
(define (assert-equal actual expected msg)
  (if (equal? actual expected)
      (begin
        (set! *test-results* (cons (list 'pass msg) *test-results*))
        #t)
      (begin
        (set! *test-results* (cons (list 'fail msg actual expected) *test-results*))
        #f)))

(define (assert-true val msg)
  (assert-equal val #t msg))

;; Test definition macro
(define-syntax test
  (syntax-rules ()
    ((_ name body ...)
     (begin
       (display "Running test: ")
       (display 'name)
       (newline)
       body ...))))

;; Test suite
(define-syntax test-suite
  (syntax-rules ()
    ((_ name tests ...)
     (begin
       (display "=== Test Suite: ")
       (display 'name)
       (display " ===")
       (newline)
       (set! *test-results* '())
       tests ...
       (display-test-results)))))

;; Display results
(define (display-test-results)
  (let ((passed (length (filter (lambda (r) (equal? (car r) 'pass)) *test-results*)))
        (failed (length (filter (lambda (r) (equal? (car r) 'fail)) *test-results*))))
    (display "Passed: ")
    (display passed)
    (display ", Failed: ")
    (display failed)
    (newline)))
```

### 2. Property-Based Testing

**Pattern**: Testing with generated inputs

```scheme
;; File: property-test.echo.scm

;; Random generators
(define (random-int min max)
  (+ min (random (- max min))))

(define (random-list length generator)
  (map (lambda (_) (generator))
       (iota length)))

;; Property test runner
(define (check-property property num-tests)
  (let loop ((n 0) (failures '()))
    (if (>= n num-tests)
        (if (null? failures)
            (list 'pass num-tests)
            (list 'fail failures))
        (let ((test-result (property)))
          (if test-result
              (loop (+ n 1) failures)
              (loop (+ n 1) (cons n failures)))))))

;; Example usage
(define (prop-reverse-twice-is-identity)
  (let ((lst (random-list 10 (lambda () (random-int 0 100)))))
    (equal? lst (reverse (reverse lst)))))

(check-property prop-reverse-twice-is-identity 100)
```

---

## Performance Patterns

### 1. Tail Recursion

**Pattern**: Efficient recursive loops

```scheme
;; File: tail-recursion.echo.scm

;; Accumulator pattern
(define (sum-list lst)
  (let loop ((remaining lst) (acc 0))
    (if (null? remaining)
        acc
        (loop (cdr remaining) (+ acc (car remaining))))))

;; Tail-recursive map
(define (map-tail fn lst)
  (let loop ((remaining lst) (acc '()))
    (if (null? remaining)
        (reverse acc)
        (loop (cdr remaining) (cons (fn (car remaining)) acc)))))

;; Tail-recursive filter
(define (filter-tail pred lst)
  (let loop ((remaining lst) (acc '()))
    (cond
      ((null? remaining) (reverse acc))
      ((pred (car remaining))
       (loop (cdr remaining) (cons (car remaining) acc)))
      (else
       (loop (cdr remaining) acc)))))
```

### 2. Memoization

**Pattern**: Caching expensive computations

```scheme
;; File: memoize.echo.scm

;; Simple memoization
(define (memoize fn)
  (let ((cache (make-hash)))
    (lambda args
      (let ((cached (hash-ref cache args #f)))
        (if cached
            cached
            (let ((result (apply fn args)))
              (hash-set! cache args result)
              result))))))

;; Fibonacci with memoization
(define fib
  (memoize
    (lambda (n)
      (if (<= n 1)
          n
          (+ (fib (- n 1)) (fib (- n 2)))))))
```

### 3. Lazy Evaluation

**Pattern**: Delayed computation

```scheme
;; File: lazy.echo.scm

;; Delay and force (standard Scheme)
(define-syntax delay
  (syntax-rules ()
    ((_ expr)
     (lambda () expr))))

(define (force promise)
  (promise))

;; Lazy list (stream)
(define (stream-cons x stream)
  (cons x (delay stream)))

(define (stream-car stream)
  (car stream))

(define (stream-cdr stream)
  (force (cdr stream)))

;; Infinite stream of natural numbers
(define (integers-from n)
  (stream-cons n (integers-from (+ n 1))))

(define naturals (integers-from 0))
```

---

## Module Organization Patterns

### 1. Library Module Pattern

**Pattern**: Reusable library structure

```scheme
;; File: my-library.echo.scm
;; ============================================
;; Library: My Utility Library
;; Purpose: Common utility functions
;; Version: 1.0.0
;; ============================================

;; Export list (documentation purposes)
;; Public functions:
;;   - utility-fn-1
;;   - utility-fn-2
;;   - utility-fn-3

;; ========================================
;; Private Helpers
;; ========================================

(define (%internal-helper x)
  ;; Private implementation
  (* x 2))

;; ========================================
;; Public API
;; ========================================

(define (utility-fn-1 arg)
  "Public function with documentation"
  (%internal-helper arg))

(define (utility-fn-2 arg1 arg2)
  "Another public function"
  (+ arg1 arg2))

;; ========================================
;; Module Initialization
;; ========================================

(display "My Library loaded successfully\n")
```

### 2. Application Structure Pattern

**Pattern**: Full application organization

```
my-app/
├── app.echo.scm              # Main entry point
├── config/
│   ├── settings.echo.lsp     # Configuration
│   └── env.echo.ls           # Environment
├── core/
│   ├── models.echo.lisp      # Data models
│   ├── logic.echo.scm        # Business logic
│   └── state.echo.glisp      # State management
├── lib/
│   ├── utils.echo.lsp        # Utilities
│   ├── http.echo.glisp       # HTTP client
│   └── db.echo.lisp          # Database
├── ui/
│   ├── components.echo.glisp # UI components
│   └── views.echo.glisp      # Views
└── tests/
    ├── models-test.echo.lisp
    └── logic-test.echo.scm
```

---

## Scheme-Specific Patterns

### 1. Continuations

**Pattern**: Control flow manipulation

```scheme
;; File: continuations.echo.scm

;; Non-local exit
(define (find-first pred lst)
  (call-with-current-continuation
    (lambda (return)
      (for-each
        (lambda (x)
          (when (pred x)
            (return x)))
        lst)
      #f)))

;; Generator using continuations
(define (make-generator fn)
  (let ((return #f))
    (lambda ()
      (call-with-current-continuation
        (lambda (resume)
          (let ((yield (lambda (value)
                        (call-with-current-continuation
                          (lambda (next)
                            (set! return next)
                            (resume value))))))
            (fn yield))
          (set! return #f)
          (resume 'done))))))
```

### 2. Macros

**Pattern**: Syntax extensions

```scheme
;; File: macros.echo.scm

;; Unless macro
(define-syntax unless
  (syntax-rules ()
    ((_ condition body ...)
     (if (not condition)
         (begin body ...)))))

;; When macro
(define-syntax when
  (syntax-rules ()
    ((_ condition body ...)
     (if condition
         (begin body ...)))))

;; Let with multiple values
(define-syntax let-values
  (syntax-rules ()
    ((_ ((vars expr)) body ...)
     (call-with-values
       (lambda () expr)
       (lambda vars body ...)))))
```

---

*Last Updated: 2026-01-02*
*Version: 1.0.0*

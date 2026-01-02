;; ============================================
;; File: hello-world.echo.scm
;; Purpose: Simple Hello World example
;; ============================================
;; 
;; This is a basic example showing standard Scheme syntax
;; in an EchoLisp file following the naming protocol.
;;
;; Usage:
;;   (load "hello-world.echo.scm")
;;   (hello-world)
;;
;; ============================================

;; hello-world: -> string
;; 
;; Returns a greeting message
;;
;; Example:
;;   (hello-world) ;; => "Hello, EchoLisp World!"
;;
(define (hello-world)
  "Hello, EchoLisp World!")

;; greet: string -> string
;; 
;; Returns a personalized greeting
;;
;; Arguments:
;;   name - The name to greet
;;
;; Example:
;;   (greet "Alice") ;; => "Hello, Alice!"
;;
(define (greet name)
  (string-append "Hello, " name "!"))

;; main: -> void
;; 
;; Main entry point for the example
;;
(define (main)
  (display (hello-world))
  (newline)
  (display (greet "Developer"))
  (newline))

;; Run the example if executed directly
(main)

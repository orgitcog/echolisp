;; ============================================
;; File: calculator.echo.scm
;; Purpose: Basic calculator implementation
;; ============================================
;; 
;; Demonstrates standard Scheme functions following
;; EchoLisp naming conventions and best practices.
;;
;; Usage:
;;   (load "calculator.echo.scm")
;;   (calculate '+ 5 3)
;;
;; ============================================

;; calculate: symbol number number -> number
;; 
;; Performs basic arithmetic operations
;;
;; Arguments:
;;   op - Operation symbol (+, -, *, /)
;;   a  - First operand
;;   b  - Second operand
;;
;; Returns: Result of the operation
;;
;; Example:
;;   (calculate '+ 5 3) ;; => 8
;;   (calculate '* 4 7) ;; => 28
;;
(define (calculate op a b)
  (cond
    ((eq? op '+) (+ a b))
    ((eq? op '-) (- a b))
    ((eq? op '*) (* a b))
    ((eq? op '/) (if (zero? b)
                     (error "Division by zero")
                     (/ a b)))
    (else (error "Unknown operation" op))))

;; safe-divide: number number -> number or #f
;; 
;; Safely divides two numbers, returning #f on division by zero
;;
;; Arguments:
;;   a - Dividend
;;   b - Divisor
;;
;; Returns: Result or #f if b is zero
;;
;; Example:
;;   (safe-divide 10 2) ;; => 5
;;   (safe-divide 10 0) ;; => #f
;;
;; Note: Returns #f instead of throwing error for graceful handling
;;
(define (safe-divide a b)
  (if (zero? b)
      #f
      (/ a b)))

;; Calculator demonstration
(define (demo)
  (display "Calculator Demo\n")
  (display "===============\n")
  (display "5 + 3 = ")
  (display (calculate '+ 5 3))
  (newline)
  (display "10 - 4 = ")
  (display (calculate '- 10 4))
  (newline)
  (display "6 * 7 = ")
  (display (calculate '* 6 7))
  (newline)
  (display "15 / 3 = ")
  (display (calculate '/ 15 3))
  (newline)
  (display "Safe divide 10 / 0 = ")
  (display (safe-divide 10 0))
  (newline))

;; ============================================
;; File: list-utils.echo.lsp
;; Purpose: Short utility functions for lists
;; ============================================
;; 
;; Collection of small utility functions for list
;; manipulation. Uses .echo.lsp extension for short
;; utility file.
;;
;; ============================================

;; sum: list -> number
;; Sum all numbers in a list
(define (sum lst)
  (fold + 0 lst))

;; product: list -> number
;; Multiply all numbers in a list
(define (product lst)
  (fold * 1 lst))

;; avg: list -> number
;; Calculate average of a list
(define (avg lst)
  (if (null? lst)
      0
      (/ (sum lst) (length lst))))

;; range: number number -> list
;; Generate a list of numbers from start to end
(define (range start end)
  (if (> start end)
      '()
      (cons start (range (+ start 1) end))))

;; take: number list -> list
;; Take first n elements from list
(define (take n lst)
  (if (or (zero? n) (null? lst))
      '()
      (cons (car lst) (take (- n 1) (cdr lst)))))

;; drop: number list -> list
;; Drop first n elements from list
(define (drop n lst)
  (if (or (zero? n) (null? lst))
      lst
      (drop (- n 1) (cdr lst))))

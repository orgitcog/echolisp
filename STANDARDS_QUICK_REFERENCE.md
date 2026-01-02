# EchoLisp Standards Quick Reference

This document provides a quick reference for the EchoLisp development standards. For detailed information, see the full documentation files.

## File Naming Protocol

### The Core Rule

**All EchoLisp source files MUST use the `.echo.` prefix:**

```
✅ module-name.echo.scm
✅ utilities.echo.glisp
✅ helpers.echo.lsp

❌ module-name.scm
❌ utilities.glisp
❌ helpers.lsp
```

### Extension Guide

| Extension | Use Case | Example |
|-----------|----------|---------|
| `.echo.scm` | Standard Scheme code | `calculator.echo.scm` |
| `.echo.glisp` | EchoLisp-specific features | `canvas-draw.echo.glisp` |
| `.echo.lisp` | Common Lisp style | `classes.echo.lisp` |
| `.echo.lsp` | Short utilities | `utils.echo.lsp` |
| `.echo.ls` | Minimal scripts | `init.echo.ls` |
| `.echo.s` | Core Scheme files | `boot.echo.s` |

## Function Naming

### Standard Patterns

```scheme
;; Predicates (return boolean)
empty-list?
valid-input?
is-prime?

;; Mutators (modify state)
set-value!
update-cache!
reset-state!

;; Converters (type transformation)
string->number
list->vector
json->object

;; Constructors
make-point
make-tree
create-user

;; Regular functions
calculate-sum
process-data
find-element
```

## File Structure Template

```scheme
;; ============================================
;; File: module-name.echo.scm
;; Purpose: Brief description
;; ============================================
;; 
;; Detailed description of the module
;;
;; Usage:
;;   (load "module-name.echo.scm")
;;   (function-name args)
;;
;; Dependencies:
;;   - dependency1.echo.scm
;;   - dependency2.echo.glisp
;;
;; ============================================

;; ========================================
;; Private Helpers
;; ========================================

(define (%internal-helper x)
  (* x 2))

;; ========================================
;; Public API
;; ========================================

;; function-name: arg1 arg2 -> result
;; 
;; Description of what the function does
;;
;; Arguments:
;;   arg1 - Description
;;   arg2 - Description
;;
;; Returns: Description
;;
;; Example:
;;   (function-name 1 2) ;; => 3
;;
(define (function-name arg1 arg2)
  ;; implementation
  )
```

## Code Style

### Indentation
- Use 2 spaces (not tabs)
- Align closing parentheses

### Line Length
- Aim for 80 characters
- 100 characters maximum

### Spacing
```scheme
;; Good
(define (sum-list lst)
  (fold + 0 lst))

;; Bad
(define(sum-list lst)(fold + 0 lst))
```

### Comments
```scheme
;; Single line comment
;;; Section header
;;;; File-level documentation

(define (function arg)
  ;; inline explanation
  (* arg 2))
```

## Directory Structure

```
project/
├── lib/                    # Core libraries
│   ├── core.echo.scm
│   └── utils.echo.glisp
├── examples/              # Example code
│   └── demo.echo.scm
├── tests/                 # Test files
│   └── core-test.echo.scm
├── docs/                  # Documentation
└── config/                # Configuration
    └── settings.echo.lsp
```

## Common Patterns

### Tail Recursion
```scheme
(define (sum-list lst)
  (let loop ((remaining lst) (acc 0))
    (if (null? remaining)
        acc
        (loop (cdr remaining) (+ acc (car remaining))))))
```

### Error Handling
```scheme
(define (safe-divide a b)
  (if (zero? b)
      (error "Division by zero")
      (/ a b)))
```

### Higher-Order Functions
```scheme
(define (compose f g)
  (lambda (x) (f (g x))))
```

## Testing

### Test File Naming
```
module.echo.scm → module-test.echo.scm
```

### Test Structure
```scheme
;; File: module-test.echo.scm

(define (test-addition)
  (assert-equal (+ 2 3) 5 "Addition works"))

(define (run-tests)
  (test-addition)
  ;; more tests
  )
```

## Commit Messages

Use conventional commit format:

```
feat: add new sorting algorithm
fix: correct boundary condition
docs: update API documentation
refactor: simplify logic
test: add edge case tests
```

## Documentation Files

- **[DEVELOPMENT_STANDARDS.md](./DEVELOPMENT_STANDARDS.md)** - Complete development standards
- **[NAMING_PROTOCOLS.md](./NAMING_PROTOCOLS.md)** - Detailed naming conventions
- **[CODING_PATTERNS.md](./CODING_PATTERNS.md)** - Common implementation patterns
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Contribution guidelines

## Examples

See the [examples/](./examples/) directory for working code examples:

- `hello-world.echo.scm` - Basic structure
- `calculator.echo.scm` - Logic and error handling
- `web-example.echo.glisp` - Browser features
- `list-utils.echo.lsp` - Utility functions

## Checklist for New Files

- [ ] File uses `.echo.` prefix
- [ ] Appropriate extension chosen
- [ ] File header with documentation
- [ ] Functions documented
- [ ] Code follows style guide
- [ ] Tests created (if applicable)
- [ ] Updated relevant documentation

## Migration from Legacy Files

If you have existing files without the `.echo.` prefix:

1. **For new files**: Always use `.echo.` prefix
2. **For existing files**: Rename when modifying
3. **Maintain compatibility**: Use symbolic links if needed
4. **Update imports**: Gradually update load statements

## Need Help?

- Read the full documentation in the files listed above
- Check examples in `examples/` directory
- Review existing code following the standards
- Open an issue for questions

---

*Quick reference for EchoLisp development standards*
*Version: 1.0.0 | Last Updated: 2026-01-02*

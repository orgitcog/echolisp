# EchoLisp Development Standards

## Overview

This document establishes the core development standards, rules, and protocols for EchoLisp development to ensure consistency, repeatability, and maintainability across the project. These standards are particularly focused on Scheme-based implementations but apply to all Lisp dialects supported by EchoLisp.

## File Naming Conventions

### Core Principle: The `.echo.` Prefix

All EchoLisp source files MUST use the `.echo.` prefix before the file extension to clearly identify them as EchoLisp implementations. This ensures:

- Clear identification of EchoLisp-specific code
- Differentiation from standard Scheme/Lisp files
- Better organization in mixed-language projects
- Easier tooling and automation

### File Extension Standards

EchoLisp supports multiple file extensions for different use cases:

#### Primary Extensions

1. **`.echo.scm`** - Primary Scheme implementation files
   - Use for: Standard Scheme code, R5RS/R7RS compatible implementations
   - Example: `calculator.echo.scm`, `rosetta-primes.echo.scm`

2. **`.echo.glisp`** - General Lisp / EchoLisp-specific code
   - Use for: EchoLisp-specific features, extensions, and libraries
   - Example: `graphics-utils.echo.glisp`, `web-api.echo.glisp`

3. **`.echo.lisp`** - Common Lisp-style implementations
   - Use for: Common Lisp compatible code, CLOS-style implementations
   - Example: `class-system.echo.lisp`, `generic-methods.echo.lisp`

#### Alternative Extensions

4. **`.echo.lsp`** - Short form for Lisp
   - Use for: Shorter utility files, quick scripts
   - Example: `utils.echo.lsp`, `helpers.echo.lsp`

5. **`.echo.ls`** - Minimal extension for LiveScript-style or short scripts
   - Use for: Very short utility scripts, one-off functions
   - Example: `init.echo.ls`, `config.echo.ls`

6. **`.echo.s`** - Scheme shorthand
   - Use for: Minimalist Scheme implementations, embedded scripts
   - Example: `embed.echo.s`, `boot.echo.s`

## Directory Structure

### Recommended Organization

```
project-root/
├── lib/                    # Core libraries and implementations
│   ├── core.echo.scm      # Core Scheme functionality
│   ├── stdlib.echo.glisp  # EchoLisp standard library extensions
│   └── utils.echo.lsp     # Utility functions
├── examples/              # Example code and tutorials
│   ├── beginner.echo.scm
│   └── advanced.echo.glisp
├── tests/                 # Test files
│   ├── core-test.echo.scm
│   └── stdlib-test.echo.glisp
├── docs/                  # Documentation
└── notebook/              # Interactive worksheets
```

## Code Organization Patterns

### Module Structure

Each EchoLisp file should follow this general structure:

```scheme
;; File: module-name.echo.scm
;; Description: Brief description of the module's purpose
;; Author: [Author name or team]
;; Date: YYYY-MM-DD
;; Dependencies: [List required modules]

;; ========================================
;; Module Exports
;; ========================================

;; List of public functions/macros exported by this module

;; ========================================
;; Private Implementation
;; ========================================

;; Private helper functions and internal definitions

;; ========================================
;; Public API
;; ========================================

;; Public functions and macros

;; ========================================
;; Module Initialization
;; ========================================

;; Any initialization code that runs on module load
```

### Naming Conventions

#### Functions
- Use kebab-case for function names: `calculate-sum`, `process-data`
- Predicates end with `?`: `valid-input?`, `empty-list?`
- Mutators end with `!`: `set-value!`, `update-state!`
- Converters use `->`: `string->number`, `list->vector`

#### Constants
- Use UPPER-CASE-WITH-DASHES: `MAX-ITERATIONS`, `DEFAULT-PORT`
- Or prefix with `*`: `*max-iterations*`, `*default-port*`

#### Private Functions
- Prefix with `%` or `-`: `%internal-helper`, `-private-function`

#### Macros
- Use descriptive names with `define-`: `define-record-type`, `define-syntax-rule`
- Or clear verb-based names: `with-timeout`, `let-values`

## Documentation Standards

### File-Level Documentation

Every file must include a header comment block with:

```scheme
;; ============================================
;; File: [filename]
;; Purpose: [One-line description]
;; ============================================
;; 
;; [Detailed description of what this file provides]
;;
;; Usage Example:
;;   (load "filename.echo.scm")
;;   (function-name args...)
;;
;; Dependencies:
;;   - module1.echo.scm
;;   - module2.echo.glisp
;;
;; Notes:
;;   [Any important notes or caveats]
;; ============================================
```

### Function Documentation

Document each public function with:

```scheme
;; function-name: arg1 arg2 -> result
;; 
;; Description: [What the function does]
;;
;; Arguments:
;;   arg1 - [description]
;;   arg2 - [description]
;;
;; Returns: [description of return value]
;;
;; Example:
;;   (function-name 1 2) ;; => 3
;;
(define (function-name arg1 arg2)
  ;; implementation
  )
```

## Best Practices

### 1. Immutability
- Prefer immutable data structures
- Use functional transformations over mutations
- Reserve `!` functions for truly necessary mutations

### 2. Pure Functions
- Strive for pure functions without side effects
- Clearly document side effects when necessary
- Separate pure logic from I/O operations

### 3. Error Handling
```scheme
;; Use predicates for validation
(define (safe-divide a b)
  (if (zero? b)
      (error "Division by zero")
      (/ a b)))

;; Or return Maybe/Option style results
(define (safe-divide-maybe a b)
  (if (zero? b)
      #f
      (/ a b)))
```

### 4. Testing
- Place tests in a separate `tests/` directory
- Name test files with `-test` suffix: `module-test.echo.scm`
- Use consistent test assertions
- Group related tests logically

### 5. Performance
- Use tail recursion for loops
- Leverage EchoLisp's optimization features
- Profile before optimizing
- Document performance-critical sections

## Version Control

### Commit Messages
Follow conventional commit format:
```
feat: add new sorting algorithm
fix: correct boundary condition in binary-search
docs: update API documentation for list functions
refactor: simplify predicate logic
test: add tests for edge cases
```

### Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

## Code Style

### Indentation
- Use 2 spaces for indentation
- Align closing parentheses with opening expression
- Break long lines at logical boundaries

### Line Length
- Aim for 80 characters maximum
- 100 characters absolute maximum
- Break complex expressions into multiple lines

### Spacing
```scheme
;; Good
(define (sum-list lst)
  (fold + 0 lst))

;; Bad
(define(sum-list lst)(fold + 0 lst))
```

### Comments
- Use `;;` for inline comments
- Use `;;;` for section headers
- Use `;;;;` for file-level documentation
- Keep comments up-to-date with code

## Scheme Dialect Compatibility

### R5RS Compatibility
- Mark R5RS-compatible code clearly
- Avoid non-standard extensions in core libraries
- Document EchoLisp-specific features

### R7RS Features
- Use R7RS libraries where appropriate
- Document R7RS-specific code
- Provide R5RS alternatives when possible

### EchoLisp Extensions
- Clearly mark EchoLisp-specific features
- Document browser-specific functionality
- Provide fallbacks for non-browser environments

## Security Considerations

### Input Validation
- Always validate external input
- Sanitize data from web sources
- Use type predicates for validation

### Resource Management
- Clean up resources (files, connections)
- Set reasonable limits on recursion
- Monitor memory usage for large datasets

## Maintenance

### Regular Reviews
- Review code for adherence to standards
- Update documentation as code evolves
- Refactor to improve clarity

### Deprecation Policy
- Mark deprecated functions with warnings
- Provide migration paths
- Maintain backward compatibility when possible

## Additional Resources

- See [NAMING_PROTOCOLS.md](./NAMING_PROTOCOLS.md) for detailed file naming rules
- See [CODING_PATTERNS.md](./CODING_PATTERNS.md) for common implementation patterns
- See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines

## Compliance

All code contributions should adhere to these standards. Reviewers should check for:
- ✅ Proper file naming with `.echo.` prefix
- ✅ Adequate documentation
- ✅ Consistent code style
- ✅ Appropriate test coverage
- ✅ Clear commit messages

---

*Last Updated: 2026-01-02*
*Version: 1.0.0*

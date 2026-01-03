# EchoLisp Examples

This directory contains example code demonstrating the EchoLisp naming protocols and best practices.

## File Naming Convention

All examples follow the `.echo.*` naming protocol:

- **`.echo.scm`** - Standard Scheme implementations
- **`.echo.glisp`** - EchoLisp-specific features
- **`.echo.lsp`** - Short utility files

## Examples

### 1. hello-world.echo.scm
Basic Hello World example showing:
- Standard Scheme syntax
- Function documentation
- File header format
- Simple string operations

**Run it:**
```scheme
(load "examples/hello-world.echo.scm")
(greet "World")
```

### 2. calculator.echo.scm
Calculator implementation demonstrating:
- Conditional logic
- Error handling
- Function patterns
- Safe operations

**Run it:**
```scheme
(load "examples/calculator.echo.scm")
(calculate '+ 5 3)
(safe-divide 10 2)
(demo)  ; Run full demonstration
```

### 3. web-example.echo.glisp
Web/browser interaction example showing:
- DOM manipulation
- Event handling
- EchoLisp-specific features
- JavaScript interop

**Run it:**
```scheme
(load "examples/web-example.echo.glisp")
(web-demo)  ; Creates interactive button on page
```

### 4. list-utils.echo.lsp
Collection of list utility functions:
- List manipulation
- Functional patterns
- Compact utility style

**Run it:**
```scheme
(load "examples/list-utils.echo.lsp")
(sum '(1 2 3 4 5))
(avg '(10 20 30))
(range 1 10)
```

## Learning Path

1. Start with `hello-world.echo.scm` to understand basic structure
2. Explore `calculator.echo.scm` for logic and error handling
3. Try `list-utils.echo.lsp` for functional programming patterns
4. Experiment with `web-example.echo.glisp` for browser features

## Creating Your Own Examples

When creating new examples, follow these guidelines:

1. **Use appropriate file extension:**
   - `.echo.scm` for portable Scheme code
   - `.echo.glisp` for EchoLisp-specific features
   - `.echo.lsp` for short utilities

2. **Include file header:**
   ```scheme
   ;; ============================================
   ;; File: your-example.echo.scm
   ;; Purpose: Brief description
   ;; ============================================
   ```

3. **Document functions:**
   ```scheme
   ;; function-name: arg1 arg2 -> result
   ;; 
   ;; Description of what it does
   ;;
   ;; Example:
   ;;   (function-name 1 2) ;; => 3
   ```

4. **Follow naming conventions:**
   - Use kebab-case: `my-function-name`
   - Predicates end with `?`: `is-valid?`
   - Mutators end with `!`: `set-value!`
   - Converters use `->`: `string->number`

## Reference

See the main documentation for detailed standards:
- [DEVELOPMENT_STANDARDS.md](../DEVELOPMENT_STANDARDS.md)
- [NAMING_PROTOCOLS.md](../NAMING_PROTOCOLS.md)
- [CODING_PATTERNS.md](../CODING_PATTERNS.md)

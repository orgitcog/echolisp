# EchoLisp Naming Protocols

## Purpose

This document provides comprehensive naming protocols for EchoLisp development, ensuring consistency and clarity across all file types, functions, and project structures.

## File Extension Protocols

### The `.echo.` Prefix Standard

**Rule**: All EchoLisp source files MUST include the `.echo.` prefix before the final extension.

**Format**: `filename.echo.<extension>`

**Rationale**:
- Clearly identifies files as EchoLisp implementations
- Prevents conflicts with other Scheme/Lisp implementations
- Enables easy pattern matching in build tools and scripts
- Improves discoverability in mixed-language codebases

### Extension Types and Use Cases

#### 1. `.echo.scm` - Scheme Implementation Files

**When to Use**:
- Standard Scheme code following R5RS or R7RS specifications
- Portable Scheme implementations
- Educational code and tutorials
- Core algorithms and data structures

**Characteristics**:
- Should be compatible with standard Scheme interpreters where possible
- Minimal EchoLisp-specific extensions
- Focus on portability and standards compliance

**Examples**:
```
factorial.echo.scm          # Mathematical functions
list-utilities.echo.scm     # List manipulation functions
parser.echo.scm             # Parsing algorithms
scheme-core.echo.scm        # Core Scheme functionality
```

**Naming Patterns**:
- Descriptive of functionality: `binary-search.echo.scm`
- Domain-specific: `rosetta-quicksort.echo.scm`
- Library names: `srfi-1.echo.scm` (for SRFI implementations)

#### 2. `.echo.glisp` - General Lisp / EchoLisp Extensions

**When to Use**:
- EchoLisp-specific features and extensions
- Browser-specific functionality
- Graphics and visualization code
- Web APIs and DOM manipulation
- Non-standard but useful extensions

**Characteristics**:
- May use EchoLisp-specific functions
- Can include browser/JavaScript interop
- Optimized for EchoLisp runtime
- May not be portable to other Scheme implementations

**Examples**:
```
canvas-draw.echo.glisp      # Canvas/graphics operations
web-fetch.echo.glisp        # Browser fetch API wrapper
json-handler.echo.glisp     # JSON manipulation
dom-utils.echo.glisp        # DOM manipulation utilities
animation.echo.glisp        # Animation framework
```

**Naming Patterns**:
- Feature-based: `svg-graphics.echo.glisp`
- API wrappers: `localstorage-api.echo.glisp`
- Framework components: `reactive-forms.echo.glisp`

#### 3. `.echo.lisp` - Common Lisp Style

**When to Use**:
- Common Lisp compatible implementations
- CLOS-style object-oriented code
- Generic functions and methods
- Condition/exception handling systems
- Package/namespace definitions

**Characteristics**:
- Uses Common Lisp conventions
- May include CLOS-style objects
- Generic function dispatch
- More imperative style when appropriate

**Examples**:
```
classes.echo.lisp           # Class definitions
generics.echo.lisp          # Generic methods
conditions.echo.lisp        # Exception handling
packages.echo.lisp          # Package definitions
database-layer.echo.lisp    # Database abstraction
```

**Naming Patterns**:
- System components: `web-server.echo.lisp`
- Object systems: `person-class.echo.lisp`
- Protocols: `serializable-protocol.echo.lisp`

#### 4. `.echo.lsp` - Short Lisp Files

**When to Use**:
- Short utility files (< 200 lines)
- Quick helper functions
- Configuration scripts
- Simple macros
- Build scripts

**Characteristics**:
- Concise and focused
- Single purpose or tightly related functions
- Minimal dependencies
- Quick to load and evaluate

**Examples**:
```
utils.echo.lsp              # General utilities
config.echo.lsp             # Configuration
macros.echo.lsp             # Helper macros
init.echo.lsp               # Initialization code
helpers.echo.lsp            # Helper functions
```

**Naming Patterns**:
- Single word when possible: `math.echo.lsp`
- Abbreviated: `str-utils.echo.lsp`
- Purpose-driven: `dev-tools.echo.lsp`

#### 5. `.echo.ls` - Minimal Scripts

**When to Use**:
- Very short scripts (< 50 lines)
- Embedded snippets
- One-off utilities
- Startup scripts
- Hook files

**Characteristics**:
- Extremely concise
- Often just a few functions
- Quick execution
- Minimal overhead

**Examples**:
```
boot.echo.ls                # Bootstrap code
setup.echo.ls               # Setup script
hooks.echo.ls               # Event hooks
env.echo.ls                 # Environment setup
load.echo.ls                # Module loader
```

**Naming Patterns**:
- Very short names: `db.echo.ls`
- Action-oriented: `init.echo.ls`
- System-level: `boot.echo.ls`

#### 6. `.echo.s` - Scheme Shorthand

**When to Use**:
- Minimalist Scheme code
- Embedded Scheme snippets
- System-level scripts
- Core boot files
- Performance-critical small files

**Characteristics**:
- Pure Scheme, minimal abstraction
- Often used in embedded contexts
- Fast loading and execution
- Core system files

**Examples**:
```
core.echo.s                 # Core definitions
boot.echo.s                 # Boot sequence
init.echo.s                 # Initialization
base.echo.s                 # Base definitions
prim.echo.s                 # Primitive operations
```

**Naming Patterns**:
- Single syllable when possible: `core.echo.s`
- System-level: `boot.echo.s`
- Abbreviated: `prim.echo.s` (primitives)

## Function Naming Protocols

### Standard Patterns

#### Predicates (Boolean Functions)
```scheme
;; Pattern: name?
empty-list?
valid-email?
is-prime?
has-children?
```

#### Mutators (State-Changing Functions)
```scheme
;; Pattern: name!
set-value!
append!
update-cache!
reset-state!
```

#### Converters (Type Transformations)
```scheme
;; Pattern: from->to
string->number
list->vector
symbol->string
hash->alist
json->object
```

#### Constructors
```scheme
;; Pattern: make-name
make-point
make-tree
make-connection
create-user
```

#### Accessors
```scheme
;; Pattern: name-field or get-name
point-x
point-y
get-width
user-name
tree-left
```

#### Setters
```scheme
;; Pattern: set-name! or name-set!
set-point-x!
set-user-name!
point-x-set!
```

### Advanced Naming Patterns

#### Higher-Order Functions
```scheme
;; Pattern: descriptive-verb
map-over
fold-left
filter-by
reduce-with
transform-using
```

#### Combinators
```scheme
;; Pattern: operation-combinator
compose
curry
partial
memoize
juxt
```

#### Iterators
```scheme
;; Pattern: for-each-thing or thing-each
for-each-line
for-each-node
list-each
tree-walk
```

## Variable Naming Protocols

### Local Variables
```scheme
;; Use descriptive names
(let ((current-value 10)
      (next-state 'ready)
      (user-input "hello"))
  ...)
```

### Constants
```scheme
;; Pattern: UPPER-CASE or *wrapped*
(define MAX-RETRIES 3)
(define *default-port* 8080)
(define PI 3.14159265359)
```

### Global State
```scheme
;; Pattern: *name* (wrapped in asterisks)
(define *global-config* ...)
(define *database-connection* ...)
(define *current-user* ...)
```

## Module and Library Naming

### Module Names
```scheme
;; Pattern: namespace.module
(module math.statistics ...)
(module web.http ...)
(module data.json ...)
```

### Library Files
```
;; Pattern: domain-purpose.echo.ext
math-statistics.echo.scm
web-http-server.echo.lisp
data-json-parser.echo.glisp
```

## Directory Naming Conventions

### Standard Directories

```
lib/                    # Core libraries (lowercase)
examples/              # Example code
tests/                 # Test suites
docs/                  # Documentation
scripts/               # Utility scripts
assets/                # Static assets
config/                # Configuration files
```

### Project-Specific Directories

```
src/                   # Source code
  core/                # Core functionality
  utils/               # Utilities
  api/                 # API implementations
  ui/                  # User interface
build/                 # Build artifacts (gitignored)
dist/                  # Distribution files (gitignored)
```

## Test File Naming

### Pattern: `name-test.echo.ext`

```
list-utils.echo.scm     → list-utils-test.echo.scm
canvas-draw.echo.glisp  → canvas-draw-test.echo.glisp
web-server.echo.lisp    → web-server-test.echo.lisp
```

### Test Function Naming

```scheme
;; Pattern: test-description or name-test
(define (test-list-append) ...)
(define (list-append-test) ...)
(define (test-empty-list-handling) ...)
```

## Documentation File Naming

### Markdown Files
```
README.md              # Project overview
CHANGELOG.md           # Version history
CONTRIBUTING.md        # Contribution guide
API.md                 # API documentation
TUTORIAL.md            # Tutorial content
```

### Module Documentation
```
module-name.echo.scm   → module-name.md
web-api.echo.glisp     → web-api-docs.md
```

## Special File Types

### Configuration Files
```
config.echo.lsp        # Application configuration
settings.echo.ls       # User settings
env.echo.ls            # Environment variables
```

### Build and Script Files
```
build.echo.lsp         # Build script
deploy.echo.lsp        # Deployment script
migrate.echo.scm       # Migration script
```

### Example Files
```
example-basic.echo.scm
example-advanced.echo.glisp
tutorial-01.echo.scm
demo-graphics.echo.glisp
```

## Migration Path for Existing Files

For existing files without the `.echo.` prefix:

### Renaming Strategy

1. **Immediate**: Critical core files
   ```
   core.glisp → core.echo.glisp
   ```

2. **Gradual**: Library files
   ```
   rosetta-primes.glisp → rosetta-primes.echo.glisp
   ```

3. **On Modification**: Update when editing
   ```
   utils.scm → utils.echo.scm (when next modified)
   ```

### Compatibility

- Maintain symbolic links for backward compatibility
- Update import/load statements gradually
- Document deprecated file names

## Pattern Matching for Tools

### Glob Patterns

```bash
# All EchoLisp files
*.echo.*

# Scheme files only
*.echo.scm

# All Lisp variants
*.echo.{lisp,lsp,glisp}

# Short forms
*.echo.{ls,s}

# Test files
*-test.echo.*
```

### Regular Expressions

```regex
# Match all echo files
.*\.echo\.(scm|s|ls|lsp|lisp|glisp)$

# Match specific extension
.*\.echo\.scm$

# Match test files
.*-test\.echo\..*$
```

## Quick Reference Table

| Extension | Primary Use | Typical Size | Portability | Browser Features |
|-----------|-------------|--------------|-------------|------------------|
| `.echo.scm` | Standard Scheme | Any | High | Limited |
| `.echo.glisp` | EchoLisp specific | Medium-Large | Low | Full |
| `.echo.lisp` | Common Lisp style | Medium-Large | Medium | Medium |
| `.echo.lsp` | Short utilities | Small | Medium | Medium |
| `.echo.ls` | Minimal scripts | Very Small | Medium | Limited |
| `.echo.s` | Core Scheme | Small | High | None |

## Examples of Complete File Structures

### Example 1: Web Application

```
my-web-app/
├── core/
│   ├── app.echo.scm           # Main application logic
│   ├── routes.echo.glisp      # Web routes
│   └── models.echo.lisp       # Data models
├── lib/
│   ├── http.echo.glisp        # HTTP utilities
│   ├── json.echo.lsp          # JSON helpers
│   └── auth.echo.scm          # Authentication
├── tests/
│   ├── app-test.echo.scm
│   ├── routes-test.echo.glisp
│   └── models-test.echo.lisp
└── config/
    ├── env.echo.ls            # Environment config
    └── settings.echo.lsp      # App settings
```

### Example 2: Algorithm Library

```
algorithms/
├── sorting/
│   ├── quicksort.echo.scm
│   ├── mergesort.echo.scm
│   └── heapsort.echo.scm
├── searching/
│   ├── binary-search.echo.scm
│   ├── dfs.echo.scm
│   └── bfs.echo.scm
├── utils/
│   ├── compare.echo.lsp
│   └── swap.echo.ls
└── tests/
    ├── sorting-test.echo.scm
    └── searching-test.echo.scm
```

## Compliance Checklist

When creating or renaming files, verify:

- [ ] File includes `.echo.` prefix
- [ ] Appropriate extension chosen for use case
- [ ] File name is descriptive and follows conventions
- [ ] Test file (if applicable) follows naming pattern
- [ ] Documentation updated with new file name
- [ ] Import/load statements updated
- [ ] Build scripts updated if necessary

---

*Last Updated: 2026-01-02*
*Version: 1.0.0*

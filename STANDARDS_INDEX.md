# EchoLisp Standards Index

Welcome to the EchoLisp development standards documentation. This index helps you navigate all the standards, protocols, and guidelines.

## 📚 Documentation Overview

### Core Standards (Start Here)

1. **[STANDARDS_QUICK_REFERENCE.md](./STANDARDS_QUICK_REFERENCE.md)** ⭐ *START HERE*
   - Quick lookup for common patterns
   - File naming rules
   - Function naming conventions
   - Code style basics
   - **Best for:** Quick reference while coding

2. **[DEVELOPMENT_STANDARDS.md](./DEVELOPMENT_STANDARDS.md)** 📖
   - Comprehensive development standards
   - File naming conventions in detail
   - Code organization patterns
   - Documentation requirements
   - Best practices for Scheme/Lisp
   - **Best for:** Understanding the complete standards

3. **[NAMING_PROTOCOLS.md](./NAMING_PROTOCOLS.md)** 🏷️
   - Detailed file extension specifications
   - When to use each extension (.echo.scm, .echo.glisp, etc.)
   - Function and variable naming patterns
   - Directory structure guidelines
   - Migration patterns for existing files
   - **Best for:** Choosing the right file names and extensions

4. **[CODING_PATTERNS.md](./CODING_PATTERNS.md)** 💡
   - Common implementation patterns
   - Data structure patterns
   - Functional programming patterns
   - Web development patterns
   - Error handling strategies
   - Testing patterns
   - Performance optimization
   - **Best for:** Learning how to implement common use cases

### Supporting Documentation

5. **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** 🔄
   - How to transition existing files
   - Migration strategies
   - Batch migration scripts
   - Handling dependencies
   - Testing after migration
   - **Best for:** Converting existing code to new standards

6. **[CONTRIBUTING.md](./CONTRIBUTING.md)** 🤝
   - How to contribute to the repository
   - Repository initialization
   - Pull request guidelines
   - Development workflow
   - **Best for:** Contributing to the project

7. **[README.md](./README.md)** 📝
   - Project overview
   - Getting started
   - Official sources
   - Quick links
   - **Best for:** Understanding what EchoLisp is

### Configuration

8. **[.editorconfig](./.editorconfig)** ⚙️
   - Editor configuration
   - Indentation settings
   - File-specific formatting
   - **Best for:** Automatic code formatting

### Examples

9. **[examples/](./examples/)** 💻
   - Working code examples
   - Demonstrates standards in practice
   - Four complete examples with different extensions
   - **Best for:** Learning by example

## 🎯 Quick Start Guides

### For New Files

1. Read [STANDARDS_QUICK_REFERENCE.md](./STANDARDS_QUICK_REFERENCE.md)
2. Choose appropriate extension from [NAMING_PROTOCOLS.md](./NAMING_PROTOCOLS.md)
3. Copy structure from [examples/](./examples/)
4. Follow patterns from [CODING_PATTERNS.md](./CODING_PATTERNS.md)

### For Existing Files

1. Review [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
2. Choose migration strategy
3. Update file names with `.echo.` prefix
4. Update imports and references
5. Test thoroughly

### For Contributors

1. Read [CONTRIBUTING.md](./CONTRIBUTING.md)
2. Review [DEVELOPMENT_STANDARDS.md](./DEVELOPMENT_STANDARDS.md)
3. Check [examples/](./examples/) for code style
4. Submit pull request following guidelines

## 📋 Common Use Cases

### "I need to create a new Scheme file"
→ Use `.echo.scm` extension, see [NAMING_PROTOCOLS.md](./NAMING_PROTOCOLS.md#1-echoscm---scheme-implementation-files)

### "I'm writing browser-specific code"
→ Use `.echo.glisp` extension, see [examples/web-example.echo.glisp](./examples/web-example.echo.glisp)

### "I need to implement common patterns"
→ See [CODING_PATTERNS.md](./CODING_PATTERNS.md)

### "I'm migrating existing files"
→ Follow [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)

### "I need a quick reference"
→ Use [STANDARDS_QUICK_REFERENCE.md](./STANDARDS_QUICK_REFERENCE.md)

## 🔍 Key Concepts

### The `.echo.` Prefix

**Rule:** All EchoLisp source files MUST use `.echo.` prefix

```
✅ module.echo.scm
✅ utils.echo.glisp
✅ helpers.echo.lsp

❌ module.scm
❌ utils.glisp
❌ helpers.lsp
```

See: [NAMING_PROTOCOLS.md](./NAMING_PROTOCOLS.md#the-echo-prefix-standard)

### Extension Guide

| Extension | Use Case | Example |
|-----------|----------|---------|
| `.echo.scm` | Standard Scheme | `calculator.echo.scm` |
| `.echo.glisp` | EchoLisp-specific | `web-api.echo.glisp` |
| `.echo.lisp` | Common Lisp style | `classes.echo.lisp` |
| `.echo.lsp` | Short utilities | `utils.echo.lsp` |
| `.echo.ls` | Minimal scripts | `init.echo.ls` |
| `.echo.s` | Core Scheme | `boot.echo.s` |

See: [NAMING_PROTOCOLS.md](./NAMING_PROTOCOLS.md#extension-types-and-use-cases)

### Function Naming

```scheme
;; Predicates
empty-list?
is-valid?

;; Mutators
set-value!
update-state!

;; Converters
string->number
list->vector

;; Regular functions
calculate-sum
process-data
```

See: [DEVELOPMENT_STANDARDS.md](./DEVELOPMENT_STANDARDS.md#naming-conventions)

### Code Organization

```scheme
;; ============================================
;; File: module.echo.scm
;; Purpose: Brief description
;; ============================================

;; Private helpers (prefix with % or -)
(define (%internal-helper x) ...)

;; Public API (with documentation)
;; function-name: arg1 arg2 -> result
(define (function-name arg1 arg2) ...)
```

See: [DEVELOPMENT_STANDARDS.md](./DEVELOPMENT_STANDARDS.md#module-structure)

## 📊 Documentation Statistics

- **Total Documentation:** ~60 pages
- **Code Examples:** 4 working files
- **Patterns Documented:** 30+
- **Standards Defined:** Naming, coding, testing, documentation
- **Extensions Covered:** 6 types (.scm, .glisp, .lisp, .lsp, .ls, .s)

## 🎓 Learning Path

### Beginner
1. [STANDARDS_QUICK_REFERENCE.md](./STANDARDS_QUICK_REFERENCE.md)
2. [examples/hello-world.echo.scm](./examples/hello-world.echo.scm)
3. [examples/calculator.echo.scm](./examples/calculator.echo.scm)

### Intermediate
1. [NAMING_PROTOCOLS.md](./NAMING_PROTOCOLS.md)
2. [CODING_PATTERNS.md](./CODING_PATTERNS.md)
3. [examples/list-utils.echo.lsp](./examples/list-utils.echo.lsp)

### Advanced
1. [DEVELOPMENT_STANDARDS.md](./DEVELOPMENT_STANDARDS.md)
2. [CODING_PATTERNS.md](./CODING_PATTERNS.md) (advanced sections)
3. [examples/web-example.echo.glisp](./examples/web-example.echo.glisp)

### Maintainer
1. [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
2. [CONTRIBUTING.md](./CONTRIBUTING.md)
3. All standards documents

## 🔗 Related Resources

### Official EchoLisp Resources
- **Website:** http://www.echolalie.org/echolisp/
- **Documentation:** https://www.echolalie.org/echolisp/help.html
- **Rosetta Code:** https://rosettacode.org/wiki/Category:EchoLisp

### Repository Resources
- **Examples:** [examples/](./examples/)
- **Library Files:** [lib/](./lib/)
- **GitHub Actions:** [.github/workflows/](./.github/workflows/)

## 🆘 Getting Help

### Documentation Issues
- File unclear or incorrect? Open an issue
- Missing information? Suggest improvements
- Found a typo? Submit a PR

### Code Questions
- Review [CODING_PATTERNS.md](./CODING_PATTERNS.md)
- Check [examples/](./examples/)
- Ask in discussions

### Standards Questions
- Check [STANDARDS_QUICK_REFERENCE.md](./STANDARDS_QUICK_REFERENCE.md)
- Review [DEVELOPMENT_STANDARDS.md](./DEVELOPMENT_STANDARDS.md)
- Consult [NAMING_PROTOCOLS.md](./NAMING_PROTOCOLS.md)

## ✅ Compliance Checklist

Use this checklist for new files:

- [ ] File name uses `.echo.` prefix
- [ ] Appropriate extension chosen
- [ ] File header with documentation
- [ ] Functions documented with examples
- [ ] Code follows style guidelines
- [ ] Tests created (if applicable)
- [ ] Imports use correct file names
- [ ] No hardcoded secrets or sensitive data

## 🚀 Next Steps

1. **Start Coding:** Use the standards to create new files
2. **Migrate Files:** Follow the migration guide for existing code
3. **Contribute:** Submit improvements to the standards
4. **Spread the Word:** Share these standards with other developers

## 📝 Version History

- **v1.0.0** (2026-01-02) - Initial release
  - Complete standards documentation
  - Working examples
  - Migration guide
  - Quick reference

---

*This index is maintained as part of the EchoLisp repository*
*For questions or suggestions, open an issue on GitHub*

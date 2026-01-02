# Migration Guide for Existing Files

This guide helps you transition existing EchoLisp files to follow the new naming protocols.

## Overview

The new standard requires all EchoLisp source files to use the `.echo.` prefix before the file extension. This guide provides strategies for migrating existing files.

## Migration Strategies

### Strategy 1: Immediate Migration (Recommended for New Development)

**When to use:** New files and files you're actively modifying

**Steps:**
1. Rename the file to include `.echo.` prefix
2. Update all load/import statements
3. Update documentation references
4. Test to ensure everything works

**Example:**
```bash
# Before
lib/utils.glisp

# After
lib/utils.echo.glisp
```

### Strategy 2: Gradual Migration (For Large Codebases)

**When to use:** Projects with many interdependent files

**Steps:**
1. Create a migration plan identifying file dependencies
2. Start with leaf nodes (files with no dependencies)
3. Work backward through the dependency tree
4. Update imports as you go
5. Test at each stage

**Priority Order:**
1. Files being actively developed
2. Core library files
3. Utility files
4. Example/demo files
5. Legacy/archived files

### Strategy 3: Symbolic Links (For Backward Compatibility)

**When to use:** Need to maintain compatibility with external systems

**Steps:**
1. Rename file to use `.echo.` prefix
2. Create symbolic link with old name
3. Add deprecation warning in file
4. Update documentation
5. Eventually remove symbolic links

**Example:**
```bash
# Rename file
mv utils.glisp utils.echo.glisp

# Create symbolic link for compatibility
ln -s utils.echo.glisp utils.glisp

# Add deprecation notice in file
echo ";; DEPRECATED: Use utils.echo.glisp instead" > utils.glisp.tmp
cat utils.echo.glisp >> utils.glisp.tmp
mv utils.glisp.tmp utils.glisp
```

## Choosing the Right Extension

When migrating, you may need to choose the appropriate extension. Use this guide:

### From `.glisp` Files

Most `.glisp` files should become `.echo.glisp`:

```bash
mv rosetta-primes.glisp rosetta-primes.echo.glisp
mv canvas-draw.glisp canvas-draw.echo.glisp
```

### From `.scm` Files

Standard Scheme files should become `.echo.scm`:

```bash
mv factorial.scm factorial.echo.scm
mv list-utils.scm list-utils.echo.scm
```

### From `.lisp` Files

Common Lisp style files should become `.echo.lisp`:

```bash
mv classes.lisp classes.echo.lisp
mv generics.lisp generics.echo.lisp
```

### From `.lsp` Files

Short utility files should become `.echo.lsp`:

```bash
mv utils.lsp utils.echo.lsp
mv helpers.lsp helpers.echo.lsp
```

### Special Considerations

If the file is:
- **Very short (< 50 lines)**: Consider `.echo.ls`
- **Core/boot file**: Consider `.echo.s`
- **Browser-specific**: Use `.echo.glisp`
- **Portable Scheme**: Use `.echo.scm`

## Updating Import Statements

### Before Migration
```scheme
(load "lib/utils.glisp")
(load "core/functions.scm")
(require "helpers.lsp")
```

### After Migration
```scheme
(load "lib/utils.echo.glisp")
(load "core/functions.echo.scm")
(require "helpers.echo.lsp")
```

### Automated Find and Replace

Use these commands to update imports across your codebase:

```bash
# Find all load statements
grep -r "(load " . --include="*.echo.*"

# Replace .glisp with .echo.glisp in load statements
find . -name "*.echo.*" -exec sed -i 's/(load "\([^"]*\)\.glisp")/(load "\1.echo.glisp")/g' {} \;

# Replace .scm with .echo.scm
find . -name "*.echo.*" -exec sed -i 's/(load "\([^"]*\)\.scm")/(load "\1.echo.scm")/g' {} \;
```

## Migration Checklist

For each file you migrate:

- [ ] Choose appropriate extension (.echo.scm, .echo.glisp, etc.)
- [ ] Rename file with .echo. prefix
- [ ] Update file header if needed
- [ ] Search for all references to the old filename
- [ ] Update load/import statements
- [ ] Update documentation
- [ ] Update build scripts/configs if applicable
- [ ] Test the migrated file
- [ ] Update symbolic links if using compatibility strategy
- [ ] Mark old file as deprecated (if keeping it temporarily)

## Batch Migration Script

Here's a script to help with batch migration:

```bash
#!/bin/bash
# migrate-to-echo.sh
# Usage: ./migrate-to-echo.sh <file>

if [ $# -eq 0 ]; then
    echo "Usage: $0 <file>"
    exit 1
fi

OLD_FILE="$1"
FILENAME=$(basename "$OLD_FILE")
DIRNAME=$(dirname "$OLD_FILE")
EXT="${FILENAME##*.}"
BASENAME="${FILENAME%.*}"

# Create new filename with .echo. prefix
NEW_FILE="${DIRNAME}/${BASENAME}.echo.${EXT}"

echo "Migrating: $OLD_FILE -> $NEW_FILE"

# Rename file
mv "$OLD_FILE" "$NEW_FILE"

# Find and update references
echo "Updating references..."
find . -name "*.echo.*" -type f -exec sed -i "s|$OLD_FILE|$NEW_FILE|g" {} \;

echo "Migration complete!"
echo "Remember to:"
echo "  1. Test the migrated file"
echo "  2. Update documentation"
echo "  3. Review changes before committing"
```

## Example: Migrating a Project

Let's say you have this structure:

```
project/
├── core.glisp
├── utils.scm
└── helpers.lsp
```

**Step 1:** Migrate utils (no dependencies)
```bash
mv utils.scm utils.echo.scm
# Update any imports in other files
```

**Step 2:** Migrate helpers
```bash
mv helpers.lsp helpers.echo.lsp
# Update any imports
```

**Step 3:** Migrate core (depends on utils and helpers)
```bash
mv core.glisp core.echo.glisp
# Update its imports
sed -i 's/(load "utils.scm")/(load "utils.echo.scm")/g' core.echo.glisp
sed -i 's/(load "helpers.lsp")/(load "helpers.echo.lsp")/g' core.echo.glisp
```

**Step 4:** Test
```bash
# Run tests or load in EchoLisp REPL
```

## Handling External Dependencies

If your project references external libraries without the `.echo.` prefix:

### Option 1: Wrapper Files
Create wrapper files that load external libraries:

```scheme
;; File: external-lib.echo.glisp
;; Wrapper for external library

(load "path/to/external-lib.glisp")

;; Re-export needed functions
(define external-function (lambda args (apply external-lib-function args)))
```

### Option 2: Conditional Loading
Use conditional loading for compatibility:

```scheme
;; Try new naming first, fall back to old
(if (file-exists? "lib.echo.glisp")
    (load "lib.echo.glisp")
    (load "lib.glisp"))
```

## Common Issues and Solutions

### Issue: File Not Found After Migration

**Solution:** Check all load statements and ensure paths are updated

```bash
# Find all load statements
grep -r "(load " . --include="*.echo.*"
```

### Issue: Circular Dependencies

**Solution:** Refactor to break circular dependencies or use forward declarations

```scheme
;; Define stub first
(define function-name #f)

;; Load dependent file
(load "dependency.echo.scm")

;; Define actual implementation
(set! function-name (lambda (x) ...))
```

### Issue: Build Scripts Still Reference Old Names

**Solution:** Update build scripts and configuration files

```bash
# Find references in build files
find . -name "*.sh" -o -name "*.yml" -o -name "Makefile" | xargs grep "\.glisp"
```

## Documentation Updates

After migration, update:

1. **README files** - Update file references
2. **API documentation** - Update module paths
3. **Tutorial/guides** - Update code examples
4. **Comments** - Update file references in comments
5. **Build instructions** - Update commands if needed

## Testing After Migration

### Checklist:
- [ ] All files load without errors
- [ ] Functions work as expected
- [ ] Tests pass
- [ ] Documentation builds correctly
- [ ] Examples run successfully

### Test Commands:
```scheme
;; Load and test migrated file
(load "module.echo.scm")
(run-tests)

;; Verify exports
(describe-module 'module)
```

## Rollback Plan

If issues arise:

1. Keep backups of original files
2. Use version control to revert changes
3. Document any issues encountered
4. Adjust migration strategy if needed

```bash
# Revert using git
git checkout -- file.echo.scm
git mv file.echo.scm file.scm
```

## Timeline Recommendations

### For Small Projects (< 50 files)
- Week 1: Plan and prioritize files
- Week 2: Migrate and test
- Week 3: Update documentation

### For Medium Projects (50-200 files)
- Month 1: Plan, migrate core files
- Month 2: Migrate remaining files
- Month 3: Update documentation, remove deprecated files

### For Large Projects (200+ files)
- Quarter 1: Plan and migrate critical files
- Quarter 2: Migrate remaining files in batches
- Quarter 3: Documentation and cleanup
- Quarter 4: Remove all deprecated references

## Getting Help

If you encounter issues during migration:

1. Review the [DEVELOPMENT_STANDARDS.md](./DEVELOPMENT_STANDARDS.md)
2. Check the [examples/](./examples/) directory
3. Open an issue describing your problem
4. Ask in community forums or discussions

## Summary

Migration to the new naming protocol:
- ✅ Improves consistency
- ✅ Clarifies file purposes
- ✅ Enables better tooling
- ✅ Prepares for future enhancements

Take your time, test thoroughly, and migrate systematically. The effort will pay off in improved code organization and maintainability.

---

*Last Updated: 2026-01-02*
*Version: 1.0.0*

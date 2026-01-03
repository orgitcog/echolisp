# Contributing to EchoLisp Repository

## Repository Initialization

This repository is intended to host the EchoLisp implementation from http://www.echolalie.org/echolisp/.

### Automated Sync (Recommended)

The easiest way to initialize the repository is to use the included GitHub Actions workflow:

1. Navigate to the **Actions** tab in this repository
2. Select the **"Sync EchoLisp Content"** workflow
3. Click **"Run workflow"** button
4. The workflow will automatically:
   - Download echolisp.zip from the official source
   - Extract the contents to the repository
   - Commit and push the changes

The workflow also runs automatically on a weekly schedule to check for updates.

### Manual Initialization Steps

If you have access to the official EchoLisp website, you can complete the repository initialization by following these steps:

1. **Download the EchoLisp package**
   ```bash
   wget http://www.echolalie.org/echolisp/echolisp.zip
   # or
   curl -O http://www.echolalie.org/echolisp/echolisp.zip
   ```

2. **Extract the contents**
   ```bash
   unzip echolisp.zip
   ```

3. **Move files to repository**
   ```bash
   # Copy the extracted files to the repository root
   cp -r echolisp/* /path/to/echolisp/repository/
   ```

4. **Update .gitignore if needed**
   Create a `.gitignore` file to exclude any build artifacts or temporary files.

5. **Commit and push**
   ```bash
   git add .
   git commit -m "Initialize repository with EchoLisp content"
   git push
   ```

### Alternative Sources

If the official website is unavailable, try these alternatives:

1. **Internet Archive Wayback Machine**
   - Visit: https://web.archive.org/web/*/http://echolalie.org/echolisp/echolisp.zip
   - Look for a recent snapshot and download the archived version

2. **Community Mirrors**
   - Check if any community members have created mirrors of the EchoLisp package
   - Search GitHub for unofficial mirrors (use caution and verify authenticity)

## Repository Structure

After initialization, the repository should contain:
- `index.html` - Main entry point for running EchoLisp in a browser
- JavaScript files implementing the EchoLisp interpreter
- Documentation and help files
- Example code and libraries

## Development Standards

Before contributing code to this repository, please familiarize yourself with our development standards:

- **[DEVELOPMENT_STANDARDS.md](./DEVELOPMENT_STANDARDS.md)** - Core development standards, file naming conventions, code organization patterns, and best practices
- **[NAMING_PROTOCOLS.md](./NAMING_PROTOCOLS.md)** - Detailed file naming protocols and extension guidelines
- **[CODING_PATTERNS.md](./CODING_PATTERNS.md)** - Common coding patterns and implementation examples

### Key Standards for Contributors

#### File Naming Convention

All new EchoLisp source files **MUST** use the `.echo.` prefix before the file extension:

- ✅ `my-module.echo.scm` - Correct
- ❌ `my-module.scm` - Incorrect

**Supported Extensions:**
- `.echo.scm` - Standard Scheme implementation files
- `.echo.glisp` - EchoLisp-specific features and extensions
- `.echo.lisp` - Common Lisp style implementations
- `.echo.lsp` - Short utility files
- `.echo.ls` - Minimal scripts
- `.echo.s` - Scheme shorthand for core files

See [NAMING_PROTOCOLS.md](./NAMING_PROTOCOLS.md) for detailed guidelines on when to use each extension.

#### Code Style

- Use 2 spaces for indentation
- Follow functional programming principles
- Use descriptive names with kebab-case
- Add documentation comments for public functions
- Write tests for new functionality

#### Commit Messages

Use conventional commit format:
```
feat: add new feature
fix: correct bug
docs: update documentation
refactor: improve code structure
test: add or update tests
```

## Contributing Code

### Process

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Follow the development standards** (see above)
4. **Write tests** for your changes
5. **Update documentation** as needed
6. **Commit your changes** with clear messages
7. **Submit a pull request**

### Pull Request Guidelines

- Ensure all tests pass
- Follow the naming protocols for new files
- Include documentation for new features
- Reference any related issues
- Provide clear description of changes

## Questions?

For questions about EchoLisp itself, refer to:
- Official documentation: https://www.echolalie.org/echolisp/help.html
- Rosetta Code examples: https://rosettacode.org/wiki/Category:EchoLisp

For questions about this repository or contributing:
- Read the [DEVELOPMENT_STANDARDS.md](./DEVELOPMENT_STANDARDS.md)
- Open an issue for discussion
- Check existing issues and pull requests

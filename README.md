# EchoLisp

This repository is intended to host EchoLisp, a JavaScript implementation of a Scheme-like Lisp language that runs in web browsers.

## About EchoLisp

EchoLisp is a feature-rich Lisp dialect with:
- Lexical scoping
- Tail call elimination
- Complex numbers and large integers
- JSON manipulation
- Graphical libraries
- Interactive worksheet interface

## Official Sources

- **Official Website**: http://www.echolalie.org/echolisp/
- **Documentation**: https://www.echolalie.org/echolisp/help.html
- **Download**: http://www.echolalie.org/echolisp/echolisp.zip

## Usage

To run EchoLisp from this repository:
1. Clone or download this repository
2. Open `index.html` in your web browser
3. Start coding in Scheme/Lisp!

Alternatively, you can download the latest version directly from the [official website](http://www.echolalie.org/echolisp/)

## Automated Sync

This repository includes a GitHub Action workflow that automatically attempts to download and sync the EchoLisp content from the official source. The workflow:
- Runs weekly to check for updates
- Can be manually triggered from the Actions tab
- Downloads echolisp.zip from http://www.echolalie.org/echolisp/
- Automatically commits the content when successfully downloaded

To manually trigger the sync:
1. Go to the Actions tab in this repository
2. Select "Sync EchoLisp Content" workflow
3. Click "Run workflow"

## Status

✅ **Ready to use!** The EchoLisp content has been successfully synced from the official source and is ready for offline use.
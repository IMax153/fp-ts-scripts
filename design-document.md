# Design Document

## 1. Considerations

### 1.1 Background

Historically, each library within the `fp-ts` ecosystem has defined its own custom scripts which automate various components of the build and deploy process. The purpose of `fp-ts-scripts` is to create a set of standardized command-line tools which will replace the custom build scripts contained within `fp-ts` ecosystem libraries.

### 1.2 Dependencies

The library production and development dependencies are located in the `package.json` at the root of the project.

### 1.3 Constraints

Each command-line tool has specific requirements which are outlined further in [Section 3](#3-available-commands) below.

### 1.3 System Environment

The goal will be to support execution of `fp-ts-scripts` in all environments where `fp-ts` ecosystem libraries are developed.

## 2. Architecture

### 2.1 Overview

The `fp-ts-scripts` library is designed as a command-line utility which supports various build and deployment functionalities for `fp-ts` ecosystem libraries. Each individual subcommand of the `fp-ts-scripts` CLI tool will have a specific function. For example, the `build` subcommand will be responsible for automating `fp-ts` ecosystem library builds.

## 3. Available Commands

### 3.1 Build

#### 3.1.1 Purpose

The purpose of the `build` command is to compile the specified targets and reorganize the build output to allow for easier library imports. See [this pull request](https://github.com/gcanti/fp-ts/pull/1241) for more details on this issue.

#### 3.1.2 Command

```sh
fp-ts-scripts build
```

#### 3.1.3 Usage

```sh
Usage: fp-ts-scripts build [options]

Compiles source code and reorganizes the build output

Options:
  -b, --build-targets <targets...>  tsconfig.json files to build (default: ["tsconfig.json"])
  -l, --es5-dir <directory>         directory to output the es5 build into (default: "lib")
  -m, --es6-dir <directory>         directory to output the es6 build into (default: "es6")
  -f, --project-files <files...>    project files that should be included in the build (default: [])
  -o, --outDir <directory>          directory to output the build into (default: "dist")
  -s, --srcDir <directory>          directory containing the project source code (default: "src")
  -h, --help                        display help for command
```

### 3.2 Pre-Publish

#### 3.2.1 Purpose

This script is meant to ensure that a library is only released using the "release" script in the library's `package.json`. It should be used in the `package.json` with the "prepublishOnly" hook like:

```json
{
  "scripts": {
    "prepublishOnly" "fp-ts-scripts pre-publish"
  }
}
```

#### 3.2.2 Command

```sh
fp-ts-scripts pre-publish
```

#### 3.2.3 Usage

```sh
Usage: fp-ts-scripts pre-publish [options]

Ensures that pre-publish is never run from the root directory

Options:
  -h, --help  display help for command
```

### 3.3 Release

#### 3.3.1 Purpose

The purpose of this script is to automate the release process for `fp-ts` ecosystem libraries.

#### 3.3.2 Command

```sh
fp-ts-scripts release
```

#### 3.3.3 Usage

```sh
Usage: fp-ts-scripts release [options]

Publishes the specified output directory

Options:
  -o, --output-dir  directory to target for publishing (default: "dist")
  --tag [tag]       registers the published package with the given tag
  -h, --help        display help for command
```

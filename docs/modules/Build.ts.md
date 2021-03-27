---
title: Build.ts
nav_order: 2
parent: Modules
---

## Build overview

Added in v0.0.1

---

<h2 class="text-delta">Table of contents</h2>

- [command](#command)
  - [makeCommand](#makecommand)
- [model](#model)
  - [Artifact (interface)](#artifact-interface)
  - [Build (interface)](#build-interface)
  - [BuildOptions (interface)](#buildoptions-interface)
  - [Capabilities (interface)](#capabilities-interface)
  - [Module (interface)](#module-interface)

---

# command

## makeCommand

**Signature**

```ts
export declare const makeCommand: () => any
```

Added in v0.0.1

# model

## Artifact (interface)

**Signature**

```ts
export interface Artifact {
  readonly source: string
  readonly destination: string
}
```

Added in v0.0.1

## Build (interface)

**Signature**

```ts
export interface Build<A> extends ReaderTaskEither<Capabilities, Error, A> {}
```

Added in v0.0.1

## BuildOptions (interface)

**Signature**

```ts
export interface BuildOptions {
  readonly buildTargets: ReadonlyNonEmptyArray<string>
  readonly es5Dir: string
  readonly es6Dir: string
  readonly outDir: string
  readonly projectFiles: ReadonlyArray<string>
  readonly srcDir: string
}
```

Added in v0.0.1

## Capabilities (interface)

**Signature**

```ts
export interface Capabilities extends BuildOptions, ChildProcess, FileSystem, Logger {}
```

Added in v0.0.1

## Module (interface)

**Signature**

```ts
export interface Module {
  readonly name: string
  readonly buildDirectory: string
  readonly es5: Artifact
  readonly es6: Artifact
  readonly typings: Artifact
  readonly packageJson: Artifact
}
```

Added in v0.0.1

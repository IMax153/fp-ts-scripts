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
  - [Build (interface)](#build-interface)
  - [BuildOptions (interface)](#buildoptions-interface)
  - [Capabilities (interface)](#capabilities-interface)

---

# command

## makeCommand

**Signature**

```ts
export declare const makeCommand: () => any
```

Added in v0.0.1

# model

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
  readonly copyFiles: ReadonlyArray<string>
  readonly mainDir: string
  readonly moduleDir: string
  readonly outputDir: string
}
```

Added in v0.0.1

## Capabilities (interface)

**Signature**

```ts
export interface Capabilities extends BuildOptions, FileSystem {}
```

Added in v0.0.1

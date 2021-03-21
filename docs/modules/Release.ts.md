---
title: Release.ts
nav_order: 7
parent: Modules
---

## Release overview

Added in v0.0.1

---

<h2 class="text-delta">Table of contents</h2>

- [command](#command)
  - [makeCommand](#makecommand)
- [model](#model)
  - [Capabilities (interface)](#capabilities-interface)
  - [Release (interface)](#release-interface)
  - [ReleaseOptions (interface)](#releaseoptions-interface)

---

# command

## makeCommand

**Signature**

```ts
export declare const makeCommand: () => any
```

Added in v0.0.1

# model

## Capabilities (interface)

**Signature**

```ts
export interface Capabilities extends ReleaseOptions {}
```

Added in v0.0.1

## Release (interface)

**Signature**

```ts
export interface Release<A> extends ReaderTaskEither<Capabilities, Error, A> {}
```

Added in v0.0.1

## ReleaseOptions (interface)

**Signature**

```ts
export interface ReleaseOptions {
  readonly outputDir: string
}
```

Added in v0.0.1

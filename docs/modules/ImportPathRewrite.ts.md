---
title: ImportPathRewrite.ts
nav_order: 5
parent: Modules
---

## ImportPathRewrite overview

Added in v0.0.1

---

<h2 class="text-delta">Table of contents</h2>

- [command](#command)
  - [makeCommand](#makecommand)
- [model](#model)
  - [Capabilities (interface)](#capabilities-interface)
  - [Rewrite (interface)](#rewrite-interface)
  - [RewriteOptions (interface)](#rewriteoptions-interface)

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
export interface Capabilities extends FileSystem, RewriteOptions {}
```

Added in v0.0.1

## Rewrite (interface)

**Signature**

```ts
export interface Rewrite<A> extends ReaderTaskEither<Capabilities, Error, A> {}
```

Added in v0.0.1

## RewriteOptions (interface)

**Signature**

```ts
export interface RewriteOptions {
  readonly directories: ReadonlyArray<string>
  readonly from: string
  readonly to: string
}
```

Added in v0.0.1

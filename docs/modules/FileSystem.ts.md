---
title: FileSystem.ts
nav_order: 4
parent: Modules
---

## FileSystem overview

Added in v0.0.1

---

<h2 class="text-delta">Table of contents</h2>

- [instances](#instances)
  - [FileSystem](#filesystem)
- [model](#model)
  - [FileSystem (interface)](#filesystem-interface)

---

# instances

## FileSystem

**Signature**

```ts
export declare const FileSystem: FileSystem
```

Added in v0.0.1

# model

## FileSystem (interface)

**Signature**

```ts
export interface FileSystem {
  readonly readFile: (path: string) => TaskEither<Error, string>
  readonly writeFile: (path: string, content: string) => TaskEither<Error, void>
  readonly modifyFile: (f: Endomorphism<string>) => (path: string) => TaskEither<NodeJS.ErrnoException, void>
  readonly copyFile: (from: string, to: string) => TaskEither<Error, void>
  readonly glob: (pattern: string) => TaskEither<Error, ReadonlyArray<string>>
  readonly mkdir: (path: string) => TaskEither<Error, void>
  readonly moveFile: (from: string, to: string) => TaskEither<Error, void>
}
```

Added in v0.0.1

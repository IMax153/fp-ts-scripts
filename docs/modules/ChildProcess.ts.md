---
title: ChildProcess.ts
nav_order: 3
parent: Modules
---

## ChildProcess overview

Added in v0.0.1

---

<h2 class="text-delta">Table of contents</h2>

- [instances](#instances)
  - [ChildProcess](#childprocess)
- [model](#model)
  - [ChildProcess (interface)](#childprocess-interface)

---

# instances

## ChildProcess

**Signature**

```ts
export declare const ChildProcess: ChildProcess
```

Added in v0.0.1

# model

## ChildProcess (interface)

**Signature**

```ts
export interface ChildProcess {
  readonly exec: (command: string, options?: child_process.ExecOptions) => TaskEither<Error, void>
}
```

Added in v0.0.1

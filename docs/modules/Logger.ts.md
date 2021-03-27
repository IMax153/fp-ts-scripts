---
title: Logger.ts
nav_order: 7
parent: Modules
---

## Logger overview

Added in v0.0.1

---

<h2 class="text-delta">Table of contents</h2>

- [instances](#instances)
  - [Logger](#logger)
- [model](#model)
  - [LogEntry (interface)](#logentry-interface)
  - [LogLevel (type alias)](#loglevel-type-alias)
  - [Logger (interface)](#logger-interface)

---

# instances

## Logger

**Signature**

```ts
export declare const Logger: Logger
```

Added in v0.0.1

# model

## LogEntry (interface)

**Signature**

```ts
export interface LogEntry {
  readonly message: string
  readonly date: Date
  readonly level: LogLevel
}
```

Added in v0.0.1

## LogLevel (type alias)

**Signature**

```ts
export type LogLevel = 'DEBUG' | 'ERROR' | 'INFO' | 'LOG'
```

Added in v0.0.1

## Logger (interface)

**Signature**

```ts
export interface Logger {
  readonly debug: (message: string) => TaskEither<Error, void>
  readonly error: (message: string) => TaskEither<Error, void>
  readonly info: (message: string) => TaskEither<Error, void>
  readonly log: (message: string) => TaskEither<Error, void>
}
```

Added in v0.0.1

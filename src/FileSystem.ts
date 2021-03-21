/**
 * @since 0.0.1
 */
import type { Endomorphism } from 'fp-ts/function'
import { constVoid, flow, pipe } from 'fp-ts/function'
import type { TaskEither } from 'fp-ts/TaskEither'
import * as TE from 'fp-ts/TaskEither'
import * as fs from 'fs'
import G from 'glob'

// -------------------------------------------------------------------------------------
// model
// -------------------------------------------------------------------------------------

/**
 * @category model
 * @since 0.0.1
 */
export interface FileSystem {
  readonly readFile: (path: string) => TaskEither<Error, string>
  readonly writeFile: (path: string, content: string) => TaskEither<Error, void>
  readonly modifyFile: (
    f: Endomorphism<string>
  ) => (path: string) => TaskEither<NodeJS.ErrnoException, void>
  readonly copyFile: (from: string, to: string) => TaskEither<Error, void>
  readonly glob: (pattern: string) => TaskEither<Error, ReadonlyArray<string>>
  readonly mkdir: (path: string) => TaskEither<Error, void>
  readonly moveFile: (from: string, to: string) => TaskEither<Error, void>
}

// -------------------------------------------------------------------------------------
// implementation
// -------------------------------------------------------------------------------------

/**
 * @internal
 */
export const readFile = TE.taskify<fs.PathLike, string, NodeJS.ErrnoException, string>(fs.readFile)

/**
 * @internal
 */
export const writeFile = TE.taskify<fs.PathLike, string, NodeJS.ErrnoException, void>(fs.writeFile)

/**
 * @internal
 */
export const modifyFile = (
  f: Endomorphism<string>
): ((path: string) => TaskEither<NodeJS.ErrnoException, void>) => (path) =>
  pipe(
    readFile(path, 'utf8'),
    TE.map(f),
    TE.chain((content) => writeFile(path, content))
  )

/**
 * @internal
 */
export const copyFile = TE.taskify<fs.PathLike, fs.PathLike, NodeJS.ErrnoException, void>(
  fs.copyFile
)

/**
 * @internal
 */
export const glob = TE.taskify<string, Error, ReadonlyArray<string>>(G)

/**
 * @internal
 */
export const mkdirTE = TE.taskify(fs.mkdir)

/**
 * @internal
 */
export const moveFile = TE.taskify<fs.PathLike, fs.PathLike, NodeJS.ErrnoException, void>(fs.rename)

// -------------------------------------------------------------------------------------
// instances
// -------------------------------------------------------------------------------------

/**
 * @category instances
 * @since 0.0.1
 */
export const FileSystem: FileSystem = {
  readFile: (path) => readFile(path, 'utf8'),
  writeFile,
  modifyFile,
  copyFile,
  glob,
  mkdir: flow(mkdirTE, TE.map(constVoid)),
  moveFile
}

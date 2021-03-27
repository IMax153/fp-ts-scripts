/**
 * @since 0.0.1
 */
import type { Endomorphism } from 'fp-ts/function'
import { constVoid, pipe } from 'fp-ts/function'
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
  readonly mkdir: (path: string, options?: fs.MakeDirectoryOptions) => TaskEither<Error, void>
  readonly moveFile: (from: string, to: string) => TaskEither<Error, void>
  readonly rmdir: (path: string, options?: fs.RmDirOptions) => TaskEither<Error, void>
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
export const moveFile = TE.taskify<fs.PathLike, fs.PathLike, NodeJS.ErrnoException, void>(fs.rename)

/**
 * @internal
 */
export const mkdir = TE.taskify(
  (
    path: fs.PathLike,
    options: fs.MakeDirectoryOptions,
    cb: (err: NodeJS.ErrnoException | null, path?: string) => void
  ) => fs.mkdir(path, options, cb)
)

/**
 * @internal
 */
export const rmdir = TE.taskify(
  (path: fs.PathLike, options: fs.RmDirOptions, cb: fs.NoParamCallback) =>
    fs.rmdir(path, options, cb)
)

/**
 * @internal
 */
export const glob = TE.taskify<string, Error, ReadonlyArray<string>>(G)

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
  moveFile,
  copyFile,
  mkdir: (path: string, options: fs.MakeDirectoryOptions = { recursive: true }) =>
    pipe(mkdir(path, options), TE.map(constVoid)),
  rmdir: (path: string, options: fs.RmDirOptions = { recursive: true }) =>
    pipe(rmdir(path, options), TE.map(constVoid)),
  glob
}

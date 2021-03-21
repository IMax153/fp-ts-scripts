/**
 * @since 0.0.1
 */
import Commander from 'commander'
import * as Console from 'fp-ts/Console'
import * as E from 'fp-ts/Either'
import { constVoid, flow, pipe } from 'fp-ts/function'
import type { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import * as RTE from 'fp-ts/ReaderTaskEither'
import * as RA from 'fp-ts/ReadonlyArray'
import type { Task } from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import * as TD from 'io-ts/TaskDecoder'

import { execute } from './Execute'
import { FileSystem } from './FileSystem'

// -------------------------------------------------------------------------------------
// model
// -------------------------------------------------------------------------------------

/**
 * @category model
 * @since 0.0.1
 */
export interface Rewrite<A> extends ReaderTaskEither<Capabilities, Error, A> {}

/**
 * @category model
 * @since 0.0.1
 */
export interface RewriteOptions {
  readonly directories: ReadonlyArray<string>
  readonly from: string
  readonly to: string
}

/**
 * @category model
 * @since 0.0.1
 */
export interface Capabilities extends FileSystem, RewriteOptions {}

// -------------------------------------------------------------------------------------
// decoders
// -------------------------------------------------------------------------------------

const RewriteOptionsDecoder = TD.struct({
  directories: TD.readonly(TD.array(TD.string)),
  from: TD.string,
  to: TD.string
})

// -------------------------------------------------------------------------------------
// import path rewrite
// -------------------------------------------------------------------------------------

const TARGET_PACKAGES = [
  'fp-ts',
  'monocle-ts',
  'io-ts',
  'io-ts-types',
  'elm-ts',
  'fp-ts-contrib',
  'fp-ts-rxjs',
  'fp-ts-routing',
  'newtype-ts',
  'fp-ts-fluture',
  'parser-ts',
  'retry-ts',
  'hyper-ts',
  'fp—ts-local-storage'
]

const getTargetRegex: Rewrite<RegExp> = pipe(
  RTE.ask<Capabilities>(),
  RTE.map(
    (C) =>
      new RegExp(
        `(\\s(?:from|module)\\s['|"](?:${TARGET_PACKAGES.join('|')}))\\/${
          C.from
        }\\/([\\w-\\/]+['|"])`,
        'gm'
      )
  )
)

const modifyFile = (path: string): Rewrite<void> =>
  pipe(
    RTE.ask<Capabilities>(),
    RTE.chain((C) =>
      pipe(
        getTargetRegex,
        RTE.chainTaskEitherK((regexp) =>
          pipe(
            path,
            C.modifyFile((s) => s.replace(regexp, `$1/${C.to}/$2`)),
            TE.chain(() => TE.rightIO(Console.log(`${path} rewritten`)))
          )
        )
      )
    )
  )

const modifyFiles: (paths: ReadonlyArray<string>) => Rewrite<void> = flow(
  RTE.traverseArray(modifyFile),
  RTE.map(constVoid)
)

const rewrite: Rewrite<void> = pipe(
  RTE.ask<Capabilities>(),
  RTE.chain((C) =>
    pipe(
      C.directories,
      RTE.traverseArray((pattern) =>
        RTE.fromTaskEither<Capabilities, Error, ReadonlyArray<string>>(C.glob(pattern))
      ),
      RTE.map(RA.flatten)
    )
  ),
  RTE.chain(modifyFiles)
)

// -------------------------------------------------------------------------------------
// main
// -------------------------------------------------------------------------------------

const main: (args: unknown) => Task<void> = flow(
  RewriteOptionsDecoder.decode,
  TE.mapLeft(flow(TD.draw, E.toError)),
  TE.chain((args) => rewrite({ ...FileSystem, ...args })),
  execute
)

// -------------------------------------------------------------------------------------
// command
// -------------------------------------------------------------------------------------

/**
 * @category command
 * @since 0.0.1
 */
export const makeCommand = (): Commander.Command =>
  new Commander.Command('import-path-rewrite')
    .description('rewrite fp-ts imports targeting one build directory to another build directory')
    .addOption(
      new Commander.Option(
        '-d, --directories <glob pattern...>',
        'glob patterns of directories to search'
      ).default(['es6/**/*.@(d.ts|js)]', 'dist/es6/**/*.@(d.ts|js)'])
    )
    .option('-f, --from <directory>', 'name of the directory to replace', 'lib')
    .option('-t, --to <directory>', 'name of the directory to use', 'es6')
    .action((args) => main(args)())

/**
 * @since 0.0.1
 */
import Commander from 'commander'
import * as E from 'fp-ts/Either'
import { flow, pipe } from 'fp-ts/function'
import type { Option } from 'fp-ts/Option'
import * as O from 'fp-ts/Option'
import type { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import * as RTE from 'fp-ts/ReaderTaskEither'
import type { Task } from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import type { TaskDecoder } from 'io-ts/TaskDecoder'
import * as TD from 'io-ts/TaskDecoder'

import { ChildProcess } from './ChildProcess'
import { execute } from './Execute'

// -------------------------------------------------------------------------------------
// model
// -------------------------------------------------------------------------------------

/**
 * @category model
 * @since 0.0.1
 */
export interface Release<A> extends ReaderTaskEither<Capabilities, Error, A> {}

/**
 * @category model
 * @since 0.0.1
 */
export interface ReleaseOptions {
  readonly outputDir: string
  readonly tag: Option<string>
}

/**
 * @category model
 * @since 0.0.1
 */
export interface Capabilities extends ChildProcess, ReleaseOptions {}

// -------------------------------------------------------------------------------------
// decoders
// -------------------------------------------------------------------------------------

const ReleaseOptionsDecoder: TaskDecoder<unknown, ReleaseOptions> = TD.struct({
  outputDir: TD.string,
  tag: pipe(
    TD.nullable(TD.string),
    TD.map((tag) => O.fromNullable(tag))
  )
})

// -------------------------------------------------------------------------------------
// release
// -------------------------------------------------------------------------------------

const release: Release<void> = pipe(
  RTE.ask<Capabilities>(),
  RTE.chainTaskEitherK((C) =>
    pipe(
      C.tag,
      O.fold(
        () => C.exec('npm publish', { cwd: C.outputDir }),
        (tag) => C.exec(`npm publish --tag=${tag}`, { cwd: C.outputDir })
      )
    )
  )
)

// -------------------------------------------------------------------------------------
// main
// -------------------------------------------------------------------------------------

const main: (args: unknown) => Task<void> = flow(
  ReleaseOptionsDecoder.decode,
  TE.mapLeft(flow(TD.draw, E.toError)),
  TE.chain((opts) => release({ ...ChildProcess, ...opts })),
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
  new Commander.Command('release')
    .description('Publishes the specified output directory')
    .option('-o, --output-dir', 'directory to target for publishing', 'dist')
    .option('--tag [tag]', 'registers the published package with the given tag')
    .action((args) => main(args)())

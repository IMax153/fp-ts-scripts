/**
 * @since 0.0.1
 */
import * as child_process from 'child_process'
import Commander from 'commander'
import * as E from 'fp-ts/Either'
import { flow, pipe } from 'fp-ts/function'
import type { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import * as RTE from 'fp-ts/ReaderTaskEither'
import type { Task } from 'fp-ts/Task'
import type { TaskEither } from 'fp-ts/TaskEither'
import * as TE from 'fp-ts/TaskEither'
import * as TD from 'io-ts/TaskDecoder'

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
}

/**
 * @category model
 * @since 0.0.1
 */
export interface Capabilities extends ReleaseOptions {}

// -------------------------------------------------------------------------------------
// decoders
// -------------------------------------------------------------------------------------

const ReleaseOptionsDecoder = TD.struct({
  outputDir: TD.string
})

// -------------------------------------------------------------------------------------
// child process
// -------------------------------------------------------------------------------------

const exec = (cmd: string, args?: child_process.ExecOptions): TaskEither<Error, void> => () =>
  new Promise((resolve) => {
    child_process.exec(cmd, args, (err) => {
      if (err != null) {
        return resolve(E.left(err))
      }
      return resolve(E.right(undefined))
    })
  })

// -------------------------------------------------------------------------------------
// release
// -------------------------------------------------------------------------------------

const release: Release<void> = pipe(
  RTE.ask<Capabilities>(),
  RTE.chainTaskEitherK((C) => exec('npm publish', { cwd: C.outputDir }))
)

// -------------------------------------------------------------------------------------
// main
// -------------------------------------------------------------------------------------

const main: (args: unknown) => Task<void> = flow(
  ReleaseOptionsDecoder.decode,
  TE.mapLeft(flow(TD.draw, E.toError)),
  TE.chain((opts) => release({ ...opts })),
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
    .description('publish the specified output directory')
    .option('-o, --output-dir', 'directory to target for publishing', 'dist')
    .action((args) => main(args)())

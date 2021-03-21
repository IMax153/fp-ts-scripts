/**
 * @since 0.0.1
 */
import chalk from 'chalk'
import * as Console from 'fp-ts/Console'
import { pipe } from 'fp-ts/function'
import type { IO } from 'fp-ts/IO'
import * as I from 'fp-ts/IO'
import type { Task } from 'fp-ts/Task'
import * as T from 'fp-ts/Task'
import type { TaskEither } from 'fp-ts/TaskEither'
import * as TE from 'fp-ts/TaskEither'

// -------------------------------------------------------------------------------------
// utils
// -------------------------------------------------------------------------------------

const exit = (code: 0 | 1): IO<void> => () => process.exit(code)

const onLeft = (e: Error): Task<void> =>
  T.fromIO(
    pipe(
      Console.log(chalk.bold.red('Unexpected Error!')),
      I.chain(() => Console.error(e)),
      I.chain(() => exit(1))
    )
  )

const onRight: Task<void> = pipe(
  T.fromIO(Console.log(chalk.bold.green('Finished!'))),
  T.chain(() => T.fromIO(exit(0)))
)

/**
 * @category utils
 * @since 0.0.1
 */
export const execute = <A>(script: TaskEither<Error, A>): Task<void> =>
  pipe(
    script,
    TE.fold(onLeft, () => onRight)
  )

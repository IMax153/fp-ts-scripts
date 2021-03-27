/**
 * @since 0.0.1
 */
import * as child_process from 'child_process'
import * as E from 'fp-ts/Either'
import type { TaskEither } from 'fp-ts/TaskEither'

// -----------------------------------------------------------------------------
// model
// -----------------------------------------------------------------------------

/**
 * @category model
 * @since 0.0.1
 */
export interface ChildProcess {
  readonly exec: (command: string, options?: child_process.ExecOptions) => TaskEither<Error, void>
}

// -----------------------------------------------------------------------------
// implementation
// -----------------------------------------------------------------------------

/**
 * @internal
 */
export const exec = (
  command: string,
  options?: child_process.ExecOptions
): TaskEither<Error, void> => () =>
  new Promise((resolve) => {
    child_process.exec(command, options, (err) => {
      if (err != null) {
        return resolve(E.left(err))
      }
      return resolve(E.right(undefined))
    })
  })

// -----------------------------------------------------------------------------
// instances
// -----------------------------------------------------------------------------

/**
 * @category instances
 * @since 0.0.1
 */
export const ChildProcess: ChildProcess = {
  exec
}

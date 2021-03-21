/**
 * @since 0.0.1
 */
import Commander from 'commander'
import { pipe } from 'fp-ts/function'
import type { Task } from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'

import { execute } from './Execute'

// -------------------------------------------------------------------------------------
// main
// -------------------------------------------------------------------------------------

const main: Task<void> = pipe(
  TE.left(new Error('"npm publish" can not be run from root, run "npm run release" instead')),
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
  new Commander.Command('pre-publish').description('pre-publish script').action(main)

/**
 * @since 0.0.1
 */
import chalk from 'chalk'
import * as C from 'fp-ts/Console'
import * as D from 'fp-ts/Date'
import { pipe } from 'fp-ts/function'
import * as M from 'fp-ts/Monoid'
import * as S from 'fp-ts/Show'
import * as T from 'fp-ts/Task'
import type { TaskEither } from 'fp-ts/TaskEither'
import * as TE from 'fp-ts/TaskEither'
import * as L from 'logging-ts/lib/Task'

// -------------------------------------------------------------------------------------
// model
// -------------------------------------------------------------------------------------

/**
 * @category model
 * @since 0.0.1
 */
export interface Logger {
  readonly debug: (message: string) => TaskEither<Error, void>
  readonly error: (message: string) => TaskEither<Error, void>
  readonly info: (message: string) => TaskEither<Error, void>
  readonly log: (message: string) => TaskEither<Error, void>
}

/**
 * @category model
 * @since 0.0.1
 */
export type LogLevel = 'DEBUG' | 'ERROR' | 'INFO' | 'LOG'

/**
 * @category model
 * @since 0.0.1
 */
export interface LogEntry {
  readonly message: string
  readonly date: Date
  readonly level: LogLevel
}

// -------------------------------------------------------------------------------------
// constructors
// -------------------------------------------------------------------------------------

/**
 * @internal
 */
export const LogEntry = (message: string, date: Date, level: LogLevel): LogEntry => ({
  message,
  date,
  level
})

// -------------------------------------------------------------------------------------
// implementation
// -------------------------------------------------------------------------------------

const getLoggerEntry = (
  withColor: (...message: ReadonlyArray<string>) => string
): L.LoggerTask<LogEntry> => (entry) => T.fromIO(C.log(withColor(showEntry.show(entry))))

const debugLogger = L.filter(getLoggerEntry(chalk.gray), (e) => e.level === 'DEBUG')

const errorLogger = L.filter(getLoggerEntry(chalk.bold.red), (e) => e.level === 'ERROR')

const infoLogger = L.filter(getLoggerEntry(chalk.bold.magenta), (e) => e.level === 'INFO')

const logLogger = L.filter(getLoggerEntry(chalk.cyan), (e) => e.level === 'LOG')

const mainLogger = pipe(
  [debugLogger, errorLogger, infoLogger, logLogger],
  M.concatAll(L.getMonoid<LogEntry>())
)

const logWithLevel = (level: LogLevel) => (message: string): T.Task<void> =>
  pipe(
    T.fromIO(D.create),
    T.chain((date) => mainLogger({ message, date, level }))
  )

/**
 * @internal
 */
export const debug: (message: string) => T.Task<void> = logWithLevel('DEBUG')

/**
 * @internal
 */
export const error: (message: string) => T.Task<void> = logWithLevel('ERROR')

/**
 * @internal
 */
export const info: (message: string) => T.Task<void> = logWithLevel('INFO')

/**
 * @internal
 */
export const log: (message: string) => T.Task<void> = logWithLevel('LOG')

// -------------------------------------------------------------------------------------
// instances
// -------------------------------------------------------------------------------------

const showDate: S.Show<Date> = {
  show: (date) => `${date.toLocaleDateString()} | ${date.toLocaleTimeString()}`
}

/**
 * @internal
 */
export const showEntry: S.Show<LogEntry> = {
  show: ({ date, level, message }) => `${showDate.show(date)} | ${level} | ${message}`
}

/**
 * @category instances
 * @since 0.0.1
 */
export const Logger: Logger = {
  debug: (message) => pipe(TE.fromTask<Error, void>(debug(message))),
  error: (message) => pipe(TE.fromTask<Error, void>(error(message))),
  info: (message) => pipe(TE.fromTask<Error, void>(info(message))),
  log: (message) => pipe(TE.fromTask<Error, void>(log(message)))
}

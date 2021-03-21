/**
 * @since 0.0.1
 */
import Commander from 'commander'
import * as E from 'fp-ts/Either'
import type { Endomorphism } from 'fp-ts/function'
import { constVoid, flow, pipe } from 'fp-ts/function'
import * as Json from 'fp-ts/Json'
import type { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import * as RTE from 'fp-ts/ReaderTaskEither'
import * as RA from 'fp-ts/ReadonlyArray'
import type { Task } from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import * as TD from 'io-ts/TaskDecoder'
import * as Path from 'path'

import { execute } from './Execute'
import { FileSystem } from './FileSystem'

// -------------------------------------------------------------------------------------
// model
// -------------------------------------------------------------------------------------

/**
 * @category model
 * @since 0.0.1
 */
export interface Build<A> extends ReaderTaskEither<Capabilities, Error, A> {}

/**
 * @category model
 * @since 0.0.1
 */
export interface BuildOptions {
  readonly copyFiles: ReadonlyArray<string>
  readonly mainDir: string
  readonly moduleDir: string
  readonly outputDir: string
}

/**
 * @category model
 * @since 0.0.1
 */
export interface Capabilities extends BuildOptions, FileSystem {}

// -------------------------------------------------------------------------------------
// decoders
// -------------------------------------------------------------------------------------

const PACKAGE_JSON = 'package.json'

const BuildOptionsDecoder = TD.struct({
  copyFiles: TD.readonly(TD.array(TD.string)),
  mainDir: TD.string,
  moduleDir: TD.string,
  outputDir: TD.string
})

const PackageJsonDecoder = TD.partial({
  scripts: TD.record(TD.string),
  files: TD.array(TD.string),
  devDependencies: TD.record(TD.string)
})

// -------------------------------------------------------------------------------------
// files
// -------------------------------------------------------------------------------------

const copyPackageJson: Build<void> = pipe(
  RTE.ask<Capabilities>(),
  RTE.chainTaskEitherK((C) =>
    pipe(
      C.readFile(Path.join(process.cwd(), PACKAGE_JSON)),
      TE.chainEitherK(flow(Json.parse, E.mapLeft(E.toError))),
      TE.chain(flow(PackageJsonDecoder.decode, TE.mapLeft(flow(TD.draw, E.toError)))),
      TE.map(({ devDependencies, files, scripts, ...rest }) => rest),
      TE.chain((pkg) =>
        TE.fromEither(E.tryCatch(() => JSON.stringify(pkg, undefined, 2), E.toError))
      ),
      TE.chain((json) => C.writeFile(Path.join(process.cwd(), C.outputDir, PACKAGE_JSON), json))
    )
  )
)

const copyFiles: Build<void> = pipe(
  RTE.ask<Capabilities>(),
  RTE.chainTaskEitherK((C) =>
    pipe(
      C.copyFiles,
      TE.traverseArray((from) => C.copyFile(from, Path.join(process.cwd(), C.outputDir, from)))
    )
  ),
  RTE.map(constVoid)
)

// -------------------------------------------------------------------------------------
// modules
// -------------------------------------------------------------------------------------

const getModules: Endomorphism<ReadonlyArray<string>> = flow(
  RA.map((filePath) => Path.basename(filePath, '.js')),
  RA.filter((name) => name !== 'index')
)

const makePackageJson = (module: string): Build<string> =>
  pipe(
    RTE.ask<Capabilities>(),
    RTE.chain((C) => {
      const packageJson = {
        main: `../${C.mainDir}/${module}.js`,
        module: `../${C.moduleDir}/${module}.js`,
        typings: module === 'HKT' ? '../HKT.d.ts' : `../${C.mainDir}/${module}.d.ts`,
        sideEffects: false
      }
      return RTE.fromEither(E.tryCatch(() => JSON.stringify(packageJson, undefined, 2), E.toError))
    })
  )

const makeModule = (moduleName: string): Build<void> =>
  pipe(
    RTE.ask<Capabilities>(),
    RTE.chain((C) =>
      pipe(
        RTE.fromTaskEither<Capabilities, Error, void>(
          C.mkdir(Path.join(process.cwd(), C.outputDir, moduleName))
        ),
        RTE.chain(() => makePackageJson(moduleName)),
        RTE.chainTaskEitherK((data) =>
          C.writeFile(Path.join(process.cwd(), moduleName, PACKAGE_JSON), data)
        )
      )
    ),
    RTE.map(constVoid)
  )

const fixHKT = (subDir: string): Build<void> =>
  pipe(
    RTE.ask<Capabilities>(),
    RTE.chainTaskEitherK((C) =>
      pipe(
        C.mkdir(Path.join(process.cwd(), C.outputDir, subDir, 'HKT')),
        TE.chain(() =>
          TE.fromEither(
            E.tryCatch(() => JSON.stringify({ typings: '../../HKT.d.ts' }, undefined, 2), E.toError)
          )
        ),
        TE.chain((pkg) => C.writeFile(Path.join(process.cwd(), subDir, 'HKT', PACKAGE_JSON), pkg)),
        TE.chain(() =>
          C.moveFile(
            Path.join(process.cwd(), C.outputDir, subDir, 'HKT.js'),
            Path.join(process.cwd(), C.outputDir, subDir, 'HKT', 'index.js')
          )
        ),
        TE.chain(() =>
          C.moveFile(
            Path.join(process.cwd(), subDir, 'HKT.d.ts'),
            Path.join(process.cwd(), C.outputDir, 'HKT.d.ts')
          )
        )
      )
    )
  )

const makeModules: Build<void> = pipe(
  RTE.ask<Capabilities>(),
  RTE.chainTaskEitherK((C) => pipe(C.glob(`${C.outputDir}/${C.mainDir}/*.js`), TE.map(getModules))),
  RTE.chain(RTE.traverseArray(makeModule)),
  RTE.map(constVoid)
)

const build: Build<void> = pipe(
  RTE.ask<Capabilities>(),
  RTE.chain((C) =>
    pipe(
      copyPackageJson,
      RTE.chain(() => copyFiles),
      RTE.chain(() => makeModules),
      RTE.chain(() => fixHKT(C.moduleDir)),
      RTE.chain(() => fixHKT(C.mainDir))
    )
  )
)

// -------------------------------------------------------------------------------------
// main
// -------------------------------------------------------------------------------------

const main: (args: unknown) => Task<void> = flow(
  BuildOptionsDecoder.decode,
  TE.mapLeft(flow(TD.draw, E.toError)),
  TE.chain((opts) => build({ ...FileSystem, ...opts })),
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
  new Commander.Command('build')
    .description('re-build compiled fp-ts source code to allow for direct module imports')
    .addOption(
      new Commander.Option(
        '-c, --copy-files <files...>',
        'files to copy into the root build directory'
      ).default(['CHANGELOG.md', 'LICENSE', 'README.md'])
    )
    .option('-l, --main-dir <directory>', 'directory to output the main build into', 'lib')
    .option('-e, --module-dir <directory>', 'directory to output the es6 build into', 'es6')
    .option('-o, --outputDir <directory>', 'directory to output the build into', 'dist')
    .action((args) => main(args)())

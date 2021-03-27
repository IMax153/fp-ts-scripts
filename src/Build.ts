/**
 * @since 0.0.1
 */
import Commander from 'commander'
import * as E from 'fp-ts/Either'
import { constVoid, flow, pipe } from 'fp-ts/function'
import * as Json from 'fp-ts/Json'
import type { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import * as RTE from 'fp-ts/ReaderTaskEither'
import * as RA from 'fp-ts/ReadonlyArray'
import { ReadonlyNonEmptyArray } from 'fp-ts/ReadonlyNonEmptyArray'
import type { ReadonlyRecord } from 'fp-ts/ReadonlyRecord'
import type { Task } from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import type { TaskDecoder } from 'io-ts/TaskDecoder'
import * as TD from 'io-ts/TaskDecoder'
import type { ParsedPath } from 'path'
import * as Path from 'path'

import { ChildProcess } from './ChildProcess'
import { execute } from './Execute'
import { FileSystem } from './FileSystem'
import { Logger } from './Logger'

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
  readonly buildTargets: ReadonlyNonEmptyArray<string>
  readonly es5Dir: string
  readonly es6Dir: string
  readonly outDir: string
  readonly projectFiles: ReadonlyArray<string>
  readonly srcDir: string
}

/**
 * @category model
 * @since 0.0.1
 */
export interface Capabilities extends BuildOptions, ChildProcess, FileSystem, Logger {}

export interface PackageJson {
  readonly scripts?: ReadonlyRecord<string, string>
  readonly files?: ReadonlyArray<string>
  readonly devDependencies?: ReadonlyRecord<string, string>
}

/**
 * @category model
 * @since 0.0.1
 */
export interface Artifact {
  readonly source: string
  readonly destination: string
}

/**
 * @category model
 * @since 0.0.1
 */
export interface Module {
  readonly name: string
  readonly buildDirectory: string
  readonly es5: Artifact
  readonly es6: Artifact
  readonly typings: Artifact
  readonly packageJson: Artifact
}

// -------------------------------------------------------------------------------------
// decoders
// -------------------------------------------------------------------------------------

const PACKAGE_JSON = 'package.json'

const BuildOptionsDecoder: TaskDecoder<unknown, BuildOptions> = TD.struct({
  buildTargets: pipe(TD.readonly(TD.array(TD.string)), TD.refine(RA.isNonEmpty, 'buildTargets')),
  es5Dir: TD.string,
  es6Dir: TD.string,
  outDir: TD.string,
  projectFiles: TD.readonly(TD.array(TD.string)),
  srcDir: TD.string
})

// -----------------------------------------------------------------------------
// constructors
// -----------------------------------------------------------------------------

const artifact = (source: string, destination: string): Artifact => ({
  source,
  destination
})

const module = (
  name: string,
  buildDirectory: string,
  es5: Artifact,
  es6: Artifact,
  typings: Artifact,
  packageJson: Artifact
): Module => ({
  name,
  buildDirectory,
  es5,
  es6,
  typings,
  packageJson
})

// -------------------------------------------------------------------------------------
// files
// -------------------------------------------------------------------------------------

const getModuleSubdirectory = (path: ParsedPath): Build<string> =>
  pipe(
    RTE.ask<Capabilities>(),
    RTE.map((C) => path.dir.replace(C.srcDir, ''))
  )

const getModuleBuildDirectory = (path: ParsedPath, subDirectory: string): Build<string> =>
  pipe(
    RTE.ask<Capabilities>(),
    RTE.chainTaskEitherK((C) =>
      pipe(
        TE.of(Path.join(C.outDir, subDirectory, path.name)),
        TE.chainFirst((buildDirectory) =>
          C.log(`Building module "${path.name}${path.ext}" into directory "${buildDirectory}"`)
        )
      )
    )
  )

const getModuleES5Artifact = (name: string, subDirectory: string): Build<Artifact> =>
  pipe(
    RTE.ask<Capabilities>(),
    RTE.chainTaskEitherK((C) =>
      pipe(
        TE.Do,
        TE.bind('tsBuildPath', () =>
          TE.of(Path.join(C.outDir, C.es5Dir, subDirectory, `${name}.js`))
        ),
        TE.chainFirst(({ tsBuildPath }) => C.debug(`Reading es5 build from "${tsBuildPath}"`)),
        TE.bind('source', ({ tsBuildPath }) => C.readFile(tsBuildPath)),
        TE.bind('destination', () => TE.of(Path.join(C.outDir, subDirectory, name, `${name}.js`))),
        TE.map(({ destination, source }) => artifact(source, destination))
      )
    )
  )

const getModuleES6Artifact = (name: string, subDirectory: string): Build<Artifact> =>
  pipe(
    RTE.ask<Capabilities>(),
    RTE.chainTaskEitherK((C) =>
      pipe(
        TE.Do,
        TE.bind('tsBuildPath', () =>
          TE.of(Path.join(C.outDir, C.es6Dir, subDirectory, `${name}.js`))
        ),
        TE.chainFirst(({ tsBuildPath }) => C.debug(`Reading es6 build from "${tsBuildPath}"`)),
        TE.bind('source', ({ tsBuildPath }) => C.readFile(tsBuildPath)),
        TE.bind('destination', () =>
          TE.of(Path.join(C.outDir, subDirectory, name, `${name}.${C.es6Dir}.js`))
        ),
        TE.map(({ destination, source }) => artifact(source, destination))
      )
    )
  )

const getModuleTypingsArtifact = (name: string, subDirectory: string): Build<Artifact> =>
  pipe(
    RTE.ask<Capabilities>(),
    RTE.chainTaskEitherK((C) =>
      pipe(
        TE.Do,
        TE.bind('tsBuildPath', () =>
          TE.of(Path.join(C.outDir, C.es5Dir, subDirectory, `${name}.d.ts`))
        ),
        TE.chainFirst(({ tsBuildPath }) => C.debug(`Acquiring typings from "${tsBuildPath}"`)),
        TE.bind('source', ({ tsBuildPath }) => C.readFile(tsBuildPath)),
        TE.bind('destination', () =>
          TE.of(Path.join(C.outDir, subDirectory, name, `${name}.d.ts`))
        ),
        TE.map(({ destination, source }) => artifact(source, destination))
      )
    )
  )

const getModulePackageJsonArtifact = (name: string, subDirectory: string): Build<Artifact> =>
  pipe(
    RTE.ask<Capabilities>(),
    RTE.map((C) => {
      const source = `{
  "main": "./${name}.js",
  "module": "./${name}.${C.es6Dir}.js",
  "typings": "./${name}.d.ts",
  "sideEffects": false
}`
      const destination = Path.join(C.outDir, subDirectory, name, PACKAGE_JSON)

      return artifact(source, destination)
    })
  )

const getModulePaths: Build<ReadonlyArray<ParsedPath>> = pipe(
  RTE.ask<Capabilities>(),
  RTE.chainTaskEitherK((C) =>
    pipe(
      C.glob(`${C.srcDir}/**/*.ts`),
      TE.chain(TE.traverseSeqArray((path) => TE.of(Path.parse(path)))),
      TE.chainFirst(
        TE.traverseSeqArray((module) =>
          C.debug(`Module found at "${Path.join(module.dir, `${module.name}${module.ext}`)}"`)
        )
      ),
      TE.chainFirst((modules) => C.info(`Found ${modules.length} modules, starting build...`))
    )
  )
)

const getModule = (path: ParsedPath): Build<Module> =>
  pipe(
    RTE.Do,
    RTE.bind('subDirectory', () => getModuleSubdirectory(path)),
    RTE.bind('buildDirectory', ({ subDirectory }) => getModuleBuildDirectory(path, subDirectory)),
    RTE.bind('es5', ({ subDirectory }) => getModuleES5Artifact(path.name, subDirectory)),
    RTE.bind('es6', ({ subDirectory }) => getModuleES6Artifact(path.name, subDirectory)),
    RTE.bind('typings', ({ subDirectory }) => getModuleTypingsArtifact(path.name, subDirectory)),
    RTE.bind('packageJson', ({ subDirectory }) =>
      getModulePackageJsonArtifact(path.name, subDirectory)
    ),
    RTE.map(({ buildDirectory, es5, es6, packageJson, typings }) =>
      module(path.name, buildDirectory, es5, es6, typings, packageJson)
    )
  )

const writeModule = (module: Module): Build<void> =>
  pipe(
    RTE.ask<Capabilities>(),
    RTE.chainTaskEitherK((C) =>
      pipe(
        C.mkdir(module.buildDirectory),
        TE.chain(() =>
          C.debug(`Writing es5 build for module "${module.name}" to "${module.es5.destination}"`)
        ),
        TE.chain(() => C.writeFile(module.es5.destination, module.es5.source)),
        TE.chain(() =>
          C.debug(`Writing es6 build for module "${module.name}" to "${module.es6.destination}"`)
        ),
        TE.chain(() => C.writeFile(module.es6.destination, module.es6.source)),
        TE.chain(() =>
          C.debug(`Writing typings for module "${module.name}" to "${module.typings.destination}"`)
        ),
        TE.chain(() => C.writeFile(module.typings.destination, module.typings.source)),
        TE.chain(() =>
          C.debug(
            `Writing ${PACKAGE_JSON} for module "${module.name}" to "${module.packageJson.destination}"`
          )
        ),
        TE.chain(() => C.writeFile(module.packageJson.destination, module.packageJson.source))
      )
    )
  )

const buildModules: Build<void> = pipe(
  getModulePaths,
  RTE.chain(RTE.traverseSeqArray(flow(getModule, RTE.chain(writeModule)))),
  RTE.map(constVoid)
)

const copyProjectFiles: Build<void> = pipe(
  RTE.ask<Capabilities>(),
  RTE.chainTaskEitherK((C) =>
    pipe(
      C.log(`Copying project files to "${C.outDir}"`),
      TE.chain(() =>
        pipe(
          C.projectFiles,
          TE.traverseArray((file) =>
            pipe(
              C.debug(`Copying "${file}"`),
              TE.chain(() => C.copyFile(file, Path.join(C.outDir, file)))
            )
          )
        )
      ),
      TE.map(constVoid)
    )
  )
)

const writeProjectPackageJson: Build<void> = pipe(
  RTE.ask<Capabilities>(),
  RTE.chainTaskEitherK((C) =>
    pipe(
      C.log(`Copying project "${PACKAGE_JSON}" to "${C.outDir}"`),
      TE.chain(() => C.readFile(PACKAGE_JSON)),
      TE.chainEitherK((s) =>
        pipe(
          Json.parse(s),
          E.bimap(
            () => new Error('Invalid package.json'),
            (json): Json.Json => {
              const clone = {
                main: `index/index.js`,
                module: `index/index.${C.es6Dir}.js`,
                typings: `index/index.d.ts`,
                sideEffects: false,
                ...(json as any)
              }

              delete clone.devDependencies
              delete clone.files
              delete clone.scripts

              return clone
            }
          )
        )
      ),
      TE.chainEitherK(
        E.tryCatchK((packageJson) => JSON.stringify(packageJson, undefined, 2), E.toError)
      ),
      TE.chain((json) => C.writeFile(Path.join(C.outDir, PACKAGE_JSON), json))
    )
  )
)

const buildTypescript: Build<void> = pipe(
  RTE.ask<Capabilities>(),
  RTE.chainTaskEitherK((C) =>
    pipe(
      C.log('Starting typescript builds'),
      TE.chain(() =>
        pipe(
          C.buildTargets,
          TE.traverseSeqArray((target) =>
            pipe(
              C.debug(`Building typescript target with "${target}"`),
              TE.chain(() => C.exec(`tsc -p ${target}`))
            )
          )
        )
      ),
      TE.map(constVoid)
    )
  )
)

const begin: Build<void> = pipe(
  RTE.ask<Capabilities>(),
  RTE.chainTaskEitherK((C) =>
    C.log(`Building modules from directory "${C.srcDir}" into directory "${C.outDir}"`)
  )
)

const cleanup: Build<void> = pipe(
  RTE.ask<Capabilities>(),
  RTE.chainTaskEitherK((C) =>
    pipe(
      TE.Do,
      TE.bind('es5Dir', () => TE.of(Path.join(C.outDir, C.es5Dir))),
      TE.bind('es6Dir', () => TE.of(Path.join(C.outDir, C.es6Dir))),
      TE.chainFirst(() => C.log(`Starting cleanup...`)),
      TE.chainFirst(({ es5Dir }) =>
        pipe(
          C.debug(`Removing "${es5Dir}"`),
          TE.chain(() => C.rmdir(es5Dir))
        )
      ),
      TE.chain(({ es6Dir }) =>
        pipe(
          C.debug(`Removing "${es6Dir}"`),
          TE.chain(() => C.rmdir(es6Dir))
        )
      )
    )
  )
)

const build: Build<void> = pipe(
  begin,
  RTE.chain(() => buildTypescript),
  RTE.chain(() => buildModules),
  RTE.chain(() => copyProjectFiles),
  RTE.chain(() => writeProjectPackageJson),
  RTE.chain(() => cleanup)
)

// -------------------------------------------------------------------------------------
// main
// -------------------------------------------------------------------------------------

const main: (args: unknown) => Task<void> = flow(
  BuildOptionsDecoder.decode,
  TE.mapLeft(flow(TD.draw, E.toError)),
  TE.chain((opts) => build({ ...ChildProcess, ...FileSystem, ...Logger, ...opts })),
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
    .description('Compiles source code and reorganizes the build output')
    .addOption(
      new Commander.Option(
        '-b, --build-targets <targets...>',
        'tsconfig.json files to build'
      ).default(['tsconfig.json'])
    )
    .option('-l, --es5-dir <directory>', 'directory to output the es5 build into', 'lib')
    .option('-m, --es6-dir <directory>', 'directory to output the es6 build into', 'es6')
    .addOption(
      new Commander.Option(
        '-f, --project-files <files...>',
        'project files that should be included in the build'
      ).default([])
    )
    .option('-o, --outDir <directory>', 'directory to output the build into', 'dist')
    .option('-s, --srcDir <directory>', 'directory containing the project source code', 'src')
    .action((args) => main(args)())

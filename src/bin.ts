#! user/env/bin node

/**
 * @since 0.0.1
 */
import { Command } from 'commander'

import * as Build from './Build'
import * as Rewrite from './ImportPathRewrite'
import * as PrePublish from './PrePublish'
import * as Release from './Release'

const program = new Command('fp-ts-scripts')

program.version('0.0.1')

program.addCommand(Build.makeCommand())
program.addCommand(Rewrite.makeCommand())
program.addCommand(PrePublish.makeCommand())
program.addCommand(Release.makeCommand())

program.parse(process.argv)

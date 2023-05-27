/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { assert } from '@japa/assert'
import { specReporter } from '@japa/spec-reporter'
import { runFailedTests } from '@japa/run-failed-tests'
import { fileSystem } from '@japa/file-system'
import { processCliArgs, configure, run } from '@japa/runner'
import { pathToFileURL } from 'node:url'
import { expectTypeOf } from '@japa/expect-type'

/*
|--------------------------------------------------------------------------
| Configure tests
|--------------------------------------------------------------------------
|
| The configure method accepts the configuration to configure the Japa
| tests runner.
|
| The first method call "processCliArgs" process the command line arguments
| and turns them into a config object. Using this method is not mandatory.
|
| Please consult japa.dev/runner-config for the config docs.
*/
configure({
  ...processCliArgs(process.argv.slice(2)),
  ...{
    plugins: [assert(), runFailedTests(), fileSystem(), expectTypeOf()],
    reporters: [specReporter()],
    importer: (filePath: string) => import(pathToFileURL(filePath).href),

    suites: [
      {
        name: 'unit',
        files: ['test/unit/**/*.spec.ts'],
      },
      {
        name: 'integration',
        files: ['test/integration/**/*.spec.ts'],
        timeout: 1000 * 10,
      },
    ],
  },
})

/*
|--------------------------------------------------------------------------
| Run tests
|--------------------------------------------------------------------------
|
| The following "run" method is required to execute all the tests.
|
*/
run()

/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { fileURLToPath } from 'node:url'
import { test } from '@japa/runner'
import { IgnitorFactory } from '@adonisjs/core/factories'
import Configure from '@adonisjs/core/commands/configure'

import { BASE_URL } from '../../test_helpers/index.js'

async function setupConfigureCommand() {
  const ignitor = new IgnitorFactory()
    .withCoreProviders()
    .withCoreConfig()
    .create(BASE_URL, {
      importer: (filePath) => {
        if (filePath.startsWith('./') || filePath.startsWith('../')) {
          return import(new URL(filePath, BASE_URL).href)
        }

        return import(filePath)
      },
    })

  const app = ignitor.createApp('web')
  await app.init()
  await app.boot()

  const ace = await app.container.make('ace')
  const command = await ace.create(Configure, ['../../index.js'])

  return { command }
}

test.group('Configure', (group) => {
  group.tap((testFn) => {
    testFn.timeout(3000)
  })

  group.each.setup(async ({ context }) => {
    context.fs.baseUrl = BASE_URL
    context.fs.basePath = fileURLToPath(BASE_URL)
    await context.fs.create('adonisrc.ts', `export default defineConfig({})`)
    await context.fs.createJson('tsconfig.json', {})
    await context.fs.create('.env', '')
    await context.fs.create('start/env.ts', `export default Env.create(new URL('./'), {})`)
  })

  test('publish config file based on driver selection', async ({ assert, fs }) => {
    const { command } = await setupConfigureCommand()

    command.prompt.trap('askDrivers').chooseOptions([0, 1])
    await command.exec()

    await assert.fileExists('config/mail.ts')
    const file = await fs.contents('config/mail.ts')
    assert.snapshot(file).match()
  })

  test('add MailProvider to the rc file', async ({ assert, fs }) => {
    const { command } = await setupConfigureCommand()

    command.prompt.trap('askDrivers').chooseOptions([0, 1])
    await command.exec()

    await assert.fileExists('adonisrc.ts')
    const file = await fs.contents('adonisrc.ts')
    assert.snapshot(file).match()
  })

  test('add env variables for the selected drivers', async ({ assert }) => {
    const { command } = await setupConfigureCommand()

    command.prompt.trap('askDrivers').chooseOptions([0, 1])
    await command.exec()

    await assert.fileContains('.env', 'SMTP_HOST=localhost')
    await assert.fileContains('.env', 'SMTP_PORT=587')
    await assert.fileContains('.env', 'SES_ACCESS_KEY=<aws-access-key>')
    await assert.fileContains('.env', 'SES_ACCESS_SECRET=<aws-access-secret>')
  })

  test('add env variables validation for the selected drivers', async ({ assert }) => {
    const { command } = await setupConfigureCommand()

    command.prompt.trap('askDrivers').chooseOptions([0, 1])
    await command.exec()

    await assert.fileContains('start/env.ts', 'SMTP_HOST: Env.schema.string(),')
    await assert.fileContains('start/env.ts', 'SMTP_PORT: Env.schema.number(),')
    await assert.fileContains('start/env.ts', 'SES_ACCESS_KEY: Env.schema.string(),')
    await assert.fileContains('start/env.ts', 'SES_ACCESS_SECRET: Env.schema.string(),')
  })
})

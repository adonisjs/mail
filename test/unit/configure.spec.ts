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
import { MemoryRenderer } from '@poppinss/cliui'
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

  command.ui.useRenderer(new MemoryRenderer())

  return { command }
}

test.group('Configure', (group) => {
  group.each.setup(({ context }) => {
    context.fs.baseUrl = BASE_URL
    context.fs.basePath = fileURLToPath(BASE_URL)
  })

  test('publish config file based on driver selection', async ({ assert }) => {
    const { command } = await setupConfigureCommand()

    command.prompt.trap('askDrivers').chooseOptions([0, 1])
    await command.exec()

    await assert.fileExists('config/mail.ts')
    await assert.fileContains('config/mail.ts', 'export default defineConfig({')
    await assert.fileContains('config/mail.ts', "driver: 'smtp'")
    await assert.fileContains('config/mail.ts', "driver: 'ses'")
  })

  test('create the types file', async ({ assert }) => {
    const { command } = await setupConfigureCommand()

    command.prompt.trap('askDrivers').chooseOptions([0, 1])
    await command.exec()

    await assert.fileExists('types/mail.ts')
    await assert.fileContains(
      'types/mail.ts',
      'export interface MailersList extends InferMailers<typeof mail>',
    )
  })

  test('add MailProvider to the rc file', async ({ assert }) => {
    const { command } = await setupConfigureCommand()

    command.prompt.trap('askDrivers').chooseOptions([0, 1])
    await command.exec()

    await assert.fileExists('.adonisrc.json')
    await assert.fileContains('.adonisrc.json', '"@adonisjs/mail/providers/mail_provider"')
  })

  test('add env variables for the selected drivers', async ({ assert, fs }) => {
    const { command } = await setupConfigureCommand()

    await fs.create('.env', '')

    command.prompt.trap('askDrivers').chooseOptions([0, 1])
    await command.exec()

    await assert.fileContains('.env', 'SMTP_HOST=localhost')
    await assert.fileContains('.env', 'SMTP_PORT=587')

    await assert.fileContains('.env', 'SES_ACCESS_KEY=<aws-access-key>')
    await assert.fileContains('.env', 'SES_ACCESS_SECRET=<aws-secret>')
  })
})

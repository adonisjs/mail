/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { fileURLToPath } from 'node:url'
import { IgnitorFactory } from '@adonisjs/core/factories'
import Configure from '@adonisjs/core/commands/configure'

const BASE_URL = new URL('../tmp/', import.meta.url)

test.group('Configure', (group) => {
  group.each.setup(({ context }) => {
    context.fs.baseUrl = BASE_URL
    context.fs.basePath = fileURLToPath(BASE_URL)
  })

  test('configure package', async ({ fs, assert }) => {
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

    await fs.create('.env', '')
    await fs.createJson('tsconfig.json', {})
    await fs.create('start/env.ts', `export default Env.create(new URL('./'), {})`)
    await fs.create('adonisrc.ts', `export default defineConfig({})`)

    const ace = await app.container.make('ace')
    ace.prompt.trap('Select the mail services you want to use').chooseOptions([2, 4])

    const command = await ace.create(Configure, ['../../index.js'])
    await command.exec()

    await assert.fileExists('config/mail.ts')
    await assert.fileExists('adonisrc.ts')
    await assert.fileContains('adonisrc.ts', '@adonisjs/mail/mail_provider')
    await assert.fileContains('config/mail.ts', 'defineConfig')
    await assert.fileContains('config/mail.ts', `declare module '@adonisjs/mail/types' {`)
    console.log(await fs.contents('config/mail.ts'))

    await assert.fileContains(
      'config/mail.ts',
      `
    sparkpost: drivers.sparkpost({
      key: env.get('SPARKPOST_API_KEY'),
      baseUrl: 'https://api.sparkpost.com/api/v1',
    }),`
    )
    await assert.fileContains(
      'config/mail.ts',
      `
    resend: drivers.resend({
      key: env.get('RESEND_API_KEY'),
      baseUrl: 'https://api.resend.com',
    }),`
    )
    await assert.fileContains('.env', 'SPARKPOST_API_KEY')
    await assert.fileContains('.env', 'RESEND_API_KEY')

    await assert.fileContains('start/env.ts', 'SPARKPOST_API_KEY: Env.schema.string()')
    await assert.fileContains('start/env.ts', 'RESEND_API_KEY: Env.schema.string()')
  }).timeout(1000 * 60)
})

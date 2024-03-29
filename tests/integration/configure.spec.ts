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

  group.each.disableTimeout()

  test('configure package with pre-defined transports', async ({ fs, assert }) => {
    const ignitor = new IgnitorFactory()
      .withCoreProviders()
      .withCoreConfig()
      .create(fs.baseUrl, {
        importer: (filePath) => {
          if (filePath.startsWith('./') || filePath.startsWith('../')) {
            return import(new URL(filePath, fs.baseUrl).href)
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

    const command = await ace.create(Configure, [
      '../../index.js',
      '--transports=sparkpost',
      '--transports=resend',
    ])
    await command.exec()

    await assert.fileExists('config/mail.ts')
    await assert.fileExists('adonisrc.ts')
    await assert.fileContains('adonisrc.ts', '@adonisjs/mail/mail_provider')
    await assert.fileContains('config/mail.ts', 'defineConfig')
    await assert.fileContains('config/mail.ts', `declare module '@adonisjs/mail/types' {`)

    await assert.fileContains(
      'config/mail.ts',
      `
    sparkpost: transports.sparkpost({
      key: env.get('SPARKPOST_API_KEY'),
      baseUrl: 'https://api.sparkpost.com/api/v1',
    }),`
    )
    await assert.fileContains(
      'config/mail.ts',
      `
    resend: transports.resend({
      key: env.get('RESEND_API_KEY'),
      baseUrl: 'https://api.resend.com',
    }),`
    )
    await assert.fileContains('.env', 'SPARKPOST_API_KEY')
    await assert.fileContains('.env', 'RESEND_API_KEY')

    await assert.fileContains('start/env.ts', 'SPARKPOST_API_KEY: Env.schema.string()')
    await assert.fileContains('start/env.ts', 'RESEND_API_KEY: Env.schema.string()')
  })

  test('report error when unknown transports are mentioned', async ({ fs, assert }) => {
    const ignitor = new IgnitorFactory()
      .withCoreProviders()
      .withCoreConfig()
      .create(fs.baseUrl, {
        importer: (filePath) => {
          if (filePath.startsWith('./') || filePath.startsWith('../')) {
            return import(new URL(filePath, fs.baseUrl).href)
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

    const command = await ace.create(Configure, [
      '../../index.js',
      '--transports=sparkpost',
      '--transports=foo',
    ])
    await command.exec()

    command.assertFailed()
    await assert.fileNotExists('config/mail.ts')
    await assert.fileExists('adonisrc.ts')
    await assert.fileEquals('adonisrc.ts', `export default defineConfig({})`)
    await assert.fileEquals('.env', '')
    await assert.fileEquals('start/env.ts', `export default Env.create(new URL('./'), {})`)
  })

  test('prompt when no transports are mentioned', async ({ fs, assert }) => {
    const ignitor = new IgnitorFactory()
      .withCoreProviders()
      .withCoreConfig()
      .create(fs.baseUrl, {
        importer: (filePath) => {
          if (filePath.startsWith('./') || filePath.startsWith('../')) {
            return import(new URL(filePath, fs.baseUrl).href)
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
    ace.prompt.trap('Select the mail services you want to use').chooseOptions([3, 4])

    const command = await ace.create(Configure, ['../../index.js'])
    await command.exec()

    await assert.fileExists('config/mail.ts')
    await assert.fileExists('adonisrc.ts')
    await assert.fileContains('adonisrc.ts', '@adonisjs/mail/mail_provider')
    await assert.fileContains('config/mail.ts', 'defineConfig')
    await assert.fileContains('config/mail.ts', `declare module '@adonisjs/mail/types' {`)

    await assert.fileContains(
      'config/mail.ts',
      `
    sparkpost: transports.sparkpost({
      key: env.get('SPARKPOST_API_KEY'),
      baseUrl: 'https://api.sparkpost.com/api/v1',
    }),`
    )
    await assert.fileContains(
      'config/mail.ts',
      `
    resend: transports.resend({
      key: env.get('RESEND_API_KEY'),
      baseUrl: 'https://api.resend.com',
    }),`
    )
    await assert.fileContains('.env', 'SPARKPOST_API_KEY')
    await assert.fileContains('.env', 'RESEND_API_KEY')

    await assert.fileContains('start/env.ts', 'SPARKPOST_API_KEY: Env.schema.string()')
    await assert.fileContains('start/env.ts', 'RESEND_API_KEY: Env.schema.string()')
  })
})

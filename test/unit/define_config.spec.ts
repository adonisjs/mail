/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import edge from 'edge.js'
import { test } from '@japa/runner'
import { AppFactory } from '@adonisjs/core/factories/app'
import { EmitterFactory } from '@adonisjs/core/factories/events'
import { LoggerFactory } from '@adonisjs/core/factories/logger'
import { defineConfig, mailers } from '../../src/define_config.js'
import { SmtpDriver } from '../../src/drivers/smtp/driver.js'
import { Mailer } from '../../src/mailer.js'
import { MailManager } from '../../src/managers/mail_manager.js'
import type { ApplicationService } from '@adonisjs/core/types'

const BASE_URL = new URL('./', import.meta.url)
const app = new AppFactory().create(BASE_URL, () => {}) as ApplicationService
const emitter = new EmitterFactory().create(app)
const logger = new LoggerFactory().create()

test.group('Define config', () => {
  test('defineConfig to lazily register mail drivers', async ({ assert, expectTypeOf }) => {
    const config = await defineConfig({
      default: 'smtp',
      mailers: {
        smtp: mailers.smtp({ host: 'smtp.io' }),
      },
    }).resolver(app)

    expectTypeOf(config).toMatchTypeOf<{
      default: 'smtp'
      mailers: {
        smtp: () => SmtpDriver
      }
    }>()

    const mailer = new MailManager(edge, emitter, logger, config)
    assert.instanceOf(mailer.use('smtp'), Mailer)
    expectTypeOf(mailer.use).parameters.toMatchTypeOf<['smtp'?]>()
  })

  test('raise error when mailers is not defined', async () => {
    // @ts-expect-error
    await defineConfig({}).resolver(app)
  }).throws('Missing "mailers" property inside the mail config')

  test('raise error when default mailer is not defined in the list', async () => {
    await defineConfig({
      // @ts-expect-error
      default: 'smtp',
      mailers: {},
    }).resolver(app)
  }).throws('"mailers.smtp" is not a valid mailer name. Double check the config file')
})

// TODO: Add Service Registration Test (see Ally codebase)

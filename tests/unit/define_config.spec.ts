/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { Emitter } from '@adonisjs/core/events'
import { AppFactory } from '@adonisjs/core/factories/app'
import type { ApplicationService } from '@adonisjs/core/types'

import type { MailEvents } from '../../src/types.js'
import { MailManager } from '../../src/mail_manager.js'
import { SESDriver } from '../../src/drivers/ses/main.js'
import { SMTPDriver } from '../../src/drivers/smtp/main.js'
import { MailgunDriver } from '../../src/drivers/mailgun/main.js'
import { defineConfig, drivers } from '../../src/define_config.js'
import { SparkPostDriver } from '../../src/drivers/sparkpost/main.js'

const app = new AppFactory().create(new URL('./', import.meta.url), () => {}) as ApplicationService

test.group('Define config', () => {
  test('configure driver using the drivers collection', async ({ assert, expectTypeOf }) => {
    const smtpProvider = drivers.smtp({ host: '' })
    const smtpFactory = await smtpProvider.resolver(app)
    assert.instanceOf(smtpFactory(), SMTPDriver)
    expectTypeOf(smtpFactory()).toMatchTypeOf<SMTPDriver>()

    const sesProvider = drivers.ses({ key: '', region: '', secret: '', apiVersion: '' })
    const sesFactory = await sesProvider.resolver(app)
    assert.instanceOf(sesFactory(), SESDriver)
    expectTypeOf(sesFactory()).toMatchTypeOf<SESDriver>()

    const mailgunProvider = drivers.mailgun({ key: '', baseUrl: '', domain: '' })
    const mailgunFactory = await mailgunProvider.resolver(app)
    assert.instanceOf(mailgunFactory(), MailgunDriver)
    expectTypeOf(mailgunFactory()).toMatchTypeOf<MailgunDriver>()

    const sparkpostProvider = drivers.sparkpost({ key: '', baseUrl: '' })
    const sparkpostFactory = await sparkpostProvider.resolver(app)
    assert.instanceOf(sparkpostFactory(), SparkPostDriver)
    expectTypeOf(sparkpostFactory()).toMatchTypeOf<SparkPostDriver>()
  })

  test('create mail manager using defineConfig method', async ({ assert, expectTypeOf }) => {
    const emitter = new Emitter<MailEvents>(app)

    const configProvider = defineConfig({
      mailers: {
        smtp: drivers.smtp({ host: '' }),
        ses: drivers.ses({ key: '', region: '', secret: '', apiVersion: '' }),
        mailgun: drivers.mailgun({ key: '', baseUrl: '', domain: '' }),
        sparkpost: drivers.sparkpost({ key: '', baseUrl: '' }),
      },
    })

    const mail = new MailManager(emitter, await configProvider.resolver(app))
    expectTypeOf(mail.use).parameters.toMatchTypeOf<[('mailgun' | 'smtp' | 'sparkpost' | 'ses')?]>()
    expectTypeOf(mail.use('mailgun').driver).toMatchTypeOf<MailgunDriver>()
    expectTypeOf(mail.use('smtp').driver).toMatchTypeOf<SMTPDriver>()
    expectTypeOf(mail.use('ses').driver).toMatchTypeOf<SESDriver>()
    expectTypeOf(mail.use('sparkpost').driver).toMatchTypeOf<SparkPostDriver>()

    assert.instanceOf(mail.use('smtp').driver, SMTPDriver)
    assert.instanceOf(mail.use('ses').driver, SESDriver)
    assert.instanceOf(mail.use('mailgun').driver, MailgunDriver)
    assert.instanceOf(mail.use('sparkpost').driver, SparkPostDriver)
  })
})

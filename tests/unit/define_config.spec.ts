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
import { SESTransport } from '../../src/transports/ses.js'
import { SMTPTransport } from '../../src/transports/smtp.js'
import { ResendTransport } from '../../src/transports/resend.js'
import { MailgunTransport } from '../../src/transports/mailgun.js'
import { defineConfig, transports } from '../../src/define_config.js'
import { SparkPostTransport } from '../../src/transports/sparkpost.js'

const app = new AppFactory().create(new URL('./', import.meta.url), () => {}) as ApplicationService

test.group('Define config', () => {
  test('configure transport using the transports collection', async ({ assert, expectTypeOf }) => {
    const smtpProvider = transports.smtp({ host: '' })
    const smtpFactory = await smtpProvider.resolver(app)
    assert.instanceOf(smtpFactory(), SMTPTransport)
    expectTypeOf(smtpFactory()).toMatchTypeOf<SMTPTransport>()

    const sesProvider = transports.ses({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })
    const sesFactory = await sesProvider.resolver(app)
    assert.instanceOf(sesFactory(), SESTransport)
    expectTypeOf(sesFactory()).toMatchTypeOf<SESTransport>()

    const mailgunProvider = transports.mailgun({ key: '', baseUrl: '', domain: '' })
    const mailgunFactory = await mailgunProvider.resolver(app)
    assert.instanceOf(mailgunFactory(), MailgunTransport)
    expectTypeOf(mailgunFactory()).toMatchTypeOf<MailgunTransport>()

    const sparkpostProvider = transports.sparkpost({ key: '', baseUrl: '' })
    const sparkpostFactory = await sparkpostProvider.resolver(app)
    assert.instanceOf(sparkpostFactory(), SparkPostTransport)
    expectTypeOf(sparkpostFactory()).toMatchTypeOf<SparkPostTransport>()

    const resendProvider = transports.resend({ key: '', baseUrl: '' })
    const resendFactory = await resendProvider.resolver(app)
    assert.instanceOf(resendFactory(), ResendTransport)
    expectTypeOf(resendFactory()).toMatchTypeOf<ResendTransport>()
  })

  test('create mail manager using defineConfig method', async ({ assert, expectTypeOf }) => {
    const emitter = new Emitter<MailEvents>(app)

    const configProvider = defineConfig({
      mailers: {
        smtp: transports.smtp({ host: '' }),
        ses: transports.ses({
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
          },
        }),
        mailgun: transports.mailgun({ key: '', baseUrl: '', domain: '' }),
        sparkpost: transports.sparkpost({ key: '', baseUrl: '' }),
        resend: transports.resend({ key: '', baseUrl: '' }),
      },
    })

    const mail = new MailManager(emitter, await configProvider.resolver(app))
    expectTypeOf(mail.use).parameters.toMatchTypeOf<
      [('mailgun' | 'smtp' | 'sparkpost' | 'ses' | 'resend')?]
    >()
    expectTypeOf(mail.use('mailgun').transport).toMatchTypeOf<MailgunTransport>()
    expectTypeOf(mail.use('smtp').transport).toMatchTypeOf<SMTPTransport>()
    expectTypeOf(mail.use('ses').transport).toMatchTypeOf<SESTransport>()
    expectTypeOf(mail.use('sparkpost').transport).toMatchTypeOf<SparkPostTransport>()
    expectTypeOf(mail.use('resend').transport).toMatchTypeOf<ResendTransport>()

    assert.instanceOf(mail.use('smtp').transport, SMTPTransport)
    assert.instanceOf(mail.use('ses').transport, SESTransport)
    assert.instanceOf(mail.use('mailgun').transport, MailgunTransport)
    assert.instanceOf(mail.use('sparkpost').transport, SparkPostTransport)
    assert.instanceOf(mail.use('resend').transport, ResendTransport)
  })
})

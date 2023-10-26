/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'

import { BaseMailer } from '../../src/base_mailer.js'
import { createMailManager } from '../../test_helpers/index.js'
import { Message } from '../../src/message.js'
import { defineConfig, mailers } from '../../index.js'
import { AppFactory } from '@adonisjs/core/factories/app'
import type { ApplicationService } from '@adonisjs/core/types'

const BASE_URL = new URL('./', import.meta.url)
const app = new AppFactory().create(BASE_URL, () => {}) as ApplicationService

test.group('BaseMailer', () => {
  test('send email using the mailer class', async ({ assert }) => {
    const { manager } = await createMailManager()
    const fakeMailer = manager.fake()

    class MyMailer extends BaseMailer {
      prepare(message: Message) {
        message.subject('Welcome').to('virk@adonisjs.com').from('virk@adonisjs.com')
      }
    }

    const mailer = new MyMailer()
    await mailer.send()

    assert.deepEqual(fakeMailer.find({ subject: 'Welcome' }), {
      subject: 'Welcome',
      from: { address: 'virk@adonisjs.com', name: '' },
      to: [{ address: 'virk@adonisjs.com', name: '' }],
    })
  })

  test('use a custom mailer', async ({ assert }) => {
    assert.plan(1)

    const config = await defineConfig({
      default: 'marketing',
      mailers: {
        marketing: mailers.smtp({ host: 'smtp.io' }),
        transactional: mailers.smtp({ host: 'smtp.io' }),
      },
    }).resolver(app)

    const { manager } = await createMailManager(config)
    manager.fake('transactional')

    class MyMailer extends BaseMailer {
      // @ts-ignore
      mailer = MyMailer.mail.use('transactional')

      prepare(message: Message) {
        message.subject('Welcome').to('virk@adonisjs.com').from('virk@adonisjs.com')
      }
    }

    const mailer = new MyMailer()
    // @ts-ignore
    mailer.mailer.send = async function send(callback: any, _c: any) {
      const message = new Message(false)
      await callback(message)

      assert.deepEqual(message.toJSON().message, {
        subject: 'Welcome',
        from: { address: 'virk@adonisjs.com' },
        to: [{ address: 'virk@adonisjs.com' }],
      })
    }

    await mailer.send()
  })
})

/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { MailDriverContract, MessageNode } from '../../../src/types/main.js'
import { createMailManager } from '../../../test_helpers/index.js'

test.group('Mail Manager | Queue', () => {
  test('pass mail and response to the queue monitor function', async ({ assert }, done) => {
    class CustomDriver implements MailDriverContract {
      message: MessageNode | null = null
      options: any

      async send(message: any, options: any) {
        return new Promise((resolve) => {
          setTimeout(() => {
            this.message = message
            this.options = options
            resolve({ messageId: '1' })
          }, 1000)
        })
      }

      async close() {}
    }

    const customDriver = new CustomDriver()
    const { manager } = await createMailManager({
      default: 'custom',
      mailers: { custom: () => customDriver },
    })

    manager.monitorQueue((error, response) => {
      assert.isNull(error)
      assert.equal(response?.mail.message.subject, 'Hello world')
      assert.equal(response?.response.messageId, '1')
      done()
    })

    await manager.use().sendLater((message) => {
      message.to('foo@bar.com')
      message.from('baz@bar.com')
      message.subject('Hello world')
    })
  }).waitForDone()

  test('attach mail to the queue error object', async ({ assert }, done) => {
    class CustomDriver implements MailDriverContract {
      message: MessageNode | null = null
      options: any

      async send(message: any, options: any) {
        return new Promise((_, reject) => {
          setTimeout(() => {
            this.message = message
            this.options = options
            reject(new Error('Something went wrong'))
          }, 1000)
        })
      }

      async close() {}
    }

    const customDriver = new CustomDriver()
    const { manager } = await createMailManager({
      default: 'custom',
      mailers: { custom: () => customDriver },
    })

    manager.monitorQueue((error) => {
      assert.equal(error?.mail.message.subject, 'Hello world')
      assert.equal(error?.message, 'Something went wrong')
      done()
    })

    await manager.use().sendLater((message) => {
      message.to('foo@bar.com')
      message.from('baz@bar.com')
      message.subject('Hello world')
    })
  }).waitForDone()
})

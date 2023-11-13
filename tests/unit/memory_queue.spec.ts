/*
 * @adonisjs/mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { Mailer } from '../../src/mailer.js'
import { JSONDriver } from '../../src/drivers/json/main.js'
import { MemoryQueueMessenger } from '../../src/messengers/memory_queue.js'

test.group('Memory queue', () => {
  test('queue email using the memory driver', async ({ assert }, done) => {
    const mailer = new Mailer('marketing', new JSONDriver(), { from: 'foo@global.com' })
    const messenger = new MemoryQueueMessenger(mailer)
    mailer.setMessenger(messenger)

    messenger.monitor((_, result) => {
      assert.exists(result.messageId)
      assert.deepEqual(result.envelope, { from: 'foo@global.com', to: ['bar@baz.com'] })
      done()
    })

    await mailer.sendLater((message) => {
      message.subject('Hello world')
      message.to('bar@baz.com')
      message.html('Hello world')
    })
  }).waitForDone()
})

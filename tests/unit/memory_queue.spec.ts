/*
 * @adonisjs/mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { Emitter } from '@adonisjs/core/events'
import { AppFactory } from '@adonisjs/core/factories/app'

import { Mailer } from '../../src/mailer.js'
import { MailEvents } from '../../src/types.js'
import { MailResponse } from '../../src/mail_response.js'
import { JSONTransport } from '../../src/transports/json.js'
import { MemoryQueueMessenger } from '../../src/messengers/memory_queue.js'

const app = new AppFactory().create(new URL('./', import.meta.url), () => {})

test.group('Memory queue', () => {
  test('queue email using the memory queue', async ({}, done) => {
    const emitter = new Emitter<MailEvents>(app)
    const jsonTransport = new JSONTransport()
    const mailer = new Mailer('marketing', jsonTransport, emitter, { from: 'foo@global.com' })
    const messenger = new MemoryQueueMessenger(mailer, emitter)
    mailer.setMessenger(messenger)

    jsonTransport.send = async function (message) {
      done()
      return new MailResponse('1', message.envelope as any, {} as any)
    }

    await mailer.sendLater((message) => {
      message.subject('Hello world')
      message.to('bar@baz.com')
      message.html('Hello world')
    })
  }).waitForDone()
})

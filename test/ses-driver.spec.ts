/*
 * @adonisjs/mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import dotenv from 'dotenv'
import { Edge } from 'edge.js'
import test from 'japa'
import { join } from 'path'
import { SesDriver } from '../src/Drivers/Ses'
import { Message } from '../src/Message'

test.group('Ses Driver', group => {
  group.before(() => {
    dotenv.config({ path: join(__dirname, '..', '.env') })
  })

  test('send email using ses driver', async assert => {
    const ses = new SesDriver({
      driver: 'ses',
      key: process.env.AWS_ACCESS_KEY_ID!,
      secret: process.env.AWS_SECRET_ACCESS_KEY!,
      region: process.env.AWS_REGION!,
    })

    const message = new Message(new Edge())
    message.from(process.env.FROM_EMAIL!)
    message.to('virk@adonisjs.com')
    message.subject('Adonisv5')
    message.html('<p> Hello Adonis </p>')

    const response = await ses.send(message.toJSON())

    assert.exists(response.response)
    assert.exists(response.messageId)
    assert.equal(response.envelope!.from, process.env.FROM_EMAIL)
    assert.deepEqual(response.envelope!.to, ['virk@adonisjs.com'])
  }).timeout(1000 * 10)
})

/*
 * @adonisjs/mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import test from 'japa'
import dotenv from 'dotenv'
import { join } from 'path'

import { Message } from '../src/Message'
import { setup, fs } from '../test-helpers'
import { SparkPostDriver } from '../src/Drivers/SparkPost'

test.group('SparkPost Driver', (group) => {
  group.before(() => {
    dotenv.config({ path: join(__dirname, '..', '.env') })
  })

  group.afterEach(async () => {
    await fs.cleanup()
  })

  test('send email using sparkpost driver', async (assert) => {
    const app = await setup()

    const sparkpost = new SparkPostDriver(
      {
        driver: 'sparkpost',
        key: process.env.SPARKPOST_API_KEY!,
        baseUrl: 'https://api.sparkpost.com/api/v1',
      },
      app.logger
    )

    const message = new Message()
    message.from(process.env.FROM_EMAIL!)
    message.to('virk@adonisjs.com')
    message.cc('info@adonisjs.com')
    message.subject('Adonisv5')
    message.html('<p> Hello Adonis </p>')

    const response = await sparkpost.send(message.toJSON().message)
    assert.exists(response.messageId)
    assert.equal(response.envelope!.from, process.env.FROM_EMAIL)
    assert.deepEqual(response.envelope!.to, ['virk@adonisjs.com', 'info@adonisjs.com'])
  }).timeout(1000 * 10)
})

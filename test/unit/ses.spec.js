'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const test = require('japa')
const Ses = require('../../src/Mail/MailDrivers').ses
const Message = require('../../src/Mail/Message')

const Config = {
  get: () => {
    return {
      accessKeyId: process.env.SES_KEY,
      secretAccessKey: process.env.SES_SECRET,
      region: 'us-west-2'
    }
  }
}

test.group('SES driver', () => {
  test('should be able to send email using ses driver', async (assert) => {
    const message = new Message()
    message.to('success@simulator.amazonses.com')
    message.from(process.env.SES_EMAIL)
    message.subject('Hello world')
    message.html('Hello world')
    const ses = new Ses(Config)
    const res = await ses.send(message.data)
    assert.exists(res.messageId)
  }).timeout(0)
})

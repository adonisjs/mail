'use strict'

/*
 * adonis-mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

require('dotenv').load()
const test = require('japa')
const { memory: MemoryDriver } = require('../src/Mail/Drivers')

test.group('MemoryDriver driver', (group) => {
  test('newup smtp driver', (assert) => {
    const mem = new MemoryDriver()
    mem.setConfig()
    assert.instanceOf(mem, MemoryDriver)
    assert.isDefined(mem.transporter)
  })

  test('send plain email', async (assert) => {
    const mem = new MemoryDriver()
    mem.setConfig()

    const message = await mem.send({
      from: process.env.SMTP_FROM_EMAIL,
      to: process.env.SMTP_TO_EMAIL,
      subject: 'Plain email',
      html: '<h2> Hello </h2>'
    })

    assert.isDefined(message.messageId)
    assert.equal(message.message.from.address, process.env.SMTP_FROM_EMAIL)
    assert.equal(message.message.to[0].address, process.env.SMTP_TO_EMAIL)
    assert.equal(message.message.subject, 'Plain email')
  })
})

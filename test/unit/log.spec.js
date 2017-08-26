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
const path = require('path')
const fs = require('fs-extra')
const simpleParser = require('mailparser').simpleParser
const Log = require('../../src/Mail/MailDrivers').log
const Message = require('../../src/Mail/Message')

const Config = {
  get: () => {
    return {
      toPath: path.join(__dirname, './tmp/mail.eml')
    }
  }
}

test.group('Log driver', (group) => {
  group.before(async () => {
    await fs.ensureFile(Config.get().toPath)
  })

  group.after(async () => {
    await fs.remove(path.join(__dirname, './tmp'))
  })

  test('should be able to write MIME representation of email to a file', async (assert) => {
    const message = new Message()
    message.to('virk@foo.com')
    message.from('virk@bar.com')
    message.subject('Hello world')
    message.html('<h2>Hello world</h2>')
    message.text('Hello world')
    const log = new Log(Config)
    await log.send(message.data)

    const emailLogs = await fs.readFile(Config.get().toPath, 'utf8')
    const email = emailLogs.split(/-\s?Email Start\s?-/gi).pop().replace(/-\s?EMAIL END\s?-/i, '').trim()

    const mailObject = await simpleParser(email)
    assert.equal(mailObject.to.value[0].address, 'virk@foo.com')
    assert.equal(mailObject.from.value[0].address, 'virk@bar.com')
    assert.equal(mailObject.subject, 'Hello world')
    assert.equal(mailObject.html, '<h2>Hello world</h2>')
    assert.equal(mailObject.text, 'Hello world')
  })

  test('should be able to set from name', async (assert) => {
    const message = new Message()
    message.to('virk@foo.com')
    message.from('virk@bar.com', 'Harminder Virk')
    message.subject('Hello world')
    message.html('<h2>Hello world</h2>')
    message.text('Hello world')
    const log = new Log(Config)
    await log.send(message.data)

    const emailLogs = await fs.readFile(Config.get().toPath, 'utf8')
    const email = emailLogs.split(/-\s?Email Start\s?-/gi).pop().replace(/-\s?EMAIL END\s?-/i, '').trim()

    const mailObject = await simpleParser(email)
    assert.equal(mailObject.from.value[0].name, 'Harminder Virk')
  })

  test('should be able to set to name', async (assert) => {
    const message = new Message()
    message.to('virk@foo.com', 'Harminder Virk')
    message.from('virk@bar.com')
    message.subject('Hello world')
    message.html('<h2>Hello world</h2>')
    message.text('Hello world')
    const log = new Log(Config)
    await log.send(message.data)

    const emailLogs = await fs.readFile(Config.get().toPath, 'utf8')
    const email = emailLogs.split(/-\s?Email Start\s?-/gi).pop().replace(/-\s?EMAIL END\s?-/i, '').trim()

    const mailObject = await simpleParser(email)
    assert.equal(mailObject.to.value[0].name, 'Harminder Virk')
  })

  test('should be able to define cc', async (assert) => {
    const message = new Message()
    message.to('virk@foo.com')
    message.cc('virk@baz.com', 'Harminder Virk')
    message.from('virk@bar.com')
    message.subject('Hello world')
    message.html('<h2>Hello world</h2>')
    message.text('Hello world')
    const log = new Log(Config)
    await log.send(message.data)

    const emailLogs = await fs.readFile(Config.get().toPath, 'utf8')
    const email = emailLogs.split(/-\s?Email Start\s?-/gi).pop().replace(/-\s?EMAIL END\s?-/i, '').trim()

    const mailObject = await simpleParser(email)
    assert.equal(mailObject.cc.value[0].name, 'Harminder Virk')
    assert.equal(mailObject.cc.value[0].address, 'virk@baz.com')
  })

  test('should be able to define multiple to fields', async (assert) => {
    const message = new Message()
    message.to('virk@foo.com')
    message.to('virk@baz.com')
    message.from('virk@bar.com')
    message.subject('Hello world')
    message.html('<h2>Hello world</h2>')
    message.text('Hello world')
    const log = new Log(Config)
    await log.send(message.data)

    const emailLogs = await fs.readFile(Config.get().toPath, 'utf8')
    const email = emailLogs.split(/-\s?Email Start\s?-/gi).pop().replace(/-\s?EMAIL END\s?-/i, '').trim()

    const mailObject = await simpleParser(email)
    assert.equal(mailObject.to.value.length, 2)
    assert.equal(mailObject.to.value[0].address, 'virk@foo.com')
    assert.equal(mailObject.to.value[1].address, 'virk@baz.com')
  })

  test('should be able to set sender on email', async (assert) => {
    const message = new Message()
    message.to('virk@foo.com')
    message.sender('virk@bar.com')
    message.subject('Hello world')
    message.html('<h2>Hello world</h2>')
    message.text('Hello world')
    const log = new Log(Config)
    await log.send(message.data)

    const emailLogs = await fs.readFile(Config.get().toPath, 'utf8')
    const email = emailLogs.split(/-\s?Email Start\s?-/gi).pop().replace(/-\s?EMAIL END\s?-/i, '').trim()

    const mailObject = await simpleParser(email)
    assert.equal(mailObject.headers.get('sender').text, 'virk@bar.com')
  })

  test('should be able to set replyTo on email', async (assert) => {
    const message = new Message()
    message.to('virk@foo.com')
    message.replyTo('virk@bar.com')
    message.subject('Hello world')
    message.html('<h2>Hello world</h2>')
    message.text('Hello world')
    const log = new Log(Config)
    await log.send(message.data)

    const emailLogs = await fs.readFile(Config.get().toPath, 'utf8')
    const email = emailLogs.split(/-\s?Email Start\s?-/gi).pop().replace(/-\s?EMAIL END\s?-/i, '').trim()

    const mailObject = await simpleParser(email)
    assert.equal(mailObject.replyTo.value[0].address, 'virk@bar.com')
  })

  test('should be able to set priority on email', async (assert) => {
    const message = new Message()
    message.to('virk@foo.com')
    message.priority('high')
    message.from('virk@bar.com')
    message.subject('Hello world')
    message.html('<h2>Hello world</h2>')
    message.text('Hello world')
    const log = new Log(Config)
    await log.send(message.data)

    const emailLogs = await fs.readFile(Config.get().toPath, 'utf8')
    const email = emailLogs.split(/-\s?Email Start\s?-/gi).pop().replace(/-\s?EMAIL END\s?-/i, '').trim()

    const mailObject = await simpleParser(email)
    assert.equal(mailObject.headers.get('priority'), 'high')
  })

  test('should be able to set header on email using key value pair', async (assert) => {
    const message = new Message()
    message.to('virk@foo.com')
    message.header('x-id', 1)
    message.from('virk@bar.com')
    message.subject('Hello world')
    message.html('<h2>Hello world</h2>')
    message.text('Hello world')
    const log = new Log(Config)
    await log.send(message.data)

    const emailLogs = await fs.readFile(Config.get().toPath, 'utf8')
    const email = emailLogs.split(/-\s?Email Start\s?-/gi).pop().replace(/-\s?EMAIL END\s?-/i, '').trim()

    const mailObject = await simpleParser(email)
    assert.equal(mailObject.headers.get('x-id'), '1')
  })

  test('should be able to set headers on email using an array of headers', async (assert) => {
    const message = new Message()
    message.to('virk@foo.com')
    message.header([{key: 'x-id', value: 2}, {key: 'x-user', value: 'doe'}])
    message.from('virk@bar.com')
    message.subject('Hello world')
    message.html('<h2>Hello world</h2>')
    message.text('Hello world')
    const log = new Log(Config)
    await log.send(message.data)

    const emailLogs = await fs.readFile(Config.get().toPath, 'utf8')
    const email = emailLogs.split(/-\s?Email Start\s?-/gi).pop().replace(/-\s?EMAIL END\s?-/i, '').trim()

    const mailObject = await simpleParser(email)
    assert.equal(mailObject.headers.get('x-id'), '2')
    assert.equal(mailObject.headers.get('x-user'), 'doe')
  })

  test('should be able to set email subject', async (assert) => {
    const message = new Message()
    message.to('virk@foo.com')
    message.from('virk@bar.com')
    message.subject('Hello world')
    message.html('<h2>Hello world</h2>')
    message.text('Hello world')
    const log = new Log(Config)
    await log.send(message.data)

    const emailLogs = await fs.readFile(Config.get().toPath, 'utf8')
    const email = emailLogs.split(/-\s?Email Start\s?-/gi).pop().replace(/-\s?EMAIL END\s?-/i, '').trim()

    const mailObject = await simpleParser(email)
    assert.equal(mailObject.subject, 'Hello world')
  })

  test('should be able to attach file to email', async (assert) => {
    const message = new Message()
    message.to('virk@foo.com')
    message.from('virk@bar.com')
    message.subject('Hello world')
    message.attach(path.join(__dirname, './assets/logo_white.svg'))
    const log = new Log(Config)
    await log.send(message.data)

    const emailLogs = await fs.readFile(Config.get().toPath, 'utf8')
    const email = emailLogs.split(/-\s?Email Start\s?-/gi).pop().replace(/-\s?EMAIL END\s?-/i, '').trim()

    const mailObject = await simpleParser(email)
    assert.equal(mailObject.attachments.length, 1)
    assert.equal(mailObject.attachments[0].contentType, 'image/svg+xml')
    assert.equal(mailObject.attachments[0].filename, 'logo_white.svg')
  })

  test('should be able to override attached file name', async (assert) => {
    const message = new Message()
    message.to('virk@foo.com')
    message.from('virk@bar.com')
    message.subject('Hello world')
    message.attach(path.join(__dirname, './assets/logo_white.svg'), {filename: 'logo.svg'})
    const log = new Log(Config)
    await log.send(message.data)

    const emailLogs = await fs.readFile(Config.get().toPath, 'utf8')
    const email = emailLogs.split(/-\s?Email Start\s?-/gi).pop().replace(/-\s?EMAIL END\s?-/i, '').trim()

    const mailObject = await simpleParser(email)
    assert.equal(mailObject.attachments.length, 1)
    assert.equal(mailObject.attachments[0].contentType, 'image/svg+xml')
    assert.equal(mailObject.attachments[0].filename, 'logo.svg')
  })

  test('should be able to override attached file contentType', async (assert) => {
    const message = new Message()
    message.to('virk@foo.com')
    message.from('virk@bar.com')
    message.subject('Hello world')
    message.attach(path.join(__dirname, './assets/logo_white.svg'), {contentType: 'image/png'})
    const log = new Log(Config)
    await log.send(message.data)

    const emailLogs = await fs.readFile(Config.get().toPath, 'utf8')
    const email = emailLogs.split(/-\s?Email Start\s?-/gi).pop().replace(/-\s?EMAIL END\s?-/i, '').trim()

    const mailObject = await simpleParser(email)
    assert.equal(mailObject.attachments.length, 1)
    assert.equal(mailObject.attachments[0].contentType, 'image/png')
  })

  test('should be able to send raw data as attachment', async (assert) => {
    const message = new Message()
    message.to('virk@foo.com')
    message.from('virk@bar.com')
    message.subject('Hello world')
    message.attachData('hello world', 'a.txt')
    const log = new Log(Config)
    await log.send(message.data)

    const emailLogs = await fs.readFile(Config.get().toPath, 'utf8')
    const email = emailLogs.split(/-\s?Email Start\s?-/gi).pop().replace(/-\s?EMAIL END\s?-/i, '').trim()

    const mailObject = await simpleParser(email)
    assert.equal(mailObject.attachments.length, 1)
    assert.equal(mailObject.attachments[0].contentType, 'text/plain')
    assert.equal(mailObject.attachments[0].filename, 'a.txt')
    assert.equal(mailObject.attachments[0].content.toString('utf8'), 'hello world')
  })

  test('should be able to send embed images', async (assert) => {
    const message = new Message()
    message.to('virk@foo.com')
    message.from('virk@bar.com')
    message.subject('Hello world')
    message.embed(path.join(__dirname, './assets/logo_white.svg'), 'LOGO')
    message.html('<img src="cid:LOGO" />')
    const log = new Log(Config)
    await log.send(message.data)

    const emailLogs = await fs.readFile(Config.get().toPath, 'utf8')
    const email = emailLogs.split(/-\s?Email Start\s?-/gi).pop().replace(/-\s?EMAIL END\s?-/i, '').trim()

    const mailObject = await simpleParser(email)
    assert.equal(mailObject.html, '<img src="cid:LOGO" />')
  })

  test('should return standard format on email success', async (assert) => {
    const message = new Message()
    message.to('virk@foo.com')
    message.from('virk@bar.com')
    message.subject('Hello world')
    message.html('<img src="cid:LOGO" />')
    const log = new Log(Config)
    const response = await log.send(message.data)
    assert.isObject(response)
    assert.exists(response.messageId)
    assert.deepEqual(response.accepted, message.data.to)
    assert.deepEqual(response.rejected, [])
  })
})

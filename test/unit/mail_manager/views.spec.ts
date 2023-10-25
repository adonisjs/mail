/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { CustomDriver, createMailManager } from '../../../test_helpers/index.js'

test.group('Mail Manager | Views', () => {
  test('make html view before sending the email', async ({ assert }) => {
    const customDriver = new CustomDriver()
    const { manager } = await createMailManager({
      default: 'custom',
      list: { custom: () => customDriver },
    })

    manager.view!.registerTemplate('welcome', { template: '<p>Hello {{ username }}</p>' })

    await manager.use('custom').send((message) => {
      message.to('foo@bar.com')
      message.from('baz@bar.com')
      message.subject('Greetings')
      message.htmlView('welcome', { username: 'virk' })
    })

    manager.view.removeTemplate('welcome')

    assert.deepEqual(customDriver.message, {
      to: [{ address: 'foo@bar.com' }],
      from: { address: 'baz@bar.com' },
      subject: 'Greetings',
      html: '<p>Hello virk</p>',
    })
  })

  test('do not make html view when inline html is defined', async ({ assert }) => {
    const customDriver = new CustomDriver()
    const { manager } = await createMailManager({
      default: 'custom',
      list: { custom: () => customDriver },
    })

    manager.view!.registerTemplate('welcome', { template: '<p>Hello {{ username }}</p>' })

    await manager.use('custom').send((message) => {
      message.to('foo@bar.com')
      message.from('baz@bar.com')
      message.subject('Greetings')
      message.htmlView('welcome', { username: 'virk' })
      message.html('<p>Hello everyone</p>')
    })

    manager.view.removeTemplate('welcome')

    assert.deepEqual(customDriver.message, {
      to: [{ address: 'foo@bar.com' }],
      from: { address: 'baz@bar.com' },
      subject: 'Greetings',
      html: '<p>Hello everyone</p>',
    })
  })

  test('make text view before sending the email', async ({ assert }) => {
    const customDriver = new CustomDriver()
    const { manager } = await createMailManager({
      default: 'custom',
      list: { custom: () => customDriver },
    })

    manager.view!.registerTemplate('welcome', { template: 'Hello {{ username }}' })

    await manager.use('custom').send((message) => {
      message.to('foo@bar.com')
      message.from('baz@bar.com')
      message.subject('Greetings')
      message.textView('welcome', { username: 'virk' })
    })

    manager.view.removeTemplate('welcome')

    assert.deepEqual(customDriver.message, {
      to: [{ address: 'foo@bar.com' }],
      from: { address: 'baz@bar.com' },
      subject: 'Greetings',
      text: 'Hello virk',
    })
  })

  test('do not make text view when inline text is defined', async ({ assert }) => {
    const customDriver = new CustomDriver()
    const { manager } = await createMailManager({
      default: 'custom',
      list: { custom: () => customDriver },
    })

    manager.view!.registerTemplate('welcome', { template: 'Hello {{ username }}' })

    await manager.use('custom').send((message) => {
      message.to('foo@bar.com')
      message.from('baz@bar.com')
      message.subject('Greetings')
      message.textView('welcome', { username: 'virk' })
      message.text('Hello everyone')
    })

    manager.view.removeTemplate('welcome')

    assert.deepEqual(customDriver.message, {
      to: [{ address: 'foo@bar.com' }],
      from: { address: 'baz@bar.com' },
      subject: 'Greetings',
      text: 'Hello everyone',
    })
  })

  test('make watch view before sending the email', async ({ assert }) => {
    const customDriver = new CustomDriver()
    const { manager } = await createMailManager({
      default: 'custom',
      list: { custom: () => customDriver },
    })

    manager.view!.registerTemplate('welcome', { template: 'Hello {{ username }}' })

    await manager.use('custom').send((message) => {
      message.to('foo@bar.com')
      message.from('baz@bar.com')
      message.subject('Greetings')
      message.watchView('welcome', { username: 'virk' })
    })

    manager.view.removeTemplate('welcome')

    assert.deepEqual(customDriver.message, {
      to: [{ address: 'foo@bar.com' }],
      from: { address: 'baz@bar.com' },
      subject: 'Greetings',
      watch: 'Hello virk',
    })
  })

  test('do not make watch view when inline watch is defined', async ({ assert }) => {
    const customDriver = new CustomDriver()
    const { manager } = await createMailManager({
      default: 'custom',
      list: { custom: () => customDriver },
    })

    manager.view!.registerTemplate('welcome', { template: 'Hello {{ username }}' })

    await manager.use('custom').send((message) => {
      message.to('foo@bar.com')
      message.from('baz@bar.com')
      message.subject('Greetings')
      message.watchView('welcome', { username: 'virk' })
      message.watch('Hello everyone')
    })

    manager.view.removeTemplate('welcome')

    assert.deepEqual(customDriver.message, {
      to: [{ address: 'foo@bar.com' }],
      from: { address: 'baz@bar.com' },
      subject: 'Greetings',
      watch: 'Hello everyone',
    })
  })
})

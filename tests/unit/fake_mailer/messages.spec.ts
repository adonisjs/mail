/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Edge } from 'edge.js'
import { test } from '@japa/runner'
import { Emitter } from '@adonisjs/core/events'
import { AppFactory } from '@adonisjs/core/factories/app'

import { Message } from '../../../src/message.js'
import type { MailEvents } from '../../../src/types.js'
import { FakeMailer } from '../../../src/fake_mailer.js'

const app = new AppFactory().create(new URL('./', import.meta.url), () => {})

test.group('Fake mailer | messages | send', (group) => {
  group.each.setup(() => {
    return () => {
      Message.templateEngine = undefined
    }
  })

  test('assert a message was sent', async ({ assert, expectTypeOf }) => {
    const emitter = new Emitter<MailEvents>(app)
    const mailer = new FakeMailer('mailgun', emitter, {})
    const { messages } = mailer

    const response = await mailer.send((message) => {
      message.from('foo@bar.com')
      message.to('bar@baz.com')
    })
    assert.exists(response.messageId)
    assert.deepEqual(response.envelope, { from: 'foo@bar.com', to: ['bar@baz.com'] })

    messages.assertSent({ from: 'foo@bar.com', to: 'bar@baz.com' })
    messages.assertSent((message) => {
      expectTypeOf(message).toMatchTypeOf<Message>
      return message.hasTo('bar@baz.com') && message.hasFrom('foo@bar.com')
    })

    assert.throws(() => {
      return messages.assertSent((message) => {
        return message.hasTo('bar@example.com')
      })
    }, 'Expected message was not sent')
  })

  test('assert a message was not sent', async ({ assert, expectTypeOf }) => {
    const emitter = new Emitter<MailEvents>(app)
    const mailer = new FakeMailer('mailgun', emitter, {})
    const { messages } = mailer

    messages.assertNotSent({ from: 'foo@bar.com', to: 'bar@baz.com' })
    messages.assertNotSent((message) => {
      expectTypeOf(message).toMatchTypeOf<Message>
      return message.hasTo('bar@baz.com') && message.hasFrom('foo@bar.com')
    })

    await mailer.send((message) => {
      message.from('foo@bar.com')
      message.to('bar@baz.com')
    })

    assert.throws(() => {
      messages.assertNotSent({ from: 'foo@bar.com', to: 'bar@baz.com' })
    }, 'Unexpected message was sent')
    assert.throws(() => {
      messages.assertNotSent((message) => {
        expectTypeOf(message).toMatchTypeOf<Message>
        return message.hasTo('bar@baz.com') && message.hasFrom('foo@bar.com')
      })
    }, 'Unexpected message was sent')
  })

  test('assert a message was sent multiple times', async ({ assert }) => {
    const emitter = new Emitter<MailEvents>(app)
    const mailer = new FakeMailer('mailgun', emitter, {})
    const { messages } = mailer

    await mailer.send((message) => {
      message.subject('Verify email address')
      message.from('foo@bar.com')
      message.to('bar@baz.com')
    })
    await mailer.send((message) => {
      message.subject('Verify email address')
      message.from('foo@bar.com')
      message.to('bar@baz.com')
    })
    await mailer.send((message) => {
      message.subject('Clear dues')
      message.from('foo@bar.com')
      message.to('bar@baz.com')
    })

    messages.assertSentCount({ subject: 'Verify email address' }, 2)
    messages.assertSentCount({ subject: 'Clear dues' }, 1)
    messages.assertSentCount(3)

    assert.throws(() => {
      messages.assertSentCount({ subject: 'Verify email address' }, 1)
    }, 'Expected to send "1" message, instead received "2" messages')
    assert.throws(() => {
      messages.assertSentCount((message) => message.hasSubject('Clear dues'), 2)
    }, 'Expected to send "2" messages, instead received "1" message')
    assert.throws(() => {
      return messages.assertSentCount(4)
    }, 'Expected to send "4" messages, instead received "3" messages')
  })

  test('assert zero messages were sent', async ({ assert }) => {
    const emitter = new Emitter<MailEvents>(app)
    const mailer = new FakeMailer('mailgun', emitter, {})
    const { messages } = mailer

    messages.assertNoneSent()

    await mailer.send((message) => {
      message.subject('Verify email address')
      message.from('foo@bar.com')
      message.to('bar@baz.com')
    })
    await mailer.send((message) => {
      message.subject('Clear dues')
      message.from('foo@bar.com')
      message.to('bar@baz.com')
    })

    assert.throws(() => {
      return messages.assertNoneSent()
    }, 'Expected zero messages to be sent, instead received "2" messages')
  })

  test('assert email templates body', async () => {
    const emitter = new Emitter<MailEvents>(app)
    const mailer = new FakeMailer('mailgun', emitter, {})

    const edge = new Edge()
    Message.templateEngine = {
      render(templatePath, helpers, data) {
        return edge.share(helpers).render(templatePath, data)
      },
    }

    edge.registerTemplate('foo/bar', {
      template: `Hello {{ username }}`,
    })

    const { messages } = mailer

    await mailer.send((message) => {
      message.subject('Verify email address')
      message.from('foo@bar.com')
      message.to('bar@baz.com')
      message.htmlView('foo/bar', { username: 'virk' })
    })

    messages.assertSent((message) => {
      message.assertHtmlIncludes('Hello virk')
      return true
    })
  })
})

test.group('Fake mailer | messages | sendLater', (group) => {
  group.each.setup(() => {
    return () => {
      Message.templateEngine = undefined
    }
  })

  test('assert a message was queued', async ({ assert, expectTypeOf }) => {
    const emitter = new Emitter<MailEvents>(app)
    const mailer = new FakeMailer('mailgun', emitter, {})
    const { messages } = mailer

    await mailer.sendLater((message) => {
      message.from('foo@bar.com')
      message.to('bar@baz.com')
    })

    messages.assertQueued({ from: 'foo@bar.com', to: 'bar@baz.com' })
    messages.assertQueued((message) => {
      expectTypeOf(message).toMatchTypeOf<Message>
      return message.hasTo('bar@baz.com') && message.hasFrom('foo@bar.com')
    })

    assert.throws(() => {
      return messages.assertQueued({ from: 'foo@example.com' })
    }, 'Expected message was not queued')
    assert.throws(() => {
      return messages.assertQueued({ to: 'foo@example.com' })
    }, 'Expected message was not queued')
    assert.throws(() => {
      return messages.assertQueued((message) => {
        return message.hasTo('bar@example.com')
      })
    }, 'Expected message was not queued')
  })

  test('assert a message with attachments was queued', async ({ assert, expectTypeOf }) => {
    const emitter = new Emitter<MailEvents>(app)
    const mailer = new FakeMailer('mailgun', emitter, {})
    const { messages } = mailer

    await mailer.sendLater((message) => {
      message.from('foo@bar.com')
      message.to('bar@baz.com')
      message.attach(new URL('../../../package.json', import.meta.url))
    })

    messages.assertQueued({ attachments: ['package.json'] })
    messages.assertQueued((message) => {
      expectTypeOf(message).toMatchTypeOf<Message>
      return message.hasAttachment('package.json')
    })

    assert.throws(() => {
      return messages.assertQueued({ attachments: ['foo.json'] })
    }, 'Expected message was not queued')
    assert.throws(() => {
      return messages.assertQueued((message) => {
        return message.hasAttachment('foo.json')
      })
    }, 'Expected message was not queued')
  })

  test('assert a message was not queued', async ({ assert, expectTypeOf }) => {
    const emitter = new Emitter<MailEvents>(app)
    const mailer = new FakeMailer('mailgun', emitter, {})
    const { messages } = mailer

    messages.assertNotQueued({ from: 'foo@bar.com', to: 'bar@baz.com' })
    messages.assertNotQueued((message) => {
      expectTypeOf(message).toMatchTypeOf<Message>
      return message.hasTo('bar@baz.com') && message.hasFrom('foo@bar.com')
    })

    await mailer.sendLater((message) => {
      message.from('foo@bar.com')
      message.to('bar@baz.com')
    })

    assert.throws(() => {
      messages.assertNotQueued({ from: 'foo@bar.com', to: 'bar@baz.com' })
    }, 'Unexpected message was queued')
    assert.throws(() => {
      messages.assertNotQueued((message) => {
        expectTypeOf(message).toMatchTypeOf<Message>
        return message.hasTo('bar@baz.com') && message.hasFrom('foo@bar.com')
      })
    }, 'Unexpected message was queued')
  })

  test('assert a message was queued multiple times', async ({ assert }) => {
    const emitter = new Emitter<MailEvents>(app)
    const mailer = new FakeMailer('mailgun', emitter, {})
    const { messages } = mailer

    await mailer.sendLater((message) => {
      message.subject('Verify email address')
      message.from('foo@bar.com')
      message.to('bar@baz.com')
    })
    await mailer.sendLater((message) => {
      message.subject('Verify email address')
      message.from('foo@bar.com')
      message.to('bar@baz.com')
    })
    await mailer.sendLater((message) => {
      message.subject('Clear dues')
      message.from('foo@bar.com')
      message.to('bar@baz.com')
    })

    messages.assertQueuedCount({ subject: 'Verify email address' }, 2)
    messages.assertQueuedCount({ subject: 'Clear dues' }, 1)
    messages.assertQueuedCount(3)

    assert.throws(() => {
      messages.assertQueuedCount({ subject: 'Verify email address' }, 1)
    }, 'Expected to queue "1" message, instead received "2" messages')
    assert.throws(() => {
      messages.assertQueuedCount((message) => message.hasSubject('Clear dues'), 2)
    }, 'Expected to queue "2" messages, instead received "1" message')
    assert.throws(() => {
      return messages.assertQueuedCount(4)
    }, 'Expected to queue "4" messages, instead received "3" messages')
  })

  test('assert zero messages were queued', async ({ assert }) => {
    const emitter = new Emitter<MailEvents>(app)
    const mailer = new FakeMailer('mailgun', emitter, {})
    const { messages } = mailer

    messages.assertNoneQueued()

    await mailer.sendLater((message) => {
      message.subject('Verify email address')
      message.from('foo@bar.com')
      message.to('bar@baz.com')
    })
    await mailer.sendLater((message) => {
      message.subject('Clear dues')
      message.from('foo@bar.com')
      message.to('bar@baz.com')
    })

    assert.throws(() => {
      return messages.assertNoneQueued()
    }, 'Expected zero messages to be queued, instead received "2" messages')
  })

  test('assert email templates body', async () => {
    const emitter = new Emitter<MailEvents>(app)
    const mailer = new FakeMailer('mailgun', emitter, {})

    const edge = new Edge()
    Message.templateEngine = {
      render(templatePath, helpers, data) {
        return edge.share(helpers).render(templatePath, data)
      },
    }

    edge.registerTemplate('foo/bar', {
      template: `Hello {{ username }}`,
    })

    const { messages } = mailer

    await mailer.sendLater((message) => {
      message.subject('Verify email address')
      message.from('foo@bar.com')
      message.to('bar@baz.com')
      message.htmlView('foo/bar', { username: 'virk' })
    })

    messages.assertQueued((message) => {
      message.assertHtmlIncludes('Hello virk')
      return true
    })
  })
})

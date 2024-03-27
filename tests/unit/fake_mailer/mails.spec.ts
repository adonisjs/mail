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
import { MailEvents } from '../../../src/types.js'
import { BaseMail } from '../../../src/base_mail.js'
import { FakeMailer } from '../../../src/fake_mailer.js'

const app = new AppFactory().create(new URL('./', import.meta.url), () => {})

test.group('Fake mailer | mails | send', (group) => {
  group.each.setup(() => {
    return () => {
      Message.templateEngine = undefined
    }
  })

  test('assert an email was sent', async ({ assert, expectTypeOf }) => {
    const emitter = new Emitter<MailEvents>(app)
    const mailer = new FakeMailer('mailgun', emitter, {})
    const { mails } = mailer

    class VerifyEmail extends BaseMail {
      from: string = 'foo@bar.com'
      subject: string = 'Verify your email address'

      prepare() {
        this.message.to('bar@baz.com')
      }
    }

    const response = await mailer.send(new VerifyEmail())
    assert.exists(response.messageId)
    assert.deepEqual(response.envelope, { from: 'foo@bar.com', to: ['bar@baz.com'] })

    mails.assertSent(VerifyEmail)
    mails.assertSent(VerifyEmail, (mail) => {
      expectTypeOf(mail).toMatchTypeOf<VerifyEmail>
      return mail.message.hasTo('bar@baz.com') && mail.message.hasFrom('foo@bar.com')
    })

    assert.throws(() => {
      return mails.assertSent(VerifyEmail, (mail) => {
        return mail.message.hasTo('bar@example.com')
      })
    }, 'Expected mail "VerifyEmail" was not sent')
  })

  test('assert an email was not sent', async ({ assert, expectTypeOf }) => {
    const emitter = new Emitter<MailEvents>(app)
    const mailer = new FakeMailer('mailgun', emitter, {})
    const { mails } = mailer

    class VerifyEmail extends BaseMail {
      from: string = 'foo@bar.com'
      subject: string = 'Verify your email address'

      prepare() {
        this.message.to('bar@baz.com')
      }
    }

    mails.assertNotSent(VerifyEmail)
    mails.assertNotSent(VerifyEmail, (mail) => {
      expectTypeOf(mail).toMatchTypeOf<VerifyEmail>
      throw new Error('Never expected to be invoked')
    })

    await mailer.send(new VerifyEmail())

    assert.throws(() => {
      return mails.assertNotSent(VerifyEmail)
    }, 'Unexpected mail "VerifyEmail" was sent')
    assert.throws(() => {
      return mails.assertNotSent(VerifyEmail, (mail) => mail.message.hasTo('bar@baz.com'))
    }, 'Unexpected mail "VerifyEmail" was sent')
  })

  test('assert an email was sent multiple times', async ({ assert }) => {
    const emitter = new Emitter<MailEvents>(app)
    const mailer = new FakeMailer('mailgun', emitter, {})
    const { mails } = mailer

    class VerifyEmail extends BaseMail {
      from: string = 'foo@bar.com'
      subject: string = 'Verify your email address'

      prepare() {
        this.message.to('bar@baz.com')
      }
    }
    class PaymentDueNotification extends BaseMail {
      from: string = 'foo@bar.com'
      subject: string = 'Clear your dues'

      prepare() {
        this.message.to('foo@example.com')
      }
    }

    await mailer.send(new VerifyEmail())
    await mailer.send(new VerifyEmail())
    await mailer.send(new PaymentDueNotification())

    mails.assertSentCount(VerifyEmail, 2)
    mails.assertSentCount(PaymentDueNotification, 1)
    mails.assertSentCount(3)

    assert.throws(() => {
      return mails.assertSentCount(VerifyEmail, 1)
    }, 'Expected "VerifyEmail" to be sent "1" time, instead it was sent "2" times')
    assert.throws(() => {
      return mails.assertSentCount(4)
    }, 'Expected to send "4" mail, instead received "3" mail')
  })

  test('assert zero mails were sent', async ({ assert }) => {
    const emitter = new Emitter<MailEvents>(app)
    const mailer = new FakeMailer('mailgun', emitter, {})
    const { mails } = mailer

    class VerifyEmail extends BaseMail {
      from: string = 'foo@bar.com'
      subject: string = 'Verify your email address'

      prepare() {
        this.message.to('bar@baz.com')
      }
    }
    class PaymentDueNotification extends BaseMail {
      from: string = 'foo@bar.com'
      subject: string = 'Clear your dues'

      prepare() {
        this.message.to('foo@example.com')
      }
    }

    mails.assertNoneSent()

    await mailer.send(new VerifyEmail())
    await mailer.send(new VerifyEmail())
    await mailer.send(new PaymentDueNotification())

    assert.throws(() => {
      return mails.assertNoneSent()
    }, 'Expected zero mail to be sent, instead received "3" mail')
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

    const { mails } = mailer

    class VerifyEmail extends BaseMail {
      from: string = 'foo@bar.com'
      subject: string = 'Verify your email address'

      prepare() {
        this.message.htmlView('foo/bar', { username: 'virk' })
        this.message.to('bar@baz.com')
      }
    }

    await mailer.send(new VerifyEmail())
    mails.assertSent(VerifyEmail, (mail) => {
      mail.message.assertHtmlIncludes('Hello virk')
      return true
    })
  })

  test('assert using mail class that accepts constructor arguments', async ({
    assert,
    expectTypeOf,
  }) => {
    const emitter = new Emitter<MailEvents>(app)
    const mailer = new FakeMailer('mailgun', emitter, {})
    const { mails } = mailer

    class VerifyEmail<UserId extends number> extends BaseMail {
      from: string = 'foo@bar.com'
      subject: string = 'Verify your email address'

      constructor(public userId: UserId) {
        super()
      }

      prepare() {
        this.message.to('bar@baz.com')
      }
    }

    const response = await mailer.send(new VerifyEmail(1))
    assert.exists(response.messageId)
    assert.deepEqual(response.envelope, { from: 'foo@bar.com', to: ['bar@baz.com'] })

    mails.assertSent(VerifyEmail)
    mails.assertSent(VerifyEmail, (mail) => {
      expectTypeOf(mail).toMatchTypeOf<VerifyEmail<number>>
      return mail.message.hasTo('bar@baz.com') && mail.message.hasFrom('foo@bar.com')
    })

    assert.throws(() => {
      return mails.assertSent(VerifyEmail, (mail) => {
        return mail.message.hasTo('bar@example.com')
      })
    }, 'Expected mail "VerifyEmail" was not sent')
  })
})

test.group('Fake mailer | mails | sendLater', (group) => {
  group.each.setup(() => {
    return () => {
      Message.templateEngine = undefined
    }
  })

  test('assert an email was queued', async ({ assert, expectTypeOf }) => {
    const emitter = new Emitter<MailEvents>(app)
    const mailer = new FakeMailer('mailgun', emitter, {})
    const { mails } = mailer

    class VerifyEmail extends BaseMail {
      from: string = 'foo@bar.com'
      subject: string = 'Verify your email address'

      prepare() {
        this.message.to('bar@baz.com')
      }
    }

    await mailer.sendLater(new VerifyEmail())

    mails.assertQueued(VerifyEmail)
    mails.assertQueued(VerifyEmail, (mail) => {
      expectTypeOf(mail).toMatchTypeOf<VerifyEmail>
      return mail.message.hasTo('bar@baz.com') && mail.message.hasFrom('foo@bar.com')
    })

    assert.throws(() => {
      return mails.assertQueued(VerifyEmail, (mail) => {
        return mail.message.hasTo('bar@example.com')
      })
    }, 'Expected mail "VerifyEmail" was not queued')
  })

  test('assert an email was not queued', async ({ assert, expectTypeOf }) => {
    const emitter = new Emitter<MailEvents>(app)
    const mailer = new FakeMailer('mailgun', emitter, {})
    const { mails } = mailer

    class VerifyEmail extends BaseMail {
      from: string = 'foo@bar.com'
      subject: string = 'Verify your email address'

      prepare() {
        this.message.to('bar@baz.com')
      }
    }

    mails.assertNotQueued(VerifyEmail)
    mails.assertNotQueued(VerifyEmail, (mail) => {
      expectTypeOf(mail).toMatchTypeOf<VerifyEmail>
      throw new Error('Never expected to be invoked')
    })

    await mailer.sendLater(new VerifyEmail())

    assert.throws(() => {
      return mails.assertNotQueued(VerifyEmail)
    }, 'Unexpected mail "VerifyEmail" was queued')
    assert.throws(() => {
      return mails.assertNotQueued(VerifyEmail, (mail) => mail.message.hasTo('bar@baz.com'))
    }, 'Unexpected mail "VerifyEmail" was queued')
  })

  test('assert an email was queued multiple times', async ({ assert }) => {
    const emitter = new Emitter<MailEvents>(app)
    const mailer = new FakeMailer('mailgun', emitter, {})
    const { mails } = mailer

    class VerifyEmail extends BaseMail {
      from: string = 'foo@bar.com'
      subject: string = 'Verify your email address'

      prepare() {
        this.message.to('bar@baz.com')
      }
    }
    class PaymentDueNotification extends BaseMail {
      from: string = 'foo@bar.com'
      subject: string = 'Clear your dues'

      prepare() {
        this.message.to('foo@example.com')
      }
    }

    await mailer.sendLater(new VerifyEmail())
    await mailer.sendLater(new VerifyEmail())
    await mailer.sendLater(new PaymentDueNotification())

    mails.assertQueuedCount(VerifyEmail, 2)
    mails.assertQueuedCount(PaymentDueNotification, 1)
    mails.assertQueuedCount(3)

    assert.throws(() => {
      return mails.assertQueuedCount(VerifyEmail, 1)
    }, 'Expected "VerifyEmail" to be queued "1" time, instead it was queued "2" times')
    assert.throws(() => {
      return mails.assertQueuedCount(4)
    }, 'Expected to queue "4" mail, instead received "3" mail')
  })

  test('assert zero mails were queued', async ({ assert }) => {
    const emitter = new Emitter<MailEvents>(app)
    const mailer = new FakeMailer('mailgun', emitter, {})
    const { mails } = mailer

    class VerifyEmail extends BaseMail {
      from: string = 'foo@bar.com'
      subject: string = 'Verify your email address'

      prepare() {
        this.message.to('bar@baz.com')
      }
    }
    class PaymentDueNotification extends BaseMail {
      from: string = 'foo@bar.com'
      subject: string = 'Clear your dues'

      prepare() {
        this.message.to('foo@example.com')
      }
    }

    mails.assertNoneQueued()

    await mailer.sendLater(new VerifyEmail())
    await mailer.sendLater(new VerifyEmail())
    await mailer.sendLater(new PaymentDueNotification())

    assert.throws(() => {
      return mails.assertNoneQueued()
    }, 'Expected zero mail to be queued, instead received "3" mail')
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

    const { mails } = mailer

    class VerifyEmail extends BaseMail {
      from: string = 'foo@bar.com'
      subject: string = 'Verify your email address'

      prepare() {
        this.message.htmlView('foo/bar', { username: 'virk' })
        this.message.to('bar@baz.com')
      }
    }

    await mailer.sendLater(new VerifyEmail())
    mails.assertQueued(VerifyEmail, (mail) => {
      mail.message.assertHtmlIncludes('Hello virk')
      return true
    })
  })
})

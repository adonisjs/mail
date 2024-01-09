/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import string from '@poppinss/utils/string'
import { AssertionError } from 'node:assert'
import type { EmitterLike } from '@adonisjs/core/types/events'
import type { SentMessageInfo } from 'nodemailer/lib/json-transport/index.js'

import { Mailer } from './mailer.js'
import type { Message } from './message.js'
import { BaseMail } from './base_mail.js'
import type { MailResponse } from './mail_response.js'
import { JSONTransport } from './transports/json.js'
import type {
  MailEvents,
  MailerConfig,
  MailerContract,
  MailerMessenger,
  MessageSearchOptions,
  MessageComposeCallback,
} from './types.js'

/**
 * Mails collection to collect mails sent or queued during
 * the fake mode
 */
class MailsCollection {
  #sent: BaseMail[] = []
  #queued: BaseMail[] = []

  trackSent(mail: BaseMail) {
    this.#sent.push(mail)
  }
  trackQueued(mail: BaseMail) {
    this.#queued.push(mail)
  }
  clear() {
    this.#sent = []
    this.#queued = []
  }

  /**
   * Returns a list of sent emails captured by the fake mailer
   */
  sent(filterFn?: (mail: BaseMail) => boolean) {
    return filterFn ? this.#sent.filter(filterFn) : this.#sent
  }

  /**
   * Returns a list of queued emails captured by the fake mailer
   */
  queued(filterFn?: (mail: BaseMail) => boolean) {
    return filterFn ? this.#queued.filter(filterFn) : this.#queued
  }

  /**
   * Assert the mentioned mail was sent during the fake
   * mode
   */
  assertSent<T extends typeof BaseMail>(
    mailConstructor: T,
    findFn?: (mail: InstanceType<T>) => boolean
  ) {
    const matchingMail = this.#sent.find((mail) => {
      if (!findFn) {
        return mail instanceof mailConstructor
      }
      return mail instanceof mailConstructor && findFn(mail as InstanceType<T>)
    })

    if (!matchingMail) {
      throw new AssertionError({
        message: `Expected mail "${mailConstructor.name}" was not sent`,
      })
    }
  }

  /**
   * Assert the mentioned mail was NOT sent during the fake
   * mode
   */
  assertNotSent<T extends typeof BaseMail>(
    mailConstructor: T,
    findFn?: (mail: InstanceType<T>) => boolean
  ) {
    const matchingMail = this.#sent.find((mail) => {
      if (!findFn) {
        return mail instanceof mailConstructor
      }
      return mail instanceof mailConstructor && findFn(mail as InstanceType<T>)
    })

    if (matchingMail) {
      throw new AssertionError({
        message: `Unexpected mail "${mailConstructor.name}" was sent`,
      })
    }
  }

  /**
   * Assert a total of expected number of mails were sent
   */
  assertSentCount(count: number): void

  /**
   * Assert the mentioned mail was sent for expected number
   * of times
   */
  assertSentCount(mailConstructor: typeof BaseMail, count: number): void
  assertSentCount(mailConstructor: typeof BaseMail | number, count?: number): void {
    if (typeof mailConstructor === 'number') {
      const actual = this.#sent.length
      const expected = mailConstructor
      if (actual !== expected) {
        throw new AssertionError({
          message: `Expected to send "${expected}" ${string.pluralize(
            'mail',
            expected
          )}, instead received "${actual}" ${string.pluralize('mail', actual)}`,
          actual,
          expected,
        })
      }
      return
    }

    const actual = this.sent((mail) => mail instanceof mailConstructor).length
    const expected = count as number
    if (actual !== expected) {
      throw new AssertionError({
        message: `Expected "${mailConstructor.name}" to be sent "${expected}" ${string.pluralize(
          'time',
          expected
        )}, instead it was sent "${actual}" ${string.pluralize('time', actual)}`,
        actual,
        expected,
      })
    }
  }

  /**
   * Assert zero emails were sent
   */
  assertNoneSent() {
    if (this.#sent.length) {
      throw new AssertionError({
        message: `Expected zero mail to be sent, instead received "${this.#sent.length}" mail`,
        expected: [],
        actual: [this.#sent.map((mail) => mail.constructor.name)],
      })
    }
  }

  /**
   * Assert the mentioned mail was queued during the fake
   * mode
   */
  assertQueued<T extends typeof BaseMail>(
    mailConstructor: T,
    findFn?: (mail: InstanceType<T>) => boolean
  ) {
    const matchingMail = this.#queued.find((mail) => {
      if (!findFn) {
        return mail instanceof mailConstructor
      }
      return mail instanceof mailConstructor && findFn(mail as InstanceType<T>)
    })

    if (!matchingMail) {
      throw new AssertionError({
        message: `Expected mail "${mailConstructor.name}" was not queued`,
      })
    }
  }

  /**
   * Assert the mentioned mail was NOT queued during the fake
   * mode
   */
  assertNotQueued<T extends typeof BaseMail>(
    mailConstructor: T,
    findFn?: (mail: InstanceType<T>) => boolean
  ) {
    const matchingMail = this.#queued.find((mail) => {
      if (!findFn) {
        return mail instanceof mailConstructor
      }
      return mail instanceof mailConstructor && findFn(mail as InstanceType<T>)
    })

    if (matchingMail) {
      throw new AssertionError({
        message: `Unexpected mail "${mailConstructor.name}" was queued`,
      })
    }
  }

  /**
   * Assert a total of expected number of mails were queued
   */
  assertQueuedCount(count: number): void

  /**
   * Assert the mentioned mail was sequeuednt for expected number
   * of times
   */
  assertQueuedCount(mailConstructor: typeof BaseMail, count: number): void
  assertQueuedCount(mailConstructor: typeof BaseMail | number, count?: number): void {
    if (typeof mailConstructor === 'number') {
      const actual = this.#queued.length
      const expected = mailConstructor
      if (actual !== expected) {
        throw new AssertionError({
          message: `Expected to queue "${expected}" ${string.pluralize(
            'mail',
            expected
          )}, instead received "${actual}" ${string.pluralize('mail', actual)}`,
          actual,
          expected,
        })
      }
      return
    }

    const actual = this.queued((mail) => mail instanceof mailConstructor).length
    const expected = count as number
    if (actual !== expected) {
      throw new AssertionError({
        message: `Expected "${mailConstructor.name}" to be queued "${expected}" ${string.pluralize(
          'time',
          expected
        )}, instead it was queued "${actual}" ${string.pluralize('time', actual)}`,
        actual,
        expected,
      })
    }
  }

  /**
   * Assert zero emails were queued
   */
  assertNoneQueued() {
    if (this.#queued.length) {
      throw new AssertionError({
        message: `Expected zero mail to be queued, instead received "${this.#queued.length}" mail`,
        expected: [],
        actual: [this.#queued.map((mail) => mail.constructor.name)],
      })
    }
  }
}

/**
 * Messages collection to collect messages sent or queued during
 * the fake mode
 */
class MessagesCollection {
  #sent: Message[] = []
  #queued: Message[] = []

  /**
   * Default finder to find a message using search options
   */
  #messageFinder = (message: Message, searchOptions: MessageSearchOptions): boolean => {
    if (searchOptions.from && !message.hasFrom(searchOptions.from)) {
      return false
    }
    if (searchOptions.to && !message.hasTo(searchOptions.to)) {
      return false
    }
    if (searchOptions.subject && !message.hasSubject(searchOptions.subject)) {
      return false
    }
    if (
      searchOptions.attachments &&
      !searchOptions.attachments.every((attachment) => message.hasAttachment(attachment))
    ) {
      return false
    }
    return true
  }

  trackSent(message: Message) {
    this.#sent.push(message)
  }
  trackQueued(message: Message) {
    this.#queued.push(message)
  }
  clear() {
    this.#sent = []
    this.#queued = []
  }

  /**
   * Returns a list of sent messages captured by the fake mailer
   */
  sent(filterFn?: (message: Message) => boolean) {
    return filterFn ? this.#sent.filter(filterFn) : this.#sent
  }

  /**
   * Returns a list of queued messages captured by the fake mailer
   */
  queued(filterFn?: (message: Message) => boolean) {
    return filterFn ? this.#queued.filter(filterFn) : this.#queued
  }

  /**
   * Assert the mentioned message was sent during the fake
   * mode
   */
  assertSent(finder: ((message: Message) => boolean) | MessageSearchOptions) {
    const matchingMessage = this.#sent.find(
      typeof finder === 'function' ? finder : (message) => this.#messageFinder(message, finder)
    )

    if (!matchingMessage) {
      throw new AssertionError({
        message: `Expected message was not sent`,
      })
    }
  }

  /**
   * Assert the mentioned message was NOT sent during the fake
   * mode
   */
  assertNotSent(finder: ((message: Message) => boolean) | MessageSearchOptions) {
    const matchingMessage = this.#sent.find(
      typeof finder === 'function' ? finder : (message) => this.#messageFinder(message, finder)
    )

    if (matchingMessage) {
      throw new AssertionError({
        message: `Unexpected message was sent`,
      })
    }
  }

  /**
   * Assert a total of expected number of messages were sent
   */
  assertSentCount(count: number): void

  /**
   * Assert the mentioned message was sent for expected number
   * of times
   */
  assertSentCount(
    finder: ((message: Message) => boolean) | MessageSearchOptions,
    count: number
  ): void
  assertSentCount(
    finder: ((message: Message) => boolean) | MessageSearchOptions | number,
    count?: number
  ): void {
    if (typeof finder === 'number') {
      const actual = this.#sent.length
      const expected = finder
      if (actual !== expected) {
        throw new AssertionError({
          message: `Expected to send "${expected}" ${string.pluralize(
            'message',
            expected
          )}, instead received "${actual}" ${string.pluralize('message', actual)}`,
          actual,
          expected,
        })
      }
      return
    }

    const actual = this.sent(
      typeof finder === 'function' ? finder : (message) => this.#messageFinder(message, finder)
    ).length
    const expected = count as number

    if (actual !== expected) {
      throw new AssertionError({
        message: `Expected to send "${expected}" ${string.pluralize(
          'message',
          expected
        )}, instead received "${actual}" ${string.pluralize('message', actual)}`,
        actual,
        expected,
      })
    }
  }

  /**
   * Assert zero messages were sent
   */
  assertNoneSent() {
    if (this.#sent.length) {
      throw new AssertionError({
        message: `Expected zero messages to be sent, instead received "${
          this.#sent.length
        }" ${string.pluralize('message', this.#sent.length)}`,
      })
    }
  }

  /**
   * Assert the mentioned message was queued during the fake
   * mode
   */
  assertQueued(finder: ((message: Message) => boolean) | MessageSearchOptions) {
    const matchingMessage = this.#queued.find(
      typeof finder === 'function' ? finder : (message) => this.#messageFinder(message, finder)
    )

    if (!matchingMessage) {
      throw new AssertionError({
        message: `Expected message was not queued`,
      })
    }
  }

  /**
   * Assert the mentioned message was NOT queued during the fake
   * mode
   */
  assertNotQueued(finder: ((message: Message) => boolean) | MessageSearchOptions) {
    const matchingMessage = this.#queued.find(
      typeof finder === 'function' ? finder : (message) => this.#messageFinder(message, finder)
    )

    if (matchingMessage) {
      throw new AssertionError({
        message: `Unexpected message was queued`,
      })
    }
  }

  /**
   * Assert a total of expected number of messages were queued
   */
  assertQueuedCount(count: number): void

  /**
   * Assert the mentioned message was queued for expected number
   * of times
   */
  assertQueuedCount(
    finder: ((message: Message) => boolean) | MessageSearchOptions,
    count: number
  ): void
  assertQueuedCount(
    finder: ((message: Message) => boolean) | MessageSearchOptions | number,
    count?: number
  ): void {
    if (typeof finder === 'number') {
      const actual = this.#queued.length
      const expected = finder
      if (actual !== expected) {
        throw new AssertionError({
          message: `Expected to queue "${expected}" ${string.pluralize(
            'message',
            expected
          )}, instead received "${actual}" ${string.pluralize('message', actual)}`,
          actual,
          expected,
        })
      }
      return
    }

    const actual = this.queued(
      typeof finder === 'function' ? finder : (message) => this.#messageFinder(message, finder)
    ).length
    const expected = count as number

    if (actual !== expected) {
      throw new AssertionError({
        message: `Expected to queue "${expected}" ${string.pluralize(
          'message',
          expected
        )}, instead received "${actual}" ${string.pluralize('message', actual)}`,
        actual,
        expected,
      })
    }
  }

  /**
   * Assert zero messages were queued
   */
  assertNoneQueued() {
    if (this.#queued.length) {
      throw new AssertionError({
        message: `Expected zero messages to be queued, instead received "${
          this.#queued.length
        }" ${string.pluralize('message', this.#queued.length)}`,
      })
    }
  }
}

/**
 * Fake mailer uses the JSON transport to send emails and
 * collects them within memory for a better testing
 * experience.
 */
export class FakeMailer extends Mailer<JSONTransport> implements MailerContract<JSONTransport> {
  mails = new MailsCollection()
  messages = new MessagesCollection()

  constructor(name: string, emitter: EmitterLike<MailEvents>, config: MailerConfig) {
    super(name, new JSONTransport(), emitter, config)
    super.setMessenger({
      queue: async (mail, sendConfig) => {
        return this.sendCompiled(mail, sendConfig)
      },
    })
  }

  /**
   * Define the messenger to use for queueing emails.
   * The fake mailer ignores using a custom messenger
   */
  setMessenger(_: MailerMessenger): this {
    return this
  }

  /**
   * @inheritdoc
   */
  async send(
    callbackOrMail: MessageComposeCallback | BaseMail,
    config?: undefined
  ): Promise<MailResponse<SentMessageInfo>> {
    if (callbackOrMail instanceof BaseMail) {
      this.mails.trackSent(callbackOrMail)
      const response = await super.send(callbackOrMail, config)
      return response
    }

    const response = await super.send((message) => {
      callbackOrMail(message)
      this.messages.trackSent(message)
    }, config)

    return response
  }

  /**
   * @inheritdoc
   */
  async sendLater(
    callbackOrMail: MessageComposeCallback | BaseMail,
    config?: undefined
  ): Promise<void> {
    if (callbackOrMail instanceof BaseMail) {
      this.mails.trackQueued(callbackOrMail)
      await callbackOrMail.sendLater(this, config)
      return
    }

    await super.sendLater((message) => {
      callbackOrMail(message)
      this.messages.trackQueued(message)
    }, config)
  }

  async close() {
    this.messages.clear()
    this.mails.clear()
    super.close()
  }
}

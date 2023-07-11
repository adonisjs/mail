/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { AssertionError } from 'node:assert'
import { ManagerDriverFactory } from '../define_config.js'
import { MessageSearchNode, MessageNode, MailerContract } from '../types/main.js'

export class FakeMailManager<KnownMailers extends Record<string, ManagerDriverFactory>> {
  fakedMailers: Map<keyof KnownMailers, MailerContract<any, any>> = new Map()

  /**
   * Returns the faked mailer instance
   */
  use(mailer: keyof KnownMailers) {
    const result = this.fakedMailers.get(mailer)!

    return result
  }

  /**
   * Restore mailer fake
   */
  restore(mailer: keyof KnownMailers) {
    const mailerInstance = this.fakedMailers.get(mailer)
    if (mailerInstance) {
      mailerInstance.close()
      this.fakedMailers.delete(mailer)
    }
  }

  /**
   * Find if a mailer is faked
   */
  isFaked(mailer: keyof KnownMailers): boolean {
    return this.fakedMailers.has(mailer)
  }

  /**
   * Find if an email exists
   */
  exists(messageOrCallback: MessageSearchNode | ((mail: MessageSearchNode) => boolean)): boolean {
    return !!this.find(messageOrCallback)
  }

  /**
   * Find an email
   */
  find(
    messageOrCallback: MessageSearchNode | ((mail: MessageSearchNode) => boolean)
  ): MessageSearchNode | null {
    for (let [, mailer] of this.fakedMailers) {
      const message = mailer.driver.find(messageOrCallback)
      if (message) {
        return message
      }
    }

    return null
  }

  /**
   * Filter emails
   */
  filter(
    messageOrCallback: MessageSearchNode | ((mail: MessageSearchNode) => boolean)
  ): MessageNode[] {
    let messages: MessageNode[] = []
    for (let [, mailer] of this.fakedMailers) {
      messages = messages.concat(mailer.driver.filter(messageOrCallback))
    }

    return messages
  }

  /**
   * Assert a given mail has been sent
   */
  assertSent(messageOrCallback: MessageSearchNode | ((mail: MessageSearchNode) => boolean)) {
    const message = this.find(messageOrCallback)

    if (!message) {
      throw new AssertionError({
        message: 'Expected to find sent email but not found any',
        expected: true,
        actual: false,
        operator: 'assertSent',
        stackStartFn: this.assertSent,
      })
    }
  }

  /**
   * Assert a given mail has not been sent
   */
  assertNotSent(messageOrCallback: MessageSearchNode | ((mail: MessageSearchNode) => boolean)) {
    const message = this.find(messageOrCallback)

    if (message) {
      throw new AssertionError({
        message: 'Expected to not find sent email but found one',
        expected: false,
        actual: true,
        operator: 'assertNotSent',
        stackStartFn: this.assertNotSent,
      })
    }
  }

  /**
   * Assert no emails have been sent
   */
  assertNoneSent() {
    const messages = this.filter(() => true)

    if (messages.length) {
      throw new AssertionError({
        message: 'Expected to not find sent email but found one',
        expected: false,
        actual: true,
        operator: 'assertNothingSent',
        stackStartFn: this.assertNoneSent,
      })
    }
  }
}

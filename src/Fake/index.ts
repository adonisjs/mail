/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/// <reference path="../../adonis-typings/mail.ts" />

import {
  MailerContract,
  MailersList,
  MessageNode,
  MessageSearchNode,
  FakeMailManagerContract,
} from '@ioc:Adonis/Addons/Mail'

export class FakeMailManager implements FakeMailManagerContract {
  public fakedMailers: Map<keyof MailersList, MailerContract<any>> = new Map()

  /**
   * Returns the faked mailer instance
   */
  public use(mailer: keyof MailersList) {
    return this.fakedMailers.get(mailer)!
  }

  /**
   * Restore mailer fake
   */
  public restore(mailer: keyof MailersList) {
    const mailerInstance = this.fakedMailers.get(mailer)
    if (mailerInstance) {
      mailerInstance.close()
      this.fakedMailers.delete(mailer)
    }
  }

  /**
   * Find if a mailer is faked
   */
  public isFaked(mailer: keyof MailersList): boolean {
    return this.fakedMailers.has(mailer)
  }

  /**
   * Find if an email exists
   */
  public exists(
    messageOrCallback: MessageSearchNode | ((mail: MessageSearchNode) => boolean)
  ): boolean {
    return !!this.find(messageOrCallback)
  }

  /**
   * Find an email
   */
  public find(
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
  public filter(
    messageOrCallback: MessageSearchNode | ((mail: MessageSearchNode) => boolean)
  ): MessageNode[] {
    let messages: MessageNode[] = []
    for (let [, mailer] of this.fakedMailers) {
      messages = messages.concat(mailer.driver.filter(messageOrCallback))
    }

    return messages
  }
}

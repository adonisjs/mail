/*
 * @adonisjs/mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

/// <reference path="../../adonis-typings/mail.ts" />

import { EdgeContract } from 'edge.js'
import {
  MailerContract,
  MailDriverContract,
  MessageComposeCallback,
} from '@ioc:Adonis/Addons/Mail'

import { Message } from '../Message'

/**
 * Mailer exposes the unified API to send emails using one of the pre-configure
 * driver
 */
export class Mailer implements MailerContract {
  constructor (
    public name: string,
    private view: EdgeContract,
    public driver: MailDriverContract,
    public onClose: (mailer: MailerContract) => void,
  ) {
  }

  /**
   * Sends email
   */
  public async send (callback: MessageComposeCallback) {
    const message = new Message(this.view)
    await callback(message)
    return this.driver.send(message.toJSON())
  }

  /**
   * Invokes `close` method on the driver
   */
  public async close () {
    await this.driver.close()
    this.onClose(this)
  }
}

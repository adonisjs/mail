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
  DriverContract,
  MessageComposeCallback,
} from '@ioc:Adonis/Addons/Mail'

import { Message } from '../Message'

/**
 * Mailer exposes the unified API to send emails using one of the pre-configure
 * driver
 */
export class Mailer implements MailerContract {
  protected $cacheMappings = true

  constructor (
    public name: string,
    private _view: EdgeContract,
    private _driver: DriverContract,
    private _onClose: (mailer: MailerContract) => void,
  ) {
  }

  /**
   * Sends email
   */
  public async send (callback: MessageComposeCallback) {
    const message = new Message(this._view)
    await callback(message)
    return this._driver.send(message.toJSON())
  }

  /**
   * Invokes `close` method on the driver
   */
  public async close () {
    await this._driver.close()
    this._onClose(this)
  }
}

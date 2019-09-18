/*
 * @adonisjs/mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

/// <reference path="../../adonis-typings/mail.ts" />

import nodemailer from 'nodemailer'

import {
  MessageNode,
  SmtpMailResponse,
  SmtpDriverContract,
  SmtpConfigContract,
} from '@ioc:Adonis/Addons/Mail'

/**
 * Smtp driver to send email using smtp
 */
export class SmtpDriver implements SmtpDriverContract {
  private _transporter: any

  constructor (config: SmtpConfigContract) {
    this._transporter = nodemailer.createTransport(config)
  }

  /**
   * Send message
   */
  public async send (message: MessageNode): Promise<SmtpMailResponse> {
    if (!this._transporter) {
      throw new Error('Driver transport has been closed and cannot be used for sending emails')
    }

    return this._transporter.sendMail(message)
  }

  /**
   * Close transporter connection, helpful when using connections pool
   */
  public async close () {
    this._transporter.close()
    this._transporter = null
  }
}

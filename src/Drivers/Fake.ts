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
  FakeDriverContract,
  FakeMailResponse,
  MessageSearchNode,
} from '@ioc:Adonis/Addons/Mail'
import { subsetCompare } from '../utils'

/**
 * Smtp driver to send email using smtp
 */
export class FakeDriver implements FakeDriverContract {
  private transporter: any
  public mails: MessageNode[] = []

  constructor() {
    this.transporter = nodemailer.createTransport({
      jsonTransport: true,
    })
  }

  /**
   * Find an email
   */
  public find(
    messageOrCallback: MessageSearchNode | ((mail: MessageSearchNode) => boolean)
  ): MessageNode | null {
    if (typeof messageOrCallback === 'function') {
      return this.mails.find(messageOrCallback) || null
    }

    return this.mails.find((mail) => subsetCompare(messageOrCallback, mail)) || null
  }

  /**
   * Filter emails
   */
  public filter(
    messageOrCallback: MessageSearchNode | ((mail: MessageSearchNode) => boolean)
  ): MessageNode[] {
    if (typeof messageOrCallback === 'function') {
      return this.mails.filter(messageOrCallback)
    }

    return this.mails.filter((mail) => subsetCompare(messageOrCallback, mail))
  }

  /**
   * Send message
   */
  public async send(message: MessageNode): Promise<FakeMailResponse> {
    if (!this.transporter) {
      throw new Error('Driver transport has been closed and cannot be used for sending emails')
    }

    this.mails.push(message)
    return this.transporter.sendMail(message)
  }

  /**
   * Close transporter connection, helpful when using connections pool
   */
  public async close() {
    this.transporter.close()
    this.mails = []
    this.transporter = null
  }
}

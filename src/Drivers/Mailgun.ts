/*
 * @adonisjs/mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/// <reference path="../../adonis-typings/mail.ts" />

import nodemailer, { Transport } from 'nodemailer'
import FormData from 'form-data'

import { Request } from '../Request'

import {
  MessageNode,
  MailgunMailResponse,
  MailgunDriverContract,
  MailgunConfigContract,
} from '@ioc:Adonis/Addons/Mail'

const ADDRESS_TYPES: Array<string> = ['from', 'to', 'cc', 'bcc', 'replyTo']
const CONTENT_TYPES: Array<string> = ['subject', 'text', 'html']
const TRANSFORM_FIELDS: Object = {
  replyTo: 'h:Reply-To',
}

/**
 * Mailgun transporter
 */

export class MailgunTransporter implements Transport {
  public name = 'mailgun'
  public version = '2.0.0'

  private config: MailgunConfigContract
  private acceptanceMessages = ['Queued', 'Success', 'Done', 'Sent']

  constructor (config: MailgunConfigContract) {
    this.config = config
  }

  private get authHeader () {
    return `api:${this.config.apiKey}`
  }

  public get endpoint () {
    const host = this.config.hostname || 'api.mailgun.net'
    return `https://${host}/v3/${this.config.domain}/messages`
  }

  /**
   * Formats a single target details into mailgun formatted
   */
  private formatTarget (target: { address: string; name?: string }): string {
    return target.name
      ? `${target.name} <${target.address}>`
      : target.address
  }

  /**
   * Insert all the addresses to the body with proper mailgun format
   */
  public prepareAddresses (form: FormData, data: MessageNode){
    ADDRESS_TYPES.forEach(target => {
      if (!data[target]) {
        return
      }
      let value: string
      if (Array.isArray(data[target])) {
        value = data[target].map(this.formatTarget).join(',')
      } else {
        value = this.formatTarget(data[target])
      }
      form.append(TRANSFORM_FIELDS[target] || target, value)
    })
  }

  /**
   * Insert all the content type field to the body with proper mailgun format
   */
  private prepareContent (form: FormData, data: MessageNode): void {
    CONTENT_TYPES.forEach(content => {
      if (!data[content]) {
        return
      }
      form.append(TRANSFORM_FIELDS[content] || content, data[content])
    })
  }

  /**
   * Insert all the attachments to the body with proper mailgun format
   */
  private prepareAttachments (form: FormData, data: MessageNode): void {
    if (!Array.isArray(data.attachments)) {
      return
    }
    data.attachments.forEach((attachment) => {
      let buffer: Buffer = Buffer.from(attachment.content || '')
      form.append('inline', buffer, {
        filename: attachment.cid,
        contentType: attachment.contentType,
        knownLength: buffer.length,
      })
    })
  }

  /**
   * Returns extras object by merging runtime config
   * with static config
   */
  public getExtras (extras?: {[index: string]: string}) {
    return {
      ...this.config.extras,
      ...extras,
    }
  }

  /**
   * Format the response message into MailgunMailResponse
   */
  public formatSuccess (response): MailgunMailResponse {
    const isAccepted = this.acceptanceMessages.find((term) => response.message.indexOf(term) > -1)
    return {
      messageId: response.id,
      acceptedCount: isAccepted ? 1 : 0,
      rejectedCount: isAccepted ? 0 : 1,
    }
  }

  /**
   * Send email from transport
   */
  public send (mail: any, callback: Function) {
    const form: FormData = new FormData()

    this.prepareAddresses(form, mail.data)
    this.prepareContent(form, mail.data)
    this.prepareAttachments(form, mail.data)

    const extras = this.getExtras(mail.data.extras)
    Object.keys(extras).forEach(key => form.append(key, extras[key]))

    new Request()
      .setBasicAuth(this.authHeader)
      .setHeaders(form.getHeaders())
      .post(this.endpoint, form)
      .then((response) => {
        callback(null, this.formatSuccess(response))
      })
      .catch(err => callback(err))
  }
}

/**
 * Mailgun driver to send email using mailgun api
 */
export class MailgunDriver implements MailgunDriverContract {
  private transporter: any

  constructor (config: MailgunConfigContract) {
    this.setConfig(config)
  }

  /**
   * Set config
   */
  public setConfig (config: MailgunConfigContract){
    this.transporter = nodemailer.createTransport(new MailgunTransporter(config))
  }

  /**
   * Send message
   */
  public async send (message: MessageNode): Promise<MailgunMailResponse> {
    if (!this.transporter) {
      throw new Error(
        'Driver transport has been closed and cannot be used for sending emails'
      )
    }
    return new Promise((resolve, reject) => {
      this.transporter.sendMail(message, (error, result) => {
        if (error) {
          reject(error)
        } else {
          resolve(result)
        }
      })
    })
  }

  /**
   * Close transporter connection, helpful when using connections pool
   */
  public async close () {
    this.transporter.close()
    this.transporter = null
  }
}

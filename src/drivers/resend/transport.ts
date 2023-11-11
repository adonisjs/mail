/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import got from 'got'
import { Transport } from 'nodemailer'
import { Address } from 'nodemailer/lib/mailer/index.js'
import MailMessage from 'nodemailer/lib/mailer/mail-message.js'

import type { ResendConfig } from '../../types.js'

/**
 * Resend transport for Nodemailer
 */
export class ResendTransport implements Transport {
  name = 'resend'
  version = '1.0.0'

  #config: ResendConfig

  constructor(config: ResendConfig) {
    this.#config = config
  }

  /**
   * Format the address for Resend API
   */
  #formatAddress(rawAddress: string | Address | undefined) {
    if (!rawAddress) {
      throw new Error('Missing recipient address')
    }

    if (typeof rawAddress === 'string') {
      return rawAddress
    }

    if (rawAddress.name) {
      return `${rawAddress.name} <${rawAddress.address}>`
    }

    return rawAddress.address
  }

  /**
   * Format a list of addresses
   */
  #formatAddresses(rawAddresses: string | Address | Array<string | Address> | undefined) {
    const addresses = Array.isArray(rawAddresses) ? rawAddresses : [rawAddresses]
    return addresses.map((address) => this.#formatAddress(address))
  }

  /**
   * Prepare the payload by converting Mail message to the format
   * accepted by Resend
   */
  #preparePayload(mail: MailMessage) {
    let payload: Record<string, any> = {
      from: this.#formatAddress(mail.data.from),
      to: this.#formatAddresses(mail.data.to),
      subject: mail.data.subject,
    }

    if (mail.data.bcc) {
      payload.bcc = this.#formatAddresses(mail.data.bcc)
    }

    if (mail.data.cc) {
      payload.cc = this.#formatAddresses(mail.data.cc)
    }

    if (mail.data.replyTo) {
      payload.reply_to = this.#formatAddresses(mail.data.replyTo)
    }

    if (mail.data.html) {
      payload.html = mail.data.html
    }

    if (mail.data.text) {
      payload.text = mail.data.text
    }

    if (mail.data.attachments) {
      payload.attachments = mail.data.attachments.map((attachment) => ({
        content: attachment.content,
        filename: attachment.filename,
        path: attachment.path,
      }))
    }

    if (this.#config.tags) {
      payload.tags = this.#config.tags
    }

    return payload
  }

  /**
   * Get resend api url to send email
   */
  #getUrl() {
    return `${this.#config.baseUrl.replace(/\/$/, '')}/emails`
  }

  /**
   * Send the message
   */
  async send(mail: MailMessage, callback: (err: Error | null, info?: any) => void) {
    const url = this.#getUrl()
    const envelope = mail.message.getEnvelope()
    const payload = this.#preparePayload(mail)

    try {
      const result = await got
        .post(url, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.#config.key}`,
          },
          json: payload,
        })
        .json<ResendApiResponse>()

      const messageId = result.id
      callback(null, { messageId, envelope })
    } catch (error) {
      callback(EmailTransportException.apiFailure(error))
    }
  }
}

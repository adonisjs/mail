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
import { EmailTransportException } from '../exceptions/email_transport_exception.js'
import { BrevoConfig } from '../types/drivers/brevo.js'
import { Logger } from '@adonisjs/core/logger'

/**
 * Brevo transport for Nodemailer
 */
export class BrevoTransport implements Transport {
  name = 'brevo'
  version = '1.0.0'

  #config: BrevoConfig
  #logger: Logger

  constructor(config: BrevoConfig, logger: Logger) {
    this.#config = config
    this.#logger = logger
  }

  /**
   * Format the address to be accepted by the Brevo API
   */
  #formatAddress(rawAddress: string | Address | undefined) {
    if (!rawAddress) {
      throw new Error('Missing recipient address')
    }

    if (typeof rawAddress === 'string') {
      return { email: rawAddress }
    }

    const address: Record<string, string> = {}
    if (rawAddress.name) address.name = rawAddress.name
    if (rawAddress.address) address.email = rawAddress.address
    return address
  }

  /**
   * Format a list of addresses
   */
  #formatAddresses(rawAddresses: string | Address | Array<string | Address> | undefined) {
    const addresses = Array.isArray(rawAddresses) ? rawAddresses : [rawAddresses]
    return addresses.map((address) => this.#formatAddress(address))
  }

  /**
   * Convert the Mail message to the format accepted by the Brevo API
   */
  #preparePayload(mail: MailMessage) {
    let payload: Record<string, any> = {
      sender: this.#formatAddress(mail.data.from),
      to: this.#formatAddresses(mail.data.to),
      subject: mail.data.subject,
    }

    if (mail.data.html) {
      payload.htmlContent = mail.data.html
    }

    if (mail.data.text) {
      payload.textContent = mail.data.text
    }

    if (mail.data.replyTo) {
      payload.replyTo = this.#formatAddresses(mail.data.replyTo)
    }

    if (mail.data.cc) {
      payload.cc = this.#formatAddresses(mail.data.cc)
    }

    if (mail.data.bcc) {
      payload.bcc = this.#formatAddresses(mail.data.bcc)
    }

    if (this.#config.tags) {
      payload.tags = this.#config.tags
    }

    if (this.#config.templateId) {
      payload.templateId = this.#config.templateId
    }

    if (this.#config.templateParams) {
      payload.params = this.#config.templateParams
    }

    if (this.#config.scheduledAt) {
      payload.scheduledAt = this.#config.scheduledAt.toISO()
    }

    if (mail.data.attachments) {
      payload.attachments = mail.data.attachments.map((attachment) => ({
        name: attachment.filename,
        content: attachment.content!.toString('base64'),
      }))
    }

    return payload
  }

  /**
   * Send mail
   */
  async send(mail: MailMessage, callback: (err: Error | null, info?: any) => void) {
    const url = this.#config.baseUrl ?? 'https://api.brevo.com/v3/smtp/email'
    const envelope = mail.message.getEnvelope()
    const payload = this.#preparePayload(mail)

    this.#logger.trace({ url, payload }, 'brevo email')

    try {
      const result = await got
        .post(url, {
          headers: {
            'accept': 'application/json',
            'api-key': this.#config.key,
            'content-type': 'application/json',
          },
          json: payload,
        })
        .json<{ messageId: string }>()

      const messageId = result.messageId.replace(/^<|>$/g, '')
      callback(null, { envelope, messageId })
    } catch (error) {
      callback(EmailTransportException.apiFailure(error))
    }
  }
}

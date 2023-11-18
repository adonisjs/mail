/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import got from 'got'
import type { Address } from 'nodemailer/lib/mailer/index.js'
import { type Transport, createTransport } from 'nodemailer'
import type MailMessage from 'nodemailer/lib/mailer/mail-message.js'

import debug from '../debug.js'
import { MailResponse } from '../mail_response.js'
import { E_MAIL_TRANSPORT_ERROR } from '../errors.js'
import type {
  BrevoConfig,
  NodeMailerMessage,
  BrevoRuntimeConfig,
  BrevoSentMessageInfo,
  MailTransportContract,
} from '../types.js'

/**
 * Transport for Nodemailer
 */
class NodeMailerTransport implements Transport {
  name = 'brevo'
  version = '1.0.0'

  #config: BrevoConfig

  constructor(config: BrevoConfig) {
    this.#config = config
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

    if (this.#config.scheduledAt) {
      payload.scheduledAt = this.#config.scheduledAt
    }

    if (mail.data.attachments) {
      payload.attachment = mail.data.attachments.map((attachment) => ({
        name: attachment.filename,
        content: attachment.content!.toString('base64'),
      }))
    }

    return payload
  }

  /**
   * Returns base url for sending emails
   */
  #getBaseUrl(): string {
    return this.#config.baseUrl.replace(/\/$/, '')
  }

  /**
   * Send mail
   */
  async send(mail: MailMessage, callback: (err: Error | null, info: BrevoSentMessageInfo) => void) {
    const url = `${this.#getBaseUrl()}/smtp/email`
    const envelope = mail.message.getEnvelope()
    const payload = this.#preparePayload(mail)

    debug('brevo email url %s', url)
    debug('brevo email payload %O', payload)

    try {
      const response = await got.post<{ messageId: string }>(url, {
        headers: {
          'accept': 'application/json',
          'api-key': this.#config.key,
          'content-type': 'application/json',
        },
        json: payload,
      })

      const brevoMessageId = response.body.messageId
      const messageId = brevoMessageId
        ? brevoMessageId.replace(/^<|>$/g, '')
        : mail.message.messageId()

      callback(null, { envelope, messageId })
    } catch (error) {
      callback(
        new E_MAIL_TRANSPORT_ERROR('Unable to send email using the brevo transport', {
          cause: error,
        }),
        undefined as any
      )
    }
  }
}

/**
 * Transport for sending emails using the Brevo `/emails/send` API.
 */
export class BrevoTransport implements MailTransportContract {
  #config: BrevoConfig

  constructor(config: BrevoConfig) {
    this.#config = config
  }

  /**
   * Send message
   */
  async send(
    message: NodeMailerMessage,
    config?: BrevoRuntimeConfig
  ): Promise<MailResponse<BrevoSentMessageInfo>> {
    const sparkpostTransport = new NodeMailerTransport({ ...this.#config, ...config })
    const transporter = createTransport<BrevoSentMessageInfo>(sparkpostTransport)

    const sparkPostResponse = await transporter.sendMail(message)
    return new MailResponse(
      sparkPostResponse.messageId,
      sparkPostResponse.envelope,
      sparkPostResponse
    )
  }
}

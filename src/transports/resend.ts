/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import got from 'got'
import { createTransport, type Transport } from 'nodemailer'
import MailMessage from 'nodemailer/lib/mailer/mail-message.js'

import debug from '../debug.js'
import { MailResponse } from '../mail_response.js'
import { E_MAIL_TRANSPORT_ERROR } from '../errors.js'
import type {
  ResendConfig,
  NodeMailerMessage,
  MailTransportContract,
  ResendRuntimeConfig,
  ResendSentMessageInfo,
} from '../types.js'

/**
 * Transport for nodemailer
 */
class NodeMailerTransport implements Transport {
  name = 'resend'
  version = '1.0.0'

  #config: ResendConfig

  constructor(config: ResendConfig) {
    this.#config = config
  }

  /**
   * Formatting recipients for resend API call
   */
  #formatRecipients(
    recipients?: MailMessage['data']['to'] | MailMessage['data']['cc'] | MailMessage['data']['bcc']
  ): string[] {
    if (!recipients) {
      return []
    }

    /**
     * Normalizing an array of recipients
     */
    if (Array.isArray(recipients)) {
      return recipients.map((recipient) => {
        if (typeof recipient === 'string') {
          return recipient
        }

        if (recipient.name) {
          return `${recipient.name} <${recipient.address}>`
        }

        return recipient.address
      })
    }

    /**
     * Normalizing a string based recipient
     */
    if (typeof recipients === 'string') {
      return [recipients]
    }

    /**
     * Normalizing an object based string
     */
    if (recipients.name) {
      return [`${recipients.name} <${recipients.address}>`]
    }

    return [recipients.address]
  }

  /**
   * Prepare the payload by converting Mail message to the format
   * accepted by Resend
   */
  #preparePayload(mail: MailMessage) {
    let payload: Record<string, any> = {
      from: this.#formatRecipients(mail.data.from)[0],
      to: this.#formatRecipients(mail.data.to),
      subject: mail.data.subject,
    }

    if (mail.data.bcc) {
      payload.bcc = this.#formatRecipients(mail.data.bcc)
    }

    if (mail.data.cc) {
      payload.cc = this.#formatRecipients(mail.data.cc)
    }

    if (mail.data.replyTo) {
      payload.reply_to = this.#formatRecipients(mail.data.replyTo)
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
  async send(
    mail: MailMessage,
    callback: (err: Error | null, info: ResendSentMessageInfo) => void
  ) {
    const url = this.#getUrl()
    const envelope = mail.message.getEnvelope()
    const payload = this.#preparePayload(mail)

    debug('resend mail url "%s"', url)
    debug('resend mail payload %O', payload)

    try {
      const response = await got.post<{ id: string }>(url, {
        responseType: 'json',
        json: payload,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.#config.key}`,
        },
      })

      const resendMessageId = response.body.id
      const messageId = resendMessageId
        ? resendMessageId.replace(/^<|>$/g, '')
        : mail.message.messageId()

      callback(null, { messageId, envelope, ...response.body })
    } catch (error) {
      callback(
        new E_MAIL_TRANSPORT_ERROR('Unable to send email using the resend transport', {
          cause: error,
        }),
        undefined as any
      )
    }
  }
}

/**
 * Transport for sending using the Resend `/emails` API.
 */
export class ResendTransport implements MailTransportContract {
  #config: ResendConfig

  constructor(config: ResendConfig) {
    this.#config = config
  }

  /**
   * Send message
   */
  async send(
    message: NodeMailerMessage,
    config?: ResendRuntimeConfig
  ): Promise<MailResponse<ResendSentMessageInfo>> {
    const sparkpostTransport = new NodeMailerTransport({ ...this.#config, ...config })
    const transporter = createTransport<ResendSentMessageInfo>(sparkpostTransport)

    const sparkPostResponse = await transporter.sendMail(message)
    return new MailResponse(
      sparkPostResponse.messageId,
      sparkPostResponse.envelope,
      sparkPostResponse
    )
  }
}

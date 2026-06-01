/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import ky from 'ky'
import { createTransport, type Transport } from 'nodemailer'
import type MailMessage from 'nodemailer/lib/mailer/mail-message.js'

import debug from '../debug.js'
import { MailResponse } from '../mail_response.js'
import { E_INVALID_CONFIG, E_MAIL_TRANSPORT_ERROR } from '../errors.js'
import { BaseApiTransport } from './base_api_transport.js'
import { normalizeBaseUrl, extractMessageHeaders, resolveAttachmentContent } from '../utils.js'

import type {
  CloudflareConfig,
  NodeMailerMessage,
  CloudflareRuntimeConfig,
  CloudflareSentMessageInfo,
} from '../types.js'

/**
 * Shape of the response returned by the Cloudflare Email Service API
 */
type CloudflareApiResponse = {
  success: boolean
  errors: { code: number; message: string }[]
  messages: { code: number; message: string }[]
  result?: {
    delivered?: string[]
    permanent_bounces?: string[]
    queued?: string[]
  }
}

/**
 * Transport for nodemailer
 */
class NodeMailerTransport implements Transport {
  name = 'cloudflare'
  version = '1.0.0'

  #config: CloudflareConfig

  constructor(config: CloudflareConfig) {
    this.#config = config
  }

  /**
   * Formatting recipients to the "Name <email>" string format. Cloudflare
   * accepts both plain strings and `{ email, name }` objects, but its docs
   * are inconsistent on the object key (`email` vs `address`), so we use
   * the universally accepted string representation.
   */
  #formatRecipients(
    recipients?: MailMessage['data']['to'] | MailMessage['data']['cc'] | MailMessage['data']['bcc']
  ): string[] {
    if (!recipients) {
      return []
    }

    if (!Array.isArray(recipients)) {
      recipients = [recipients] as any
    }

    return (recipients as any[]).map((recipient) => {
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
   * Prepare the payload by converting the Mail message to the format
   * accepted by the Cloudflare Email Service API
   */
  async #preparePayload(mail: MailMessage) {
    let payload: Record<string, any> = {
      from: this.#formatRecipients(mail.data.from)[0],
      to: this.#formatRecipients(mail.data.to),
      subject: mail.data.subject,
    }

    if (mail.data.cc) {
      payload.cc = this.#formatRecipients(mail.data.cc)
    }

    if (mail.data.bcc) {
      payload.bcc = this.#formatRecipients(mail.data.bcc)
    }

    if (mail.data.replyTo) {
      payload.reply_to = this.#formatRecipients(mail.data.replyTo)[0]
    }

    if (mail.data.html) {
      payload.html = mail.data.html
    }

    if (mail.data.text) {
      payload.text = mail.data.text
    }

    if (mail.data.attachments) {
      payload.attachments = await Promise.all(
        mail.data.attachments.map(async (attachment, index) => {
          const content = await resolveAttachmentContent(mail, index)
          const item: Record<string, any> = {
            filename: attachment.filename,
            content: content.toString('base64'),
            disposition: attachment.cid ? 'inline' : 'attachment',
          }

          if (attachment.contentType) {
            item.type = attachment.contentType
          }

          /**
           * Inline attachments defined via `message.embed()` carry a `cid`
           * that maps to Cloudflare's `content_id`
           */
          if (attachment.cid) {
            item.content_id = attachment.cid
          }

          return item
        })
      )
    }

    const headers = extractMessageHeaders(mail)
    if (headers) {
      payload.headers = headers
    }

    return payload
  }

  /**
   * Returns the URL for the Cloudflare Email Service send endpoint
   */
  #getSendUrl() {
    const baseUrl = normalizeBaseUrl(this.#config.baseUrl)
    return `${baseUrl}/accounts/${this.#config.accountId}/email/sending/send`
  }

  /**
   * Send the message
   */
  async send(
    mail: MailMessage,
    callback: (err: Error | null, info: CloudflareSentMessageInfo) => void
  ) {
    try {
      const url = this.#getSendUrl()
      const envelope = mail.message.getEnvelope()
      const payload = await this.#preparePayload(mail)

      debug('cloudflare mail url "%s"', url)
      debug('cloudflare mail payload %O', payload)

      const response = await ky.post<CloudflareApiResponse>(url, {
        json: payload,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.#config.key}`,
        },
      })

      const body = await response.json()

      /**
       * The Cloudflare API can respond with a 200 status code while still
       * reporting a failure through the `success` flag.
       */
      if (!body.success) {
        const reason = body.errors?.map((error) => error.message).join(', ')
        throw new Error(reason || 'Cloudflare API reported a failure')
      }

      callback(null, { messageId: mail.message.messageId(), envelope, ...body })
    } catch (error) {
      callback(
        new E_MAIL_TRANSPORT_ERROR('Unable to send email using the cloudflare transport', {
          cause: error,
        }),
        undefined as any
      )
    }
  }
}

/**
 * Transport for sending emails using the Cloudflare Email Service
 * `/email/sending/send` REST API.
 */
export class CloudflareTransport extends BaseApiTransport<CloudflareConfig> {
  constructor(config: CloudflareConfig) {
    super('cloudflare', config)

    if (!config.accountId) {
      throw new E_INVALID_CONFIG(
        'Invalid config for "cloudflare" transport. The "accountId" property is missing'
      )
    }
  }

  /**
   * Send message
   */
  async send(
    message: NodeMailerMessage,
    config?: CloudflareRuntimeConfig
  ): Promise<MailResponse<CloudflareSentMessageInfo>> {
    const cloudflareTransport = new NodeMailerTransport({ ...this.config, ...config })
    const transporter = createTransport(cloudflareTransport)

    const cloudflareResponse = await transporter.sendMail(message)
    return new MailResponse(
      cloudflareResponse.messageId,
      cloudflareResponse.envelope,
      cloudflareResponse as unknown as CloudflareSentMessageInfo
    )
  }
}

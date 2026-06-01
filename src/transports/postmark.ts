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
import mimeFuncs from 'nodemailer/lib/mime-funcs/index.js'
import type MailMessage from 'nodemailer/lib/mailer/mail-message.js'

import debug from '../debug.js'
import { MailResponse } from '../mail_response.js'
import { E_MAIL_TRANSPORT_ERROR } from '../errors.js'
import { BaseApiTransport } from './base_api_transport.js'
import { normalizeBaseUrl, extractMessageHeaders, resolveAttachmentContent } from '../utils.js'

import type {
  PostmarkConfig,
  NodeMailerMessage,
  PostmarkRuntimeConfig,
  PostmarkSentMessageInfo,
} from '../types.js'

/**
 * Shape of the response returned by the Postmark API
 */
type PostmarkApiResponse = {
  To?: string
  SubmittedAt?: string
  MessageID?: string
  ErrorCode: number
  Message: string
}

/**
 * Transport for nodemailer
 */
class NodeMailerTransport implements Transport {
  name = 'postmark'
  version = '1.0.0'

  #config: PostmarkConfig

  constructor(config: PostmarkConfig) {
    this.#config = config
  }

  /**
   * Formatting recipients to a comma separated string of "Name <email>"
   * values, as accepted by the Postmark API.
   */
  #formatRecipients(
    recipients?: MailMessage['data']['to'] | MailMessage['data']['cc'] | MailMessage['data']['bcc']
  ): string | undefined {
    if (!recipients) {
      return
    }

    if (!Array.isArray(recipients)) {
      recipients = [recipients] as any
    }

    const formatted = (recipients as any[]).map((recipient) => {
      if (typeof recipient === 'string') {
        return recipient
      }

      if (recipient.name) {
        return `${recipient.name} <${recipient.address}>`
      }

      return recipient.address
    })

    return formatted.join(',')
  }

  /**
   * Prepare the payload by converting the Mail message to the format
   * accepted by the Postmark API
   */
  async #preparePayload(mail: MailMessage) {
    let payload: Record<string, any> = {
      From: this.#formatRecipients(mail.data.from),
      To: this.#formatRecipients(mail.data.to),
      Subject: mail.data.subject,
    }

    const cc = this.#formatRecipients(mail.data.cc)
    if (cc) {
      payload.Cc = cc
    }

    const bcc = this.#formatRecipients(mail.data.bcc)
    if (bcc) {
      payload.Bcc = bcc
    }

    const replyTo = this.#formatRecipients(mail.data.replyTo)
    if (replyTo) {
      payload.ReplyTo = replyTo
    }

    if (mail.data.html) {
      payload.HtmlBody = mail.data.html
    }

    if (mail.data.text) {
      payload.TextBody = mail.data.text
    }

    if (this.#config.messageStream) {
      payload.MessageStream = this.#config.messageStream
    }

    if (this.#config.tag) {
      payload.Tag = this.#config.tag
    }

    if (this.#config.trackOpens !== undefined) {
      payload.TrackOpens = this.#config.trackOpens
    }

    if (this.#config.trackLinks) {
      payload.TrackLinks = this.#config.trackLinks
    }

    if (this.#config.metadata) {
      payload.Metadata = this.#config.metadata
    }

    if (mail.data.attachments) {
      payload.Attachments = await Promise.all(
        mail.data.attachments.map(async (attachment, index) => {
          const content = await resolveAttachmentContent(mail, index)

          /**
           * Postmark requires a `ContentType` on every attachment. Nodemailer
           * only populates it while building the MIME message, so we fall back
           * to detecting it from the filename.
           */
          const item: Record<string, any> = {
            Name: attachment.filename,
            Content: content.toString('base64'),
            ContentType:
              attachment.contentType || mimeFuncs.detectMimeType(attachment.filename || ''),
          }

          /**
           * Inline attachments defined via `message.embed()` carry a `cid`
           * that maps to Postmark's prefixed `ContentID`
           */
          if (attachment.cid) {
            item.ContentID = `cid:${attachment.cid}`
          }

          return item
        })
      )
    }

    /**
     * Postmark expects custom headers as an array of `{ Name, Value }`
     * objects instead of a plain object.
     */
    const headers = extractMessageHeaders(mail)
    if (headers) {
      payload.Headers = Object.keys(headers).map((key) => ({ Name: key, Value: headers[key] }))
    }

    return payload
  }

  /**
   * Returns the normalized base URL for the API
   */
  #getBaseUrl() {
    return normalizeBaseUrl(this.#config.baseUrl)
  }

  /**
   * Send the message
   */
  async send(
    mail: MailMessage,
    callback: (err: Error | null, info: PostmarkSentMessageInfo) => void
  ) {
    try {
      const url = `${this.#getBaseUrl()}/email`
      const envelope = mail.message.getEnvelope()
      const payload = await this.#preparePayload(mail)

      debug('postmark mail url "%s"', url)
      debug('postmark mail payload %O', payload)

      const response = await ky.post<PostmarkApiResponse>(url, {
        json: payload,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Postmark-Server-Token': this.#config.key,
        },
      })

      const body = await response.json()

      /**
       * Postmark reports a non-zero `ErrorCode` when the message could
       * not be processed.
       */
      if (body.ErrorCode !== 0) {
        throw new Error(body.Message || `Postmark API returned error code ${body.ErrorCode}`)
      }

      const messageId = body.MessageID
        ? body.MessageID.replace(/^<|>$/g, '')
        : mail.message.messageId()

      callback(null, { messageId, envelope, ...body })
    } catch (error) {
      callback(
        new E_MAIL_TRANSPORT_ERROR('Unable to send email using the postmark transport', {
          cause: error,
        }),
        undefined as any
      )
    }
  }
}

/**
 * Transport for sending emails using the Postmark `/email` API.
 */
export class PostmarkTransport extends BaseApiTransport<PostmarkConfig> {
  constructor(config: PostmarkConfig) {
    super('postmark', config)
  }

  /**
   * Send message
   */
  async send(
    message: NodeMailerMessage,
    config?: PostmarkRuntimeConfig
  ): Promise<MailResponse<PostmarkSentMessageInfo>> {
    const postmarkTransport = new NodeMailerTransport({ ...this.config, ...config })
    const transporter = createTransport(postmarkTransport)

    const postmarkResponse = await transporter.sendMail(message)
    return new MailResponse(
      postmarkResponse.messageId,
      postmarkResponse.envelope,
      postmarkResponse as unknown as PostmarkSentMessageInfo
    )
  }
}

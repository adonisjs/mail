/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import got from 'got'
import { FormData, File } from 'formdata-node'

import { ObjectBuilder, streamToBlob } from '../utils/index.js'
import { EmailTransportException } from '../exceptions/email_transport_exception.js'
import { MailgunConfig } from '../types/drivers/mailgun.js'
import { Logger } from '@adonisjs/core/logger'
import { Transport } from 'nodemailer'
import MailMessage from 'nodemailer/lib/mailer/mail-message.js'

/**
 * Mailgun transport for node mailer. Uses the `/message.mime` to send MIME
 * representation of the email
 */
export class MailgunTransport implements Transport {
  name = 'mailgun'
  version = '1.0.0'

  #config: MailgunConfig
  #logger: Logger

  constructor(config: MailgunConfig, logger: Logger) {
    this.#config = config
    this.#logger = logger
  }

  /**
   * Converts a boolean flag to a yes/no string.
   */
  #flagToYesNo(value?: boolean) {
    if (value === undefined) {
      return
    }

    return value === true ? 'yes' : 'no'
  }

  /**
   * Returns pre-configured otags
   */
  #getOTags(config: MailgunConfig) {
    const tags = new ObjectBuilder()
    tags.add('o:tag', config.oTags)
    tags.add('o:dkim', this.#flagToYesNo(config.oDkim))
    tags.add('o:testmode', this.#flagToYesNo(config.oTestMode))
    tags.add('o:tracking', this.#flagToYesNo(config.oTracking))
    tags.add('o:tracking-clicks', this.#flagToYesNo(config.oTrackingClick))
    tags.add('o:tracking-opens', this.#flagToYesNo(config.oTrackingOpens))
    return tags.toObject()
  }

  /**
   * Returns base url for sending emails
   */
  #getBaseUrl(): string {
    return this.#config.domain
      ? `${this.#config.baseUrl}/${this.#config.domain}`
      : this.#config.baseUrl
  }

  /**
   * Returns an object of custom headers
   */
  #getHeaders(config: MailgunConfig) {
    return config.headers || {}
  }

  /**
   * Formats an array of recipients to a string accepted by mailgun
   */
  #formatRecipients(recipients?: { address: string; name?: string }[]): string | undefined {
    if (!recipients) {
      return
    }

    return recipients
      .map((recipient) => {
        if (!recipient.name) return recipient.address

        return `${recipient.name} <${recipient.address}>`
      })
      .join(',')
  }

  /**
   * Returns an object of `to`, `cc` and `bcc`
   */
  #getRecipients(mail: any) {
    const recipients = new ObjectBuilder()
    recipients.add('to', this.#formatRecipients(mail.data.to))
    recipients.add('cc', this.#formatRecipients(mail.data.cc))
    recipients.add('bcc', this.#formatRecipients(mail.data.bcc))
    return recipients.toObject()
  }

  /**
   * If we call formData.append('to', ['a', 'b', 'c']), it will
   * create a single key-value pair with key 'to' and value 'a,b,c'
   *
   * This method will append each value separately
   */
  #appendValue(form: FormData, key: string, value: any) {
    if (Array.isArray(value)) {
      value.forEach((item) => form.append(key, item))
    } else {
      form.append(key, value)
    }
  }

  /**
   * Create FormData object to send to Mailgun
   */
  async #createFormData(mail: MailMessage) {
    const form = new FormData()

    const tags = this.#getOTags(this.#config)
    const headers = this.#getHeaders(this.#config)
    const recipients = this.#getRecipients(mail)

    Object.keys(tags).forEach((key) => this.#appendValue(form, key, tags[key]))
    Object.keys(headers).forEach((key) => this.#appendValue(form, key, headers[key]))
    Object.keys(recipients).forEach((key) => this.#appendValue(form, 'to', recipients[key]))

    const mime = new File(
      [await streamToBlob(mail.message.createReadStream(), 'message/rfc822')],
      'message.mime',
    )

    form.append('message', mime, 'message.mime')

    return form
  }

  /**
   * Send email
   */
  async send(mail: MailMessage, callback: (err: Error | null, info?: any) => void) {
    const envelope = mail.message.getEnvelope()
    const url = `${this.#getBaseUrl()}/messages.mime`
    const form = await this.#createFormData(mail)

    this.#logger.trace({ url, envelope, form: { ...form } }, 'sending email')

    try {
      const response = await got.post<{ id: string }>(url, {
        body: form,
        username: 'api',
        password: this.#config.key,
        responseType: 'json',
      })

      const messageId = (response.body?.id || mail.message.messageId()).replace(/^<|>$/g, '')
      callback(null, { messageId, envelope })
    } catch (error) {
      callback(EmailTransportException.apiFailure(error))
    }
  }
}

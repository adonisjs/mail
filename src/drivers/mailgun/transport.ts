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
import { FormData, File } from 'formdata-node'
import { ObjectBuilder } from '@poppinss/utils'
import MailMessage from 'nodemailer/lib/mailer/mail-message.js'

import debug from '../../debug.js'
import { streamToBlob } from '../../utils.js'
import { E_MAIL_TRANSPORT_ERROR } from '../../errors.js'
import type { MailgunConfig, MailgunSentMessageInfo } from '../../types.js'

/**
 * Mailgun transport for node mailer. Uses the `/message.mime` to send MIME
 * representation of the email
 */
export class MailgunTransport implements Transport<MailgunSentMessageInfo> {
  name = 'mailgun'
  version = '1.0.0'

  #config: MailgunConfig

  constructor(config: MailgunConfig) {
    this.#config = config
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
    const tags = new ObjectBuilder<Record<string, string>>({})

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
    const headers = config.headers || {}
    return Object.keys(headers).reduce<Record<string, string>>((result, key) => {
      result[`h:${key}`] = headers[key]
      return result
    }, {})
  }

  /**
   * Returns an object of custom variables
   */
  #getVariables(config: MailgunConfig) {
    const variables = config.variables || {}
    return Object.keys(variables).reduce<Record<string, string>>((result, key) => {
      result[`v:${key}`] = variables[key]
      return result
    }, {})
  }

  /**
   * Formats an array of recipients to a string accepted by mailgun
   */
  #formatRecipients(
    recipients?: MailMessage['data']['to'] | MailMessage['data']['cc'] | MailMessage['data']['bcc']
  ): string | undefined {
    if (!recipients) {
      return
    }

    if (typeof recipients === 'string') {
      return recipients
    }

    if (Array.isArray(recipients)) {
      return recipients
        .map((recipient) => {
          if (typeof recipient === 'string') {
            return recipient
          }
          return `${recipient.name} <${recipient.address}>`
        })
        .join(',')
    }

    return `${recipients.name} <${recipients.address}>`
  }

  /**
   * Returns an object of `to`, `cc` and `bcc`
   */
  #getRecipients(mail: MailMessage) {
    const recipients = new ObjectBuilder<Record<string, string>>({})

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
    const tags = this.#getOTags(this.#config)
    const headers = this.#getHeaders(this.#config)
    const variables = this.#getVariables(this.#config)
    const recipients = this.#getRecipients(mail)
    const mimeMessage = await streamToBlob(mail.message.createReadStream(), 'message/rfc822')
    const mime = new File([mimeMessage], 'messages.mime')

    debug('mailgun mail mime %O', mimeMessage)
    debug('mailgun mail tags %O', tags)
    debug('mailgun mail headers %O', headers)
    debug('mailgun mail variables %O', variables)
    debug('mailgun mail recipients %O', recipients)

    const form = new FormData()

    form.append('message', mime, 'message.mime')
    Object.keys(tags).forEach((key) => this.#appendValue(form, key, tags[key]))
    Object.keys(headers).forEach((key) => this.#appendValue(form, key, headers[key]))
    Object.keys(variables).forEach((key) => this.#appendValue(form, key, variables[key]))
    Object.keys(recipients).forEach((key) => this.#appendValue(form, 'to', recipients[key]))

    return form
  }

  /**
   * Sends email using Mailgun's HTTP API
   */
  async send(
    mail: MailMessage,
    callback: (err: Error | null, info: MailgunSentMessageInfo) => void
  ) {
    const envelope = mail.message.getEnvelope()
    const url = `${this.#getBaseUrl()}/messages.mime`
    const form = await this.#createFormData(mail)

    debug('mailgun mail url %s', url)
    debug('mailgun mail envelope %s', envelope)

    try {
      const response = await got.post<{ id: string }>(url, {
        body: form as any,
        username: 'api',
        password: this.#config.key,
        responseType: 'json',
      })

      const mailgunMessageId = response.body.id
      const messageId = mailgunMessageId
        ? mailgunMessageId.replace(/^<|>$/g, '')
        : mail.message.messageId()

      callback(null, { id: mailgunMessageId, messageId, envelope })
    } catch (error) {
      callback(
        new E_MAIL_TRANSPORT_ERROR('Unable to send email using the mailgun driver', {
          cause: error,
        }),
        undefined as any
      )
    }
  }
}

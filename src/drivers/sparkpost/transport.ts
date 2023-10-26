/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { text } from 'node:stream/consumers'
import got from 'got'

import { ObjectBuilder } from '../../utils.js'
import { EmailTransportException } from '../../exceptions/email_transport_exception.js'
import { SparkPostConfig } from './types.js'
import { Logger } from '@adonisjs/core/logger'

/**
 * Sparkpost transport for node mailer. Uses the `/message.mime` to send MIME
 * representation of the email
 */
export class SparkPostTransport {
  name = 'sparkpost'
  version = '1.0.0'

  #config: SparkPostConfig
  #logger: Logger

  constructor(config: SparkPostConfig, logger: Logger) {
    this.#config = config
    this.#logger = logger
  }

  /**
   * Returns base url for sending emails
   */
  #getBaseUrl(): string {
    return this.#config.baseUrl
  }

  /**
   * Returns an array of recipients accepted by the SparkPost API
   */
  #getRecipients(
    recipients: { address: string; name?: string }[]
  ): { address: { name?: string; email: string } }[] {
    return recipients.map((recipient) => {
      return {
        address: {
          email: recipient.address,
          ...(recipient.name ? { name: recipient.name } : {}),
        },
      }
    })
  }

  /**
   * Returns an object of options accepted by the sparkpost mail API
   */
  #getOptions(config: SparkPostConfig) {
    const options = new ObjectBuilder()
    options.add('start_time', config.startTime)
    options.add('open_tracking', config.openTracking)
    options.add('click_tracking', config.clickTracking)
    options.add('transactional', config.transactional)
    options.add('sandbox', config.sandbox)
    options.add('skip_suppression', config.skipSuppression)
    options.add('ip_pool', config.ipPool)
  }

  /**
   * Send email
   */
  async send(mail: any, callback: any) {
    const url = `${this.#getBaseUrl()}/transmissions`
    const options = this.#getOptions(this.#config)
    const envelope = mail.message.getEnvelope()
    const addresses = (mail.data.to || []).concat(mail.data.cc || []).concat(mail.data.bcc || [])

    try {
      this.#logger.trace({ url, options }, 'sparkpost email')

      /**
       * The sparkpost API doesn't accept the multipart stream and hence we
       * need to convert the stream to a string
       */
      const emailBody = await text(mail.message.createReadStream())
      const response = await got.post<{ results?: { id: string } }>(url, {
        json: {
          recipients: this.#getRecipients(addresses),
          options: options,
          content: { email_rfc822: emailBody },
        },

        responseType: 'json',
        headers: { Authorization: this.#config.key },
      })

      const messageId = (response.body.results?.id || mail.message.messageId()).replace(
        /^<|>$/g,
        ''
      )
      callback(null, { messageId, envelope })
    } catch (error) {
      callback(EmailTransportException.apiFailure(error))
    }
  }
}

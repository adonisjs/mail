/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import SES from '@aws-sdk/client-ses'
import nodemailer from 'nodemailer'

import { SesConfig, SesMailResponse } from './types.js'
import { MailDriverContract, MessageNode } from '../../types/main.js'
import SESTransport from 'nodemailer/lib/ses-transport/index.js'

/**
 * Ses driver to send email using ses
 */
export class SesDriver implements MailDriverContract {
  protected transporter: nodemailer.Transporter<SESTransport.SentMessageInfo> | null

  constructor(config: SesConfig) {
    const sesClient = new SES.SES({
      apiVersion: config.apiVersion,
      region: config.region,
      credentials: {
        accessKeyId: config.key,
        secretAccessKey: config.secret,
      },
    })

    this.transporter = nodemailer.createTransport({
      SES: { aws: SES, ses: sesClient },
      sendingRate: config.sendingRate,
      maxConnections: config.maxConnections,
    })
  }

  /**
   * Send message
   */
  async send(
    message: MessageNode,
    options?: Omit<SES.SendRawEmailRequest, 'RawMessage' | 'Source' | 'Destinations'>
  ): Promise<SesMailResponse> {
    if (!this.transporter) {
      throw new Error('Driver transport has been closed and cannot be used for sending emails')
    }

    const mailOptions = Object.assign({}, message, { ses: options })

    // @ts-expect-error - `ses` doesn't seems to appear in the nodemailer types
    return this.transporter.sendMail(mailOptions) as Promise<SesMailResponse>
  }

  /**
   * Close transporter connection, helpful when using connections pool
   */
  async close() {
    if (!this.transporter) {
      return
    }

    this.transporter.close()
    this.transporter = null
  }
}

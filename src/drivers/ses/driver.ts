/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import nodemailer from 'nodemailer'
import type * as SES from '@aws-sdk/client-ses'
import { SesConfig, SesMailResponse } from './types.js'
import { MailDriverContract, MessageNode } from '../../types/main.js'
import SESTransport from 'nodemailer/lib/ses-transport/index.js'

/**
 * Ses driver to send email using ses
 */
export class SesDriver implements MailDriverContract {
  /**
   * SES config
   */
  #config: SesConfig

  /**
   * Store the promise that is resolved when the transporter is created
   */
  #createTransportPromise?: Promise<void>

  /**
   * The nodemailer transport
   */
  protected transporter: nodemailer.Transporter<SESTransport.SentMessageInfo> | null = null

  constructor(config: SesConfig) {
    this.#config = config
    this.#createTransportPromise = this.#createTransporter()
  }

  /**
   * Create transporter instance
   */
  async #createTransporter() {
    const SES = await import('@aws-sdk/client-ses')

    const sesClient = new SES.SES({
      apiVersion: this.#config.apiVersion,
      region: this.#config.region,
      credentials: {
        accessKeyId: this.#config.key,
        secretAccessKey: this.#config.secret,
      },
    })

    this.transporter = nodemailer.createTransport({
      SES: { aws: SES, ses: sesClient },
      sendingRate: this.#config.sendingRate,
      maxConnections: this.#config.maxConnections,
    })
  }

  /**
   * Send message
   */
  async send(
    message: MessageNode,
    options?: Omit<SES.SendRawEmailRequest, 'RawMessage' | 'Source' | 'Destinations'>
  ): Promise<SesMailResponse> {
    await this.#createTransportPromise

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

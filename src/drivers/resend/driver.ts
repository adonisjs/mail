/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import nodemailer from 'nodemailer'

import type { Logger } from '@adonisjs/core/logger'
import type { BrevoResponse } from '../brevo/types.js'
import type { MailDriverContract } from '../../types/main.js'
import type { MessageNode } from '../../types/message.js'
import type { ResendConfig, ResendRuntimeConfig } from './types.js'

/**
 * Driver for sending emails using Brevo ( ex-sendinblue )
 */
export class ResendDriver implements MailDriverContract {
  #config: ResendConfig
  #logger: Logger

  constructor(config: ResendConfig, logger: Logger) {
    this.#config = config
    this.#logger = logger
  }

  /**
   * Send message
   */
  async send(message: MessageNode, config?: ResendRuntimeConfig): Promise<BrevoResponse> {
    const { ResendTransport } = await import('./transport.js')
    const mailgunTransport = new ResendTransport({ ...this.#config, ...config }, this.#logger)
    const transporter = nodemailer.createTransport(mailgunTransport)

    return transporter.sendMail(message as any) as any
  }

  async close() {}
}

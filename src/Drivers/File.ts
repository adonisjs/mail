/*
 * @adonisjs/mail
 *
 * (c) Matt Strayer <git@mattstrayer.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/// <reference path="../../adonis-typings/mail.ts" />

import {
  FileConfig,
  FileDriverContract,
  FileMailResponse,
  MessageNode,
  SmtpMailResponse,
} from '@ioc:Adonis/Addons/Mail'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { DateTime } from 'luxon'
import { createTransport } from 'nodemailer'
import path from 'path'

export class FileDriver implements FileDriverContract {
  private transporter: any = createTransport({
    streamTransport: true,
    buffer: true,
  })

  public filePath: string
  constructor(config?: FileConfig) {
    this.filePath = config?.filePath ?? path.join('tmp', 'emails')
    if (!existsSync(this.filePath)) {
      mkdirSync(this.filePath, { recursive: true })
    }
  }

  /**
   * Send message
   */

  public async send(message: MessageNode): Promise<FileMailResponse> {
    const emailPath = path.join(this.filePath, `${DateTime.now().toMillis().toString()}.eml`)

    const msg = await this.wrappedSendMail(message, emailPath)
    return { messageId: msg.messageId, message: message }
  }

  /**
   * Close transporter connection, helpful when using connections pool
   */
  public async close() {}

  private async wrappedSendMail(
    message: MessageNode,
    emailPath: string
  ): Promise<SmtpMailResponse> {
    return new Promise((resolve, reject) => {
      this.transporter.sendMail(message, function (error, info) {
        if (error) {
          reject(error)
        } else {
          writeFileSync(emailPath, info.message.toString())
          resolve(info)
        }
      })
    })
  }
}

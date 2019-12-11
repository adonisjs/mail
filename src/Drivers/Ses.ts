/*
 * @adonisjs/mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/// <reference path="../../adonis-typings/mail.ts" />

import { MessageNode, SesConfigContract, SesDriverContract, SesMailResponse } from '@ioc:Adonis/Addons/Mail'
import * as aws from 'aws-sdk'
import nodemailer from 'nodemailer'

/**
 * Ses driver to send email using ses
 */
export class SesDriver implements SesDriverContract {
  private _transporter: any

  constructor (config: SesConfigContract) {
    this._transporter = nodemailer.createTransport({
      SES: new aws.SES({
        apiVersion: config.apiVersion,
        accessKeyId: config.key,
        secretAccessKey: config.secret,
        region: config.region,
        sslEnabled: config.sslEnabled,
      }),
      sendingRate: config.sendingRate,
      maxConnections: config.maxConnections,
    })
  }

  /**
   * Send message
   */
  public async send (message: MessageNode): Promise<SesMailResponse> {
    if (!this._transporter) {
      throw new Error(
        'Driver transport has been closed and cannot be used for sending emails',
      )
    }

    return this._transporter.sendMail(message)
  }

  /**
   * Close transporter connection, helpful when using connections pool
   */
  public async close () {
    this._transporter.close()
    this._transporter = null
  }
}

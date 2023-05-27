/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { PostSentEnvelopeNode } from '../main.js'

/**
 * Mailgun driver config
 */
export type MailgunRuntimeConfig = {
  oTags?: string[]
  oDeliverytime?: Date
  oTestMode?: boolean
  oTracking?: boolean
  oTrackingClick?: boolean
  oTrackingOpens?: boolean
  headers?: { [key: string]: string }
}

export type MailgunConfig = MailgunRuntimeConfig & {
  driver: 'mailgun'
  baseUrl: string
  key: string
  domain: string
  oDkim?: boolean
}

/**
 * Shape of mail response for the mailgun driver
 */
export type MailgunResponse = {
  envelope: PostSentEnvelopeNode
  messageId: string
}

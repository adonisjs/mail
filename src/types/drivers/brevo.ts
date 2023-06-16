/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { PostSentEnvelopeNode } from '../main.js'

export type BrevoRuntimeConfig = {
  scheduledAt?: luxon.DateTime
  tags?: string[]
  templateId?: number
  templateParams?: Record<string, any>
}

/**
 * Brevo driver config
 */
export type BrevoConfig = {
  driver: 'brevo'
  key: string

  /**
   * @default https://api.brevo.io/v3/email/send
   */
  baseUrl?: string
} & BrevoRuntimeConfig

/**
 * Mail response from Brevo
 */
export interface BrevoResponse {
  envelope: PostSentEnvelopeNode
  messageId: string
}

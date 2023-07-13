/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { PostSentEnvelopeNode } from '../../types/main.js'

export type ResendRuntimeConfig = {
  tags?: {
    name: string
    value?: string
  }[]
}

/**
 * Resend driver config
 */
export type ResendConfig = {
  driver: 'resend'
  key: string

  /**
   * @default https://api.resend.com/
   */
  baseUrl?: string
} & ResendRuntimeConfig

export interface ResendResponse {
  envelope: PostSentEnvelopeNode
  messageId: string
}

export interface ResendApiResponse {
  id: string
  from: string
  to: string[] | string
  created_at: string
}

/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { PostSentEnvelopeNode } from '../../types/main.js'

/**
 * Ses driver config
 */
export type SesConfig = {
  driver: 'ses'
  apiVersion: string
  key: string
  secret: string
  region: string
  sslEnabled?: boolean
  sendingRate?: number
  maxConnections?: number
}

/**
 * Shape of mail response for the ses driver
 */
export type SesMailResponse = {
  response: string
  accepted: string[]
  rejected: string[]
  envelope: PostSentEnvelopeNode
  messageId: string
}

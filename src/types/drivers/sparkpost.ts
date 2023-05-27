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
 * Following options can be defined during the `Mail.send` call
 */
export type SparkPostRuntimeConfig = {
  startTime?: Date
  openTracking?: boolean
  clickTracking?: boolean
  transactional?: boolean
  sandbox?: boolean
  skipSuppression?: boolean
  ipPool?: string
}

/**
 * Spark post config
 */
export type SparkPostConfig = SparkPostRuntimeConfig & {
  driver: 'sparkpost'
  baseUrl: string
  key: string
}

/**
 * Shape of mail response for the sparkpost driver
 */
export type SparkPostResponse = {
  envelope: PostSentEnvelopeNode
  messageId: string
}

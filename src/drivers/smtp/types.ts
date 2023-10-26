/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { TlsOptions } from 'node:tls'
import type { PostSentEnvelopeNode } from '../../types/main.js'

/**
 * Login options for Oauth2 smtp login
 */
export type SmtpOauth2 = {
  type: 'OAuth2'
  user: string
  clientId: string
  clientSecret: string
  refreshToken?: string
  accessToken?: string
  expires?: string | number
  accessUrl?: string
}

/**
 * Login options for simple smtp login
 */
export type SmtpSimpleAuth = {
  type: 'login'
  user: string
  pass: string
}

/**
 * Smtp driver config
 */
export type SmtpConfig = {
  host: string
  port?: number | string
  secure?: boolean

  /**
   * Authentication
   */
  auth?: SmtpSimpleAuth | SmtpOauth2

  /**
   * TLS options
   */
  tls?: TlsOptions
  ignoreTLS?: boolean
  requireTLS?: boolean

  /**
   * Pool options
   */
  pool?: boolean
  maxConnections?: number
  maxMessages?: number
  rateDelta?: number
  rateLimit?: number

  /**
   * Proxy
   */
  proxy?: string
}

/**
 * Shape of mail response for the smtp driver
 */
export type SmtpMailResponse = {
  response: string
  accepted: string[]
  rejected: string[]
  envelope: PostSentEnvelopeNode
  messageId: string
}

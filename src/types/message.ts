/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { Readable } from 'node:stream'

export type AttachmentOptionsNode = {
  filename?: string
  href?: string
  httpHeaders?: { [key: string]: any }
  contentType?: string
  contentDisposition?: string
  encoding?: string
  headers?: { [key: string]: any }
}

/**
 * Shape of envelope node
 */
export type EnvelopeNode = { from?: string; to?: string; cc?: string; bcc?: string }
export type PostSentEnvelopeNode = { from: string; to: string[] }

/**
 * Shape of the recipient
 */
export type RecipientNode = { address: string; name?: string }

/**
 * Available calendar event methods
 */
export type CalendarEventMethod =
  | 'PUBLISH'
  | 'REQUEST'
  | 'REPLY'
  | 'ADD'
  | 'CANCEL'
  | 'REFRESH'
  | 'COUNTER'
  | 'DECLINECOUNTER'

/**
 * Event options accepted by the icalEvent* methods
 */
export type CalendarEventOptions = {
  method?: CalendarEventMethod
  filename?: string
  encoding?: string
}

/**
 * Shape of data view defined on the message
 */
export type MessageContentViewsNode = {
  html?: { template: string; data?: any }
  text?: { template: string; data?: any }
  watch?: { template: string; data?: any }
}

/**
 * Message node is compatible with nodemailer `sendMail` method
 */
export type MessageNode = {
  from?: RecipientNode
  to?: RecipientNode[]
  cc?: RecipientNode[]
  bcc?: RecipientNode[]
  messageId?: string
  subject?: string
  replyTo?: RecipientNode[]
  inReplyTo?: string
  references?: string[]
  encoding?: string
  priority?: 'low' | 'normal' | 'high'
  envelope?: EnvelopeNode
  icalEvent?: CalendarEventOptions & {
    content?: string
    path?: string
    href?: string
  }
  attachments?: (AttachmentOptionsNode & {
    path?: string
    cid?: string
    content?: Buffer | Readable
  })[]
  headers?: (
    | {
        [key: string]: string | string[]
      }
    | {
        [key: string]: { prepared: true; value: string | string[] }
      }
  )[]
  html?: string
  text?: string
  watch?: string
}

/**
 * The object that can be used to search for mail messages
 * during fakes
 */
export type MessageSearchNode = Omit<MessageNode, 'attachments' | 'icalEvent'>

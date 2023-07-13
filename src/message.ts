/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Readable } from 'node:stream'
import ical, { ICalCalendar } from 'ical-generator'
import {
  AttachmentOptionsNode,
  CalendarEventOptions,
  EnvelopeNode,
  MessageContentViewsNode,
  MessageNode,
  RecipientNode,
} from './types/main.js'
import { basename } from 'node:path'

/**
 * Fluent API to construct node mailer message object
 */
export class Message {
  #nodeMailerMessage: MessageNode = {}
  #deferred = false

  /**
   * Path to the views used to generate content for the
   * message
   */
  #contentViews: {
    html?: { template: string; data?: any }
    text?: { template: string; data?: any }
    watch?: { template: string; data?: any }
  } = {}

  constructor(deferred = false) {
    this.#deferred = deferred
  }

  /**
   * Returns address node with correctly formatted way
   */
  #getAddress(address: string, name?: string): RecipientNode {
    return name ? { address, name } : { address }
  }

  /**
   * Add recipient as `to`
   */
  to(address: string, name?: string): this {
    this.#nodeMailerMessage.to = this.#nodeMailerMessage.to || []
    this.#nodeMailerMessage.to.push(this.#getAddress(address, name))
    return this
  }

  /**
   * Add `from` name and email
   */
  from(address: string, name?: string): this {
    this.#nodeMailerMessage.from = this.#getAddress(address, name)
    return this
  }

  /**
   * Add recipient as `cc`
   */
  cc(address: string, name?: string): this {
    this.#nodeMailerMessage.cc = this.#nodeMailerMessage.cc || []
    this.#nodeMailerMessage.cc.push(this.#getAddress(address, name))
    return this
  }

  /**
   * Add recipient as `bcc`
   */
  bcc(address: string, name?: string): this {
    this.#nodeMailerMessage.bcc = this.#nodeMailerMessage.bcc || []
    this.#nodeMailerMessage.bcc.push(this.#getAddress(address, name))
    return this
  }

  /**
   * Define custom message id
   */
  messageId(messageId: string): this {
    this.#nodeMailerMessage.messageId = messageId
    return this
  }

  /**
   * Define subject
   */
  subject(message: string): this {
    this.#nodeMailerMessage.subject = message
    return this
  }

  /**
   * Define replyTo email and name
   */
  replyTo(address: string, name?: string): this {
    this.#nodeMailerMessage.replyTo = this.#nodeMailerMessage.replyTo || []
    this.#nodeMailerMessage.replyTo.push(this.#getAddress(address, name))
    return this
  }

  /**
   * Define inReplyTo message id
   */
  inReplyTo(messageId: string): this {
    this.#nodeMailerMessage.inReplyTo = messageId
    return this
  }

  /**
   * Define multiple message id's as references
   */
  references(messagesIds: string[]): this {
    this.#nodeMailerMessage.references = messagesIds
    return this
  }

  /**
   * Optionally define email envolpe
   */
  envelope(envelope: EnvelopeNode): this {
    this.#nodeMailerMessage.envelope = envelope
    return this
  }

  /**
   * Define contents encoding
   */
  encoding(encoding: string): this {
    this.#nodeMailerMessage.encoding = encoding
    return this
  }

  /**
   * Define email prority
   */
  priority(priority: 'low' | 'normal' | 'high'): this {
    this.#nodeMailerMessage.priority = priority
    return this
  }

  /**
   * Compute email html from defined view
   */
  htmlView(template: string, data?: any): this {
    this.#contentViews.html = { template, data }
    return this
  }

  /**
   * Compute email text from defined view
   */
  textView(template: string, data?: any): this {
    this.#contentViews.text = { template, data }
    return this
  }

  /**
   * Compute apple watch html from defined view
   */
  watchView(template: string, data?: any): this {
    this.#contentViews.watch = { template, data }
    return this
  }

  /**
   * Compute email html from raw text
   */
  html(content: string): this {
    this.#nodeMailerMessage.html = content
    return this
  }

  /**
   * Compute email text from raw text
   */
  text(content: string): this {
    this.#nodeMailerMessage.text = content
    return this
  }

  /**
   * Compute email watch html from raw text
   */
  watch(content: string): this {
    this.#nodeMailerMessage.watch = content
    return this
  }

  /**
   * Define one or attachments
   */
  attach(filePath: string, options?: AttachmentOptionsNode): this {
    this.#nodeMailerMessage.attachments = this.#nodeMailerMessage.attachments || []
    this.#nodeMailerMessage.attachments.push({
      path: filePath,
      filename: basename(filePath),
      ...options,
    })

    return this
  }

  /**
   * Define attachment from raw data
   */
  attachData(content: Readable | Buffer, options?: AttachmentOptionsNode): this {
    if (this.#deferred) {
      throw new Error('Cannot attach raw data when using "Mail.sendLater" method')
    }

    this.#nodeMailerMessage.attachments = this.#nodeMailerMessage.attachments || []
    this.#nodeMailerMessage.attachments.push({
      content,
      ...options,
    })

    return this
  }

  /**
   * Embed attachment inside content using `cid`
   */
  embed(filePath: string, cid: string, options?: AttachmentOptionsNode): this {
    this.#nodeMailerMessage.attachments = this.#nodeMailerMessage.attachments || []
    this.#nodeMailerMessage.attachments.push({
      path: filePath,
      cid,
      ...options,
    })

    return this
  }

  /**
   * Embed attachment from raw data inside content using `cid`
   */
  embedData(content: Readable | Buffer, cid: string, options?: AttachmentOptionsNode): this {
    if (this.#deferred) {
      throw new Error('Cannot attach raw data when using "Mail.sendLater" method')
    }

    this.#nodeMailerMessage.attachments = this.#nodeMailerMessage.attachments || []
    this.#nodeMailerMessage.attachments.push({
      content,
      cid,
      ...options,
    })

    return this
  }

  /**
   * Define custom headers for email
   */
  header(key: string, value: string | string[]): this {
    this.#nodeMailerMessage.headers = this.#nodeMailerMessage.headers || []
    this.#nodeMailerMessage.headers.push({ [key]: value })

    return this
  }

  /**
   * Define custom prepared headers for email
   */
  preparedHeader(key: string, value: string | string[]): this {
    this.#nodeMailerMessage.headers = this.#nodeMailerMessage.headers || []
    this.#nodeMailerMessage.headers.push({ [key]: { prepared: true, value } })

    return this
  }

  /**
   * Attach a calendar event and define contents as string
   */
  icalEvent(
    contents: ((calendar: ICalCalendar) => void) | string,
    options?: CalendarEventOptions
  ): this {
    if (typeof contents === 'function') {
      const calendar = ical()
      contents(calendar)
      contents = calendar.toString()
    }

    this.#nodeMailerMessage.icalEvent = { content: contents, ...options }
    return this
  }

  /**
   * Attach a calendar event and load contents from a file
   */
  icalEventFromFile(filePath: string, options?: CalendarEventOptions): this {
    this.#nodeMailerMessage.icalEvent = { path: filePath, ...options }
    return this
  }

  /**
   * Attach a calendar event and load contents from a url
   */
  icalEventFromUrl(url: string, options?: CalendarEventOptions): this {
    this.#nodeMailerMessage.icalEvent = { href: url, ...options }
    return this
  }

  /**
   * Get message JSON. The packet can be sent over to nodemailer
   */
  toJSON(): { message: MessageNode; views: MessageContentViewsNode } {
    return {
      message: this.#nodeMailerMessage,
      views: this.#contentViews,
    }
  }
}

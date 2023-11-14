/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { basename } from 'node:path'
import { Readable } from 'node:stream'
import { fileURLToPath } from 'node:url'
import Macroable from '@poppinss/macroable'
import { AssertionError } from 'node:assert'
import type { SendMailOptions } from 'nodemailer'
import ical, { type ICalCalendar } from 'ical-generator'
import { Attachment } from 'nodemailer/lib/mailer/index.js'

import type {
  Recipient,
  AttachmentOptions,
  NodeMailerMessage,
  CalendarEventOptions,
  MessageBodyTemplates,
} from './types.js'

/**
 * Fluent API to construct node mailer message object
 */
export class Message extends Macroable {
  /**
   * Nodemailer internally mutates the "attachments" object
   * and removes the path property with the contents of
   * the file.
   *
   * Therefore, we need an additional attachment array we can
   * use to searching attachments and writing assertions
   */
  #attachmentsForSearch: Attachment[] = []

  /**
   * Templates to use for rendering email body for
   * HTML, plain text and watch
   */
  contentViews: MessageBodyTemplates = {}

  /**
   * Reference to the underlying node mailer message
   */
  nodeMailerMessage: NodeMailerMessage = {}

  /**
   * Returns formatted address
   */
  #getAddress(address: string, name?: string): Recipient {
    return name ? { address, name } : address
  }

  /**
   * Converts a recipient email and name to formatted
   * string
   */
  protected formatRecipient(recipient?: Recipient) {
    if (!recipient) {
      return undefined
    }

    if (typeof recipient === 'string') {
      return recipient
    }

    if (!recipient.name) {
      return recipient.address
    }

    return `${recipient.name} <${recipient.address}>`
  }

  /**
   * Check if a given recipient exists for the mentioned
   * email and name.
   */
  hasRecipient(property: 'to' | 'cc' | 'bcc' | 'replyTo', address: string, name?: string) {
    const recipients = this.nodeMailerMessage[property]
    if (!recipients) {
      return false
    }

    /**
     * When checking for name and email both
     */
    if (name) {
      return !!recipients.find((recipient) => {
        if (typeof recipient === 'string') {
          return false
        }
        return recipient.address === address && recipient.name === name
      })
    }

    /**
     * When checking for just the email
     */
    return !!recipients.find((recipient) => {
      if (typeof recipient === 'string') {
        return recipient === address
      }
      return recipient.address === address
    })
  }

  /**
   * Assert the message is sent to the mentioned address
   */
  assertRecipient(property: 'to' | 'cc' | 'bcc' | 'replyTo', address: string, name?: string) {
    if (!this.hasRecipient(property, address, name)) {
      const expected = this.formatRecipient({ address, name: name || '' })
      const actual =
        this.nodeMailerMessage[property]?.map((recipient) => {
          return this.formatRecipient(recipient)
        }) || []

      throw new AssertionError({
        message: `Expected message to be delivered to "${expected}"`,
        expected: [expected],
        actual,
        operator: 'includes',
      })
    }
  }

  /**
   * Add recipient as `to`
   */
  to(address: string, name?: string): this {
    this.nodeMailerMessage.to = this.nodeMailerMessage.to || []
    this.nodeMailerMessage.to.push(this.#getAddress(address, name))
    return this
  }

  /**
   * Check if message is sent to the mentioned address
   */
  hasTo(address: string, name?: string): boolean {
    return this.hasRecipient('to', address, name)
  }

  /**
   * Assert the message is sent to the mentioned address
   */
  assertTo(address: string, name?: string) {
    return this.assertRecipient('to', address, name)
  }

  /**
   * Add `from` name and email
   */
  from(address: string, name?: string): this {
    this.nodeMailerMessage.from = this.#getAddress(address, name)
    return this
  }

  /**
   * Check if message is sent from the mentioned address
   */
  hasFrom(address: string, name?: string): boolean {
    const fromAddress = this.nodeMailerMessage.from
    if (!fromAddress) {
      return false
    }

    /**
     * When checking for name and email both
     */
    if (name) {
      if (typeof fromAddress === 'string') {
        return false
      }
      return fromAddress.address === address && fromAddress.name === name
    }

    /**
     * When checking for just the email
     */
    if (typeof fromAddress === 'string') {
      return fromAddress === address
    }
    return fromAddress.address === address
  }

  /**
   * Assert the message is sent from the mentioned address
   */
  assertFrom(address: string, name?: string) {
    if (!this.hasFrom(address, name)) {
      const expected = this.formatRecipient({ address, name: name || '' })
      const actual = this.formatRecipient(this.nodeMailerMessage.from)

      throw new AssertionError({
        message: `Expected message to be sent from "${expected}"`,
        expected,
        actual,
      })
    }
  }

  /**
   * Add recipient as `cc`
   */
  cc(address: string, name?: string): this {
    this.nodeMailerMessage.cc = this.nodeMailerMessage.cc || []
    this.nodeMailerMessage.cc.push(this.#getAddress(address, name))
    return this
  }

  /**
   * Check if message is sent to the mentioned address
   */
  hasCc(address: string, name?: string): boolean {
    return this.hasRecipient('cc', address, name)
  }

  /**
   * Assert the message is sent to the mentioned address
   */
  assertCc(address: string, name?: string) {
    return this.assertRecipient('cc', address, name)
  }

  /**
   * Add recipient as `bcc`
   */
  bcc(address: string, name?: string): this {
    this.nodeMailerMessage.bcc = this.nodeMailerMessage.bcc || []
    this.nodeMailerMessage.bcc.push(this.#getAddress(address, name))
    return this
  }

  /**
   * Check if message is sent to the mentioned address
   */
  hasBcc(address: string, name?: string): boolean {
    return this.hasRecipient('bcc', address, name)
  }

  /**
   * Assert the message is sent to the mentioned address
   */
  assertBcc(address: string, name?: string) {
    return this.assertRecipient('bcc', address, name)
  }

  /**
   * Define custom message id
   */
  messageId(messageId: string): this {
    this.nodeMailerMessage.messageId = messageId
    return this
  }

  /**
   * Define subject
   */
  subject(message: string): this {
    this.nodeMailerMessage.subject = message
    return this
  }

  /**
   * Check if the message has the mentioned subject
   */
  hasSubject(message: string): boolean {
    return !!this.nodeMailerMessage.subject && this.nodeMailerMessage.subject === message
  }

  /**
   * Assert the message has the mentioned subject
   */
  assertSubject(message: string) {
    if (!this.hasSubject(message)) {
      throw new AssertionError({
        message: `Expected message subject to be "${message}"`,
        expected: message,
        actual: this.nodeMailerMessage.subject,
      })
    }
  }

  /**
   * Define replyTo email and name
   */
  replyTo(address: string, name?: string): this {
    this.nodeMailerMessage.replyTo = this.nodeMailerMessage.replyTo || []
    this.nodeMailerMessage.replyTo.push(this.#getAddress(address, name))
    return this
  }

  /**
   * Check if the mail has the mentioned reply to address
   */
  hasReplyTo(address: string, name?: string): boolean {
    return this.hasRecipient('replyTo', address, name)
  }

  /**
   * Assert the mail has the mentioned reply to address
   */
  assertReplyTo(address: string, name?: string) {
    if (!this.hasRecipient('replyTo', address, name)) {
      const expected = this.formatRecipient({ address, name: name || '' })
      const actual =
        this.nodeMailerMessage.replyTo?.map((recipient) => {
          return this.formatRecipient(recipient)
        }) || []

      throw new AssertionError({
        message: `Expected reply-to addresses to include "${expected}"`,
        expected: [expected],
        actual,
        operator: 'includes',
      })
    }
  }

  /**
   * Define inReplyTo message id
   */
  inReplyTo(messageId: string): this {
    this.nodeMailerMessage.inReplyTo = messageId
    return this
  }

  /**
   * Define multiple message id's as references
   */
  references(messagesIds: string[]): this {
    this.nodeMailerMessage.references = messagesIds
    return this
  }

  /**
   * Optionally define email envolpe
   */
  envelope(envelope: SendMailOptions['envelope']): this {
    this.nodeMailerMessage.envelope = envelope
    return this
  }

  /**
   * Define contents encoding
   */
  encoding(encoding: string): this {
    this.nodeMailerMessage.encoding = encoding
    return this
  }

  /**
   * Define email prority
   */
  priority(priority: 'low' | 'normal' | 'high'): this {
    this.nodeMailerMessage.priority = priority
    return this
  }

  /**
   * Compute email html from defined view
   */
  htmlView(template: string, data?: any): this {
    this.contentViews.html = { template, data }
    return this
  }

  /**
   * Compute email text from defined view
   */
  textView(template: string, data?: any): this {
    this.contentViews.text = { template, data }
    return this
  }

  /**
   * Compute apple watch html from defined view
   */
  watchView(template: string, data?: any): this {
    this.contentViews.watch = { template, data }
    return this
  }

  /**
   * Compute email html from raw text
   */
  html(content: string): this {
    this.nodeMailerMessage.html = content
    return this
  }

  /**
   * Compute email text from raw text
   */
  text(content: string): this {
    this.nodeMailerMessage.text = content
    return this
  }

  /**
   * Compute email watch html from raw text
   */
  watch(content: string): this {
    this.nodeMailerMessage.watch = content
    return this
  }

  /**
   * Assert content of mail to include substring or match
   * a given regular expression
   */
  assertContent(property: 'text' | 'watch' | 'html', substring: string | RegExp) {
    const contents = this.nodeMailerMessage[property]
    if (!contents) {
      throw new AssertionError({
        message: `Expected message ${property} body to match substring, but it is undefined`,
      })
    }

    if (typeof substring === 'string') {
      if (!String(contents).includes(substring)) {
        throw new AssertionError({
          message: `Expected message ${property} body to include "${substring}"`,
        })
      }
      return
    }

    if (!substring.test(String(contents))) {
      throw new AssertionError({
        message: `Expected message ${property} body to match "${substring}"`,
      })
    }
  }

  /**
   * Assert message plain text contents to include
   * substring or match the given regular expression
   */
  assertTextIncludes(substring: string | RegExp) {
    return this.assertContent('text', substring)
  }

  /**
   * Assert message HTML contents to include substring
   * or match the given regular expression
   */
  assertHtmlIncludes(substring: string | RegExp) {
    return this.assertContent('html', substring)
  }

  /**
   * Assert message watch contents to include substring
   * or match the given regular expression
   */
  assertWatchIncludes(substring: string | RegExp) {
    return this.assertContent('watch', substring)
  }

  /**
   * Define one or attachments
   */
  attach(
    file: string | URL,
    options?: Omit<AttachmentOptions, 'raw' | 'content' | 'cid' | 'path'>
  ): this {
    const filePath = typeof file === 'string' ? file : fileURLToPath(file)

    this.nodeMailerMessage.attachments = this.nodeMailerMessage.attachments || []
    this.nodeMailerMessage.attachments.push({
      path: filePath,
      filename: basename(filePath),
      ...options,
    })
    this.#attachmentsForSearch.push({
      path: filePath,
      filename: basename(filePath),
      ...options,
    })

    return this
  }

  /**
   * Check if a file attachment exists by the mentioned
   * file path or URL.
   */
  hasAttachment(file: string | URL, options?: { filename?: string; cid?: string }): boolean
  hasAttachment(finder: (attachment: Attachment) => boolean): boolean
  hasAttachment(
    file: ((attachment: Attachment) => boolean) | string | URL,
    options?: { filename?: string; cid?: string }
  ): boolean {
    const attachments = this.#attachmentsForSearch
    if (!attachments) {
      return false
    }

    if (typeof file === 'function') {
      return !!attachments.find(file)
    }

    const filePath = typeof file === 'string' ? file : fileURLToPath(file)
    return !!attachments.find((attachment) => {
      const hasMatchingPath = attachment.path ? String(attachment.path).endsWith(filePath) : false
      if (!options) {
        return hasMatchingPath
      }

      if (options.filename && attachment.filename !== options.filename) {
        return false
      }

      if (options.cid && attachment.cid !== options.cid) {
        return false
      }

      return true
    })
  }

  /**
   * Assert a file attachment exists by the mentioned
   * file path or URL.
   */
  assertAttachment(file: string | URL, options?: { filename?: string; cid?: string }): void
  assertAttachment(finder: (attachment: Attachment) => boolean): void
  assertAttachment(
    file: ((attachment: Attachment) => boolean) | string | URL,
    options?: { filename?: string; cid?: string }
  ): void {
    if (typeof file === 'function') {
      if (!this.hasAttachment(file)) {
        throw new AssertionError({
          message: `Expected assertion callback to find an attachment`,
        })
      }
      return
    }

    if (!this.hasAttachment(file, options)) {
      throw new AssertionError({
        message: `Expected message attachments to include "${file}"`,
        expected: [{ path: file, ...options }],
        actual: this.nodeMailerMessage.attachments,
        operator: 'includes',
      })
    }
  }

  /**
   * Define attachment from raw data
   */
  attachData(
    content: Readable | Buffer,
    options?: Omit<AttachmentOptions, 'raw' | 'content' | 'cid' | 'path'>
  ): this {
    this.nodeMailerMessage.attachments = this.nodeMailerMessage.attachments || []
    this.nodeMailerMessage.attachments.push({
      content,
      ...options,
    })

    return this
  }

  /**
   * Embed attachment inside content using `cid`
   */
  embed(
    file: string | URL,
    cid: string,
    options?: Omit<AttachmentOptions, 'raw' | 'content' | 'cid' | 'path'>
  ): this {
    const filePath = typeof file === 'string' ? file : fileURLToPath(file)

    this.nodeMailerMessage.attachments = this.nodeMailerMessage.attachments || []
    this.nodeMailerMessage.attachments.push({
      path: filePath,
      cid,
      filename: basename(filePath),
      ...options,
    })
    this.#attachmentsForSearch.push({
      path: filePath,
      cid,
      filename: basename(filePath),
      ...options,
    })

    return this
  }

  /**
   * Embed attachment from raw data inside content using `cid`
   */
  embedData(
    content: Readable | Buffer,
    cid: string,
    options?: Omit<AttachmentOptions, 'raw' | 'content' | 'cid' | 'path'>
  ): this {
    this.nodeMailerMessage.attachments = this.nodeMailerMessage.attachments || []
    this.nodeMailerMessage.attachments.push({
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
    if (!this.nodeMailerMessage.headers) {
      this.nodeMailerMessage.headers = {}
    }

    if (!Array.isArray(this.nodeMailerMessage.headers)) {
      this.nodeMailerMessage.headers[key] = value
    }

    return this
  }

  /**
   * Check if a header has been defined and optionally
   * check for values as well.
   */
  hasHeader(key: string, value?: string | string[]): boolean {
    const headers = this.nodeMailerMessage.headers
    if (!headers || Array.isArray(headers)) {
      return false
    }

    const headerValue = headers[key]
    if (!headerValue) {
      return false
    }

    if (value) {
      return !!(Array.isArray(value) ? value : [value]).every((one) => {
        return typeof headerValue === 'string'
          ? headerValue === one
          : Array.isArray(headerValue)
          ? headerValue.includes(one)
          : headerValue.value === one
      })
    }

    return true
  }

  /**
   * Assert a header has been defined and optionally
   * check for values as well.
   */
  assertHeader(key: string, value?: string | string[]) {
    if (!this.hasHeader(key, value)) {
      const headers = this.nodeMailerMessage.headers
      const actual = headers && !Array.isArray(headers) ? headers[key] : undefined

      if (!value || !actual) {
        throw new AssertionError({
          message: `Expected message headers to include "${key}"`,
        })
      }

      throw new AssertionError({
        message: `Expected message headers to include "${key}" with value "${value}"`,
        actual,
        expected: value,
      })
    }
  }

  /**
   * Define custom prepared headers for email
   */
  preparedHeader(key: string, value: string): this {
    if (!this.nodeMailerMessage.headers) {
      this.nodeMailerMessage.headers = {}
    }

    if (!Array.isArray(this.nodeMailerMessage.headers)) {
      this.nodeMailerMessage.headers[key] = { prepared: true, value }
    }

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

    this.nodeMailerMessage.icalEvent = { content: contents, ...options }
    return this
  }

  /**
   * Attach a calendar event and load contents from a file
   */
  icalEventFromFile(file: string | URL, options?: CalendarEventOptions): this {
    const filePath = typeof file === 'string' ? file : fileURLToPath(file)
    this.nodeMailerMessage.icalEvent = { path: filePath, ...options }
    return this
  }

  /**
   * Attach a calendar event and load contents from a url
   */
  icalEventFromUrl(url: string, options?: CalendarEventOptions): this {
    this.nodeMailerMessage.icalEvent = { href: url, ...options }
    return this
  }

  /**
   * Object representation of the message
   */
  toObject(): { message: NodeMailerMessage; views: MessageBodyTemplates } {
    return {
      message: this.nodeMailerMessage,
      views: {
        ...this.contentViews,
      },
    }
  }

  /**
   * JSON representation of the message
   */
  toJSON(): { message: NodeMailerMessage; views: MessageBodyTemplates } {
    return this.toObject()
  }
}

/*
 * @adonisjs/mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

/// <reference path="../../adonis-typings/mail.ts" />

import { Readable } from 'stream'
import { EdgeContract } from 'edge.js'
import { MessageContract, AttachmentOptionsNode, MessageNode, EnvolpeNode } from '@ioc:Adonis/Addons/Mail'

export class Message implements MessageContract {
  private _nodeMailerMessage: MessageNode = {}

  constructor (private _view: EdgeContract) {
  }

  /**
   * Explicit content set on the message object. This will get
   * preference over views
   */
  private _content: {
    html?: string,
    text?: string,
    watch?: string,
  } = {}

  /**
   * Returns address node with correctly formatted way
   */
  private _getAddress (address: string, name?: string): { address: string, name?: string } {
    return name ? { address, name } : { address }
  }

  /**
   * Add receipent as `to`
   */
  public to (address: string, name?: string): this {
    this._nodeMailerMessage.to = this._nodeMailerMessage.to || []
    this._nodeMailerMessage.to.push(this._getAddress(address, name))
    return this
  }

  /**
   * Add `from` name and email
   */
  public from (address: string, name?: string): this {
    this._nodeMailerMessage.from = this._getAddress(address, name)
    return this
  }

  /**
   * Add receipent as `cc`
   */
  public cc (address: string, name?: string): this {
    this._nodeMailerMessage.cc = this._nodeMailerMessage.cc || []
    this._nodeMailerMessage.cc.push(this._getAddress(address, name))
    return this
  }

  /**
   * Add receipent as `bcc`
   */
  public bcc (address: string, name?: string): this {
    this._nodeMailerMessage.bcc = this._nodeMailerMessage.bcc || []
    this._nodeMailerMessage.bcc.push(this._getAddress(address, name))
    return this
  }

  /**
   * Define custom message id
   */
  public messageId (messageId: string): this {
    this._nodeMailerMessage.messageId = messageId
    return this
  }

  /**
   * Define subject
   */
  public subject (message: string): this {
    this._nodeMailerMessage.subject = message
    return this
  }

  /**
   * Define replyTo email and name
   */
  public replyTo (address: string, name?: string): this {
    this._nodeMailerMessage.replyTo = this._getAddress(address, name)
    return this
  }

  /**
   * Define inReplyTo message id
   */
  public inReplyTo (messageId: string): this {
    this._nodeMailerMessage.inReplyTo = messageId
    return this
  }

  /**
   * Define multiple message id's as references
   */
  public references (messagesIds: string[]): this {
    this._nodeMailerMessage.references = messagesIds
    return this
  }

  /**
   * Optionally define email envolpe
   */
  public envelope (envelope: EnvolpeNode): this {
    this._nodeMailerMessage.envelope = envelope
    return this
  }

  /**
   * Define contents encoding
   */
  public encoding (encoding: string): this {
    this._nodeMailerMessage.encoding = encoding
    return this
  }

  /**
   * Define email prority
   */
  public priority (priority: 'low' | 'normal' | 'high'): this {
    this._nodeMailerMessage.priority = priority
    return this
  }

  /**
   * Compute email html from defined view
   */
  public htmlView (template: string, data?: any): this {
    this._content.html = this._view.render(template, data)
    return this
  }

  /**
   * Compute email text from defined view
   */
  public textView (template: string, data?: any): this {
    this._content.text = this._view.render(template, data)
    return this
  }

  /**
   * Compute apple watch html from defined view
   */
  public watchView (template: string, data?: any): this {
    this._content.watch = this._view.render(template, data)
    return this
  }

  /**
   * Compute email html from raw text
   */
  public html (content: string): this {
    this._content.html = content
    return this
  }

  /**
   * Compute email text from raw text
   */
  public text (content: string): this {
    this._content.text = content
    return this
  }

  /**
   * Compute email watch html from raw text
   */
  public watch (content: string): this {
    this._content.watch = content
    return this
  }

  /**
   * Define one or attachments
   */
  public attach (filePath: string, options?: AttachmentOptionsNode): this {
    this._nodeMailerMessage.attachments = this._nodeMailerMessage.attachments || []
    this._nodeMailerMessage.attachments.push({
      path: filePath,
      ...options,
    })

    return this
  }

  /**
   * Define attachment from raw data
   */
  public attachData (content: Readable | Buffer, options?: AttachmentOptionsNode): this {
    this._nodeMailerMessage.attachments = this._nodeMailerMessage.attachments || []
    this._nodeMailerMessage.attachments.push({
      content,
      ...options,
    })

    return this
  }

  /**
   * Embed attachment inside content using `cid`
   */
  public embed (filePath: string, cid: string, options?: AttachmentOptionsNode): this {
    this._nodeMailerMessage.attachments = this._nodeMailerMessage.attachments || []
    this._nodeMailerMessage.attachments.push({
      path: filePath,
      cid,
      ...options,
    })

    return this
  }

  /**
   * Embed attachment from raw data inside content using `cid`
   */
  public embedData (content: Readable | Buffer, cid: string, options?: AttachmentOptionsNode): this {
    this._nodeMailerMessage.attachments = this._nodeMailerMessage.attachments || []
    this._nodeMailerMessage.attachments.push({
      content,
      cid,
      ...options,
    })

    return this
  }

  /**
   * Define custom headers for email
   */
  public header (key: string, value: string | string[]): this {
    this._nodeMailerMessage.headers = this._nodeMailerMessage.headers || []
    this._nodeMailerMessage.headers.push({ [key]: value })

    return this
  }

  /**
   * Define custom prepared headers for email
   */
  public preparedHeader (key: string, value: string | string[]): this {
    this._nodeMailerMessage.headers = this._nodeMailerMessage.headers || []
    this._nodeMailerMessage.headers.push({ [key]: { prepared: true, value } })

    return this
  }

  /**
   * Get message JSON. The packet can be sent over to nodemailer
   */
  public toJSON (): MessageNode {
    return Object.assign(this._content, this._nodeMailerMessage)
  }
}

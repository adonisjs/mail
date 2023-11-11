/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import fastq from 'fastq'

import type { Mailer } from '../mailer.js'
import type { MailDriverContract, MessageBodyTemplates, NodeMailerMessage } from '../types.js'

/**
 * Worker to send emails
 */
function sendEmail(
  this: MemoryQueueMessenger,
  task: {
    mail: { message: NodeMailerMessage; views: MessageBodyTemplates }
    sendConfig?: unknown
  }
) {
  return this.mailer.sendCompiled(task.mail, task.sendConfig)
}

/**
 * Memory queue messenger uses "fastq" npm package to keep
 * emails within memory and send them in the chunks of 10
 */
export class MemoryQueueMessenger {
  #queue = fastq(this, sendEmail, 10)
  constructor(public mailer: Mailer<MailDriverContract>) {}

  /**
   * Queues the email within memory
   */
  async queue(
    mail: { message: NodeMailerMessage; views: MessageBodyTemplates },
    sendConfig?: unknown
  ) {
    this.#queue.push({
      mail,
      sendConfig,
    })
  }
}

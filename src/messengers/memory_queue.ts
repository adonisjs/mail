/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import fastq, { type done } from 'fastq'

import debug from '../debug.js'
import type { Mailer } from '../mailer.js'
import type { MailResponse } from '../mail_response.js'
import type { MailDriverContract, MessageBodyTemplates, NodeMailerMessage } from '../types.js'

/**
 * Worker to send emails
 */
function sendEmail(
  this: MemoryQueueMessenger,
  task: {
    mail: { message: NodeMailerMessage; views: MessageBodyTemplates }
    sendConfig?: unknown
  },
  cb: done
) {
  this.mailer
    .sendCompiled(task.mail, task.sendConfig)
    .then((result) => cb(null, result))
    .catch((error) => cb(error))
}

/**
 * Memory queue messenger uses "fastq" npm package to keep
 * emails within memory and send them in the chunks of 10
 */
export class MemoryQueueMessenger {
  #queue = fastq(this, sendEmail, 10)
  #jobCompletedCallback?: (error: Error | null, result: MailResponse<unknown>) => void

  constructor(public mailer: Mailer<MailDriverContract>) {}

  /**
   * Register a callback to get notified when a job is
   * completed
   */
  monitor(jobCompletionNotifier: (error: Error | null, result: MailResponse<unknown>) => void) {
    this.#jobCompletedCallback = jobCompletionNotifier
    return this
  }

  /**
   * Queues the email within memory
   */
  async queue(
    mail: { message: NodeMailerMessage; views: MessageBodyTemplates },
    sendConfig?: unknown
  ) {
    debug('pushing email to in-memory queue')
    this.#queue.push(
      {
        mail,
        sendConfig,
      },
      this.#jobCompletedCallback
    )
  }
}

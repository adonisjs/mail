/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { MessageNode, PostSentEnvelopeNode } from '../main.js'

/**
 * Shape of mail response for the fake driver
 */
export type FakeMailResponse = {
  messageId: string
  message: MessageNode
  envelope: PostSentEnvelopeNode
}

/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

import { stubsRoot } from '../stubs/main.js'

export default class MakeMail extends BaseCommand {
  static commandName = 'make:mail'
  static description = 'Make a new mail class'
  static options: CommandOptions = {
    allowUnknownFlags: true,
  }

  /**
   * The name of the mail file.
   */
  @args.string({ description: 'Name of the mail file' })
  declare name: string

  /**
   * Define the intent suffix for the mail
   */
  @flags.string({ description: 'The intent suffix for the mail' })
  declare intent?: string

  /**
   * Execute command
   */
  async run(): Promise<void> {
    const codemods = await this.createCodemods()
    await codemods.makeUsingStub(stubsRoot, 'make/mail/main.stub', {
      flags: this.parsed.flags,
      intent: this.intent || 'notification',
      entity: this.app.generators.createEntity(this.name),
    })
  }
}

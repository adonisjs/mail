/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { BaseCommand, args } from '@adonisjs/core/ace'
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
   * Execute command
   */
  async run(): Promise<void> {
    const codemods = await this.createCodemods()
    await codemods.makeUsingStub(stubsRoot, 'mail.stub', {
      flags: this.parsed.flags,
      entity: this.app.generators.createEntity(this.name),
    })
  }
}

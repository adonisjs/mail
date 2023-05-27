/*
 * @adonisjs/assembler
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { args } from '@adonisjs/core/ace'
import BaseCommand from './_base.js'

/**
 * Command to make a new mailer
 */
export default class MakeMailer extends BaseCommand {
  static commandName = 'make:mailer'
  static description = 'Create a new mailer class'

  @args.string({ description: 'Name of the mailer class', required: true })
  declare name: string

  /**
   * The stub to use for generating the command class
   */
  protected stubPath: string = 'make/mailer.stub'

  async run() {
    await this.generate(this.stubPath, {
      entity: this.app.generators.createEntity(this.name),
    })
  }
}

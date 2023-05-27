/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { slash } from '@poppinss/utils'
import { stubsRoot } from '../stubs/index.js'
import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'

/**
 * Base command for make commands
 *
 * Copy/paste from :
 * https://github.com/adonisjs/core/blob/next/commands/make/_base.ts#L13
 *
 * May need to be extracted to a separate package. So users can easily create commands
 * with that stub customization logic.
 */
export default abstract class extends BaseCommand {
  /**
   * Allowing unknown flags to enable custom workflows
   */
  static options: CommandOptions = {
    allowUnknownFlags: true,
  }

  /**
   * Generates the resource from stub
   */
  protected async generate(stubPath: string, stubState: Record<string, any>) {
    const stub = await this.app.stubs.build(stubPath, { source: stubsRoot })
    const output = await stub.generate(
      Object.assign(
        {
          flags: this.parsed.flags,
        },
        stubState
      )
    )

    const entityFileName = slash(this.app.relativePath(output.destination))
    if (output.status === 'skipped') {
      this.logger.action(`create ${entityFileName}`).skipped(output.skipReason)
      return {
        ...output,
        relativeFileName: entityFileName,
      }
    }

    this.logger.action(`create ${entityFileName}`).succeeded()
    return {
      ...output,
      relativeFileName: entityFileName,
    }
  }
}

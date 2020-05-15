/*
 * @adonisjs/mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { IocContract } from '@adonisjs/fold'
import { MailManager } from '../src/Mail/MailManager'

export default class MailProvider {
  constructor (protected $container: IocContract) {}

  public register () {
    this.$container.singleton('Adonis/Addons/Mail', () => {
      const config = this.$container.use('Adonis/Core/Config').get('mail', {})
      const view = this.$container.use('Adonis/Core/View')
      return new MailManager(this.$container, config, view)
    })
  }

  public boot () {
    if (!this.$container.hasBinding('Adonis/Core/View')) {
      throw new Error('@adonisjs/mail requires @adonisjs/view to render mail templates')
    }
  }
}

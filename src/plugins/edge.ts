/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { PluginFn } from 'edge.js/types'
import debug from '../debug.js'

/**
 * Registers mjml component to convert email markup
 * to HTML
 */
export const mailPluginEdge: PluginFn<undefined> = (edge) => {
  debug('detected edge. registering mjml component')

  edge.global('mail', {
    async processMjml(markup: string, options: any) {
      const mjml = await import('mjml')
      return mjml.default(markup, options).html
    },
  })

  edge.registerTemplate('mjml', {
    template: `{{{ await mail.processMjml(await $slots.main(), $props.all()) }}}`,
  })
}

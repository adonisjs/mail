/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import mjml2html from 'mjml'
import { Edge } from 'edge.js'
import { test } from '@japa/runner'
import { mailPluginEdge } from '../../../src/plugins/edge.js'

test.group('Edge plugin', () => {
  test('render mjml markup to HTML', async ({ assert, fs }) => {
    const edge = new Edge()
    edge.mount(fs.baseUrl)
    edge.use(mailPluginEdge)

    const markup = `<mjml>
<mj-body>
  <mj-section>
    <mj-column>
      <mj-text>
        Hello World!
      </mj-text>
    </mj-column>
  </mj-section>
</mj-body>
</mjml>`

    const html = await edge.renderRaw(`@mjml() \n ${markup} \n @end`)
    assert.equal(html, mjml2html(markup).html)
  })
})

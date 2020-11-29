/*
 * @adonisjs/assembler
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { join } from 'path'
import { args, BaseCommand } from '@adonisjs/core/build/standalone'

/**
 * Command to make a new mailer
 */
export default class MakeMailer extends BaseCommand {
	/**
	 * Command meta data
	 */
	public static commandName = 'make:mailer'
	public static description = 'Make a new mailer class'

	@args.string({ description: 'Name of the mailer class' })
	public name: string

	/**
	 * Create the mailer template
	 */
	public async run() {
		const stub = join(__dirname, '..', 'templates', 'mailer.txt')
		const path = this.application.resolveNamespaceDirectory('mailers')

		this.generator
			.addFile(this.name, { pattern: 'pascalcase' })
			.stub(stub)
			.destinationDir(path || 'app/Mailers')
			.useMustache()
			.appRoot(this.application.cliCwd || this.application.appRoot)

		await this.generator.run()
	}
}

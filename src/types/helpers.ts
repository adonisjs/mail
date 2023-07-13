/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { ManagerDriverFactory } from '../define_config.js'
import { MailDriverContract } from './main.js'

export type MailDriversListContract = Record<string, ManagerDriverFactory>

/**
 * Unwraps value of a promise type
 */
export type UnwrapPromise<T> = T extends PromiseLike<infer U> ? U : T

/**
 * Infers the response type of a driver
 */
export type DriverResponseType<Driver> = Driver extends MailDriverContract
  ? UnwrapPromise<ReturnType<Driver['send']>>
  : never

/**
 * Infers the response type of a mailer
 */
export type MailerResponseType<
  Name extends keyof KnownMailers,
  KnownMailers extends MailDriversListContract,
> = DriverResponseType<KnownMailers[Name]>

/**
 * Infers the 2nd argument accepted by the driver send method
 */
export type DriverOptionsType<Driver> = Driver extends MailDriverContract
  ? Parameters<Driver['send']>[1]
  : never

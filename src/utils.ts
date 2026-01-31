/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { E_INVALID_CONFIG } from './errors.js'

/**
 * Convert a stream to a blob
 */
export function streamToBlob(stream: NodeJS.ReadableStream, mimeType: string) {
  return new Promise<Blob>((resolve, reject) => {
    const chunks: any = []

    stream
      .on('data', (chunk) => chunks.push(chunk))
      .once('end', () => resolve(new Blob(chunks, { type: mimeType })))
      .once('error', reject)
  })
}

/**
 * Normalize the base URL by removing the trailing slash
 */
export function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/$/, '')
}

/**
 * Validate transport config to ensure the "key" and
 * "baseUrl" are present.
 */
export function validateConfig(
  transportName: string,
  config: { key: string; baseUrl: string | undefined }
) {
  if (!config.key) {
    throw new E_INVALID_CONFIG(
      `Invalid config for "${transportName}" transport. The "key" property is missing`
    )
  }

  if (!config.baseUrl) {
    throw new E_INVALID_CONFIG(
      `Invalid config for "${transportName}" transport. The "baseUrl" property is missing`
    )
  }
}

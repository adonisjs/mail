/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { RuntimeException } from '@adonisjs/core/exceptions'

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
 * Validates the transport configuration
 */
export function validateConfig(transportName: string, config: { key: string; baseUrl: string }) {
  if (!config.key) {
    throw new RuntimeException(`${transportName} transport: "key" is not defined`)
  }

  if (!config.baseUrl) {
    throw new RuntimeException(`${transportName} transport: "baseUrl" is not defined`)
  }
}

/**
 * Returns the normalized base URL for the API
 */
export function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/$/, '')
}

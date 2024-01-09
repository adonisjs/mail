/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

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

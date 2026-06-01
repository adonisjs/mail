/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type MailMessage from 'nodemailer/lib/mailer/mail-message.js'

import { E_INVALID_CONFIG } from './errors.js'

/**
 * Headers that the JSON based transports (Resend, Brevo) reconstruct from
 * the structured payload fields or that are owned by the provider/MIME
 * layer. Forwarding them inside the "headers" object would either
 * duplicate or conflict with the values the API already computes.
 */
const STRUCTURAL_HEADERS = new Set([
  'from',
  'sender',
  'reply-to',
  'to',
  'cc',
  'bcc',
  'subject',
  'message-id',
  'date',
  'content-type',
  'content-transfer-encoding',
  'mime-version',
])

/**
 * Extracts the user defined headers (custom headers, "List-" headers,
 * "In-Reply-To", "References", etc.) from a Nodemailer message so they
 * can be forwarded to the API based transports that accept an arbitrary
 * "headers" object (Resend, Brevo).
 *
 * Nodemailer has already serialized every header onto the underlying
 * MimeNode (including the tricky "List-*" formatting), so we read them
 * back instead of re-implementing the serialization. Structural headers
 * that the API derives from the structured payload are skipped, and
 * duplicate keys (e.g. a multi value "List-Unsubscribe") are collapsed
 * into a single comma separated value.
 */
export function extractMessageHeaders(mail: MailMessage): Record<string, string> | undefined {
  const rawHeaders = (mail.message as unknown as { _headers?: { key: string; value: unknown }[] })
    ._headers

  if (!Array.isArray(rawHeaders)) {
    return undefined
  }

  const headers: Record<string, string> = {}

  for (const { key, value } of rawHeaders) {
    if (STRUCTURAL_HEADERS.has(key.toLowerCase())) {
      continue
    }

    /**
     * Prepared and "List-" headers are stored as
     * `{ prepared, foldLines, value }` objects.
     */
    const normalized =
      value && typeof value === 'object' && 'value' in value
        ? (value as { value: unknown }).value
        : value

    const stringValue = Array.isArray(normalized) ? normalized.join(', ') : String(normalized)

    headers[key] = headers[key] ? `${headers[key]}, ${stringValue}` : stringValue
  }

  return Object.keys(headers).length ? headers : undefined
}

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

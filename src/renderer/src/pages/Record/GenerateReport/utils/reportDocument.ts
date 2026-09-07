import reportIconDataUrl from '@resources/icon.png?inline'
import baseStyles from './reportBase.css?inline'

const CONTENT_SECURITY_POLICY =
  "default-src 'none'; img-src data:; font-src data:; style-src 'unsafe-inline'; script-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"

function escapeCssUrl(url: string): string {
  return url.replaceAll('\\', '\\\\').replaceAll("'", "\\'").replaceAll('\n', '')
}

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function sanitizeLanguage(language: string): string {
  return /^[a-zA-Z0-9-]+$/.test(language) ? language : 'en'
}

export function buildReportDocument({
  language,
  title,
  markup,
  themeCss,
  styleCss,
  fontSource
}: {
  language: string
  title: string
  markup: string
  themeCss: string
  styleCss: string
  fontSource: string
}): string {
  if (!fontSource.startsWith('data:font/woff2;base64,')) {
    throw new Error('Export report font must be an embedded WOFF2 data URI')
  }
  if (/(?:src|href)="(?:attachment|file|https?):/i.test(markup)) {
    throw new Error('Report contains a non-embedded resource')
  }

  return `<!doctype html>
<html lang="${sanitizeLanguage(language)}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="Content-Security-Policy" content="${CONTENT_SECURITY_POLICY}" />
    <link rel="icon" type="image/png" href="${reportIconDataUrl}" />
    <title>${escapeHtml(title)}</title>
    <style>
      @font-face {
        font-family: 'Vnite Report';
        src: url('${escapeCssUrl(fontSource)}') format('woff2');
        font-weight: 400;
        font-style: normal;
      }
      ${themeCss}
      ${baseStyles}
      ${styleCss}
    </style>
  </head>
  <body>${markup}</body>
</html>`
}

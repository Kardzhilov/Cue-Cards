import JSZip from 'jszip'
import type { CardFace } from '../types'
import { captureNodes } from './pdf'

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Capture each card face as a PNG and bundle them into a zip blob. */
export async function buildPngZipBlob(faces: CardFace[], nodes: HTMLElement[]): Promise<Blob | null> {
  if (faces.length === 0) return null
  const urls = await captureNodes(nodes)
  const zip = new JSZip()
  urls.forEach((url, i) => {
    const face = faces[i]
    const base64 = url.split(',')[1]
    const num = String(face.cardNumber).padStart(2, '0')
    const suffix = face.side === 'back' ? '-back' : ''
    zip.file(`card-${num}${suffix}.png`, base64, { base64: true })
  })
  return zip.generateAsync({ type: 'blob' })
}

/** Capture each card face as a PNG and download them bundled in a zip. */
export async function exportPngZip(faces: CardFace[], nodes: HTMLElement[]): Promise<void> {
  const blob = await buildPngZipBlob(faces, nodes)
  if (blob) downloadBlob(blob, 'cue-cards-png.zip')
}

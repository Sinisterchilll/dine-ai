import QRCode from 'qrcode';

export async function generateQRCode(url: string): Promise<Buffer> {
  const buffer = await QRCode.toBuffer(url, {
    type: 'png',
    width: 400,
    margin: 2,
    color: {
      dark: '#0C0A09',
      light: '#FAFAF9',
    },
    errorCorrectionLevel: 'M',
  });
  return buffer;
}

export function getTableUrl(baseUrl: string, slug: string, tableId: number): string {
  return `${baseUrl}/r/${slug}/t/${tableId}`;
}

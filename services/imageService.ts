
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { ImageMetadata } from '../types';

// Tabel pre-calculat pentru CRC32
const crcTable: number[] = new Array(256);
for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
        if (c & 1) c = 0xedb88320 ^ (c >>> 1);
        else c = c >>> 1;
    }
    crcTable[n] = c;
}

function crc32(buf: Uint8Array): number {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ -1) >>> 0;
}

/**
 * Inserează meta-date în fișierul PNG folosind chunk-uri iTXt (UTF-8).
 */
export function downloadWithMetadata(
    base64Data: string,
    metadata: ImageMetadata,
    filename: string
) {
    try {
        // Curățare Base64
        const cleanBase64 = base64Data.includes('base64,') 
            ? base64Data.split('base64,')[1] 
            : base64Data;

        // Decodare în buffer binar
        const binaryString = atob(cleanBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Verificare semnătură PNG (8 bytes)
        const signature = [137, 80, 78, 71, 13, 10, 26, 10];
        if (bytes.length < 8) throw new Error("Fișier prea mic");
        for (let i = 0; i < 8; i++) {
            if (bytes[i] !== signature[i]) throw new Error("Format PNG invalid");
        }

        const createChunk = (type: string, data: Uint8Array) => {
            const buf = new Uint8Array(12 + data.length);
            const view = new DataView(buf.buffer);
            // Lungime (4 bytes)
            view.setUint32(0, data.length, false);
            // Tip (4 bytes)
            for (let i = 0; i < 4; i++) buf[4 + i] = type.charCodeAt(i);
            // Date
            buf.set(data, 8);
            // CRC (4 bytes)
            const crc = crc32(buf.subarray(4, 8 + data.length));
            view.setUint32(8 + data.length, crc, false);
            return buf;
        };

        const createITXtChunk = (keyword: string, text: string) => {
            const encoder = new TextEncoder();
            const kwBytes = encoder.encode(keyword.substring(0, 79));
            const textBytes = encoder.encode(text);
            
            // Format: Keyword (null) Compression(0) Method(0) Language(null) Translated(null) Text
            const data = new Uint8Array(kwBytes.length + 5 + textBytes.length);
            data.set(kwBytes, 0);
            data[kwBytes.length] = 0;
            data[kwBytes.length + 1] = 0; // Fără compresie
            data[kwBytes.length + 2] = 0;
            data[kwBytes.length + 3] = 0; // Limbă goală
            data[kwBytes.length + 4] = 0; // Traducere goală
            data.set(textBytes, kwBytes.length + 5);
            
            return createChunk('iTXt', data);
        };

        const chunks: Uint8Array[] = [bytes.slice(0, 8)];
        let pos = 8;
        let inserted = false;

        // Procesare chunk-uri existente
        while (pos + 8 <= bytes.length) {
            const view = new DataView(bytes.buffer, bytes.byteOffset + pos, 8);
            const length = view.getUint32(0, false);
            const type = String.fromCharCode(bytes[pos+4], bytes[pos+5], bytes[pos+6], bytes[pos+7]);
            const totalLen = length + 12;

            if (pos + totalLen > bytes.length) break;

            const chunkData = bytes.slice(pos, pos + totalLen);
            chunks.push(chunkData);

            // Inserăm meta-datele imediat după IHDR
            if (type === 'IHDR' && !inserted) {
                const metaTags = [
                    { k: 'Title', v: metadata.title },
                    { k: 'Author', v: metadata.author },
                    { k: 'Description', v: metadata.description },
                    { k: 'Copyright', v: metadata.copyright },
                    { k: 'Creation Time', v: metadata.date },
                    { k: 'Comment', v: metadata.keywords }
                ];

                metaTags.forEach(tag => {
                    if (tag.v && tag.v.trim()) {
                        chunks.push(createITXtChunk(tag.k, tag.v.trim()));
                    }
                });
                inserted = true;
            }
            pos += totalLen;
        }

        const blob = new Blob(chunks, { type: 'image/png' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error("Eroare la generarea fișierului cu meta-date:", err);
        // Fallback la descărcare simplă
        const link = document.createElement('a');
        link.href = base64Data.startsWith('data:') ? base64Data : `data:image/png;base64,${base64Data}`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

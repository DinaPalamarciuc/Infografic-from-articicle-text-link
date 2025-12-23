/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { ImageMetadata } from '../types';

// Precompute CRC32 table
const crcTable: number[] = [];
for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
        if (c & 1) c = 0xedb88320 ^ (c >>> 1);
        else c = c >>> 1;
    }
    crcTable[n] = c;
}

function crc32(buf: Uint8Array): number {
    let crc = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
}

export function downloadWithMetadata(
    base64Data: string,
    metadata: ImageMetadata,
    filename: string
) {
    try {
        const binaryString = atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const createChunk = (type: string, data: Uint8Array) => {
            const length = data.length;
            const buf = new Uint8Array(4 + 4 + length + 4);
            const view = new DataView(buf.buffer);
            
            view.setUint32(0, length, false);
            for (let i = 0; i < 4; i++) buf[4 + i] = type.charCodeAt(i);
            buf.set(data, 8);
            
            const crc = crc32(buf.subarray(4, 8 + length));
            view.setUint32(8 + length, crc, false);
            
            return buf;
        };

        const textChunks: Uint8Array[] = [];
        const keywords: Record<string, string> = {
            'Title': metadata.title,
            'Author': metadata.author,
            'Description': metadata.description,
            'Copyright': metadata.copyright,
            'Creation Time': metadata.date,
            'Software': 'Link2Infographic AI'
        };
        
        if (metadata.keywords) {
             // Append keywords to Description for better visibility in simple viewers
             // keywords['Keywords'] = metadata.keywords; 
        }

        for (const [key, value] of Object.entries(keywords)) {
            if (!value) continue;
            const keyBytes = new TextEncoder().encode(key);
            const valBytes = new TextEncoder().encode(value);
            const chunkData = new Uint8Array(keyBytes.length + 1 + valBytes.length);
            chunkData.set(keyBytes, 0);
            chunkData[keyBytes.length] = 0;
            chunkData.set(valBytes, keyBytes.length + 1);
            
            textChunks.push(createChunk('tEXt', chunkData));
        }

        let pos = 8;
        const parts: Uint8Array[] = [bytes.slice(0, 8)]; // Signature
        let inserted = false;

        while (pos < bytes.length) {
            const view = new DataView(bytes.buffer);
            const chunkLen = view.getUint32(pos, false);
            const type = String.fromCharCode(bytes[pos+4], bytes[pos+5], bytes[pos+6], bytes[pos+7]);
            
            const totalChunkLen = chunkLen + 12;
            const chunk = bytes.slice(pos, pos + totalChunkLen);
            
            parts.push(chunk);
            
            // Insert metadata after IHDR
            if (type === 'IHDR' && !inserted) {
                textChunks.forEach(c => parts.push(c));
                inserted = true;
            }
            
            pos += totalChunkLen;
        }

        const blob = new Blob(parts, { type: 'image/png' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error("Failed to inject metadata, falling back to simple download", e);
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${base64Data}`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export async function GET() {
  const robots = `User-agent: *
Allow: /

Sitemap: https://link2infographic-92345457269.us-west1.run.app/sitemap.xml`;

  return new Response(robots, {
    headers: {
      "Content-Type": "text/plain"
    }
  });
}
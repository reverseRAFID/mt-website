import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'
export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'your-project-id',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: process.env.NODE_ENV === 'production',
})

const builder = imageUrlBuilder(client)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function urlFor(source: any) {
  return builder.image(source)
}

export function getYouTubeID(url: string): string | null {
  return url.match(/(?:youtu\.be\/|v=)([^&\n?#]+)/)?.[1] ?? null
}

/**
 * YouTube video downloader service
 * For MVP, we'll use a mock implementation
 * In production, use yt-dlp or YouTube API
 */

export interface VideoInfo {
  id: string
  title: string
  duration: number
  thumbnail: string
  author: string
}

export async function getVideoInfo(url: string): Promise<VideoInfo> {
  console.log("[v0] Buscando informações do vídeo de:", url)

  const videoId = extractVideoId(url)

  try {
    // Use a free API to get real video info
    const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`)
    const data = await response.json()

    if (data && data.title) {
      console.log("[v0] Título do vídeo obtido:", data.title)
      return {
        id: videoId,
        title: data.title,
        duration: data.duration || 1800,
        thumbnail: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
        author: data.author_name || "Autor desconhecido",
      }
    }
  } catch (error) {
    console.error("[v0] Erro ao buscar informações do vídeo:", error)
  }

  // Fallback se a API falhar
  return {
    id: videoId,
    title: "Vídeo do YouTube",
    duration: 1800,
    thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    author: "Canal do YouTube",
  }
}

export async function downloadVideo(url: string, outputPath: string): Promise<string> {
  console.log("[v0] Downloading video:", url)

  // For MVP: Simulate download
  // In production, use yt-dlp:
  // execSync(`yt-dlp -f "best[ext=mp4]" -o "${outputPath}" "${url}"`)

  await new Promise((resolve) => setTimeout(resolve, 3000))

  return outputPath
}

export async function downloadAudio(url: string, outputPath: string): Promise<string> {
  console.log("[v0] Downloading audio:", url)

  // For MVP: Simulate download
  // In production, use yt-dlp:
  // execSync(`yt-dlp -x --audio-format mp3 -o "${outputPath}" "${url}"`)

  await new Promise((resolve) => setTimeout(resolve, 2000))

  return outputPath
}

function extractVideoId(url: string): string {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return "mock-video-id"
}

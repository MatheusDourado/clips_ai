# Guia de Implementação - Processamento Real

## 1. YouTube Download

### Opção 1: ytdl-core (Node.js)
\`\`\`typescript
import ytdl from 'ytdl-core'
import fs from 'fs'

export async function downloadVideo(url: string, outputPath: string) {
  const info = await ytdl.getInfo(url)
  const format = ytdl.chooseFormat(info.formats, { quality: 'highestvideo' })
  
  return new Promise((resolve, reject) => {
    ytdl(url, { format })
      .pipe(fs.createWriteStream(outputPath))
      .on('finish', resolve)
      .on('error', reject)
  })
}
\`\`\`

### Opção 2: yt-dlp (Mais robusto)
\`\`\`typescript
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function downloadVideo(url: string, outputPath: string) {
  await execAsync(`yt-dlp -f "best" -o "${outputPath}" "${url}"`)
}
\`\`\`

## 2. FFmpeg - Cortar Vídeo

\`\`\`typescript
import ffmpeg from 'fluent-ffmpeg'

export async function cutVideo(
  inputPath: string,
  outputPath: string,
  startTime: number,
  endTime: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(startTime)
      .setDuration(endTime - startTime)
      .output(outputPath)
      .on('end', resolve)
      .on('error', reject)
      .run()
  })
}
\`\`\`

## 3. FFmpeg - Adicionar Legendas

\`\`\`typescript
import ffmpeg from 'fluent-ffmpeg'

export async function addSubtitles(
  videoPath: string,
  srtPath: string,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .outputOptions([
        `-vf subtitles=${srtPath}:force_style='FontName=Arial,FontSize=24,PrimaryColour=&HFFFFFF&,OutlineColour=&H000000&,BorderStyle=3'`
      ])
      .output(outputPath)
      .on('end', resolve)
      .on('error', reject)
      .run()
  })
}
\`\`\`

## 4. Groq Whisper - Transcrição Real

\`\`\`typescript
import { createGroq } from '@ai-sdk/groq'
import fs from 'fs'

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY
})

export async function transcribeAudio(
  audioPath: string,
  language: string = 'pt'
): Promise<TranscriptionResult> {
  const audioBuffer = fs.readFileSync(audioPath)
  
  // Groq Whisper API
  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: createFormData(audioBuffer, language)
  })
  
  const result = await response.json()
  
  return {
    text: result.text,
    segments: result.segments,
    language: result.language
  }
}
\`\`\`

## 5. Vercel Blob - Upload de Vídeos

\`\`\`typescript
import { put } from '@vercel/blob'

export async function uploadVideoToBlob(
  filePath: string,
  filename: string
): Promise<string> {
  const fileBuffer = fs.readFileSync(filePath)
  
  const blob = await put(filename, fileBuffer, {
    access: 'public',
    contentType: 'video/mp4'
  })
  
  return blob.url
}
\`\`\`

## 6. Integração Completa

\`\`\`typescript
// lib/video/queue.ts - Versão Produção

export async function processVideoJob(projectId: string, youtubeUrl: string) {
  const logger = new ProcessingLogger(projectId)
  
  try {
    await logger.initializeSteps()
    
    // 1. Download
    await logger.updateStep(1, 'processing', 'Baixando vídeo...')
    const videoPath = `/tmp/${projectId}.mp4`
    await downloadVideo(youtubeUrl, videoPath)
    await logger.updateStep(1, 'completed', 'Download concluído')
    
    // 2. Extrair áudio
    await logger.updateStep(2, 'processing', 'Extraindo áudio...')
    const audioPath = `/tmp/${projectId}.mp3`
    await extractAudio(videoPath, audioPath)
    await logger.updateStep(2, 'completed', 'Áudio extraído')
    
    // 3. Transcrever
    await logger.updateStep(3, 'processing', 'Transcrevendo...')
    const transcription = await transcribeAudio(audioPath, 'pt')
    await logger.updateStep(3, 'completed', `${transcription.segments.length} segmentos`)
    
    // 4. Analisar
    await logger.updateStep(4, 'processing', 'Analisando conteúdo...')
    const analysis = await analyzeContentForClips(transcription.text, transcription.segments)
    await logger.updateStep(4, 'completed', `${analysis.clips.length} clips identificados`)
    
    // 5-7. Processar cada clip
    for (const clip of analysis.clips) {
      await logger.updateStep(5, 'processing', `Cortando clip: ${clip.title}`)
      const clipPath = `/tmp/${projectId}-${clip.startTime}.mp4`
      await cutVideo(videoPath, clipPath, clip.startTime, clip.endTime)
      
      await logger.updateStep(6, 'processing', 'Gerando legendas...')
      const srtPath = `/tmp/${projectId}-${clip.startTime}.srt`
      const subtitles = generateSubtitlesForClip(transcription.segments, clip.startTime, clip.endTime)
      fs.writeFileSync(srtPath, generateSRT(subtitles))
      
      await logger.updateStep(7, 'processing', 'Aplicando legendas...')
      const finalPath = `/tmp/${projectId}-${clip.startTime}-final.mp4`
      await addSubtitles(clipPath, srtPath, finalPath)
      
      // Upload
      const url = await uploadVideoToBlob(finalPath, `${projectId}/${clip.startTime}.mp4`)
      
      // Salvar no banco
      await supabase.from('clips').insert({
        project_id: projectId,
        title: clip.title,
        start_time: clip.startTime,
        end_time: clip.endTime,
        output_url: url,
        status: 'completed'
      })
    }
    
    await logger.updateStep(9, 'completed', 'Processamento finalizado!')
    
  } catch (error) {
    await logger.logError(error)
  }
}
\`\`\`

## Próximos Comandos

\`\`\`bash
# Instalar dependências
npm install ytdl-core fluent-ffmpeg @ffmpeg-installer/ffmpeg
npm install @vercel/blob
npm install groq-sdk

# Sistema (se necessário)
apt-get install ffmpeg  # Linux
brew install ffmpeg     # macOS

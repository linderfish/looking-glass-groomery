import OpenAI from 'openai';
import * as fs from 'fs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Transcribe audio file using OpenAI Whisper API
 * @param filePath - Path to audio file (OGG format from Telegram)
 * @returns Transcribed text
 * @throws Error if transcription fails
 */
export async function transcribeAudio(filePath: string): Promise<string> {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: 'whisper-1',
    });

    return transcription.text;
  } catch (error) {
    console.error('Transcription failed:', error);
    throw new Error('Transcription failed');
  }
}

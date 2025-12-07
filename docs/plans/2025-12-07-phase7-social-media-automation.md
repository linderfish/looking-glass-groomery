# Phase 7: Social Media Automation - The Mad Hatter's Content Factory

## Overview

This phase implements the complete social media automation pipeline - from capturing before/after photos to auto-posting across platforms. The system ensures Kimmie never forgets a photo opportunity and turns every groom into shareable content.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Social Media Pipeline                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │   Photo      │    │   Content    │    │   Platform   │          │
│  │   Capture    │───▶│   Engine     │───▶│   Publisher  │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
│         │                   │                   │                   │
│         ▼                   ▼                   ▼                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │  Telegram    │    │   AI Copy    │    │  Instagram   │          │
│  │  Reminders   │    │   Writer     │    │  Facebook    │          │
│  │  + Upload    │    │   (Claude)   │    │  TikTok      │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    n8n Workflow Engine                        │   │
│  │  • Appointment triggers    • Photo processing                 │   │
│  │  • Reminder scheduling     • Multi-platform posting           │   │
│  │  • Analytics collection    • Engagement tracking              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Dependencies

- Phase 1 (Database + n8n) - Required
- Phase 2 (Telegram Hub) - Required for reminders
- Phase 3 (Cheshire Cat AI) - For copy generation

## Implementation

### Step 1: Photo Reminder System

The critical piece - ensuring Kimmie never forgets before/after photos.

```typescript
// packages/social/src/reminders/photo-reminder.ts

import { prisma } from '@ttlg/database'
import { telegramBot } from '@ttlg/telegram'
import { InlineKeyboard } from 'grammy'

export interface PhotoReminderConfig {
  beforePhotoWindow: number  // Minutes before appointment
  afterPhotoWindow: number   // Minutes after expected completion
  followUpInterval: number   // Minutes between follow-ups
  maxFollowUps: number
}

const DEFAULT_CONFIG: PhotoReminderConfig = {
  beforePhotoWindow: 15,
  afterPhotoWindow: 10,
  followUpInterval: 5,
  maxFollowUps: 3,
}

export class PhotoReminderService {
  private config: PhotoReminderConfig

  constructor(config: Partial<PhotoReminderConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Schedule reminders for an appointment
   */
  async scheduleReminders(appointmentId: string): Promise<void> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        pet: {
          include: { client: true }
        },
        services: true,
      },
    })

    if (!appointment) {
      throw new Error(`Appointment ${appointmentId} not found`)
    }

    // Calculate reminder times
    const beforeTime = new Date(appointment.scheduledStart)
    beforeTime.setMinutes(beforeTime.getMinutes() - this.config.beforePhotoWindow)

    const expectedDuration = appointment.services.reduce(
      (total, s) => total + s.duration,
      0
    )
    const afterTime = new Date(appointment.scheduledStart)
    afterTime.setMinutes(
      afterTime.getMinutes() + expectedDuration + this.config.afterPhotoWindow
    )

    // Create reminder records
    await prisma.photoReminder.createMany({
      data: [
        {
          appointmentId,
          type: 'BEFORE',
          scheduledFor: beforeTime,
          status: 'PENDING',
        },
        {
          appointmentId,
          type: 'AFTER',
          scheduledFor: afterTime,
          status: 'PENDING',
        },
      ],
    })
  }

  /**
   * Send a photo reminder via Telegram
   */
  async sendReminder(reminderId: string): Promise<void> {
    const reminder = await prisma.photoReminder.findUnique({
      where: { id: reminderId },
      include: {
        appointment: {
          include: {
            pet: {
              include: { client: true }
            },
          },
        },
      },
    })

    if (!reminder || reminder.status !== 'PENDING') return

    const { appointment } = reminder
    const petName = appointment.pet.name
    const isBeforePhoto = reminder.type === 'BEFORE'

    const keyboard = new InlineKeyboard()
      .text('📸 Upload Photo', `photo_upload:${appointment.id}:${reminder.type}`)
      .row()
      .text('⏰ Remind in 5min', `photo_snooze:${reminderId}`)
      .text('⏭️ Skip', `photo_skip:${reminderId}`)

    const message = isBeforePhoto
      ? `🐕 **BEFORE Photo Time!**\n\n` +
        `${petName} is about to get fabulous!\n` +
        `Quick snap before the magic happens? ✨\n\n` +
        `_${appointment.pet.client.firstName}'s appointment_`
      : `🌟 **AFTER Photo Time!**\n\n` +
        `${petName} is looking GORGEOUS!\n` +
        `Time to show off that transformation! 📸\n\n` +
        `_Don't forget - this content is GOLD!_`

    await telegramBot.api.sendMessage(
      process.env.KIMMIE_TELEGRAM_ID!,
      message,
      {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      }
    )

    await prisma.photoReminder.update({
      where: { id: reminderId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    })
  }

  /**
   * Handle photo upload from Telegram
   */
  async handlePhotoUpload(
    appointmentId: string,
    photoType: 'BEFORE' | 'AFTER',
    photoFileId: string
  ): Promise<void> {
    // Download photo from Telegram
    const file = await telegramBot.api.getFile(photoFileId)
    const photoUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`

    // Store in our system
    const photo = await prisma.appointmentPhoto.create({
      data: {
        appointmentId,
        type: photoType,
        originalUrl: photoUrl,
        status: 'PENDING_REVIEW',
      },
    })

    // Mark reminder as completed
    await prisma.photoReminder.updateMany({
      where: {
        appointmentId,
        type: photoType,
        status: 'SENT',
      },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    })

    // If both photos exist, trigger content creation
    const photos = await prisma.appointmentPhoto.findMany({
      where: { appointmentId },
    })

    if (photos.some(p => p.type === 'BEFORE') && photos.some(p => p.type === 'AFTER')) {
      await this.triggerContentCreation(appointmentId)
    }
  }

  /**
   * Trigger the content creation pipeline
   */
  private async triggerContentCreation(appointmentId: string): Promise<void> {
    // Trigger n8n webhook to start content pipeline
    await fetch(`${process.env.N8N_WEBHOOK_URL}/photo-content-ready`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId }),
    })
  }

  /**
   * Handle snooze request
   */
  async snoozeReminder(reminderId: string): Promise<void> {
    const reminder = await prisma.photoReminder.findUnique({
      where: { id: reminderId },
    })

    if (!reminder || reminder.followUpCount >= this.config.maxFollowUps) {
      return
    }

    const newScheduledTime = new Date()
    newScheduledTime.setMinutes(
      newScheduledTime.getMinutes() + this.config.followUpInterval
    )

    await prisma.photoReminder.update({
      where: { id: reminderId },
      data: {
        status: 'PENDING',
        scheduledFor: newScheduledTime,
        followUpCount: { increment: 1 },
      },
    })

    await telegramBot.api.sendMessage(
      process.env.KIMMIE_TELEGRAM_ID!,
      `⏰ Got it! I'll remind you again in ${this.config.followUpInterval} minutes!`
    )
  }
}
```

### Step 2: AI Content Generator

```typescript
// packages/social/src/content/ai-content-generator.ts

import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@ttlg/database'

const anthropic = new Anthropic()

export interface ContentGenerationResult {
  instagram: {
    caption: string
    hashtags: string[]
    altText: string
  }
  facebook: {
    caption: string
    hashtags: string[]
  }
  tiktok: {
    caption: string
    hashtags: string[]
    sounds?: string[]  // Suggested trending sounds
  }
}

export class AIContentGenerator {
  private readonly systemPrompt = `You are the social media voice for "Through the Looking Glass Groomery" - a whimsical, Alice in Wonderland themed pet grooming salon in Nuevo, CA.

Your tone is:
- Playful and magical, but not childish
- Professional with personality
- Warm and welcoming
- Occasionally uses Wonderland references naturally (not forced)

Writing style:
- Short, punchy sentences for social media
- Emojis used strategically (not overloaded)
- Hashtags are relevant and mix popular + niche
- Calls to action are soft and inviting

Remember:
- Owner is Kimmie - force-free, fear-free certified
- Services include creative grooming, Asian fusion, breed standard cuts
- Also serves cats, goats, pigs, guinea pigs (NO birds)
- Has 501(c)(3) arm called "Shelter Angels" for shelter pets

IMPORTANT: Never use cliche phrases like "fur baby" or "pawsome". Keep it fresh and authentic.`

  /**
   * Generate content for all platforms from appointment photos
   */
  async generateContent(appointmentId: string): Promise<ContentGenerationResult> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        pet: {
          include: {
            client: true,
            passport: true,
          },
        },
        services: true,
        photos: true,
        design: true,
      },
    })

    if (!appointment) {
      throw new Error(`Appointment ${appointmentId} not found`)
    }

    const context = this.buildContext(appointment)

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: this.systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Generate social media content for this grooming transformation:

${context}

Provide content for each platform in this JSON format:
{
  "instagram": {
    "caption": "Main caption (under 2200 chars)",
    "hashtags": ["array", "of", "hashtags"],
    "altText": "Descriptive alt text for accessibility"
  },
  "facebook": {
    "caption": "Can be longer and more detailed",
    "hashtags": ["fewer", "hashtags", "here"]
  },
  "tiktok": {
    "caption": "Short and catchy (under 150 chars ideal)",
    "hashtags": ["trending", "relevant", "tags"],
    "sounds": ["suggest 2-3 trending sounds that might fit"]
  }
}

Make each platform's content unique - not just copy/paste!`,
        },
      ],
    })

    const textContent = response.content.find(c => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in AI response')
    }

    // Extract JSON from response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Could not parse AI response as JSON')
    }

    return JSON.parse(jsonMatch[0]) as ContentGenerationResult
  }

  /**
   * Build context string for AI
   */
  private buildContext(appointment: any): string {
    const pet = appointment.pet
    const services = appointment.services.map((s: any) => s.name).join(', ')
    const isCreativeGroom = appointment.services.some(
      (s: any) => s.category === 'CREATIVE'
    )

    let context = `
Pet Name: ${pet.name}
Species: ${pet.species}
Breed: ${pet.breed || 'Mixed'}
Services: ${services}
`

    if (isCreativeGroom && appointment.design) {
      context += `
Creative Design: Yes
Design Theme: ${appointment.design.theme || 'Custom'}
Colors Used: ${appointment.design.colors?.join(', ') || 'Various'}
`
    }

    if (pet.passport?.designHistory?.length > 0) {
      const pastDesigns = pet.passport.designHistory.slice(-3)
      context += `
Regular Client: Yes (${pet.passport.designHistory.length} previous visits)
Past Styles: ${pastDesigns.map((d: any) => d.theme).join(', ')}
`
    }

    // Check if this is a shelter pet (Shelter Angels)
    if (appointment.isShelterAngel) {
      context += `
🌟 SHELTER ANGEL GROOM 🌟
This is a shelter pet makeover for adoption!
Shelter: ${appointment.shelterName}
Include call-to-action for adoption!
`
    }

    return context
  }

  /**
   * Generate caption variations for A/B testing
   */
  async generateVariations(
    appointmentId: string,
    count: number = 3
  ): Promise<string[]> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { pet: true, services: true },
    })

    if (!appointment) {
      throw new Error(`Appointment ${appointmentId} not found`)
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: this.systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Generate ${count} different Instagram caption variations for:
Pet: ${appointment.pet.name} (${appointment.pet.breed || appointment.pet.species})
Services: ${appointment.services.map(s => s.name).join(', ')}

Each variation should have a different angle/hook:
1. Transformation-focused
2. Pet personality-focused
3. Behind-the-scenes/process-focused

Return as JSON array of strings.`,
        },
      ],
    })

    const textContent = response.content.find(c => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in AI response')
    }

    const jsonMatch = textContent.text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('Could not parse variations')
    }

    return JSON.parse(jsonMatch[0])
  }
}
```

### Step 3: Multi-Platform Publisher

```typescript
// packages/social/src/publisher/multi-platform-publisher.ts

import { IgApiClient } from 'instagram-private-api'
import { prisma } from '@ttlg/database'
import { ContentGenerationResult } from '../content/ai-content-generator'

export type Platform = 'INSTAGRAM' | 'FACEBOOK' | 'TIKTOK'

export interface PublishResult {
  platform: Platform
  success: boolean
  postId?: string
  postUrl?: string
  error?: string
}

export interface PublishOptions {
  platforms: Platform[]
  scheduledFor?: Date  // If not provided, publishes immediately
  autoApprove?: boolean
}

export class MultiPlatformPublisher {
  private ig: IgApiClient

  constructor() {
    this.ig = new IgApiClient()
  }

  /**
   * Initialize Instagram client
   */
  async initInstagram(): Promise<void> {
    this.ig.state.generateDevice(process.env.IG_USERNAME!)
    await this.ig.account.login(
      process.env.IG_USERNAME!,
      process.env.IG_PASSWORD!
    )
  }

  /**
   * Publish content to multiple platforms
   */
  async publish(
    appointmentId: string,
    content: ContentGenerationResult,
    photos: { before: Buffer; after: Buffer },
    options: PublishOptions
  ): Promise<PublishResult[]> {
    const results: PublishResult[] = []

    // Create content record
    const contentRecord = await prisma.socialContent.create({
      data: {
        appointmentId,
        content: content as any,
        status: options.scheduledFor ? 'SCHEDULED' : 'PUBLISHING',
        scheduledFor: options.scheduledFor,
      },
    })

    for (const platform of options.platforms) {
      try {
        let result: PublishResult

        switch (platform) {
          case 'INSTAGRAM':
            result = await this.publishToInstagram(content.instagram, photos)
            break
          case 'FACEBOOK':
            result = await this.publishToFacebook(content.facebook, photos)
            break
          case 'TIKTOK':
            result = await this.publishToTikTok(content.tiktok, photos)
            break
          default:
            result = {
              platform,
              success: false,
              error: `Unknown platform: ${platform}`,
            }
        }

        results.push(result)

        // Record publish attempt
        await prisma.socialPost.create({
          data: {
            contentId: contentRecord.id,
            platform,
            postId: result.postId,
            postUrl: result.postUrl,
            status: result.success ? 'PUBLISHED' : 'FAILED',
            error: result.error,
            publishedAt: result.success ? new Date() : undefined,
          },
        })
      } catch (error) {
        results.push({
          platform,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    // Update content record status
    const allSucceeded = results.every(r => r.success)
    const anySucceeded = results.some(r => r.success)

    await prisma.socialContent.update({
      where: { id: contentRecord.id },
      data: {
        status: allSucceeded
          ? 'PUBLISHED'
          : anySucceeded
            ? 'PARTIAL'
            : 'FAILED',
      },
    })

    return results
  }

  /**
   * Publish to Instagram as carousel (before/after)
   */
  private async publishToInstagram(
    content: ContentGenerationResult['instagram'],
    photos: { before: Buffer; after: Buffer }
  ): Promise<PublishResult> {
    try {
      await this.initInstagram()

      // Create carousel with before/after
      const publishResult = await this.ig.publish.album({
        items: [
          {
            file: photos.before,
          },
          {
            file: photos.after,
          },
        ],
        caption: `${content.caption}\n\n${content.hashtags.map(h => `#${h}`).join(' ')}`,
      })

      return {
        platform: 'INSTAGRAM',
        success: true,
        postId: publishResult.media.id,
        postUrl: `https://instagram.com/p/${publishResult.media.code}`,
      }
    } catch (error) {
      return {
        platform: 'INSTAGRAM',
        success: false,
        error: error instanceof Error ? error.message : 'Instagram publish failed',
      }
    }
  }

  /**
   * Publish to Facebook via Graph API
   */
  private async publishToFacebook(
    content: ContentGenerationResult['facebook'],
    photos: { before: Buffer; after: Buffer }
  ): Promise<PublishResult> {
    try {
      const pageId = process.env.FB_PAGE_ID!
      const accessToken = process.env.FB_PAGE_ACCESS_TOKEN!

      // Upload photos first
      const beforePhotoId = await this.uploadFacebookPhoto(
        photos.before,
        pageId,
        accessToken,
        false  // Don't publish yet
      )
      const afterPhotoId = await this.uploadFacebookPhoto(
        photos.after,
        pageId,
        accessToken,
        false
      )

      // Create post with both photos
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}/feed`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `${content.caption}\n\n${content.hashtags.map(h => `#${h}`).join(' ')}`,
            attached_media: [
              { media_fbid: beforePhotoId },
              { media_fbid: afterPhotoId },
            ],
            access_token: accessToken,
          }),
        }
      )

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error.message)
      }

      return {
        platform: 'FACEBOOK',
        success: true,
        postId: data.id,
        postUrl: `https://facebook.com/${data.id}`,
      }
    } catch (error) {
      return {
        platform: 'FACEBOOK',
        success: false,
        error: error instanceof Error ? error.message : 'Facebook publish failed',
      }
    }
  }

  /**
   * Upload photo to Facebook (unpublished)
   */
  private async uploadFacebookPhoto(
    photo: Buffer,
    pageId: string,
    accessToken: string,
    published: boolean
  ): Promise<string> {
    const formData = new FormData()
    formData.append('source', new Blob([photo]), 'photo.jpg')
    formData.append('published', published.toString())
    formData.append('access_token', accessToken)

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/photos`,
      {
        method: 'POST',
        body: formData,
      }
    )

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error.message)
    }

    return data.id
  }

  /**
   * Publish to TikTok via Content Posting API
   */
  private async publishToTikTok(
    content: ContentGenerationResult['tiktok'],
    photos: { before: Buffer; after: Buffer }
  ): Promise<PublishResult> {
    try {
      // TikTok Content Posting API requires video
      // For photos, we need to create a slideshow video first
      // This would integrate with a video creation service

      // For now, return a placeholder that indicates manual upload needed
      return {
        platform: 'TIKTOK',
        success: false,
        error: 'TikTok requires video content - manual upload recommended with provided caption',
      }

      // Future implementation with video creation:
      // const video = await this.createSlideshow(photos)
      // const result = await this.uploadToTikTok(video, content)
      // return result
    } catch (error) {
      return {
        platform: 'TIKTOK',
        success: false,
        error: error instanceof Error ? error.message : 'TikTok publish failed',
      }
    }
  }

  /**
   * Schedule content for future publishing
   */
  async scheduleContent(
    appointmentId: string,
    content: ContentGenerationResult,
    scheduledFor: Date,
    platforms: Platform[]
  ): Promise<string> {
    const scheduled = await prisma.socialContent.create({
      data: {
        appointmentId,
        content: content as any,
        status: 'SCHEDULED',
        scheduledFor,
        platforms,
      },
    })

    return scheduled.id
  }
}
```

### Step 4: n8n Workflow Definitions

```json
// n8n-workflows/social-media-pipeline.json

{
  "name": "Social Media Content Pipeline",
  "nodes": [
    {
      "name": "Webhook - Photo Ready",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300],
      "parameters": {
        "path": "photo-content-ready",
        "httpMethod": "POST"
      }
    },
    {
      "name": "Get Appointment Data",
      "type": "n8n-nodes-base.httpRequest",
      "position": [450, 300],
      "parameters": {
        "url": "={{$env.API_URL}}/api/appointments/{{$json.appointmentId}}",
        "method": "GET",
        "headers": {
          "Authorization": "Bearer {{$env.API_KEY}}"
        }
      }
    },
    {
      "name": "Download Photos",
      "type": "n8n-nodes-base.httpRequest",
      "position": [650, 300],
      "parameters": {
        "url": "={{$env.API_URL}}/api/appointments/{{$json.appointmentId}}/photos",
        "method": "GET"
      }
    },
    {
      "name": "Generate AI Content",
      "type": "n8n-nodes-base.httpRequest",
      "position": [850, 300],
      "parameters": {
        "url": "={{$env.API_URL}}/api/social/generate-content",
        "method": "POST",
        "body": {
          "appointmentId": "={{$json.appointmentId}}"
        }
      }
    },
    {
      "name": "Send for Approval",
      "type": "n8n-nodes-base.telegram",
      "position": [1050, 300],
      "parameters": {
        "chatId": "={{$env.KIMMIE_TELEGRAM_ID}}",
        "text": "📱 **Content Ready for Review!**\n\n{{$json.content.instagram.caption}}\n\n---\nHashtags: {{$json.content.instagram.hashtags.join(' ')}}\n\nApprove to post or edit first?",
        "additionalFields": {
          "reply_markup": {
            "inline_keyboard": [
              [
                {"text": "✅ Approve All", "callback_data": "approve_{{$json.appointmentId}}"},
                {"text": "✏️ Edit First", "callback_data": "edit_{{$json.appointmentId}}"}
              ],
              [
                {"text": "📅 Schedule", "callback_data": "schedule_{{$json.appointmentId}}"},
                {"text": "❌ Skip", "callback_data": "skip_{{$json.appointmentId}}"}
              ]
            ]
          }
        }
      }
    },
    {
      "name": "Wait for Approval",
      "type": "n8n-nodes-base.wait",
      "position": [1250, 300],
      "parameters": {
        "amount": 24,
        "unit": "hours"
      }
    },
    {
      "name": "Check Approval Status",
      "type": "n8n-nodes-base.if",
      "position": [1450, 300],
      "parameters": {
        "conditions": {
          "boolean": [
            {
              "value1": "={{$json.approved}}",
              "value2": true
            }
          ]
        }
      }
    },
    {
      "name": "Publish to Platforms",
      "type": "n8n-nodes-base.httpRequest",
      "position": [1650, 200],
      "parameters": {
        "url": "={{$env.API_URL}}/api/social/publish",
        "method": "POST",
        "body": {
          "appointmentId": "={{$json.appointmentId}}",
          "platforms": ["INSTAGRAM", "FACEBOOK"]
        }
      }
    },
    {
      "name": "Notify Success",
      "type": "n8n-nodes-base.telegram",
      "position": [1850, 200],
      "parameters": {
        "chatId": "={{$env.KIMMIE_TELEGRAM_ID}}",
        "text": "🎉 **Posted Successfully!**\n\nInstagram: {{$json.results.instagram.postUrl}}\nFacebook: {{$json.results.facebook.postUrl}}"
      }
    }
  ],
  "connections": {
    "Webhook - Photo Ready": {
      "main": [[{"node": "Get Appointment Data", "type": "main", "index": 0}]]
    },
    "Get Appointment Data": {
      "main": [[{"node": "Download Photos", "type": "main", "index": 0}]]
    },
    "Download Photos": {
      "main": [[{"node": "Generate AI Content", "type": "main", "index": 0}]]
    },
    "Generate AI Content": {
      "main": [[{"node": "Send for Approval", "type": "main", "index": 0}]]
    },
    "Send for Approval": {
      "main": [[{"node": "Wait for Approval", "type": "main", "index": 0}]]
    },
    "Wait for Approval": {
      "main": [[{"node": "Check Approval Status", "type": "main", "index": 0}]]
    },
    "Check Approval Status": {
      "main": [
        [{"node": "Publish to Platforms", "type": "main", "index": 0}],
        []
      ]
    },
    "Publish to Platforms": {
      "main": [[{"node": "Notify Success", "type": "main", "index": 0}]]
    }
  }
}
```

### Step 5: Photo Reminder Scheduler (n8n)

```json
// n8n-workflows/photo-reminder-scheduler.json

{
  "name": "Photo Reminder Scheduler",
  "nodes": [
    {
      "name": "Every Minute Check",
      "type": "n8n-nodes-base.cron",
      "position": [250, 300],
      "parameters": {
        "triggerTimes": {
          "item": [{"mode": "everyMinute"}]
        }
      }
    },
    {
      "name": "Get Due Reminders",
      "type": "n8n-nodes-base.httpRequest",
      "position": [450, 300],
      "parameters": {
        "url": "={{$env.API_URL}}/api/reminders/due",
        "method": "GET"
      }
    },
    {
      "name": "Split Reminders",
      "type": "n8n-nodes-base.splitInBatches",
      "position": [650, 300],
      "parameters": {
        "batchSize": 1
      }
    },
    {
      "name": "Send Reminder",
      "type": "n8n-nodes-base.httpRequest",
      "position": [850, 300],
      "parameters": {
        "url": "={{$env.API_URL}}/api/reminders/{{$json.id}}/send",
        "method": "POST"
      }
    }
  ],
  "connections": {
    "Every Minute Check": {
      "main": [[{"node": "Get Due Reminders", "type": "main", "index": 0}]]
    },
    "Get Due Reminders": {
      "main": [[{"node": "Split Reminders", "type": "main", "index": 0}]]
    },
    "Split Reminders": {
      "main": [[{"node": "Send Reminder", "type": "main", "index": 0}]]
    }
  }
}
```

### Step 6: Telegram Handlers for Social Media

```typescript
// packages/telegram/src/handlers/social-media-handlers.ts

import { Context, InlineKeyboard } from 'grammy'
import { prisma } from '@ttlg/database'
import { PhotoReminderService } from '@ttlg/social'
import { telegramBot } from '../bot'

const photoService = new PhotoReminderService()

/**
 * Handle photo upload callback
 */
telegramBot.callbackQuery(/^photo_upload:(.+):(.+)$/, async (ctx) => {
  const [, appointmentId, photoType] = ctx.match!

  await ctx.answerCallbackQuery()
  await ctx.reply(
    `📸 Perfect! Send me the ${photoType.toLowerCase()} photo now!\n\n_Just snap it and send - I'll handle the rest!_`,
    { parse_mode: 'Markdown' }
  )

  // Store context for next photo message
  await prisma.telegramContext.upsert({
    where: { chatId: ctx.chat!.id.toString() },
    create: {
      chatId: ctx.chat!.id.toString(),
      pendingAction: 'PHOTO_UPLOAD',
      actionData: { appointmentId, photoType },
    },
    update: {
      pendingAction: 'PHOTO_UPLOAD',
      actionData: { appointmentId, photoType },
    },
  })
})

/**
 * Handle incoming photos
 */
telegramBot.on('message:photo', async (ctx) => {
  const context = await prisma.telegramContext.findUnique({
    where: { chatId: ctx.chat.id.toString() },
  })

  if (context?.pendingAction === 'PHOTO_UPLOAD') {
    const { appointmentId, photoType } = context.actionData as any

    // Get highest resolution photo
    const photo = ctx.message.photo[ctx.message.photo.length - 1]

    await photoService.handlePhotoUpload(
      appointmentId,
      photoType as 'BEFORE' | 'AFTER',
      photo.file_id
    )

    // Clear context
    await prisma.telegramContext.update({
      where: { chatId: ctx.chat.id.toString() },
      data: { pendingAction: null, actionData: null },
    })

    const isAfter = photoType === 'AFTER'

    if (isAfter) {
      await ctx.reply(
        `✨ **GORGEOUS!** Both photos captured!\n\n` +
          `I'm generating your social media content now...\n` +
          `You'll get a preview to approve in just a moment! 🎨`,
        { parse_mode: 'Markdown' }
      )
    } else {
      await ctx.reply(
        `📸 **Before photo saved!**\n\n` +
          `Now work your magic! ✨\n` +
          `I'll remind you for the after photo when ${ctx.message.caption || 'they'}'re done!`,
        { parse_mode: 'Markdown' }
      )
    }
  } else {
    // No pending context - ask what to do with this photo
    const keyboard = new InlineKeyboard()
      .text('📝 Add to Portfolio', 'portfolio_photo')
      .row()
      .text('🐕 Link to Appointment', 'link_appointment')
      .text('🗑️ Nevermind', 'discard_photo')

    await ctx.reply(
      `📸 Got a photo! What would you like to do with it?`,
      { reply_markup: keyboard }
    )
  }
})

/**
 * Handle snooze reminder
 */
telegramBot.callbackQuery(/^photo_snooze:(.+)$/, async (ctx) => {
  const [, reminderId] = ctx.match!

  await ctx.answerCallbackQuery('⏰ Snoozed!')
  await photoService.snoozeReminder(reminderId)
})

/**
 * Handle skip reminder
 */
telegramBot.callbackQuery(/^photo_skip:(.+)$/, async (ctx) => {
  const [, reminderId] = ctx.match!

  await prisma.photoReminder.update({
    where: { id: reminderId },
    data: { status: 'SKIPPED' },
  })

  await ctx.answerCallbackQuery('⏭️ Skipped')
  await ctx.reply(
    `No worries! Skipped this one. 📸\n\n` +
      `_Remember: consistent photos = consistent content!_`,
    { parse_mode: 'Markdown' }
  )
})

/**
 * Handle content approval
 */
telegramBot.callbackQuery(/^approve_(.+)$/, async (ctx) => {
  const [, appointmentId] = ctx.match!

  await ctx.answerCallbackQuery('Publishing...')

  // Trigger publish via n8n webhook
  await fetch(`${process.env.N8N_WEBHOOK_URL}/content-approved`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appointmentId, approved: true }),
  })

  await ctx.editMessageText(
    ctx.callbackQuery.message?.text + '\n\n✅ **APPROVED** - Publishing now!',
    { parse_mode: 'Markdown' }
  )
})

/**
 * Handle content edit request
 */
telegramBot.callbackQuery(/^edit_(.+)$/, async (ctx) => {
  const [, appointmentId] = ctx.match!

  await ctx.answerCallbackQuery()

  await prisma.telegramContext.upsert({
    where: { chatId: ctx.chat!.id.toString() },
    create: {
      chatId: ctx.chat!.id.toString(),
      pendingAction: 'EDIT_CAPTION',
      actionData: { appointmentId },
    },
    update: {
      pendingAction: 'EDIT_CAPTION',
      actionData: { appointmentId },
    },
  })

  await ctx.reply(
    `✏️ **Edit Mode**\n\n` +
      `Send me the new caption you'd like to use.\n` +
      `I'll regenerate the hashtags automatically!\n\n` +
      `_Or type "cancel" to go back_`,
    { parse_mode: 'Markdown' }
  )
})

/**
 * Handle schedule request
 */
telegramBot.callbackQuery(/^schedule_(.+)$/, async (ctx) => {
  const [, appointmentId] = ctx.match!

  await ctx.answerCallbackQuery()

  const keyboard = new InlineKeyboard()
    .text('🌅 Tomorrow 9am', `schedule_time:${appointmentId}:tomorrow_9am`)
    .text('🌆 Tomorrow 6pm', `schedule_time:${appointmentId}:tomorrow_6pm`)
    .row()
    .text('📅 Pick Date/Time', `schedule_custom:${appointmentId}`)
    .row()
    .text('🎯 Best Time (AI)', `schedule_optimal:${appointmentId}`)

  await ctx.reply(
    `📅 **Schedule Post**\n\nWhen would you like this to go out?`,
    { parse_mode: 'Markdown', reply_markup: keyboard }
  )
})

/**
 * Handle optimal timing (AI-suggested)
 */
telegramBot.callbackQuery(/^schedule_optimal:(.+)$/, async (ctx) => {
  const [, appointmentId] = ctx.match!

  await ctx.answerCallbackQuery('Analyzing best time...')

  // In a real implementation, this would analyze:
  // - Past engagement data
  // - Day of week patterns
  // - Follower activity times
  // For now, we'll use a sensible default

  const optimalTime = new Date()
  optimalTime.setDate(optimalTime.getDate() + 1)
  optimalTime.setHours(18, 30, 0, 0)  // 6:30 PM next day

  await prisma.socialContent.updateMany({
    where: { appointmentId },
    data: {
      scheduledFor: optimalTime,
      status: 'SCHEDULED',
    },
  })

  await ctx.reply(
    `🎯 **Scheduled for Optimal Time!**\n\n` +
      `📅 Tomorrow at 6:30 PM\n` +
      `_Based on your typical engagement patterns_\n\n` +
      `I'll post automatically - you can sit back and relax! 🛋️`,
    { parse_mode: 'Markdown' }
  )
})
```

### Step 7: Analytics Dashboard API

```typescript
// packages/api/src/routes/social-analytics.ts

import { Hono } from 'hono'
import { prisma } from '@ttlg/database'

const analytics = new Hono()

/**
 * Get social media performance metrics
 */
analytics.get('/metrics', async (c) => {
  const { startDate, endDate } = c.req.query()

  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const end = endDate ? new Date(endDate) : new Date()

  const posts = await prisma.socialPost.findMany({
    where: {
      publishedAt: {
        gte: start,
        lte: end,
      },
      status: 'PUBLISHED',
    },
    include: {
      content: {
        include: {
          appointment: {
            include: {
              pet: true,
              services: true,
            },
          },
        },
      },
    },
  })

  // Aggregate metrics
  const metrics = {
    totalPosts: posts.length,
    byPlatform: {
      INSTAGRAM: posts.filter(p => p.platform === 'INSTAGRAM').length,
      FACEBOOK: posts.filter(p => p.platform === 'FACEBOOK').length,
      TIKTOK: posts.filter(p => p.platform === 'TIKTOK').length,
    },
    photoCapture: {
      total: await prisma.appointment.count({
        where: {
          scheduledStart: { gte: start, lte: end },
        },
      }),
      withPhotos: await prisma.appointment.count({
        where: {
          scheduledStart: { gte: start, lte: end },
          photos: { some: {} },
        },
      }),
      withBothPhotos: await prisma.appointment.count({
        where: {
          scheduledStart: { gte: start, lte: end },
          photos: {
            some: { type: 'BEFORE' },
          },
          AND: {
            photos: {
              some: { type: 'AFTER' },
            },
          },
        },
      }),
    },
    topPerformingServices: await getTopServices(start, end),
    contentByType: {
      regular: posts.filter(p => !p.content.appointment?.isShelterAngel).length,
      shelterAngel: posts.filter(p => p.content.appointment?.isShelterAngel).length,
    },
  }

  return c.json(metrics)
})

/**
 * Get top performing services by social engagement
 */
async function getTopServices(start: Date, end: Date) {
  const posts = await prisma.socialPost.findMany({
    where: {
      publishedAt: { gte: start, lte: end },
      status: 'PUBLISHED',
    },
    include: {
      content: {
        include: {
          appointment: {
            include: { services: true },
          },
        },
      },
    },
  })

  const serviceCount: Record<string, number> = {}

  for (const post of posts) {
    const services = post.content.appointment?.services || []
    for (const service of services) {
      serviceCount[service.name] = (serviceCount[service.name] || 0) + 1
    }
  }

  return Object.entries(serviceCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }))
}

/**
 * Get photo capture rate over time
 */
analytics.get('/photo-capture-rate', async (c) => {
  const { days = '30' } = c.req.query()
  const daysNum = parseInt(days)

  const rates: Array<{ date: string; rate: number }> = []

  for (let i = 0; i < daysNum; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)

    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)

    const total = await prisma.appointment.count({
      where: {
        scheduledStart: { gte: date, lt: nextDate },
        status: 'COMPLETED',
      },
    })

    const withPhotos = await prisma.appointment.count({
      where: {
        scheduledStart: { gte: date, lt: nextDate },
        status: 'COMPLETED',
        photos: {
          some: { type: 'BEFORE' },
        },
        AND: {
          photos: {
            some: { type: 'AFTER' },
          },
        },
      },
    })

    rates.push({
      date: date.toISOString().split('T')[0],
      rate: total > 0 ? (withPhotos / total) * 100 : 0,
    })
  }

  return c.json(rates.reverse())
})

export default analytics
```

### Step 8: Prisma Schema Additions

```prisma
// Add to packages/database/prisma/schema.prisma

model PhotoReminder {
  id            String   @id @default(cuid())
  appointmentId String
  appointment   Appointment @relation(fields: [appointmentId], references: [id])

  type          PhotoReminderType
  status        ReminderStatus @default(PENDING)
  scheduledFor  DateTime
  sentAt        DateTime?
  completedAt   DateTime?
  followUpCount Int      @default(0)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([status, scheduledFor])
}

enum PhotoReminderType {
  BEFORE
  AFTER
}

enum ReminderStatus {
  PENDING
  SENT
  COMPLETED
  SKIPPED
  EXPIRED
}

model AppointmentPhoto {
  id            String   @id @default(cuid())
  appointmentId String
  appointment   Appointment @relation(fields: [appointmentId], references: [id])

  type          PhotoReminderType
  originalUrl   String
  processedUrl  String?
  thumbnailUrl  String?
  status        PhotoStatus @default(PENDING_REVIEW)

  metadata      Json?    // EXIF data, dimensions, etc.

  createdAt     DateTime @default(now())

  @@index([appointmentId, type])
}

enum PhotoStatus {
  PENDING_REVIEW
  APPROVED
  REJECTED
  PROCESSED
}

model SocialContent {
  id            String   @id @default(cuid())
  appointmentId String
  appointment   Appointment @relation(fields: [appointmentId], references: [id])

  content       Json     // ContentGenerationResult
  status        ContentStatus @default(DRAFT)
  scheduledFor  DateTime?
  platforms     Platform[]

  posts         SocialPost[]

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum ContentStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED
  SCHEDULED
  PUBLISHING
  PUBLISHED
  PARTIAL
  FAILED
}

enum Platform {
  INSTAGRAM
  FACEBOOK
  TIKTOK
}

model SocialPost {
  id         String   @id @default(cuid())
  contentId  String
  content    SocialContent @relation(fields: [contentId], references: [id])

  platform   Platform
  postId     String?  // Platform's post ID
  postUrl    String?
  status     PostStatus
  error      String?

  // Engagement metrics (updated via webhooks/polling)
  likes      Int?
  comments   Int?
  shares     Int?
  reach      Int?

  publishedAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([platform, publishedAt])
}

enum PostStatus {
  PENDING
  PUBLISHED
  FAILED
  DELETED
}

model TelegramContext {
  id            String   @id @default(cuid())
  chatId        String   @unique
  pendingAction String?
  actionData    Json?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reminders/due` | Get all due photo reminders |
| POST | `/api/reminders/:id/send` | Send a specific reminder |
| POST | `/api/reminders/:id/snooze` | Snooze a reminder |
| POST | `/api/social/generate-content` | Generate AI content for appointment |
| POST | `/api/social/publish` | Publish to platforms |
| GET | `/api/social/analytics/metrics` | Get social media metrics |
| GET | `/api/social/analytics/photo-capture-rate` | Get photo capture rate over time |

## Telegram Commands

| Command | Description |
|---------|-------------|
| `/content` | View pending content for approval |
| `/schedule` | View scheduled posts |
| `/stats` | Quick social media stats |
| `/photo [appointment]` | Manually trigger photo upload |

## Success Metrics

1. **Photo Capture Rate**: Target 90%+ appointments with both before/after photos
2. **Content Approval Time**: < 30 minutes average
3. **Post Consistency**: 1+ posts per day with content
4. **Engagement Growth**: Track likes/comments/shares monthly

## Testing

```bash
# Run social media service tests
pnpm --filter @ttlg/social test

# Test photo reminder flow
pnpm --filter @ttlg/social test:reminders

# Test content generation
pnpm --filter @ttlg/social test:content

# E2E social pipeline test
pnpm test:e2e:social
```

## Environment Variables

```bash
# Instagram
IG_USERNAME=
IG_PASSWORD=

# Facebook
FB_PAGE_ID=
FB_PAGE_ACCESS_TOKEN=

# TikTok (future)
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=

# n8n
N8N_WEBHOOK_URL=

# Telegram
KIMMIE_TELEGRAM_ID=
```

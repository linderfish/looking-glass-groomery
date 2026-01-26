// apps/cheshire/src/routes/appointment.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '@looking-glass/db'
import { updateCalendarEvent, deleteCalendarEvent } from '../services/calendar-oauth'
import { format } from 'date-fns'

const app = new Hono()

// Schema for reschedule request
const RescheduleSchema = z.object({
  appointmentId: z.string(),
  newScheduledAt: z.string().datetime(), // ISO 8601 datetime
  newDuration: z.number().optional(), // Optional - keep existing if not provided
})

/**
 * POST /appointment/reschedule
 * Reschedules an appointment and updates the Google Calendar event
 */
app.post('/reschedule', zValidator('json', RescheduleSchema), async (c) => {
  const { appointmentId, newScheduledAt, newDuration } = c.req.valid('json')

  try {
    // Get the existing appointment with related data
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        pet: true,
        client: true,
        services: true,
      },
    })

    if (!appointment) {
      return c.json({ error: 'Appointment not found' }, 404)
    }

    if (appointment.status === 'CANCELLED') {
      return c.json({ error: 'Cannot reschedule a cancelled appointment' }, 400)
    }

    const newStart = new Date(newScheduledAt)
    const duration = newDuration || appointment.duration
    const newEnd = new Date(newStart.getTime() + duration * 60000)

    // Update the appointment in database
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        scheduledAt: newStart,
        endTime: newEnd,
        duration,
      },
    })

    // Update Google Calendar if we have a linked event
    if (appointment.calendarEventId) {
      try {
        const serviceNames = appointment.services.map(s => s.name).join(', ') || 'Full Groom'
        const clientName = `${appointment.client.firstName} ${appointment.client.lastName}`.trim()

        await updateCalendarEvent(appointment.calendarEventId, {
          summary: `🐾 ${appointment.pet.name} - ${serviceNames}`,
          description: `Client: ${clientName}\nPet: ${appointment.pet.name}\nServices: ${serviceNames}\nRescheduled: ${format(new Date(), 'PPP')}\nAppointment ID: ${appointment.id}`,
          start: newStart,
          end: newEnd,
        })

        console.log(`[Appointment] ✅ Rescheduled and synced calendar: ${appointmentId}`)
      } catch (calendarError) {
        console.error(`[Appointment] ❌ Failed to update calendar event:`, calendarError)
        // Don't fail - appointment is updated in DB even if calendar sync fails
      }
    } else {
      console.log(`[Appointment] ⚠️ Rescheduled but no calendarEventId to sync: ${appointmentId}`)
    }

    return c.json({
      success: true,
      appointment: {
        id: updatedAppointment.id,
        scheduledAt: updatedAppointment.scheduledAt,
        endTime: updatedAppointment.endTime,
        calendarSynced: !!appointment.calendarEventId,
      },
    })
  } catch (error) {
    console.error('[Appointment] Reschedule error:', error)
    return c.json({
      error: error instanceof Error ? error.message : 'Failed to reschedule'
    }, 500)
  }
})

// Schema for cancel request
const CancelSchema = z.object({
  appointmentId: z.string(),
  reason: z.string().optional(),
})

/**
 * POST /appointment/cancel
 * Cancels an appointment and deletes the Google Calendar event
 */
app.post('/cancel', zValidator('json', CancelSchema), async (c) => {
  const { appointmentId, reason } = c.req.valid('json')

  try {
    // Get the existing appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        status: true,
        calendarEventId: true,
        pet: { select: { name: true } },
      },
    })

    if (!appointment) {
      return c.json({ error: 'Appointment not found' }, 404)
    }

    if (appointment.status === 'CANCELLED') {
      return c.json({ error: 'Appointment is already cancelled' }, 400)
    }

    if (appointment.status === 'COMPLETED') {
      return c.json({ error: 'Cannot cancel a completed appointment' }, 400)
    }

    // Update appointment status to CANCELLED
    const cancelledAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: reason,
      },
    })

    // Delete from Google Calendar if we have a linked event
    if (appointment.calendarEventId) {
      try {
        await deleteCalendarEvent(appointment.calendarEventId)
        console.log(`[Appointment] ✅ Cancelled and removed from calendar: ${appointmentId}`)
      } catch (calendarError) {
        console.error(`[Appointment] ❌ Failed to delete calendar event:`, calendarError)
        // Don't fail - appointment is cancelled in DB even if calendar sync fails
      }
    } else {
      console.log(`[Appointment] ⚠️ Cancelled but no calendarEventId to remove: ${appointmentId}`)
    }

    return c.json({
      success: true,
      appointment: {
        id: cancelledAppointment.id,
        status: cancelledAppointment.status,
        cancelledAt: cancelledAppointment.cancelledAt,
        calendarDeleted: !!appointment.calendarEventId,
      },
    })
  } catch (error) {
    console.error('[Appointment] Cancel error:', error)
    return c.json({
      error: error instanceof Error ? error.message : 'Failed to cancel'
    }, 500)
  }
})

export default app

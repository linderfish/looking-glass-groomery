// apps/telegram-bot/src/routes/dashboard.ts
import { Router } from 'express'
import basicAuth from 'express-basic-auth'
import { prisma } from '@looking-glass/db'
import { startOfDay, endOfDay, format } from 'date-fns'
import { getTodayRevenue, getWeekRevenue, getMonthRevenue, getYearRevenue } from '../services/stripe'
import { formatCurrency } from '../services/revenue'

export const dashboardRouter = Router()

// Protect all dashboard routes with basic auth
dashboardRouter.use(
  basicAuth({
    users: { kimmie: process.env.DASHBOARD_PASSWORD || 'lookinglass' },
    challenge: true,
    realm: 'Looking Glass Dashboard',
  })
)

// GET /dashboard/today - View today's schedule
dashboardRouter.get('/today', async (req, res) => {
  try {
    const today = new Date()
    const startOfToday = startOfDay(today)
    const endOfToday = endOfDay(today)

    // Fetch today's appointments
    const appointments = await prisma.appointment.findMany({
      where: {
        scheduledAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
        status: {
          in: ['CONFIRMED', 'PENDING', 'CHECKED_IN', 'IN_PROGRESS'],
        },
      },
      include: {
        pet: {
          include: {
            client: true,
          },
        },
        services: true,
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    })

    // Fetch photo streak
    const stats = await prisma.kimmieStats.findFirst({
      orderBy: { date: 'desc' },
    })
    const streak = stats?.photoStreak || 0

    // Build HTML
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Today's Schedule - Looking Glass</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      background: white;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 20px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    h1 {
      color: #6d28d9;
      font-size: 28px;
      margin-bottom: 8px;
    }
    .date {
      color: #64748b;
      font-size: 16px;
    }
    .streak-badge {
      display: inline-block;
      background: #f59e0b;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: bold;
      margin-top: 12px;
      font-size: 14px;
    }
    .appointment {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .appointment-time {
      color: #6d28d9;
      font-weight: bold;
      font-size: 18px;
      margin-bottom: 8px;
    }
    .pet-name {
      font-size: 20px;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 4px;
    }
    .client-info {
      color: #64748b;
      margin-bottom: 8px;
      font-size: 14px;
    }
    .services {
      color: #475569;
      font-size: 14px;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
    }
    .status {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
      margin-top: 8px;
    }
    .status-confirmed { background: #dcfce7; color: #166534; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-checked-in { background: #dbeafe; color: #1e40af; }
    .status-in-progress { background: #e0e7ff; color: #4338ca; }
    .empty {
      background: white;
      border-radius: 12px;
      padding: 40px;
      text-align: center;
      color: #64748b;
      font-size: 18px;
    }
    .nav {
      background: white;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      text-align: center;
    }
    .nav a {
      color: #6d28d9;
      text-decoration: none;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="nav">
      <a href="/dashboard/search">🔍 Search Clients</a>
      <span style="color: #e2e8f0;">|</span>
      <a href="/dashboard/revenue">💰 Revenue</a>
    </div>

    <div class="header">
      <h1>✨ Today's Schedule</h1>
      <div class="date">${format(today, 'EEEE, MMMM d, yyyy')}</div>
      ${streak > 0 ? `<div class="streak-badge">🔥 ${streak} day photo streak!</div>` : ''}
    </div>

    ${
      appointments.length === 0
        ? '<div class="empty">No appointments scheduled for today 🎉</div>'
        : appointments
            .map((apt) => {
              const statusEmoji = ({
                CONFIRMED: '✅',
                PENDING: '⏳',
                CHECKED_IN: '🚪',
                IN_PROGRESS: '✂️',
              } as Record<string, string>)[apt.status] || '📅'

              const statusClass = ({
                CONFIRMED: 'status-confirmed',
                PENDING: 'status-pending',
                CHECKED_IN: 'status-checked-in',
                IN_PROGRESS: 'status-in-progress',
              } as Record<string, string>)[apt.status] || ''

              const serviceNames = apt.services.map(s => s.name).join(', ')

              return `
        <div class="appointment">
          <div class="appointment-time">${format(apt.scheduledAt, 'h:mm a')}</div>
          <div class="pet-name">${apt.pet.name}</div>
          <div class="client-info">
            ${apt.pet.client.firstName} ${apt.pet.client.lastName} ·
            ${apt.pet.client.phone}
          </div>
          <div class="services">${serviceNames}</div>
          <span class="status ${statusClass}">${statusEmoji} ${apt.status.replace('_', ' ')}</span>
        </div>
              `
            })
            .join('')
    }
  </div>
</body>
</html>
    `

    res.send(html)
  } catch (error) {
    console.error('Dashboard /today error:', error)
    res.status(500).send('Error loading schedule')
  }
})

// GET /dashboard/search - Search clients
dashboardRouter.get('/search', async (req, res) => {
  const query = req.query.q as string | undefined

  let clients: any[] = []

  if (query && query.length > 0) {
    // Search clients by name or phone
    clients = await prisma.client.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
        ],
      },
      include: {
        pets: true,
      },
      take: 20,
      orderBy: {
        firstName: 'asc',
      },
    })
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Search Clients - Looking Glass</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      background: white;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 20px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    h1 {
      color: #6d28d9;
      font-size: 28px;
      margin-bottom: 16px;
    }
    .search-form {
      display: flex;
      gap: 8px;
    }
    input[type="text"] {
      flex: 1;
      padding: 12px 16px;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      font-size: 16px;
    }
    button {
      padding: 12px 24px;
      background: #6d28d9;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
      font-size: 16px;
    }
    button:hover {
      background: #5b21b6;
    }
    .client-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .client-name {
      font-size: 20px;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 4px;
    }
    .client-phone {
      color: #64748b;
      margin-bottom: 12px;
      font-size: 14px;
    }
    .pets {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .pet-tag {
      background: #f1f5f9;
      padding: 6px 12px;
      border-radius: 16px;
      font-size: 14px;
      color: #475569;
    }
    .empty {
      background: white;
      border-radius: 12px;
      padding: 40px;
      text-align: center;
      color: #64748b;
      font-size: 18px;
    }
    .nav {
      background: white;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      text-align: center;
    }
    .nav a {
      color: #6d28d9;
      text-decoration: none;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="nav">
      <a href="/dashboard/today">📅 Today's Schedule</a>
      <span style="color: #e2e8f0;">|</span>
      <a href="/dashboard/revenue">💰 Revenue</a>
    </div>

    <div class="header">
      <h1>🔍 Search Clients</h1>
      <form class="search-form" action="/dashboard/search" method="GET">
        <input
          type="text"
          name="q"
          placeholder="Search by name or phone..."
          value="${query || ''}"
          autofocus
        />
        <button type="submit">Search</button>
      </form>
    </div>

    ${
      !query
        ? '<div class="empty">Enter a name or phone number to search</div>'
        : clients.length === 0
        ? '<div class="empty">No clients found matching your search</div>'
        : clients
            .map((client) => {
              const petsList = client.pets
                .map((pet: any) => `<span class="pet-tag">${pet.name} (${pet.species})</span>`)
                .join('')

              return `
        <div class="client-card">
          <div class="client-name">${client.firstName} ${client.lastName}</div>
          <div class="client-phone">${client.phone}</div>
          ${petsList ? `<div class="pets">${petsList}</div>` : ''}
        </div>
              `
            })
            .join('')
    }
  </div>
</body>
</html>
  `

  res.send(html)
})

// GET /dashboard/revenue - View revenue metrics
dashboardRouter.get('/revenue', async (req, res) => {
  try {
    // Fetch all revenue metrics in parallel
    const [today, week, month, year] = await Promise.all([
      getTodayRevenue(),
      getWeekRevenue(),
      getMonthRevenue(),
      getYearRevenue(),
    ])

    const monthlyGoal = parseFloat(process.env.MONTHLY_REVENUE_GOAL || '9000')
    const percentage = Math.min((month / monthlyGoal) * 100, 100)

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Revenue Dashboard - Looking Glass</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      background: white;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 20px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    h1 {
      color: #6d28d9;
      font-size: 28px;
      margin-bottom: 8px;
    }
    .subtitle {
      color: #64748b;
      font-size: 16px;
    }
    .metric {
      background: white;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 16px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .metric-label {
      color: #64748b;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }
    .metric-amount {
      font-size: 36px;
      font-weight: bold;
      color: #10b981;
    }
    .progress-container {
      margin-top: 16px;
    }
    .progress-label {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
      color: #64748b;
    }
    .progress-bar {
      width: 100%;
      height: 24px;
      background: #e5e7eb;
      border-radius: 12px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #10b981 0%, #059669 100%);
      transition: width 0.3s ease;
      border-radius: 12px;
    }
    .goal-message {
      margin-top: 12px;
      font-size: 16px;
      font-weight: 500;
      color: ${month >= monthlyGoal ? '#059669' : '#f59e0b'};
    }
    .nav {
      background: white;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      display: flex;
      justify-content: center;
      gap: 24px;
    }
    .nav a {
      color: #6d28d9;
      text-decoration: none;
      font-weight: bold;
    }
    .nav a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="nav">
      <a href="/dashboard/today">📅 Today's Schedule</a>
      <span style="color: #e2e8f0;">|</span>
      <a href="/dashboard/search">🔍 Search Clients</a>
    </div>

    <div class="header">
      <h1>💰 Revenue Dashboard</h1>
      <div class="subtitle">Business performance at a glance</div>
    </div>

    <div class="metric">
      <div class="metric-label">Today</div>
      <div class="metric-amount">${formatCurrency(today)}</div>
    </div>

    <div class="metric">
      <div class="metric-label">This Week</div>
      <div class="metric-amount">${formatCurrency(week)}</div>
    </div>

    <div class="metric">
      <div class="metric-label">This Month</div>
      <div class="metric-amount">${formatCurrency(month)}</div>
      <div class="progress-container">
        <div class="progress-label">
          <span>Progress</span>
          <span>${percentage.toFixed(1)}% of ${formatCurrency(monthlyGoal)}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${percentage}%"></div>
        </div>
        <div class="goal-message">
          ${month >= monthlyGoal
            ? '🎉 Goal reached! Amazing work!'
            : `💪 ${formatCurrency(monthlyGoal - month)} to go!`}
        </div>
      </div>
    </div>

    <div class="metric">
      <div class="metric-label">Year to Date</div>
      <div class="metric-amount">${formatCurrency(year)}</div>
    </div>
  </div>
</body>
</html>
    `

    res.send(html)
  } catch (error) {
    console.error('Dashboard /revenue error:', error)
    res.status(500).send('Error loading revenue data - check Stripe connection')
  }
})

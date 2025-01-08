# MyCalendar

A modern, open-source meeting scheduling platform built with Next.js 14.

## Features

- 📅 Easy meeting scheduling
- 🔄 Google Calendar integration
- 🎨 Dark/Light mode
- 👥 User profiles
- 🔗 Shareable booking links
- ⚡ Real-time availability
- 🔒 Secure authentication
- 📱 Responsive design

## Tech Stack

- **Framework:** Next.js 14
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** NextAuth.js
- **Calendar API:** Nylas
- **Deployment:** Vercel

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mycalendar.git
```

2. Install dependencies:
```bash
npm install
```

3. Copy the example env file:
```bash
cp .env.example .env
```

4. Configure your environment variables

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Environment Variables

Required environment variables:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NYLAS_CLIENT_ID`
- `NYLAS_CLIENT_SECRET`

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

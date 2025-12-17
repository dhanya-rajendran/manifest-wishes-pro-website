# Manifest Wishes Pro – Website

A separate Next.js website (app router) using Tailwind CSS and shadcn/ui-inspired components, backed by MySQL via Docker and Prisma ORM.

## Features

- Home page with configurable hero image and usage copy
- Sticky, mobile-friendly navbar with Chrome extension icon
- Login and signup; protected dashboard requires authentication
- Contact page storing messages in MySQL
- Pricing page

## Getting Started

1. Start MySQL with Docker:
   - `cd website`
   - `docker compose up -d`

2. Configure environment:
   - Copy `.env.example` to `.env`
   - Update `JWT_SECRET` and `DATABASE_URL` if needed

3. Install dependencies and set up Prisma:
   - `npm install`
   - `npx prisma generate`
   - `npx prisma migrate dev --name init`

4. Run the dev server:
   - `npm run dev` and open `http://localhost:3000`

## Notes

- Components follow Tailwind/shadcn conventions. For Origin UI template patterns, reference: https://www.shadcn.io/template/origin-space-originui
- Update navbar “Add Extension” link to your Chrome Web Store listing.
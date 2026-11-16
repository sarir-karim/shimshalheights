# Deploying to Vercel

Create two Vercel projects from this repository. Use Node.js 22.x for both.

## Backend project

- Root Directory: backend
- Framework: Express (automatic detection)
- No custom build command or output directory.
- Entry point: src/app.js exports the app. MongoDB connects once per running instance and initializes indexes before requests are served.

Set these environment variables in Vercel (never commit actual secrets):

NODE_ENV=production
MONGODB_URI=<MongoDB Atlas connection string including database name>
JWT_SECRET=<random secret, at least 32 characters>
COOKIE_NAME=sh_token
COOKIE_SECURE=true
COOKIE_SAMESITE=lax
CLIENT_ORIGINS=https://<frontend-domain>
TRUST_PROXY=1
HOTEL_TIMEZONE=Asia/Karachi
CLOUDINARY_CLOUD_NAME=<cloud name>
CLOUDINARY_API_KEY=<key>
CLOUDINARY_API_SECRET=<secret>
FRONTEND_REVALIDATE_URL=https://<frontend-domain>/revalidate
REVALIDATE_SECRET=<shared random secret, at least 16 characters>

Use a MongoDB Atlas network access configuration that permits the deployed functions. Booking transactions require a replica set, which Atlas provides. Keep the API publicly reachable by the frontend server; Vercel deployment protection must not block those calls.

## Frontend project

- Root Directory: frontend
- Framework: Next.js
- Build Command: npm run build
- Output Directory: default

Environment variables:

BACKEND_URL=https://<backend-domain>
NEXT_PUBLIC_SITE_URL=https://<frontend-domain>
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_DEMO_MODE=false
ADMIN_COOKIE_NAME=sh_token
REVALIDATE_SECRET=<same secret as backend>

BACKEND_URL is the origin only: no trailing /api or slash. Browser calls use the frontend /api rewrite, so login cookies remain on the frontend domain. Keep COOKIE_NAME and ADMIN_COOKIE_NAME identical. Add every frontend domain used for admin writes to CLIENT_ORIGINS, separated by commas; preview domains must be explicitly allowed.

Deploy the backend first. Set its URL on the frontend and deploy the frontend. Then update CLIENT_ORIGINS and FRONTEND_REVALIDATE_URL on the backend with the final frontend domain and redeploy. Environment variable changes require redeployment.

## Before launch

Create the first admin by running the existing backend seed script from a trusted local terminal against the production database; inspect src/scripts/seed.js first because it may create sample content. Do not run seeding as a Vercel build command.

Check backend /api/health, frontend rooms, admin login, a content save, an image upload, and a booking request.

Vercel function request bodies have a 4.5 MB limit, including multipart overhead. Keep the combined images in a single save below 4 MB; the local 5 MB per-file upload limit does not override this platform limit. Large batches need direct-to-Cloudinary signed uploads.

The current rate limiter uses instance-local memory; for shared enforcement across Vercel instances use a persistent rate-limit store or Vercel Firewall rules. The refresh webhook currently runs after the response, so if it is interrupted the public cache still refreshes after its 60-second lifetime.

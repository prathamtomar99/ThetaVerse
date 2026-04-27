# Render Backend Environment Variables

Copy and paste these into your Render Web Service environment variables section.

## Database Variables (Render PostgreSQL)

```
SPRING_DATASOURCE_URL=postgresql://interview_prep_db_284m_user:bpopVbYjtOUItj2uBFwNqHXr7QYFWtlo@dpg-d7nhuaosfn5c73e2rptg-a:5432/interview_prep_db_284m
SPRING_DATASOURCE_USERNAME=interview_prep_db_284m_user
SPRING_DATASOURCE_PASSWORD=bpopVbYjtOUItj2uBFwNqHXr7QYFWtlo
```

## Server & Security Variables

```
PORT=8080
JWT_SECRET_KEY=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
JWT_EXPIRATION=86400000
```

## AI Service Variables

```
GROQ_API_KEY=YOUR_GROQ_API_KEY_HERE
GROQ_BASE_URL=https://api.groq.com/openai
GROQ_MODEL=openai/gpt-oss-20b
```

## CORS & WebSocket Variables (Update after Vercel deployment)

```
APP_CORS_ALLOWED_ORIGINS=https://YOUR_VERCEL_FRONTEND_URL.vercel.app
APP_WEBSOCKET_ALLOWED_ORIGINS=https://YOUR_VERCEL_FRONTEND_URL.vercel.app
```

## Steps to add to Render:

1. Go to your Render backend service
2. Click **Settings** → **Environment** (or **Environment Variables**)
3. Click **Add Environment Variable**
4. Copy each variable name and value from above
5. After deploying frontend to Vercel, update `APP_CORS_ALLOWED_ORIGINS` and `APP_WEBSOCKET_ALLOWED_ORIGINS` with your Vercel URL

## Database Connection Details (for reference)

- Hostname: dpg-d7nhuaosfn5c73e2rptg-a
- Port: 5432
- Database: interview_prep_db_284m
- User: interview_prep_db_284m_user
- Password: bpopVbYjtOUItj2uBFwNqHXr7QYFWtlo

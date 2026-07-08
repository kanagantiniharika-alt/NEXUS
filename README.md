<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/daae779c-b6ca-43a6-8ec0-934b601b9ea7

## Run Locally

**Prerequisites:** Node.js, Python, MySQL

1. Install dependencies:
   `npm install`
2. Create a `.env` file from `.env.example` and fill in your MySQL database credentials.
3. Set the `GEMINI_API_KEY` in `.env` as well if you need Gemini AI features.
4. Start the backend:
   `cd backend && python main.py`
5. Start the frontend dev server:
   `npm run dev`

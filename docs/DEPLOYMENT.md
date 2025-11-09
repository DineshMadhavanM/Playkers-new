# Deployment

## Netlify (static pages)
- Build command: none
- Publish directory: /

## Docker (server)
```
docker build -t playkers-app .
docker run -p 5502:5502 --env-file .env playkers-app
```

## Environment variables
See `.env.example` for required keys.

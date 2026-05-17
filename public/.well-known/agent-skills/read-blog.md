# Skill: Read Blog Posts

## Description
Fetch blog posts from the Nahed Nakib personal site.

## Endpoint
`GET https://nahednakib.com/api/blog`

## Parameters
- `page` (optional, integer) — page number for pagination (default: 1)
- `limit` (optional, integer) — number of posts per page (default: 10)
- `category` (optional, string) — filter by category slug

## Response
JSON array of blog post objects with fields: `id`, `title`, `slug`, `excerpt`, `published_at`, `category`, `author`.

## Example
```
GET /api/blog?page=1&limit=5
```

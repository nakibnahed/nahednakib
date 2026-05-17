# Skill: Read Portfolio Projects

## Description
Fetch portfolio projects from the Nahed Nakib personal site.

## Endpoint
`GET https://nahednakib.com/api/portfolio`

## Parameters
- `page` (optional, integer) — page number for pagination (default: 1)
- `limit` (optional, integer) — number of items per page (default: 10)

## Response
JSON array of portfolio project objects with fields: `id`, `title`, `slug`, `description`, `published_at`, `technologies`.

## Example
```
GET /api/portfolio?page=1
```

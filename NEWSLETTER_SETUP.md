# Newsletter System Setup

## Required Environment Variables

Add these to your `.env.local` file:

```env
# Email Configuration (required for newsletter welcome emails)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@example.com
SMTP_PASS=your_email_password

# Contact Email Settings
SEND_OWNER_NOTIFICATION=true
CONTACT_RECEIVER_EMAIL=admin@yourdomain.com

# Base URL for unsubscribe links
NEXT_PUBLIC_BASE_URL=https://yourdomain.com  # or http://localhost:3000 for development
```

## Database Setup

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run the SQL script from `/database/newsletter_table.sql`

This will create:

- `newsletter_subscribers` table with proper structure
- Indexes for better performance
- Row Level Security (RLS) policies
- Trigger for automatic timestamp updates

## Features Included

### Public Features

- Newsletter subscription form
- Automatic welcome email with beautiful HTML template
- Unsubscribe functionality via email link
- Email validation and duplicate checking
- Reactivation of unsubscribed emails

### Admin Features

- Newsletter subscriber management
- View all subscribers with status filtering
- Export subscribers to CSV
- Delete subscribers
- Statistics dashboard (total, active, unsubscribed)
- Search and filter functionality
- Responsive design matching your admin theme

### Email Templates

- Beautiful HTML welcome email with:
  - Welcome message
  - Feature highlights
  - Unsubscribe link
  - Dark mode friendly design
  - Professional styling

### Security

- Admin-only access to management features
- Proper error handling
- RLS policies on database
- Input validation and sanitization

## Usage

1. **Database Setup**: Run the SQL script in Supabase
2. **Environment Variables**: Add required variables to `.env.local`
3. **Newsletter Form**: Already integrated in your contact page
4. **Admin Management**: Available at `/admin/newsletter`
5. **Email Testing**: Test with a real email to see the welcome message

## Email Providers

The system works with any SMTP provider:

- Gmail (use App Password)
- SendGrid
- Mailgun
- AWS SES
- Or any other SMTP service

## File Structure

```
/src/app/api/newsletter/
  ├── route.js (POST, GET, DELETE)
  └── unsubscribe/
      └── route.js (GET for unsubscribe handling)

/src/components/Admin/Newsletter/
  ├── NewsletterManagement.jsx
  └── NewsletterManagement.module.css

/src/app/admin/newsletter/
  └── page.jsx

/database/
  └── newsletter_table.sql

/src/services/
  └── mailer.js (updated with newsletter functions)
```

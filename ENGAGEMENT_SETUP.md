# Engagement System Setup Guide

This guide will help you set up the complete engagement system (likes, favorites, comments) for your Next.js application.

## 🗄️ Database Setup

### 1. Run the SQL Script

Execute the SQL script in your Supabase dashboard:

```bash
# Run this in your Supabase SQL Editor
./database/engagement_system.sql
```

This creates:

- `user_likes` table
- `user_favorites` table
- `user_comments` table
- Indexes for performance
- RLS policies for security
- Views for aggregated data

### 2. Verify Tables

Check that these tables were created in your Supabase dashboard:

- ✅ user_likes
- ✅ user_favorites
- ✅ user_comments
- ✅ content_engagement_stats (view)

## 🔧 Environment Variables

Ensure these are set in your `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🚀 Features

### ✨ Likes System

- ❤️ Users can like/unlike portfolios and blog posts
- 📊 Real-time like counts
- 🔐 Authentication required
- 💾 Persistent storage in Supabase

### ⭐ Favorites System

- 🌟 Save content to favorites
- 📋 Personal favorites collection
- 🔐 Authentication required
- 💾 Persistent storage in Supabase

### 💬 Comments System

- 💭 Add comments to portfolios and blogs
- 🔗 Nested replies support
- ⏰ Real-time timestamps
- 🔐 Authentication required
- ✅ Moderation system ready
- 📱 Responsive design

### 🔄 Share System

- 📤 Native share API support
- 📋 Fallback to clipboard copy
- 🎉 Toast notifications
- 📱 Mobile-friendly

## 🎨 UI Features

### Modern Design

- 🎯 Consistent with your existing design system
- 🌙 Dark/light theme support
- 📱 Fully responsive
- ⚡ Smooth animations
- 🎭 Loading states
- 🎨 Hover effects

### User Experience

- 🚀 Optimistic updates
- 🔄 Real-time data
- 🎯 Smart error handling
- 📱 Touch-friendly
- ♿ Accessible design
- 🎪 Beautiful interactions

## 🔐 Authentication Flow

### For Guests

- 👁️ Can view likes, favorites, and comments counts
- 🚫 Cannot interact (like, favorite, comment)
- 🔗 Redirected to `/login` when attempting actions

### For Logged-in Users

- ✅ Full access to all features
- 💾 Actions are saved permanently
- 🎯 Personalized experience

## 📊 Admin Features

### Dashboard Integration

- 📈 Comments count in admin dashboard
- 📊 Real-time statistics
- 🎛️ Ready for moderation features

### Future Admin Features (Ready to Implement)

- 🛡️ Comment moderation
- 📊 Engagement analytics
- 🔍 Content performance insights
- 🚫 User management
- 📋 Bulk actions

## 🔧 API Endpoints

### Likes

- `POST /api/engagement/likes` - Toggle like
- `GET /api/engagement/likes` - Get like data

### Favorites

- `POST /api/engagement/favorites` - Toggle favorite
- `GET /api/engagement/favorites` - Get favorite data

### Comments

- `POST /api/engagement/comments` - Add comment
- `GET /api/engagement/comments` - Get comments
- `DELETE /api/engagement/comments` - Delete comment

## 🎯 Usage

### Portfolio Pages

```jsx
// Already integrated in:
// - /portfolio/[id] pages
// - /blog/[id] pages

<EngagementSection
  contentType="portfolio"
  contentId={portfolioId}
  title={portfolioTitle}
/>
```

### Custom Implementation

```jsx
import { useEngagement } from "@/hooks/useEngagement";

const { user, engagement, actions } = useEngagement("blog", blogId);

// Use engagement.likes, engagement.favorites, engagement.comments
// Use actions.toggleLike, actions.toggleFavorite, actions.addComment
```

## 🔒 Security Features

### Row Level Security (RLS)

- ✅ Users can only manage their own data
- ✅ Public read access for approved content
- ✅ Admin override capabilities

### Input Validation

- ✅ Content type validation
- ✅ Comment length limits
- ✅ XSS protection
- ✅ SQL injection prevention

## 📱 Mobile Optimization

### Responsive Design

- 📱 Touch-friendly buttons
- 📏 Proper spacing on mobile
- 🎯 Easy thumb navigation
- ⚡ Fast loading
- 💫 Smooth animations

## 🚀 Performance

### Optimizations

- ⚡ Optimistic UI updates
- 📊 Efficient data fetching
- 🗄️ Database indexes
- 🔄 Smart caching
- 📱 Lazy loading

## 🎉 Ready to Use!

Your engagement system is now fully set up and ready to use! Users can:

1. 👍 Like posts (shows real counts)
2. ⭐ Favorite posts (personal collection)
3. 💬 Comment and reply (full conversation threads)
4. 📤 Share posts (native + clipboard)
5. 🔐 All with proper authentication

The system follows modern best practices and provides a world-class user experience that rivals platforms like Medium, LinkedIn, and other social platforms.

## 🔮 Future Enhancements

Ready to implement:

- 📊 Analytics dashboard
- 🛡️ Advanced moderation
- 🏷️ Comment reactions
- 📧 Email notifications
- 🔍 Search comments
- 📱 Push notifications
- 🎯 Content recommendations

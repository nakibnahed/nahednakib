#!/bin/bash

# Test script to verify engagement system setup
echo "🧪 Testing Engagement System Setup..."
echo ""

# Test 1: Check if tables exist
echo "1️⃣ Checking if database tables exist..."
curl -s http://localhost:3000/api/engagement/test | jq .

echo ""
echo "2️⃣ If you see 'missing' tables above, please:"
echo "   • Go to your Supabase Dashboard → SQL Editor"
echo "   • Copy the SQL from database/engagement_system.sql"
echo "   • Paste and run it"
echo ""

# Test 2: Test a simple GET request
echo "3️⃣ Testing likes API..."
curl -s "http://localhost:3000/api/engagement/likes?contentType=blog&contentId=test-id" | jq .

echo ""
echo "✅ If you see JSON responses (not errors), the system is working!"
echo "🚀 Now you can test the engagement features on your blog/portfolio pages"

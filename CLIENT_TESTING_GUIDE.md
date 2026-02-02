# Campaign Approval System - Client Testing Guide

## 🌐 Live Demo
**URL**: https://projekt-gr-nland.vercel.app

---

## Quick Start - 3 Portals

| Portal | URL | Role |
|--------|-----|------|
| **CS Dashboard** | `/cs/login` | Create & monitor campaigns |
| **Customer Portal** | `/customer/login` | Upload assets, approve drafts |
| **Agency Portal** | `/agency/login` | Download assets, submit drafts |

---

## Complete Test Flow (5 minutes)

### Step 1: Login as CS User
1. Go to https://projekt-gr-nland.vercel.app/cs/login
2. Enter any email (e.g., `cs@demo.com`)
3. Click "Send Magic Link"
4. Use the **debug URL** shown to login

### Step 2: Create a Campaign
1. Click "New Campaign"
2. Fill in customer details, select agency
3. Set deadlines and click Create
4. ✅ Customer receives notification

### Step 3: Login as Customer
1. Go to `/customer/login`
2. Use customer email from Step 2
3. Access the campaign link

### Step 4: Upload Brand Assets
1. Click "Upload Assets" 
2. Select images/files
3. ✅ Agency is notified

### Step 5: Login as Agency
1. Go to `/agency/login`
2. Download customer assets
3. Upload draft for review
4. ✅ Customer is notified

### Step 6: Customer Approves
1. Return to Customer Portal
2. Review the draft
3. Click "Approve" or "Request Changes"
4. ✅ Campaign moves to approved/live

---

## What to Look For

✨ **Automatic Notifications** - Check console for email logs  
📊 **Real-time Status** - Dashboard updates after each action  
📝 **Activity Timeline** - All actions are logged  
⏰ **Deadline Tracking** - Overdue campaigns highlighted  

---

## Demo Notes
- Email: Debug URLs shown in browser (no real emails for POC)
- Storage: Files saved locally on server
- Database: In-memory (resets on restart)

**Questions?** Contact the development team.

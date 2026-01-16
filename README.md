# AI-Powered RFP Management System

A single-user web application that automates the entire Request for Proposal (RFP) procurement workflow using AI.

---

## 📋 Table of Contents
1. [Features](#features)
2. [Prerequisites](#prerequisites)
3. [Installation Guide](#installation-guide)
4. [Configuration](#configuration)
5. [Running the Application](#running-the-application)
6. [Usage Guide](#usage-guide)
7. [API Documentation](#api-documentation)
8. [Troubleshooting](#troubleshooting)

---

## ✨ Features

### Core Functionality
- **Natural Language RFP Creation**: AI converts plain English to structured RFPs
- **Vendor Management**: Store and manage vendor contact information
- **Email Integration**: Real SendGrid integration for sending RFPs to vendors
- **Gmail Auto-Detection**: Automatically detects and parses vendor email replies
- **AI Response Parsing**: Automatically extract pricing and terms from vendor emails
- **AI Comparison**: Intelligent proposal analysis with recommendations

### Technical Stack
- **Frontend**: React 18, JavaScript, CSS
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **AI**: Google Gemini API
- **Email**: SendGrid + Gmail IMAP

---

## 🔧 Prerequisites

Before you begin, ensure you have the following installed:

### Required Software
1. **Node.js** (v18 or higher)
   - Download: https://nodejs.org/
   - Verify: `node --version`

2. **MongoDB** (v5.0 or higher)
   - Download: https://www.mongodb.com/try/download/community
   - Verify: `mongod --version`

3. **Git** (for cloning repository)
   - Download: https://git-scm.com/
   - Verify: `git --version`

### Required API Keys (FREE)

1. **Google Gemini API Key**
   - Go to: https://makersuite.google.com/app/apikey
   - Click "Create API Key"
   - Copy the key (starts with `AIza...`)

2. **SendGrid API Key**
   - Sign up: https://signup.sendgrid.com/ (Free: 100 emails/day)
   - Go to: Settings → API Keys → Create API Key
   - Select "Full Access"
   - Copy the key (starts with `SG.`)

3. **Gmail App Password** (for receiving emails)
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and generate password
   - Copy the 16-character password

---

## 📥 Installation Guide

### Step 1: Download/Clone the Project

**Option A: Download ZIP**
```bash
# Extract the ZIP file to your desired location
# Example: C:\Users\YourName\Desktop\RFP Management System
```

**Option B: Clone from Git**
```bash
git clone <repository-url>
cd "RFP Management System"
```

### Step 2: Install Backend Dependencies

```bash
# Navigate to backend folder
cd backend

# Install all required packages
npm install
```

**Packages installed:**
- express (web server)
- mongodb (database driver)
- @google/generative-ai (Gemini AI)
- @sendgrid/mail (email sending)
- imap (email receiving)
- mailparser (email parsing)
- cors, helmet, dotenv (utilities)

### Step 3: Install Frontend Dependencies

```bash
# Navigate to frontend folder (from project root)
cd ../frontend

# Install all required packages
npm install
```

**Packages installed:**
- react, react-dom (UI framework)
- react-router-dom (routing)
- axios (API calls)
- react-hot-toast (notifications)

---

## ⚙️ Configuration

### Step 1: Start MongoDB

**Windows:**
```bash
# Open Command Prompt as Administrator
net start MongoDB

# Or start MongoDB manually
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath="C:\data\db"
```

**Mac/Linux:**
```bash
# Start MongoDB service
sudo systemctl start mongod

# Or use brew (Mac)
brew services start mongodb-community
```

**Verify MongoDB is running:**
```bash
# Should connect without errors
mongosh
```

### Step 2: Configure Backend Environment

```bash
# Navigate to backend folder
cd backend

# Create .env file from example
copy .env.example .env    # Windows
# OR
cp .env.example .env      # Mac/Linux
```

**Edit `backend/.env` file with your API keys:**

```env
# Database
DATABASE_URL="mongodb://localhost:27017/rfp_system"

# Google Gemini AI (REQUIRED)
GEMINI_API_KEY="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

# SendGrid Email (REQUIRED for sending RFPs)
SENDGRID_API_KEY="SG.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
SENDGRID_FROM_EMAIL="your-email@gmail.com"

# Gmail IMAP (REQUIRED for receiving vendor replies)
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx"

# Server
PORT=3001
NODE_ENV=development
```

**Important Notes:**
- Replace `your-email@gmail.com` with your actual Gmail address
- Use the same Gmail for both `SENDGRID_FROM_EMAIL` and `GMAIL_USER`
- Gmail App Password has spaces (e.g., `abcd efgh ijkl mnop`)
- Verify your email in SendGrid: Settings → Sender Authentication

---

### ⚡ Quick Start for Interviewers/Evaluators

**For immediate testing, working API credentials are already included in `backend/.env` file:**

- ✅ Google Gemini API Key (pre-configured)
- ✅ SendGrid API Key (pre-configured)
- ✅ Gmail IMAP credentials (pre-configured)
- ✅ Verified sender email: yokipers@gmail.com

**You can skip the API key setup and run the application directly:**

```bash
# Just install dependencies and run
cd backend && npm install
cd ../frontend && npm install

# Start MongoDB
net start MongoDB  # Windows

# Run application
cd backend && npm run dev   # Terminal 1
cd frontend && npm start    # Terminal 2
```

**Note:** These credentials are provided for evaluation purposes only. In production environments, always use your own API keys and never commit them to version control.

### Step 3: Verify SendGrid Email

1. Go to: https://app.sendgrid.com/settings/sender_auth/senders
2. Click "Create New Sender"
3. Fill in your details (use your Gmail)
4. Check your Gmail for verification email
5. Click verification link
6. Status should show "Verified"

---

## 🚀 Running the Application

### Step 1: Start Backend Server

```bash
# Open Terminal 1
cd backend
npm run dev
```

**Expected output:**
```
[nodemon] starting `node src/server.js`
🚀 Server running on http://localhost:3001
✅ Connected to MongoDB
```

**If you see errors:**
- MongoDB not running → Start MongoDB first
- Port 3001 in use → Change PORT in .env
- Database connection failed → Check DATABASE_URL

### Step 2: Start Frontend Server

```bash
# Open Terminal 2 (new terminal window)
cd frontend
npm start
```

**Expected output:**
```
Compiled successfully!

You can now view frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

**Browser should automatically open to:** http://localhost:3000

### Step 3: Verify Application is Running

1. **Frontend**: http://localhost:3000 (should show dashboard)
2. **Backend**: http://localhost:3001/health (should show `{"status":"OK"}`)

---

## 📖 Usage Guide

### 1. Create Your First RFP

1. Click **"Create New RFP"**
2. Enter natural language description:
   ```
   I need 50 Dell or HP laptops with Intel i7 processor, 16GB RAM, 512GB SSD, 
   and Windows 11 Pro. Also need 50 wireless keyboards, 50 wireless mice, 
   and 3 network switches with 24 ports each. Budget is $85,000. 
   Delivery required within 30 days. Payment terms: Net 30. 
   Warranty must be at least 1 year.
   ```
3. Click **"Create RFP"**
4. AI will parse and structure the RFP automatically

### 2. Add Vendors

1. Click **"Vendors"** in navigation
2. Click **"Add New Vendor"**
3. Fill in details:
   - **Name**: TechCorp Solutions
   - **Email**: friend1@gmail.com (use real Gmail addresses)
   - **Phone**: +1-555-0101
   - **Contact Person**: John Smith
4. Click **"Add Vendor"**
5. Repeat for 2-3 vendors

**Important:** Use real Gmail addresses you can access for testing!

### 3. Send RFP to Vendors

1. Go to **"RFPs"** → Click on your RFP
2. Select vendors (check boxes)
3. Click **"Send to X vendor(s)"**
4. Emails will be sent via SendGrid
5. Check vendor Gmail inboxes (may be in Spam folder)

### 4. Simulate Vendor Responses

**Option A: Reply via Email (Realistic)**
1. Open vendor Gmail inbox
2. Find RFP email (check Spam folder)
3. Click Reply
4. Write proposal:
   ```
   Dear Procurement Team,

   Thank you for your RFP. We are pleased to submit our proposal:

   PRICING BREAKDOWN:
   - 50x Dell Latitude 5540 Laptops (i7, 16GB RAM, 512GB SSD, Win11 Pro): $1,450 each = $72,500
   - 50x Logitech K380 Wireless Keyboards: $35 each = $1,750
   - 50x Logitech M720 Wireless Mice: $28 each = $1,400
   - 3x Cisco SG250-26 24-Port Switches: $450 each = $1,350

   TOTAL: $77,000

   DELIVERY: 21 days from PO
   WARRANTY: 3-year manufacturer warranty on laptops
   PAYMENT TERMS: Net 30 days

   Best regards,
   John Smith
   TechCorp Solutions
   ```
5. Send email
6. Wait 30 seconds for auto-detection

**Option B: Manual Entry (Quick Testing)**
1. Go to **"Test Proposal"** page
2. Select RFP and Vendor
3. Paste vendor response
4. Click **"Submit Proposal"**

### 5. Check for Vendor Emails

1. Go to **"Email Inbox"** in navigation
2. Click **"🔄 Check for New Emails"**
3. System will:
   - Connect to Gmail via IMAP
   - Find emails with "RFP" in subject
   - Parse them with AI
   - Create proposals automatically

**Or enable auto-checking:**
- Click **"▶️ Start Auto-Check"**
- System checks every 30 seconds

### 6. Compare Proposals with AI

1. Go to your RFP details page
2. Wait for 2+ proposals to arrive
3. Click **"Compare Proposals with AI"**
4. AI will analyze and provide:
   - Score breakdown (100-point system)
   - Pros and cons for each vendor
   - Compliance checks
   - Clear recommendation with reasoning

---

## 📡 API Documentation

### RFP Endpoints

**Create RFP**
```bash
POST http://localhost:3001/api/rfps
Content-Type: application/json

{
  "description": "I need 20 laptops with 16GB RAM, budget $50000, delivery 30 days"
}
```

**Get All RFPs**
```bash
GET http://localhost:3001/api/rfps
```

**Send RFP to Vendors**
```bash
POST http://localhost:3001/api/rfps/:rfpId/send
Content-Type: application/json

{
  "vendorIds": ["vendor1_id", "vendor2_id"]
}
```

### Vendor Endpoints

**Create Vendor**
```bash
POST http://localhost:3001/api/vendors
Content-Type: application/json

{
  "name": "TechCorp Solutions",
  "email": "sales@techcorp.com",
  "phone": "+1-555-0101",
  "contactPerson": "John Smith"
}
```

**Get All Vendors**
```bash
GET http://localhost:3001/api/vendors
```

### Proposal Endpoints

**Create Proposal**
```bash
POST http://localhost:3001/api/proposals
Content-Type: application/json

{
  "rfpId": "rfp_id_here",
  "vendorId": "vendor_id_here",
  "rawContent": "We quote $40,000 for 20 laptops..."
}
```

**Compare Proposals**
```bash
POST http://localhost:3001/api/proposals/compare/:rfpId
```

### Email Endpoints

**Check for New Emails**
```bash
GET http://localhost:3001/api/email/check
```

**Start Auto-Polling**
```bash
POST http://localhost:3001/api/email/start-polling
```

---

## 🔍 Troubleshooting

### MongoDB Connection Failed

**Error:** `MongoServerError: connect ECONNREFUSED`

**Solution:**
```bash
# Windows
net start MongoDB

# Mac/Linux
sudo systemctl start mongod
```

### SendGrid Email Not Sending

**Error:** `Sender email not verified`

**Solution:**
1. Go to: https://app.sendgrid.com/settings/sender_auth/senders
2. Verify your email address
3. Check spam folder for verification email

### Gmail Not Receiving Emails

**Error:** `Gmail credentials not configured`

**Solution:**
1. Enable 2-Step Verification: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Add to `.env`: `GMAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx"`

### Emails Not Being Detected

**Issue:** Vendor replies not showing up

**Solution:**
1. Check Gmail inbox (look in Spam folder)
2. Ensure subject contains "RFP" (e.g., "Re: RFP: Laptop Procurement")
3. Mark emails as unread if already read
4. Click "Check for New Emails" button
5. Check backend terminal for logs

### Port Already in Use

**Error:** `Port 3001 is already in use`

**Solution:**
```bash
# Windows - Kill process on port 3001
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3001 | xargs kill -9
```

### Gemini API Error

**Error:** `API key not valid`

**Solution:**
1. Get new key: https://makersuite.google.com/app/apikey
2. Update `GEMINI_API_KEY` in `.env`
3. Restart backend server

### Frontend Not Loading

**Issue:** Blank page or connection refused

**Solution:**
1. Check backend is running on port 3001
2. Check frontend is running on port 3000
3. Clear browser cache (Ctrl+Shift+Delete)
4. Check browser console for errors (F12)

---

## 🎯 Demo Test Data

Use this complete test scenario for demonstration:

### RFP Description
```
I need 50 Dell or HP laptops with Intel i7 processor, 16GB RAM, 512GB SSD, and Windows 11 Pro. Also need 50 wireless keyboards, 50 wireless mice, and 3 network switches with 24 ports each. Budget is $85,000. Delivery required within 30 days. Payment terms: Net 30. Warranty must be at least 1 year.
```

### Vendor 1: TechCorp Solutions
```
Dear Procurement Team,

Thank you for your RFP. We are pleased to submit our proposal:

PRICING BREAKDOWN:
- 50x Dell Latitude 5540 Laptops (i7-1355U, 16GB RAM, 512GB SSD, Win11 Pro): $1,450 each = $72,500
- 50x Logitech K380 Wireless Keyboards: $35 each = $1,750
- 50x Logitech M720 Wireless Mice: $28 each = $1,400
- 3x Cisco SG250-26 24-Port Gigabit Switches: $450 each = $1,350

TOTAL: $77,000

DELIVERY: 21 days from PO
WARRANTY: 3-year manufacturer warranty on laptops, 2-year on switches, 1-year on peripherals
PAYMENT TERMS: Net 30 days
ADDITIONAL: Free shipping, on-site setup support included

Best regards,
John Smith
TechCorp Solutions
```

### Vendor 2: Digital Supplies Inc
```
Hi there,

Here's our quote for your requirements:

HP EliteBook 840 G10 (i7-1365U, 16GB, 512GB NVMe, Win11 Pro) - 50 units @ $1,380/unit = $69,000
Microsoft Wireless Desktop 900 (keyboard + mouse combo) - 50 sets @ $45/set = $2,250
Netgear GS324 24-port switches - 3 units @ $380/unit = $1,140

Grand Total: $72,390

We can deliver in 25 days. Standard 1-year warranty on everything. Payment: Net 30.

Let me know if you need any changes!

Sarah Johnson
Digital Supplies Inc
```

### Vendor 3: Enterprise IT Partners
```
PROPOSAL FOR RFP

ITEM QUOTATION:

1. Laptops (Dell Precision 3581)
   - Specifications: Intel Core i7-13700H, 16GB DDR5, 512GB PCIe SSD, Windows 11 Pro
   - Quantity: 50
   - Unit Price: $1,620
   - Subtotal: $81,000

2. Wireless Keyboards (Dell KB700) - 50 units @ $42 = $2,100
3. Wireless Mice (Dell MS5120W) - 50 units @ $32 = $1,600
4. Network Switches (TP-Link TL-SG3428 24-port Managed) - 3 units @ $520 = $1,560

TOTAL COST: $86,260

TERMS & CONDITIONS:
- Delivery Timeline: 28 days
- Warranty: 5-year ProSupport on laptops, 3-year on switches, 2-year on peripherals
- Payment: Net 45 days

NOTE: Price exceeds budget by $1,260 but includes premium enterprise-grade equipment.

Michael Chen
Enterprise IT Partners
```

---

## 🏗️ Project Structure

```
RFP Management System/
├── backend/
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic (AI, Email)
│   │   ├── utils/           # Database, helpers
│   │   └── server.js        # Express server
│   ├── .env                 # Configuration (create this)
│   ├── .env.example         # Template
│   └── package.json         # Dependencies
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API calls
│   │   └── App.js           # Main app
│   └── package.json         # Dependencies
└── README.md                # This file
```

---

## 🤖 AI Integration Details

### Google Gemini Usage

**1. RFP Parsing**
- Converts natural language to structured JSON
- Extracts: items, quantities, specs, budget, delivery date

**2. Proposal Parsing**
- Extracts pricing from unstructured vendor emails
- Handles various formats: $1,000 / 1000 / 1k
- Identifies: total price, item prices, delivery, warranty

**3. Proposal Comparison**
- 100-point scoring system
- Multi-factor analysis (price, delivery, warranty, terms)
- Generates pros/cons and recommendations

---

## 📞 Support

If you encounter issues:

1. Check [Troubleshooting](#troubleshooting) section
2. Verify all prerequisites are installed
3. Check `.env` configuration
4. Review backend terminal logs for errors
5. Check browser console (F12) for frontend errors

---

## 📄 License

This project is for educational/demonstration purposes.

---

**Built with ❤️ using React, Node.js, MongoDB, and Google Gemini AI**

# 📚 RFP Management System - Study Guide

## 🎯 Application Overview

This is an **AI-Powered RFP (Request for Proposal) Management System** that automates the procurement workflow from creating RFPs to comparing vendor proposals.

---

## 🏗️ Architecture

### High-Level Flow
```
User → Frontend (React) → Backend API (Express) → Database (MongoDB)
                              ↓
                         AI Service (Gemini)
                         Email Service (SendGrid/Gmail)
```

### Three-Tier Architecture
1. **Presentation Layer**: React frontend
2. **Business Logic Layer**: Express backend with services
3. **Data Layer**: MongoDB database

---

## 📂 Backend Structure

### 1. **server.js** - Entry Point
```javascript
// What it does:
- Starts Express server
- Connects to MongoDB
- Sets up middleware (CORS, JSON parsing)
- Registers all routes
- Listens on port 3001
```

### 2. **Routes** (API Endpoints)

#### **rfps.js** - RFP Management
```javascript
POST /api/rfps
// Creates RFP from natural language
// Flow: User input → AI parsing → Save to DB

GET /api/rfps
// Lists all RFPs

GET /api/rfps/:id
// Gets specific RFP details

POST /api/rfps/:id/send
// Sends RFP to selected vendors via email
// Flow: Get RFP → Get vendors → Send emails → Track in DB

DELETE /api/rfps/:id
// Deletes RFP and related data
```

#### **vendors.js** - Vendor Management
```javascript
POST /api/vendors
// Creates new vendor

GET /api/vendors
// Lists all vendors

GET /api/vendors/:id
// Gets specific vendor

PUT /api/vendors/:id
// Updates vendor information

DELETE /api/vendors/:id
// Soft deletes vendor
```

#### **proposals.js** - Proposal Management
```javascript
GET /api/proposals/all
// Gets all proposals (for Email Inbox)

GET /api/proposals/rfp/:rfpId
// Gets proposals for specific RFP

POST /api/proposals
// Creates proposal (manual or from email)
// Flow: Receive data → Parse with AI → Save to DB

POST /api/proposals/compare/:rfpId
// Compares proposals using AI
// Flow: Get proposals → AI analysis → Return scores & recommendation
```

#### **email.js** - Email Receiving (SendGrid Webhook)
```javascript
POST /api/email/receive
// Receives emails from SendGrid webhook
// Flow: Email arrives → Find vendor → Match RFP → Parse → Create proposal
```

#### **emailPolling.js** - Email Receiving (Gmail IMAP)
```javascript
GET /api/email/check
// Manually checks Gmail for new emails

POST /api/email/start-polling
// Starts automatic checking (every 30 seconds)

POST /api/email/stop-polling
// Stops automatic checking
```

### 3. **Services** (Business Logic)

#### **aiService.js** - AI Integration
```javascript
// Three main methods:

1. parseNaturalLanguageToRFP(naturalLanguage)
   Input: "I need 20 laptops, budget $50,000..."
   Output: {
     title: "Equipment Procurement",
     items: [{name: "Laptops", quantity: 20, ...}],
     budget: 50000,
     deliveryDate: "2026-02-15"
   }
   
2. parseProposalEmail(emailContent, rfpContext)
   Input: Vendor email text + RFP details
   Output: {
     totalPrice: 36200,
     itemPrices: [...],
     deliveryDate: "2026-02-20",
     warranty: "2-year",
     isComplete: true
   }
   
3. compareProposals(proposals, rfpContext)
   Input: Array of proposals + RFP requirements
   Output: {
     analysis: [{vendorId, score, pros, cons, ...}],
     recommendation: {recommendedVendorId, reasoning, ...},
     summary: "..."
   }
```

**How AI Works:**
1. **Primary**: Calls Google Gemini API with structured prompts
2. **Fallback**: If AI fails, uses regex-based parsing
3. **Error Handling**: Graceful degradation

#### **emailService.js** - Email Sending
```javascript
sendRFPToVendor(rfp, vendor)
// Uses SendGrid to send HTML email
// Flow: Generate HTML → Send via SendGrid → Return result

generateRFPEmail(rfp)
// Creates HTML email template with RFP details
```

#### **gmailReceiver.js** - Email Receiving
```javascript
connect()
// Connects to Gmail via IMAP

checkNewEmails()
// Searches for unread emails with "RFP" in subject
// Returns array of emails

processVendorEmail(email)
// Flow: Extract vendor email → Find vendor in DB → 
//       Match to recent RFP → Parse with AI → Create proposal

pollEmails()
// Main function: Check → Process → Repeat
```

### 4. **Utils**

#### **database.js** - MongoDB Connection
```javascript
connectDB()
// Connects to MongoDB
// Creates database if doesn't exist

getDB()
// Returns database instance for queries
```

---

## 📂 Frontend Structure

### 1. **App.js** - Main Application
```javascript
// Sets up routing:
/ → Dashboard
/rfps → RFP List
/rfps/create → Create RFP
/rfps/:id → RFP Detail
/vendors → Vendor List
/vendors/create → Create Vendor
/vendors/:id/edit → Edit Vendor
/emails → Email Inbox
```

### 2. **Components**

#### **Layout.js** - App Shell
```javascript
// Provides:
- Navigation bar (Dashboard, RFPs, Vendors, Inbox)
- Context buttons (Create RFP, Add Vendor)
- Main content area
```

### 3. **Pages**

#### **Dashboard.js** - Home Page
```javascript
// Shows:
- Statistics (total RFPs, vendors, active RFPs)
- Recent RFPs
- Quick actions
- Getting started guide
```

#### **CreateRFP.js** - RFP Creation
```javascript
// Flow:
1. User types natural language in textarea
2. Click "Create RFP"
3. API call to POST /api/rfps
4. AI parses text into structured RFP
5. Navigate to RFP detail page

// Key Feature: Natural language → Structured data
```

#### **RFPDetail.js** - RFP Details & Comparison
```javascript
// Shows:
1. RFP Information (title, items, budget, delivery)
2. Vendor Selection (if status = DRAFT)
3. Proposals Table (received proposals)
4. Compare Button (if 2+ proposals)
5. AI Comparison Results (scores, recommendation)

// Key Features:
- Send RFP to vendors
- View proposals
- AI-powered comparison
- Clear recommendation
```

#### **VendorList.js** - Vendor Management
```javascript
// Shows:
- List of all vendors
- Edit button (links to /vendors/:id/edit)
- Delete button
```

#### **CreateVendor.js** - Add Vendor
```javascript
// Form fields:
- Name (required)
- Email (required)
- Phone (optional)
- Contact Person (optional)
```

#### **EditVendor.js** - Edit Vendor
```javascript
// Loads vendor data
// Updates via PUT /api/vendors/:id
```

#### **EmailInbox.js** - Email Visualization
```javascript
// Shows:
- All received proposals
- Manual "Check for New Emails" button
- Auto-polling toggle
- Email metadata (from, subject, date)
- Parsed data (price, delivery, warranty)
- Raw email content (expandable)

// Key Feature: Visualizes email receiving process
```

#### **TestProposal.js** - Manual Testing
```javascript
// Development tool for testing
// Allows manual proposal submission
// Only available in development mode
```

### 4. **Services**

#### **api.js** - API Client
```javascript
// Axios instance configured for backend
// Exports:
- rfpAPI: { create, getAll, getById, sendToVendors, delete }
- vendorAPI: { create, getAll, getById, update, delete }
- proposalAPI: { create, getAll, getByRFP, compare }
- emailAPI: { checkForNew, startPolling, stopPolling }
```

---

## 🔄 Complete Workflow

### 1. Create RFP
```
User Input (Natural Language)
    ↓
Frontend: CreateRFP.js
    ↓
API: POST /api/rfps
    ↓
AI Service: parseNaturalLanguageToRFP()
    ↓
Database: Save to 'rfps' collection
    ↓
Frontend: Navigate to RFP Detail
```

### 2. Send RFP to Vendors
```
User: Select vendors (checkboxes)
    ↓
Frontend: RFPDetail.js → handleSendRFP()
    ↓
API: POST /api/rfps/:id/send
    ↓
Email Service: sendRFPToVendor() for each vendor
    ↓
SendGrid: Send actual emails
    ↓
Database: Save to 'rfp_vendors' collection
    ↓
Update RFP status: DRAFT → SENT
```

### 3. Receive Vendor Response
```
Vendor replies to email
    ↓
Option A: Gmail IMAP
    Gmail Receiver: checkNewEmails()
        ↓
    Find unread emails with "RFP" in subject
        ↓
    processVendorEmail()
        
Option B: SendGrid Webhook
    POST /api/email/receive
        ↓
    Extract vendor from email
        ↓
    Match to recent RFP
        ↓
    AI Service: parseProposalEmail()
        ↓
    Extract: price, delivery, warranty, terms
        ↓
    Database: Save to 'proposals' collection
        ↓
    Frontend: Visible in Email Inbox
```

### 4. Compare Proposals
```
User: Click "Compare Proposals with AI"
    ↓
Frontend: RFPDetail.js → handleCompareProposals()
    ↓
API: POST /api/proposals/compare/:rfpId
    ↓
AI Service: compareProposals()
    ↓
Gemini AI: Analyze proposals
    ↓
Calculate scores (100-point system)
    ↓
Generate pros/cons, compliance checks
    ↓
Determine recommendation
    ↓
Frontend: Display results
    - Green banner with recommended vendor
    - Detailed scores and analysis
    - Clear reasoning
```

---

## 🗄️ Database Schema

### Collections

#### **rfps**
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  items: [{
    name: String,
    quantity: Number,
    specifications: String,
    estimatedPrice: Number
  }],
  budget: Number,
  deliveryDate: Date,
  paymentTerms: String,
  status: 'DRAFT' | 'SENT' | 'CLOSED',
  createdAt: Date,
  updatedAt: Date
}
```

#### **vendors**
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  phone: String,
  contactPerson: String,
  isActive: Boolean,
  createdAt: Date
}
```

#### **proposals**
```javascript
{
  _id: ObjectId,
  rfpId: String,
  vendorId: String,
  rawContent: String,
  totalPrice: Number,
  itemPrices: [{
    item: String,
    quantity: Number,
    unitPrice: Number,
    totalPrice: Number
  }],
  deliveryDate: Date,
  warranty: String,
  terms: {
    paymentTerms: String,
    deliveryTerms: String,
    additionalConditions: []
  },
  aiSummary: String,
  isComplete: Boolean,
  status: 'PARSING' | 'PARSED' | 'INCOMPLETE' | 'ERROR',
  receivedAt: Date,
  receivedViaEmail: Boolean,
  emailFrom: String,
  emailSubject: String
}
```

#### **rfp_vendors** (Junction Table)
```javascript
{
  _id: ObjectId,
  rfpId: String,
  vendorId: String,
  sentAt: Date
}
```

---

## 🤖 AI Integration Details

### Prompting Strategy

#### 1. RFP Creation Prompt
```
"Convert this to JSON: [user input]. 
Return only JSON with title, description, items array, 
budget, deliveryDate, paymentTerms."
```
**Why**: Simple, direct, structured output

#### 2. Proposal Parsing Prompt
```
"Parse this vendor proposal email and extract ALL pricing information.

RFP Context: [items from RFP]
Vendor Email: [email content]

Extract: totalPrice, itemPrices[], deliveryDate, warranty, terms
Handle formats: $1,000 / 1000 / 1k
Return ONLY valid JSON"
```
**Why**: Provides context, handles multiple formats, structured output

#### 3. Comparison Prompt
```
"You are a procurement expert. Analyze these proposals.

RFP Requirements: [budget, delivery, items]
Vendor Proposals: [all proposals with details]

Provide 100-point scoring:
- Price (40 pts)
- Delivery (25 pts)
- Warranty (15 pts)
- Terms (10 pts)
- Completeness (10 pts)

Return JSON with analysis, recommendation, summary"
```
**Why**: Expert persona, clear criteria, structured scoring

### Fallback Strategy
```
If AI fails:
1. Use regex patterns to extract data
2. Parse line-by-line
3. Match keywords (total, price, delivery, warranty)
4. Calculate from available data
5. Mark as incomplete if insufficient
```

---

## 🔐 Security & Best Practices

### Environment Variables
```
- Never commit .env file
- Use .env.example as template
- Validate on startup
- Use different keys for dev/prod
```

### Error Handling
```
- Try-catch blocks everywhere
- User-friendly error messages
- Log technical details
- Graceful degradation
```

### Data Validation
```
- express-validator for input
- Check required fields
- Validate email formats
- Prevent duplicates
```

---

## 🎓 Key Concepts to Understand

### 1. **RESTful API Design**
- GET: Retrieve data
- POST: Create data
- PUT: Update data
- DELETE: Remove data

### 2. **Async/Await**
```javascript
// All database and API calls are asynchronous
const rfp = await db.collection('rfps').findOne({...});
```

### 3. **React Hooks**
- useState: Component state
- useEffect: Side effects (data fetching)
- useParams: URL parameters
- useNavigate: Navigation

### 4. **MongoDB Queries**
```javascript
// Find one
db.collection('rfps').findOne({ _id: ObjectId(id) })

// Find many
db.collection('vendors').find({}).toArray()

// Insert
db.collection('proposals').insertOne(proposal)

// Update
db.collection('rfps').updateOne({ _id }, { $set: {...} })
```

### 5. **Promise.all**
```javascript
// Fetch multiple things in parallel
const [rfp, vendors, proposals] = await Promise.all([
  rfpAPI.getById(id),
  vendorAPI.getAll(),
  proposalAPI.getByRFP(id)
]);
```

---

## 🐛 Common Issues & Solutions

### Issue: "AI parsing returns incomplete"
**Solution**: Check fallback parser, improve regex patterns

### Issue: "Email not received"
**Solution**: Check Gmail IMAP settings, mark email as unread

### Issue: "Comparison not showing"
**Solution**: Need 2+ proposals with PARSED or INCOMPLETE status

### Issue: "SendGrid email fails"
**Solution**: Verify sender email in SendGrid dashboard

---

## 📝 Study Checklist

- [ ] Understand three-tier architecture
- [ ] Know all API endpoints and their purpose
- [ ] Understand AI service methods
- [ ] Know database schema
- [ ] Understand complete workflow
- [ ] Know how email sending works
- [ ] Know how email receiving works
- [ ] Understand AI prompting strategy
- [ ] Know fallback mechanisms
- [ ] Understand React component structure

---

## 🎯 Demo Talking Points

1. **Natural Language Processing**: "AI converts plain English to structured data"
2. **Real Email Integration**: "Uses actual SendGrid and Gmail, not simulated"
3. **Intelligent Parsing**: "AI extracts pricing from messy vendor emails"
4. **Smart Comparison**: "100-point scoring system with clear recommendation"
5. **Complete Workflow**: "End-to-end automation from RFP creation to vendor selection"

---

**You now have a complete understanding of the application!** 🎉

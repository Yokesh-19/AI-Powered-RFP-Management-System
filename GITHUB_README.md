# 🤖 AI-Powered RFP Management System

> Automate your entire Request for Proposal (RFP) procurement workflow with AI

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-5.0+-green.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🎯 Overview

A full-stack web application that transforms the traditional RFP process using AI. Create RFPs in natural language, automatically parse vendor responses, and get intelligent recommendations—all powered by Google Gemini AI.

### ✨ Key Features

- 🗣️ **Natural Language RFP Creation** - Describe requirements in plain English
- 📧 **Real Email Integration** - SendGrid + Gmail IMAP for actual email workflows
- 🤖 **AI-Powered Parsing** - Extract pricing and terms from any vendor email format
- 📊 **Intelligent Comparison** - Multi-factor analysis with clear recommendations
- ⚡ **Real-Time Processing** - Automatic vendor response detection

---

## 🏗️ Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   React     │ ───> │   Express    │ ───> │   MongoDB   │
│  Frontend   │      │   Backend    │      │  Database   │
└─────────────┘      └──────────────┘      └─────────────┘
                            │
                            ├──> Google Gemini AI
                            ├──> SendGrid Email
                            └──> Gmail IMAP
```

### Tech Stack

**Frontend**
- React 18 with Hooks
- Axios for API calls
- React Router for navigation
- React Hot Toast for notifications

**Backend**
- Node.js + Express
- MongoDB (native driver)
- Google Gemini AI
- SendGrid + IMAP

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 5.0+
- Google Gemini API Key ([Get Free](https://makersuite.google.com/app/apikey))
- SendGrid API Key ([Get Free](https://signup.sendgrid.com/))
- Gmail App Password ([Setup Guide](https://support.google.com/accounts/answer/185833))

### Installation

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/rfp-management-system.git
cd rfp-management-system

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Configuration

```bash
# Copy environment template
cd backend
cp .env.example .env

# Edit .env with your API keys
# See .env.example for detailed instructions
```

### Run Application

```bash
# Terminal 1 - Start backend
cd backend
npm run dev

# Terminal 2 - Start frontend
cd frontend
npm start
```

**Access:** http://localhost:3000

---

## 📖 Usage

### 1. Create RFP with Natural Language

```
Input: "I need 50 laptops with 16GB RAM, Intel i7, budget $75,000, delivery 30 days"

Output: Structured RFP with parsed items, quantities, specs, budget, and delivery date
```

### 2. Send to Vendors

- Add vendor contacts
- Select vendors and send RFP via email
- Real emails sent through SendGrid

### 3. Automatic Response Processing

- System monitors Gmail inbox
- Detects vendor replies with "RFP" in subject
- AI extracts pricing, delivery, warranty, terms

### 4. AI-Powered Comparison

- Multi-factor scoring (100 points)
  - Price: 40 points
  - Delivery: 25 points
  - Warranty: 15 points
  - Terms: 10 points
  - Completeness: 10 points
- Detailed pros/cons analysis
- Clear recommendation with reasoning

---

## 📁 Project Structure

```
rfp-management-system/
├── backend/
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   │   ├── rfps.js
│   │   │   ├── vendors.js
│   │   │   ├── proposals.js
│   │   │   ├── email.js
│   │   │   └── emailPolling.js
│   │   ├── services/        # Business logic
│   │   │   ├── aiService.js      # Gemini AI integration
│   │   │   ├── emailService.js   # SendGrid integration
│   │   │   └── gmailReceiver.js  # IMAP email receiving
│   │   ├── utils/           # Helpers
│   │   │   └── database.js
│   │   └── server.js        # Express app
│   ├── .env.example         # Environment template
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/           # Page components
│   │   │   ├── Dashboard.js
│   │   │   ├── CreateRFP.js
│   │   │   ├── RFPDetail.js
│   │   │   ├── VendorList.js
│   │   │   ├── EmailInbox.js
│   │   │   └── TestProposal.js
│   │   ├── components/      # Reusable components
│   │   ├── services/        # API client
│   │   │   └── api.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── .gitignore
├── README.md
└── SETUP.md
```

---

## 🔌 API Documentation

### RFP Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/rfps` | Create RFP from natural language |
| GET | `/api/rfps` | List all RFPs |
| GET | `/api/rfps/:id` | Get specific RFP |
| POST | `/api/rfps/:id/send` | Send RFP to vendors |

### Vendor Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/vendors` | Create vendor |
| GET | `/api/vendors` | List all vendors |
| PUT | `/api/vendors/:id` | Update vendor |
| DELETE | `/api/vendors/:id` | Delete vendor |

### Proposal Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/proposals` | Create proposal |
| GET | `/api/proposals/rfp/:rfpId` | Get proposals for RFP |
| POST | `/api/proposals/compare/:rfpId` | AI comparison |

### Email Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/email/check` | Check Gmail for new emails |
| POST | `/api/email/start-polling` | Start auto-checking (30s) |
| POST | `/api/email/stop-polling` | Stop auto-checking |

---

## 🎬 Demo Workflow

### Complete Test Scenario

**RFP Input:**
```
I need 50 Dell or HP laptops with Intel i7 processor, 16GB RAM, 512GB SSD, 
and Windows 11 Pro. Also need 50 wireless keyboards, 50 wireless mice, 
and 3 network switches with 24 ports each. Budget is $85,000. 
Delivery required within 30 days. Payment terms: Net 30. 
Warranty must be at least 1 year.
```

**Vendor Response Example:**
```
Dear Procurement Team,

Thank you for your RFP. We are pleased to submit our proposal:

PRICING BREAKDOWN:
- 50x Dell Latitude 5540 Laptops: $1,450 each = $72,500
- 50x Logitech K380 Keyboards: $35 each = $1,750
- 50x Logitech M720 Mice: $28 each = $1,400
- 3x Cisco SG250-26 Switches: $450 each = $1,350

TOTAL: $77,000
DELIVERY: 21 days
WARRANTY: 3-year on laptops
PAYMENT TERMS: Net 30 days

Best regards,
John Smith
```

**AI Analysis Output:**
- Extracts all pricing automatically
- Scores vendor on 100-point scale
- Provides pros/cons analysis
- Recommends best vendor with reasoning

---

## 🔧 Configuration

### Environment Variables

All configuration is in `backend/.env`:

```env
# Database
DATABASE_URL="mongodb://localhost:27017/rfp_system"

# AI
GEMINI_API_KEY="your_gemini_api_key"

# Email Sending
SENDGRID_API_KEY="your_sendgrid_api_key"
SENDGRID_FROM_EMAIL="your-email@gmail.com"

# Email Receiving
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="your_app_password"

# Server
PORT=3001
NODE_ENV=development
```

See `.env.example` for detailed setup instructions.

---

## 🧪 Testing

### Manual Testing

1. **Create RFP**: Test natural language parsing
2. **Add Vendors**: Verify CRUD operations
3. **Send Email**: Check SendGrid integration
4. **Receive Email**: Test IMAP detection
5. **AI Comparison**: Verify scoring logic

### API Testing

```bash
# Create RFP
curl -X POST http://localhost:3001/api/rfps \
  -H "Content-Type: application/json" \
  -d '{"description":"I need 20 laptops, budget $50000"}'

# Check for emails
curl http://localhost:3001/api/email/check
```

---

## 🚧 Troubleshooting

### Common Issues

**MongoDB Connection Failed**
```bash
# Windows
net start MongoDB

# Mac/Linux
sudo systemctl start mongod
```

**SendGrid Email Not Sending**
- Verify sender email at: https://app.sendgrid.com/settings/sender_auth/senders
- Check API key has "Full Access" permissions

**Gmail Not Receiving**
- Enable 2-Step Verification
- Generate App Password (not regular password)
- Check spam folder for vendor replies

**Emails Not Detected**
- Ensure subject contains "RFP"
- Mark emails as unread if already read
- Check backend logs for errors

---

## 🎯 Design Decisions

### Why Gemini over OpenAI?
- Free tier available
- Fast response times
- Excellent JSON extraction
- No credit card required

### Why MongoDB over SQL?
- Flexible schema for varying vendor responses
- Easy to store unstructured email content
- Fast prototyping and iteration

### Why SendGrid?
- Production-ready email service
- 100 free emails/day
- Reliable delivery rates
- Easy integration

### Email Detection Strategy
- IMAP polling (checks every 30s)
- Searches for "RFP" in subject
- Prevents duplicate proposals
- Handles any email format

---

## 🔮 Future Enhancements

- [ ] File upload support (PDF/Excel proposals)
- [ ] Multi-user authentication
- [ ] Vendor performance tracking
- [ ] Advanced analytics dashboard
- [ ] ERP system integration
- [ ] Webhook-based email receiving
- [ ] Real-time notifications

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details

---

## 👤 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your Profile](https://linkedin.com/in/yourprofile)

---

## 🙏 Acknowledgments

- Google Gemini AI for natural language processing
- SendGrid for email infrastructure
- MongoDB for flexible data storage
- React community for excellent documentation

---

## 📞 Support

For questions or issues:
1. Check [SETUP.md](SETUP.md) for detailed setup instructions
2. Review [Troubleshooting](#troubleshooting) section
3. Open an issue on GitHub
4. Check backend logs for error details

---

**⭐ If you find this project useful, please consider giving it a star!**

---

*Built with ❤️ using React, Node.js, MongoDB, and Google Gemini AI*

# 🚀 GitHub Repository Setup Guide

## Quick Setup for Reviewers/Interviewers

### 1. Clone the Repository
```bash
git clone <repository-url>
cd "RFP Management System"
```

### 2. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Configure Environment Variables
```bash
# Copy example file
cd ../backend
cp .env.example .env

# Edit .env with your API keys (see .env.example for instructions)
```

### 4. Start MongoDB
```bash
# Windows
net start MongoDB

# Mac/Linux
sudo systemctl start mongod
```

### 5. Run the Application
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

### 6. Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

---

## 📋 Required API Keys (All FREE)

### Google Gemini API
- Get from: https://makersuite.google.com/app/apikey
- Free tier available
- Used for AI parsing and analysis

### SendGrid API
- Sign up: https://signup.sendgrid.com/
- Free: 100 emails/day
- Used for sending RFPs to vendors

### Gmail App Password
- Setup: https://myaccount.google.com/apppasswords
- Enable 2-Step Verification first
- Used for receiving vendor replies

---

## 🎯 Demo Workflow

1. **Create RFP**: Use natural language to describe requirements
2. **Add Vendors**: Add 2-3 vendor contacts
3. **Send RFP**: Email RFPs to vendors via SendGrid
4. **Receive Replies**: System auto-detects vendor email responses
5. **AI Analysis**: Compare proposals with AI recommendations

---

## 📁 Repository Structure

```
RFP Management System/
├── backend/              # Node.js/Express API
│   ├── src/
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # Business logic (AI, Email)
│   │   └── utils/       # Database helpers
│   ├── .env.example     # Environment template
│   └── package.json     # Dependencies
├── frontend/            # React application
│   ├── src/
│   │   ├── pages/       # Page components
│   │   ├── components/  # Reusable components
│   │   └── services/    # API calls
│   └── package.json     # Dependencies
├── .gitignore           # Git ignore rules
└── README.md            # Full documentation
```

---

## 🔒 Security Notes

- `.env` files are in `.gitignore` (never committed)
- `.env.example` shows required variables without secrets
- All API keys must be obtained by the user
- No hardcoded credentials in the codebase

---

## 📞 Support

For issues or questions:
1. Check README.md for detailed documentation
2. Review .env.example for configuration help
3. Check backend logs for error messages
4. Verify all API keys are correctly configured

---

**Ready to review the code? Start with README.md for complete setup instructions!**

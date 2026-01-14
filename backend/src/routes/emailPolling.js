const express = require('express');
const { GmailReceiver } = require('../services/gmailReceiver');

const router = express.Router();
const gmailReceiver = new GmailReceiver();

/**
 * Manual trigger to check Gmail for new vendor replies
 * GET /api/email/check
 */
router.get('/check', async (req, res) => {
  try {
    console.log('📬 Checking Gmail for new vendor replies...');
    
    const emailCount = await gmailReceiver.pollEmails();
    
    res.json({
      success: true,
      message: `Checked Gmail. Processed ${emailCount} new email(s)`,
      emailsProcessed: emailCount
    });
  } catch (error) {
    console.error('Error checking emails:', error);
    
    if (error.message.includes('Gmail credentials not configured')) {
      return res.status(503).json({
        error: 'Gmail not configured',
        message: 'Set GMAIL_USER and GMAIL_APP_PASSWORD in .env file',
        instructions: 'See REAL_EMAIL_SETUP.md for configuration steps'
      });
    }
    
    res.status(500).json({
      error: 'Failed to check emails',
      message: error.message
    });
  }
});

/**
 * Start automatic email polling (checks every 30 seconds)
 * POST /api/email/start-polling
 */
let pollingInterval = null;

router.post('/start-polling', (req, res) => {
  if (pollingInterval) {
    return res.json({
      message: 'Email polling already running',
      interval: '30 seconds'
    });
  }

  pollingInterval = setInterval(async () => {
    try {
      console.log('🔄 Auto-checking Gmail...');
      await gmailReceiver.pollEmails();
    } catch (error) {
      console.error('Polling error:', error);
    }
  }, 30000); // Check every 30 seconds

  res.json({
    success: true,
    message: 'Email polling started',
    interval: '30 seconds'
  });
});

/**
 * Stop automatic email polling
 * POST /api/email/stop-polling
 */
router.post('/stop-polling', (req, res) => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    gmailReceiver.disconnect();
    
    res.json({
      success: true,
      message: 'Email polling stopped'
    });
  } else {
    res.json({
      message: 'Email polling was not running'
    });
  }
});

module.exports = router;

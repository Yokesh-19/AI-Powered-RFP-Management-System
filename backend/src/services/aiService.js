const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIService {
  static getAIClient() {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      throw new Error('AI_CONFIG_ERROR: GEMINI_API_KEY not configured');
    }
    return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  static async parseNaturalLanguageToRFP(naturalLanguage) {
    try {
      const genAI = this.getAIClient();
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `Convert this to JSON: "${naturalLanguage}". Return only JSON with title, description, items array, budget, deliveryDate, paymentTerms.`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      if (error.message.includes('AI_CONFIG_ERROR')) {
        throw error;
      }
      if (error.message.includes('API_KEY_INVALID') || error.message.includes('401')) {
        throw new Error('AI_AUTH_ERROR: Invalid Gemini API key');
      }
      console.log('Gemini failed, using fallback parsing...', error.message);
    }

    // Fallback: Enhanced parsing for multiple item types
    const words = naturalLanguage.toLowerCase();
    const items = [];
    
    // Define item patterns
    const itemPatterns = [
      { regex: /(\d+)\s*(?:office\s+)?chairs?/i, name: 'Office Chairs', defaultSpec: 'Ergonomic design with lumbar support', price: 300 },
      { regex: /(\d+)\s*(?:standing\s+)?desks?/i, name: 'Standing Desks', defaultSpec: 'Electric height adjustment', price: 800 },
      { regex: /(\d+)\s*(?:desk\s+)?lamps?/i, name: 'Desk Lamps', defaultSpec: 'LED lighting', price: 50 },
      { regex: /(\d+)\s*laptops?/i, name: 'Laptops', defaultSpec: '16GB RAM, 512GB SSD', price: 1500 },
      { regex: /(\d+)\s*monitors?/i, name: 'Monitors', defaultSpec: '24-inch LCD', price: 300 },
      { regex: /(\d+)\s*(?:wireless\s+)?(?:mice|mouse)/i, name: 'Wireless Mice', defaultSpec: 'Wireless connectivity', price: 25 },
      { regex: /(\d+)\s*(?:wireless\s+)?keyboards?/i, name: 'Wireless Keyboards', defaultSpec: 'Wireless connectivity', price: 50 },
      { regex: /(\d+)\s*(?:laptop\s+)?bags?/i, name: 'Laptop Bags', defaultSpec: 'Padded protection', price: 40 }
    ];
    
    // Extract all matching items
    itemPatterns.forEach(pattern => {
      const match = naturalLanguage.match(pattern.regex);
      if (match) {
        const quantity = parseInt(match[1]);
        
        // Extract specifications from context
        let specifications = pattern.defaultSpec;
        const contextStart = Math.max(0, match.index - 50);
        const contextEnd = Math.min(naturalLanguage.length, match.index + match[0].length + 100);
        const context = naturalLanguage.substring(contextStart, contextEnd);
        
        // Look for specifications in context
        if (context.toLowerCase().includes('ergonomic') || context.toLowerCase().includes('lumbar')) {
          specifications = 'Ergonomic design with lumbar support';
        } else if (context.toLowerCase().includes('electric') || context.toLowerCase().includes('height adjustment')) {
          specifications = 'Electric height adjustment';
        } else if (context.toLowerCase().includes('led')) {
          specifications = 'LED lighting';
        } else if (context.toLowerCase().includes('16gb') || context.toLowerCase().includes('i7')) {
          specifications = '16GB RAM, Intel i7 processor';
        }
        
        items.push({
          name: pattern.name,
          quantity: quantity,
          specifications: specifications,
          estimatedPrice: pattern.price
        });
      }
    });
    
    // Extract budget with better pattern matching
    let budget = null;
    const budgetPatterns = [
      /budget[\s:is]*\$?([\d,]+)/i,
      /\$([\d,]+)\s*budget/i,
      /\$([\d,]+)/
    ];
    
    for (const pattern of budgetPatterns) {
      const match = naturalLanguage.match(pattern);
      if (match) {
        let amount = parseInt(match[1].replace(/,/g, ''));
        if (amount > 100) { // Reasonable budget threshold
          budget = amount;
          break;
        }
      }
    }
    
    // Extract delivery with flexible day matching
    let deliveryDate = null;
    const deliveryMatch = naturalLanguage.match(/(\d+)\s*days?/i);
    if (deliveryMatch) {
      const days = parseInt(deliveryMatch[1]);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      deliveryDate = futureDate.toISOString().split('T')[0];
    }

    return {
      title: "Equipment Procurement Request",
      description: naturalLanguage,
      items: items.length > 0 ? items : [{
        name: "General Items",
        quantity: 1,
        specifications: "As described",
        estimatedPrice: budget || 1000
      }],
      budget: budget,
      deliveryDate: deliveryDate,
      paymentTerms: words.includes('net 30') ? 'Net 30' : null,
      requirements: {}
    };
  }

  static async parseProposalEmail(emailContent, rfpContext) {
    // Validate input
    if (!emailContent || emailContent.trim().length === 0) {
      return {
        totalPrice: null,
        itemPrices: [],
        deliveryDate: null,
        warranty: null,
        terms: {},
        summary: "Empty or invalid email content",
        isComplete: false,
        parseError: "NO_CONTENT"
      };
    }

    try {
      const genAI = this.getAIClient();
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `Parse this vendor proposal email and extract ALL pricing information.

RFP Context:
${JSON.stringify(rfpContext.items, null, 2)}

Vendor Email:
${emailContent}

Extract and return ONLY valid JSON with this exact structure:
{
  "totalPrice": <number or null>,
  "itemPrices": [{"item": "name", "quantity": <number>, "unitPrice": <number>, "totalPrice": <number>}],
  "deliveryDate": "YYYY-MM-DD" or null,
  "warranty": "text" or null,
  "terms": {"paymentTerms": "text", "deliveryTerms": "text", "additionalConditions": []},
  "summary": "brief summary",
  "isComplete": <boolean - true if all RFP items are priced>
}

Rules:
- Extract ALL individual item prices from the email
- Calculate totalPrice from itemPrices if not explicitly stated
- Set isComplete to false if any RFP items are missing prices
- Parse all price formats: $1,000 / 1000 / 1k / etc
- Return ONLY the JSON object, no markdown or extra text`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed;
      }
    } catch (error) {
      if (error.message.includes('AI_CONFIG_ERROR') || error.message.includes('AI_AUTH_ERROR')) {
        console.log('AI service unavailable, using fallback parser');
      } else {
        console.log('AI parsing failed, using enhanced fallback...', error.message);
      }
    }

    // Enhanced fallback parsing
    const content = emailContent.toLowerCase();
    const originalContent = emailContent;
    
    let totalPrice = null;
    const itemPrices = [];
    
    // Split into lines for better parsing
    const lines = originalContent.split('\n');
    const priceRegex = /\$?([\d,]+(?:\.\d{2})?)/g;
    
    // Extract total price - look for lines with "total"
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if ((lowerLine.includes('total') || lowerLine.includes('price:')) && !lowerLine.includes('per unit')) {
        const matches = [...line.matchAll(priceRegex)];
        if (matches.length > 0) {
          // Take the last price on the line (usually the total)
          const lastPrice = matches[matches.length - 1][1];
          totalPrice = parseInt(lastPrice.replace(/,/g, ''));
          break;
        }
      }
    }
    
    // Extract individual item prices
    rfpContext.items?.forEach(rfpItem => {
      const itemName = rfpItem.name.toLowerCase();
      
      for (const line of lines) {
        const lowerLine = line.toLowerCase();
        
        // Check if line mentions this item
        if (lowerLine.includes(itemName) || 
            lowerLine.includes(itemName.slice(0, -1)) || // handles plural
            (itemName.includes('laptop') && lowerLine.includes('laptop')) ||
            (itemName.includes('monitor') && lowerLine.includes('monitor')) ||
            (itemName.includes('chair') && lowerLine.includes('chair')) ||
            (itemName.includes('desk') && lowerLine.includes('desk'))) {
          
          // Extract all prices from this line
          const prices = [...line.matchAll(priceRegex)];
          
          if (prices.length >= 2) {
            // Format: "$1,200 each = $24,000"
            const unitPrice = parseInt(prices[0][1].replace(/,/g, ''));
            const totalItemPrice = parseInt(prices[1][1].replace(/,/g, ''));
            
            itemPrices.push({
              item: rfpItem.name,
              quantity: rfpItem.quantity,
              unitPrice: unitPrice,
              totalPrice: totalItemPrice
            });
          } else if (prices.length === 1) {
            // Just one price - assume it's total for this item
            const price = parseInt(prices[0][1].replace(/,/g, ''));
            itemPrices.push({
              item: rfpItem.name,
              quantity: rfpItem.quantity,
              unitPrice: Math.round(price / rfpItem.quantity),
              totalPrice: price
            });
          }
          break; // Found this item, move to next
        }
      }
    });
    
    // Calculate total from items if not found directly
    if (!totalPrice && itemPrices.length > 0) {
      totalPrice = itemPrices.reduce((sum, item) => sum + item.totalPrice, 0);
    }
    
    // Extract delivery with better patterns
    let deliveryDate = null;
    const deliveryPatterns = [
      /(\d+)\s*days?/i,
      /delivery[:\s]*(\d+)\s*days?/i,
      /within\s*(\d+)\s*days?/i,
      /in\s*(\d+)\s*days?/i
    ];
    
    for (const pattern of deliveryPatterns) {
      const match = originalContent.match(pattern);
      if (match) {
        const days = parseInt(match[1]);
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);
        deliveryDate = futureDate.toISOString().split('T')[0];
        break;
      }
    }
    
    // Extract warranty with better detection
    let warranty = null;
    const warrantyPatterns = [
      /(\d+)[-\s]?year\s+warranty/i,
      /warranty[:\s]*(\d+)\s+years?/i,
      /(\d+)\s*yr\s+warranty/i
    ];
    
    for (const pattern of warrantyPatterns) {
      const match = originalContent.match(pattern);
      if (match) {
        warranty = `${match[1]}-year warranty`;
        break;
      }
    }
    
    if (!warranty && content.includes('warranty')) {
      warranty = 'Standard warranty included';
    }
    
    // Improved completeness check
    const hasAllItems = rfpContext.items ? 
      itemPrices.length >= rfpContext.items.length : 
      false;
    
    const isComplete = totalPrice !== null && 
                      deliveryDate !== null &&
                      (itemPrices.length === 0 || hasAllItems);
    
    return {
      totalPrice: totalPrice,
      itemPrices: itemPrices,
      deliveryDate: deliveryDate,
      warranty: warranty,
      terms: {
        paymentTerms: content.includes('net 30') ? 'Net 30' : 
                      content.includes('net 60') ? 'Net 60' : 
                      content.includes('net 45') ? 'Net 45' : null,
        deliveryTerms: deliveryDate ? `Delivery in ${originalContent.match(/(\d+)\s*days?/i)?.[1] || 'TBD'} days` : null,
        additionalConditions: []
      },
      summary: `Proposal ${isComplete ? 'complete' : 'incomplete'}: ${totalPrice ? `$${totalPrice.toLocaleString()} total, ` : 'price not found, '}${itemPrices.length} items priced, ${deliveryDate ? 'delivery date provided' : 'no delivery date'}`,
      isComplete: isComplete,
      parseError: totalPrice === null ? "INSUFFICIENT_DATA" : null
    };
  }

  static async compareProposals(proposals, rfpContext) {
    try {
      const genAI = this.getAIClient();
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      const prompt = `You are a procurement expert. Analyze these vendor proposals and provide a comprehensive comparison.

RFP REQUIREMENTS:
Budget: $${rfpContext.budget || 'Not specified'}
Delivery Required: ${rfpContext.deliveryDate || 'Not specified'}
Items: ${JSON.stringify(rfpContext.items, null, 2)}

VENDOR PROPOSALS:
${proposals.map((p, i) => `
Vendor ${i + 1} (ID: ${p.vendorId}):
- Total Price: $${p.totalPrice || 'Not provided'}
- Item Prices: ${JSON.stringify(p.itemPrices || [])}
- Delivery: ${p.deliveryDate || 'Not specified'}
- Warranty: ${p.warranty || 'Not specified'}
- Payment Terms: ${p.terms?.paymentTerms || 'Not specified'}
- Status: ${p.isComplete ? 'Complete' : 'Incomplete'}
- Raw Content: ${p.rawContent?.substring(0, 200)}...`).join('\n')}

Provide analysis in this EXACT JSON format:
{
  "analysis": [
    {
      "vendorId": "vendor_id",
      "score": <0-100>,
      "rank": <number>,
      "scoreBreakdown": {
        "price": <0-40 points>,
        "delivery": <0-25 points>,
        "warranty": <0-15 points>,
        "terms": <0-10 points>,
        "completeness": <0-10 points>
      },
      "pros": ["list of advantages"],
      "cons": ["list of disadvantages"],
      "complianceCheck": {
        "meetsBudget": <boolean>,
        "meetsDelivery": <boolean>,
        "meetsWarranty": <boolean>,
        "overallCompliance": "FULL/PARTIAL/NON-COMPLIANT"
      },
      "valueAdds": ["additional benefits"],
      "riskFactors": ["potential risks"],
      "notes": "detailed assessment"
    }
  ],
  "recommendation": {
    "recommendedVendorId": "best_vendor_id",
    "reasoning": "detailed explanation considering all factors",
    "priceSavings": <number or null>,
    "keyAdvantages": ["main reasons for recommendation"],
    "considerations": ["things to consider before accepting"]
  },
  "summary": "executive summary of comparison"
}

Scoring Criteria:
- Price (40 pts): Best price = 40, scale down for higher prices
- Delivery (25 pts): Meets/beats deadline = 25, late = 0-15
- Warranty (15 pts): Exceeds requirement = 15, meets = 10, below = 5
- Terms (10 pts): Favorable payment/delivery terms
- Completeness (10 pts): All info provided = 10, incomplete = 5

Return ONLY valid JSON, no markdown.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const comparison = JSON.parse(jsonMatch[0]);
        // Sort by score and assign ranks
        comparison.analysis.sort((a, b) => b.score - a.score);
        comparison.analysis.forEach((item, index) => item.rank = index + 1);
        return comparison;
      }
    } catch (error) {
      if (error.message.includes('AI_CONFIG_ERROR') || error.message.includes('AI_AUTH_ERROR')) {
        console.log('AI service unavailable, using fallback comparison');
      } else {
        console.log('AI comparison failed, using enhanced fallback...', error.message);
      }
    }

    // Enhanced fallback with comprehensive scoring
    const rfpBudget = rfpContext.budget || 999999;
    const rfpDeliveryDate = rfpContext.deliveryDate ? new Date(rfpContext.deliveryDate) : null;
    
    // Find lowest price for relative scoring
    const prices = proposals.map(p => p.totalPrice).filter(p => p !== null);
    const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const highestPrice = prices.length > 0 ? Math.max(...prices) : 0;
    
    const analysis = proposals.map(proposal => {
      const scores = {
        price: 0,
        delivery: 0,
        warranty: 0,
        terms: 0,
        completeness: 0
      };
      
      // Price scoring (40 points) - Relative to other proposals AND budget
      if (proposal.totalPrice) {
        // First check budget compliance
        const priceRatio = proposal.totalPrice / rfpBudget;
        let budgetScore = 0;
        
        if (priceRatio <= 0.7) budgetScore = 20;      // 70% or less of budget
        else if (priceRatio <= 0.8) budgetScore = 18; // 80% of budget
        else if (priceRatio <= 0.9) budgetScore = 16; // 90% of budget
        else if (priceRatio <= 1.0) budgetScore = 14; // At budget
        else if (priceRatio <= 1.1) budgetScore = 8;  // 10% over
        else budgetScore = 4; // More than 10% over
        
        // Then compare to other proposals (relative scoring)
        let relativeScore = 0;
        if (prices.length > 1 && highestPrice > lowestPrice) {
          // Best price gets 20 points, worst gets 0, others scaled
          const priceRange = highestPrice - lowestPrice;
          const pricePosition = highestPrice - proposal.totalPrice;
          relativeScore = Math.round((pricePosition / priceRange) * 20);
        } else if (proposal.totalPrice === lowestPrice) {
          relativeScore = 20; // Only one proposal or tied for best
        } else {
          relativeScore = 10; // Default middle score
        }
        
        scores.price = budgetScore + relativeScore; // Max 40 points
      }
      
      // Delivery scoring (25 points)
      if (proposal.deliveryDate && rfpDeliveryDate) {
        const proposalDate = new Date(proposal.deliveryDate);
        const daysDiff = Math.floor((proposalDate - rfpDeliveryDate) / (1000 * 60 * 60 * 24));
        if (daysDiff <= -5) scores.delivery = 25; // 5+ days early
        else if (daysDiff <= 0) scores.delivery = 22; // On time or early
        else if (daysDiff <= 5) scores.delivery = 15; // Slightly late
        else scores.delivery = 5; // Too late
      } else {
        scores.delivery = 10; // No delivery info
      }
      
      // Warranty scoring (15 points)
      if (proposal.warranty) {
        const warrantyText = proposal.warranty.toLowerCase();
        if (warrantyText.includes('3 year') || warrantyText.includes('36 month')) scores.warranty = 15;
        else if (warrantyText.includes('2 year') || warrantyText.includes('24 month')) scores.warranty = 12;
        else if (warrantyText.includes('1 year') || warrantyText.includes('12 month')) scores.warranty = 8;
        else scores.warranty = 5;
      }
      
      // Terms scoring (10 points)
      if (proposal.terms?.paymentTerms) {
        const terms = proposal.terms.paymentTerms.toLowerCase();
        if (terms.includes('net 60') || terms.includes('net 90')) scores.terms = 10;
        else if (terms.includes('net 30')) scores.terms = 8;
        else scores.terms = 5;
      }
      
      // Completeness scoring (10 points)
      scores.completeness = proposal.isComplete ? 10 : 5;
      
      const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
      
      // Compliance check
      const meetsBudget = proposal.totalPrice ? proposal.totalPrice <= rfpBudget : false;
      const meetsDelivery = proposal.deliveryDate && rfpDeliveryDate ? 
        new Date(proposal.deliveryDate) <= rfpDeliveryDate : false;
      const meetsWarranty = proposal.warranty ? true : false;
      
      const complianceCount = [meetsBudget, meetsDelivery, meetsWarranty].filter(Boolean).length;
      const overallCompliance = complianceCount === 3 ? 'FULL' : 
                               complianceCount >= 2 ? 'PARTIAL' : 'NON-COMPLIANT';
      
      // Generate pros and cons
      const pros = [];
      const cons = [];
      const valueAdds = [];
      const riskFactors = [];
      
      if (scores.price >= 30) pros.push('Competitive pricing within budget');
      else cons.push('Price exceeds budget or not competitive');
      
      if (scores.delivery >= 20) pros.push('Meets or exceeds delivery timeline');
      else cons.push('Delivery timeline may not meet requirements');
      
      if (scores.warranty >= 10) pros.push('Adequate warranty coverage');
      else cons.push('Limited or no warranty information');
      
      if (proposal.isComplete) pros.push('Complete proposal with all details');
      else cons.push('Incomplete proposal - missing information');
      
      if (proposal.terms?.additionalConditions?.length > 0) {
        valueAdds.push(...proposal.terms.additionalConditions);
      }
      
      if (!proposal.isComplete) riskFactors.push('Incomplete information may hide additional costs');
      if (!meetsBudget) riskFactors.push('Over budget - requires additional approval');
      if (!meetsDelivery) riskFactors.push('Delivery timeline may cause project delays');
      
      return {
        vendorId: proposal.vendorId,
        score: totalScore,
        rank: 0, // Will be assigned after sorting
        scoreBreakdown: scores,
        pros,
        cons,
        complianceCheck: {
          meetsBudget,
          meetsDelivery,
          meetsWarranty,
          overallCompliance
        },
        valueAdds: valueAdds.length > 0 ? valueAdds : ['Standard offering'],
        riskFactors: riskFactors.length > 0 ? riskFactors : ['No significant risks identified'],
        notes: `Score: ${totalScore}/100. ${overallCompliance} compliance with RFP requirements.`
      };
    });
    
    // Sort by score and assign ranks
    analysis.sort((a, b) => b.score - a.score);
    analysis.forEach((item, index) => item.rank = index + 1);
    
    // Generate recommendation
    const topVendor = analysis[0];
    const secondVendor = analysis[1];
    
    let priceSavings = null;
    if (topVendor && secondVendor) {
      const topPrice = proposals.find(p => p.vendorId === topVendor.vendorId)?.totalPrice;
      const secondPrice = proposals.find(p => p.vendorId === secondVendor.vendorId)?.totalPrice;
      if (topPrice && secondPrice) {
        priceSavings = secondPrice - topPrice;
      }
    }
    
    const keyAdvantages = topVendor ? topVendor.pros.slice(0, 3) : [];
    const considerations = topVendor ? topVendor.riskFactors : [];
    
    return {
      analysis,
      recommendation: {
        recommendedVendorId: topVendor?.vendorId,
        reasoning: `Vendor ranks #1 with ${topVendor?.score}/100 points. ${topVendor?.complianceCheck.overallCompliance} compliance with RFP requirements. Best overall value considering price (${topVendor?.scoreBreakdown.price}/40), delivery (${topVendor?.scoreBreakdown.delivery}/25), warranty (${topVendor?.scoreBreakdown.warranty}/15), and terms (${topVendor?.scoreBreakdown.terms}/10).`,
        priceSavings,
        keyAdvantages,
        considerations: considerations.length > 0 ? considerations : ['Review final terms before acceptance']
      },
      summary: `Analyzed ${proposals.length} proposals. Top vendor scores ${topVendor?.score}/100 with ${topVendor?.complianceCheck.overallCompliance} compliance. ${priceSavings ? `Potential savings of $${priceSavings.toLocaleString()} vs next best option.` : 'Recommendation based on comprehensive scoring across all criteria.'}`
    };
  }
}

module.exports = { AIService };
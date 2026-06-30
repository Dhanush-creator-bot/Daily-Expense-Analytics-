/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
app.use(express.json());

const PORT = 3000;

// Shared lazy-loaded Gemini AI client helper to avoid crashes if API key is not present on boot
let genAIClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required for AI features.');
    }
    genAIClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

// AI spending insights proxy endpoint
app.post('/api/ai/spending-insights', async (req, res) => {
  try {
    const { transactions } = req.body;

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({
        error: 'No transactions provided for analysis.',
      });
    }

    // Lazy load and obtain the Gemini API client
    const ai = getGenAI();

    // Prepare content for prompt
    const formattedTransactions = transactions.map((t: any) => ({
      type: t.type,
      amount: t.amount,
      category: t.category,
      date: t.date,
      note: t.note || '',
    }));

    const prompt = `You are an expert personal financial advisor and spending analyst. 
Analyze the following list of transactions for the user (currency is USD) and provide high-quality financial insights.
Identify major spending categories, any potential overspending patterns, savings opportunities, and a high-level summary of their financial posture.

Transactions:
${JSON.stringify(formattedTransactions, null, 2)}

Provide your response strictly conforming to the requested JSON schema. Be constructive, motivating, and friendly!`;

    // Query Gemini 3.5-flash with structured JSON schema
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an elite financial coach. Your goal is to guide professionals to build wealth and stop overspending through actionable, data-driven micro-insights.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { 
              type: Type.STRING, 
              description: 'A comprehensive, 2-3 sentence overview of the user\'s financial health and primary spending trends based on the transaction log.' 
            },
            insights: {
              type: Type.ARRAY,
              description: 'List of specific actionable recommendations or micro-insights.',
              items: {
                type: Type.OBJECT,
                properties: {
                  headline: { 
                    type: Type.STRING, 
                    description: 'A punchy, clear, human-focused title for the insight (e.g. "Restaurant Overspend Alert" or "Strong Savings Rate").' 
                  },
                  recommendation: { 
                    type: Type.STRING, 
                    description: 'Specific, detailed financial recommendation with concrete numbers based on their data. Mention the category and how they can optimize it.' 
                  },
                  severity: { 
                    type: Type.STRING, 
                    enum: ['low', 'medium', 'high'],
                    description: 'The priority of the insight (low for general encouragement/tips, high for critical leak/overspending).' 
                  },
                  category: { 
                    type: Type.STRING, 
                    description: 'The name of the category this applies to (e.g., Food, Shopping, Transport, Rent, or General).' 
                  },
                },
                required: ['headline', 'recommendation', 'severity'],
              },
            },
            savingsPotential: { 
              type: Type.NUMBER, 
              description: 'An estimated total dollar amount the user could save monthly by acting on these insights.' 
            },
          },
          required: ['summary', 'insights', 'savingsPotential'],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error('Gemini returned an empty response.');
    }

    const insightsData = JSON.parse(resultText.trim());
    return res.json(insightsData);

  } catch (error: any) {
    console.error('Gemini Spend Analytics API Error:', error);
    return res.status(500).json({
      error: error.message || 'An error occurred during transaction analysis.',
    });
  }
});

// Setup dev vs production servers
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Starting Express server in DEVELOPMENT mode...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Starting Express server in PRODUCTION mode...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express server successfully running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

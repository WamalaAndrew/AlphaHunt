import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Pesapal Payment Initiation
  app.post("/api/initiate-payment", async (req, res) => {
    const { amount, currency, email, name, phoneNumber } = req.body;
    try {
      const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
      const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;

      if (!consumerKey || !consumerSecret) {
        return res.status(500).json({ error: "Pesapal credentials not configured" });
      }

      // 1. Get Auth Token
      const authResponse = await axios.post('https://pay.pesapal.com/v3/api/Auth/RequestToken', {
        consumer_key: consumerKey,
        consumer_secret: consumerSecret
      });
      const token = authResponse.data.token;

      const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;

      // 2. Submit Order
      const orderResponse = await axios.post('https://pay.pesapal.com/v3/api/Transactions/SubmitOrderRequest', {
        id: `order_${Date.now()}`,
        currency: currency || 'UGX',
        amount: amount,
        description: 'Payment for AlphaHunt service',
        callback_url: `${appUrl}/api/payment-callback`,
        notification_id: 'YOUR_NOTIFICATION_ID',
        billing_address: {
          email_address: email,
          phone_number: phoneNumber,
          first_name: name
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      res.json({ redirectUrl: orderResponse.data.redirect_url });
    } catch (error: any) {
      console.error("Pesapal error:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to initiate payment" });
    }
  });

  // Pesapal Payment Callback
  app.get("/api/payment-callback", async (req, res) => {
    const { OrderTrackingId, OrderMerchantReference } = req.query;
    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    
    try {
      // In a real scenario, you would verify the transaction status with Pesapal here
      // using the OrderTrackingId and your credentials.
      console.log("Payment callback received:", { OrderTrackingId, OrderMerchantReference });
      
      // For now, we redirect to the frontend status page
      res.redirect(`${appUrl}/payment-status?status=success&trackingId=${OrderTrackingId}`);
    } catch (error: any) {
      console.error("Callback error:", error);
      res.redirect(`${appUrl}/payment-status?status=failure`);
    }
  });

  app.get("/api/jobs", async (req, res) => {
    console.log("Received request to /api/jobs", req.query);
    try {
      const appId = process.env.VITE_ADZUNA_APP_ID || process.env.ADZUNA_APP_ID;
      const appKey = process.env.VITE_ADZUNA_APP_KEY || process.env.ADZUNA_APP_KEY;

      if (!appId || !appKey) {
        return res.status(500).json({ error: "Adzuna API credentials not configured" });
      }

      const { query, location, country } = req.query;
      const countryCode = country || 'gb'; // Default to 'gb' if not provided

      const response = await axios.get(`https://api.adzuna.com/v1/api/jobs/${countryCode}/search/1`, {
        params: {
          app_id: appId,
          app_key: appKey,
          results_per_page: 20,
          what: query || 'software',
          where: location || 'london',
        },
      });

      res.json(response.data);
    } catch (error: any) {
      console.error('Error fetching jobs from Adzuna:', error.response?.data || error.message);
      res.status(500).json({ error: "Failed to fetch jobs", details: error.response?.data || error.message });
    }
  });

  // Google Jobs API via SerpApi (Supports Uganda, BrighterMonday, etc.)
  app.get("/api/jobs/google", async (req, res) => {
    try {
      const apiKey = process.env.SERPAPI_KEY;
      if (!apiKey) {
        // Return empty array if no key is configured so it doesn't break the frontend
        return res.json({ jobs_results: [] });
      }

      const { query, location } = req.query;
      const response = await axios.get('https://serpapi.com/search.json', {
        params: {
          engine: 'google_jobs',
          q: `${query || 'jobs'} in ${location || 'Uganda'}`,
          hl: 'en',
          api_key: apiKey,
        }
      });

      res.json(response.data);
    } catch (error: any) {
      console.error('Error fetching jobs from SerpApi:', error.response?.data || error.message);
      res.status(500).json({ error: "Failed to fetch jobs from Google Jobs" });
    }
  });

  // JSearch API via RapidAPI (Excellent for Uganda/East Africa)
  app.get("/api/jobs/jsearch", async (req, res) => {
    try {
      const apiKey = process.env.RAPIDAPI_KEY;
      if (!apiKey) {
        return res.json({ data: [] });
      }

      const { query, location } = req.query;
      const response = await axios.get('https://jsearch.p.rapidapi.com/search', {
        params: {
          query: `${query || 'jobs'} in ${location || 'Uganda'}`,
          page: '1',
          num_pages: '1'
        },
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
        }
      });

      res.json(response.data);
    } catch (error: any) {
      const errorData = error.response?.data;
      console.error('Error fetching jobs from JSearch:', errorData || error.message);
      
      // If not subscribed or rate limited, return empty data so the UI doesn't break
      if (errorData?.message?.includes('not subscribed') || errorData?.message?.includes('Too many requests')) {
        return res.json({ data: [], error: errorData.message });
      }
      
      res.status(500).json({ error: "Failed to fetch jobs from JSearch" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

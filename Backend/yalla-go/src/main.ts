import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { https } from 'firebase-functions/v2';

// Log all environment variable keys (for debugging)
console.log("✅ All process.env keys:");
console.log(Object.keys(process.env));

// Craete an Express server
const server = express();

// Keep a reference to avoid re-creating Nest on every request
let nestAppInitialized = false;

// Create the NestJS app using the Express adapter
// This fucntions initializes the app module and returns the instance
export const createNestServer = async (expressInstance) => {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressInstance));
  await app.init();
  return app; // ✅ This line is critical
};

// Check if running in development mode
if (process.env.NODE_ENV === 'development') {
  // Local dev: start HTTP server
  createNestServer(server).then(app => {
    app.listen(3000, () => {
      console.log('✅ Nest app listening on http://localhost:3000');
    });
  });
} 

// Production: Firebase v2 Function
export const yallago = https.onRequest(
  {
    region: 'asia-south1', // set server location to mumbai
    // Reference the secret name directly
    secrets: ['GOOGLE_MAPS_API_KEY'],
  },
  async (req, res) => {
    // Confirm the secret is available in process.env
    console.log('✅ process.env.GOOGLE_MAPS_API_KEY:', !!process.env.GOOGLE_MAPS_API_KEY);

    // Initialize Nest only once
    if (!nestAppInitialized) {
      await createNestServer(server);
      nestAppInitialized = true;
    }

    // Delegate the request to the Express server
    server(req, res);
  }
);

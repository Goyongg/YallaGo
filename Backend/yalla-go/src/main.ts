import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import * as functions from 'firebase-functions'

console.log("✅ All process.env keys:");
console.log(Object.keys(process.env));

// Craete an Express server
const server = express();

export const createNestServer = async (expressInstance) => {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressInstance));
  await app.init();
  return app; // ✅ This line is critical
};

if (process.env.NODE_ENV !== 'production') {
  // Local dev: start HTTP server
  createNestServer(server).then(app => {
    app.listen(3000, () => {
      console.log('✅ Nest app listening on http://localhost:3000');
    });
  });
} else {
  // Firebase Functions: only export the handler
  createNestServer(server);
}

// Export the Firebase Cloud Function handler
export const api = functions.https.onRequest(server);

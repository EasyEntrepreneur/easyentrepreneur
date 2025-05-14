import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import documentRoutes from './routes/documents';
import paymentIntentRoute from './routes/paymentIntent'; // ✅ Ajout de la route stripe
import stripeRoutes from './routes/stripe';
import getPaymentMethodsRoute from './routes/getPaymentMethods';
import getCustomerIdRoute from './routes/getCustomerId';
import savePaymentMethodRoute from './routes/savePaymentMethod';
import payRoute from './routes/stripe/pay';


dotenv.config(); // Chargement dotenv en premier
console.log("OPENAI_API_KEY:", process.env.OPENAI_API_KEY); // vérification clé
console.log("STRIPE_SECRET_KEY:", process.env.STRIPE_SECRET_KEY); // vérification clé stripe

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/documents', documentRoutes);
app.use('/api/payment-intent', paymentIntentRoute); // ✅ Nouvelle route Stripe
app.use('/api/stripe', stripeRoutes); // ✅ pas .use('/api/stripe', async ...)
app.use('/api/get-payment-methods', getPaymentMethodsRoute); // ✅ OK
app.use('/api/get-customer-id', getCustomerIdRoute); // ✅ sans parenthèses
app.use('/api/save-payment-method', savePaymentMethodRoute);
app.use('/api/stripe/pay', payRoute);

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});

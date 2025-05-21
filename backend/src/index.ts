import express from 'express'
import path from 'path';
import cors from 'cors'
import dotenv from 'dotenv'
import documentRoutes from './routes/documents'
import paymentIntentRoute from './routes/paymentIntent'
import stripeRoutes from './routes/stripe'
import getPaymentMethodsRoute from './routes/getPaymentMethods'
import getCustomerIdRoute from './routes/getCustomerId'
import savePaymentMethodRoute from './routes/savePaymentMethod'
import payRoute from './routes/stripe/pay'
import authRoutes from './routes/auth' // 🆕 auth centralisée
import userRoutes from './routes/users';
import billingRoutes from './routes/billing';
import paymentRoutes from './routes/payment';
import getCustomerId from './routes/getCustomerId';
import savePaymentMethod from './routes/savePaymentMethod';
import registerRoute from './routes/auth/register';
import confirmPaymentRoute from './routes/stripe/confirm-payment';
import createSubscription from './routes/createSubscription';
import confirmEmailRoute from './routes/confirmEmail';
import updateUserInfoRoutes from './routes/updateUserInfo';
import invoicesRoute from './routes/invoices'
import issuerRouter from "./routes/issuer";
import clientRouter from "./routes/client";
import quotaRouter from './routes/quota';


dotenv.config()

const app = express()
const port = process.env.PORT || 4000

// Debug des clés
console.log('🔑 OPENAI_API_KEY:', process.env.OPENAI_API_KEY)
console.log('💳 STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY)

app.use(
  cors({
    origin: "http://localhost:3000",  // ou process.env.FRONTEND_URL
    credentials: true,                // <— autorise les cookies et le header Authorization
  })
);
app.use(express.json())

// ✅ Toutes les routes passent sous /api
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes) // Pour infos profil, maj données, etc.
app.use('/api/documents', documentRoutes)
app.use('/api', paymentRoutes);

app.use('/api/stripe', stripeRoutes)
app.use('/api/stripe/payment-intent', paymentIntentRoute)
app.use('/api/stripe/pay', payRoute)
app.use('/api/stripe/get-payment-methods', getPaymentMethodsRoute)
app.use('/api/stripe/get-customer-id', getCustomerIdRoute)
app.use('/api/stripe/save-payment-method', savePaymentMethodRoute)
app.use('/api/billing', billingRoutes);
app.use('/api/get-customer-id', getCustomerId);
app.use('/api/save-payment-method', savePaymentMethod);
app.use('/api/auth/register', registerRoute);

app.use('/api/stripe/confirm-payment', confirmPaymentRoute);
app.use('/api', createSubscription);

app.use('/api', confirmEmailRoute);

app.use('/api', updateUserInfoRoutes);

app.use('/api/invoices', invoicesRoute)
app.use('/api/issuer', issuerRouter);
app.use("/api/client", clientRouter);

app.use("/api/quota", quotaRouter);

app.use('/invoices', express.static(path.join(__dirname, 'invoices_pdf')));

app.listen(port, () => {
  console.log(`🚀 API backend running at: http://localhost:${port}/api`)
})
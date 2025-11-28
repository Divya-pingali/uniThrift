require("dotenv").config();

const functions = require("firebase-functions");
const Stripe = require("stripe");

const stripe = new Stripe(process.env.EXPO_PUBLIC_STRIPE_SECRET_KEY);

exports.createPaymentIntent = functions.https.onCall(async (data, context) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: data.amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
    });

    return { clientSecret: paymentIntent.client_secret };
  } catch (error) {
    return { error: error.message };
  }
});

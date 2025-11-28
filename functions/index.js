const functions = require("firebase-functions");

const Stripe = require("stripe");

require("dotenv").config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

exports.createPaymentIntent = functions.https.onCall(async (data, context) => {
  console.log("Received data:", data); // Add this line
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 200,   
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
    });

    return { clientSecret: paymentIntent.client_secret };

  } catch (error) {
    console.error("Error creating payment intent:", error);
    return { error: error.message };
  }
});

const functions = require("firebase-functions");
const Stripe = require("stripe");
require("dotenv").config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

exports.createPaymentIntent = functions.https.onCall(async (request) => {
  try {
    const data = request.data;
    const amount = data.amount;

    if (
      !amount ||
      amount <= 0 ||
      isNaN(amount) ||
      typeof amount !== "number"
    ) {
      throw new Error("Invalid amount sent to payment intent");
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "hkd",
      automatic_payment_methods: { enabled: true },
    });

    return {
      clientSecret: paymentIntent.client_secret,
    };

  } catch (error) {
    console.error("Error creating payment intent:", error);
    return { error: error.message };
  }
});

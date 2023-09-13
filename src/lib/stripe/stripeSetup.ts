// connect to stripe
import Stripe from "stripe";

const stripeSecret = process.env.STRIPE_SECRET as string;

const stripe = new Stripe(stripeSecret, {
  apiVersion: "2023-08-16",
  typescript: true,
});
// Stripe object export
export { stripe };

// The two Flexi membership products in Stripe - a pack of 10 sessions at
// the full price or the concession price (over 65s and registered disabled).
// Used by the new member sign-up form and by existing members' top-ups.
//
// Prices shown on the site come from env vars; the amount actually charged
// is each product's default price in Stripe, so keep the two in step.
export const FLEXI_PRODUCTS = [
  {
    id: "prod_NPVoljs1x5z8TW",
    label: "Non Concession",
    price: process.env.NEXT_PUBLIC_FLEXI_FULL_PRICE,
  },
  {
    id: "prod_NPW4JZ4qmBULfB",
    label: "Concession",
    price: process.env.NEXT_PUBLIC_FLEXI_CONCESSION_PRICE,
  },
];

export const FULL_PRICE_PRODUCT_ID = FLEXI_PRODUCTS[0].id;

// True for one of our Flexi product ids (so a request can't buy anything else)
export const isFlexiProduct = (id: unknown) =>
  FLEXI_PRODUCTS.some((product) => product.id === id);

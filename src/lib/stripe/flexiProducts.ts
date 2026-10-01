// The two Flexi membership products in Stripe - a pack of 10 sessions at
// the full price or the concession price (over 65s and registered disabled).
//
// Concession is no longer offered to new members: sign-ups always get the
// full price pack. Members who already joined as concession keep it - they're
// recognised by their flexi_type ("Flexi Concession"), see isConcessionMember.
//
// Prices shown on the site, and in the app's payment drawer, come from the
// env vars below (.env.local / the server's env), so they're easy to update.
// The amount Stripe actually charges online is each product's default price
// in Stripe, so keep the two in step when changing a price.
export const FULL_PRICE_PRODUCT = {
  id: "prod_NPVoljs1x5z8TW",
  label: "Non Concession",
  price: Number(process.env.NEXT_PUBLIC_FLEXI_FULL_PRICE),
};

export const CONCESSION_PRODUCT = {
  id: "prod_NPW4JZ4qmBULfB",
  label: "Concession",
  price: Number(process.env.NEXT_PUBLIC_FLEXI_CONCESSION_PRICE),
};

export const FLEXI_PRODUCTS = [FULL_PRICE_PRODUCT, CONCESSION_PRODUCT];

export const FULL_PRICE_PRODUCT_ID = FULL_PRICE_PRODUCT.id;

// True for one of our Flexi product ids (so a request can't buy anything else)
export const isFlexiProduct = (id: unknown) =>
  FLEXI_PRODUCTS.some((product) => product.id === id);

// Whether an existing member pays the concession price, from the Flexi pack
// they bought ("Flexi Concession" - but not "Flexi Non Concession").
export const isConcessionMember = (member: { flexi_type?: string }) =>
  /concession/i.test(member.flexi_type || "") &&
  !/non/i.test(member.flexi_type || "");

// The Flexi pack a member should buy: concession members keep concession,
// everyone else (including all new members) pays the full price.
export const flexiProductFor = (member: { flexi_type?: string }) =>
  isConcessionMember(member) ? CONCESSION_PRODUCT : FULL_PRICE_PRODUCT;

// Paying cash at a rehearsal is cheaper - we pass on the card fee saving.
// FLEXI_CASH_DISCOUNT (£, server only) - defaults to £5 if it isn't set.
export const cashDiscount = () => {
  const discount = Number(process.env.FLEXI_CASH_DISCOUNT ?? 5);
  return Number.isFinite(discount) ? discount : 5;
};

// What to charge for a pack of 10 at a rehearsal desk:
//   full price:  card £95, cash £90
//   concession:  card £85, cash £80
// (with the default prices and £5 cash discount)
export const deskPricesFor = (member: { flexi_type?: string }) => {
  const { price } = flexiProductFor(member);
  return { card: price, cash: price - cashDiscount() };
};

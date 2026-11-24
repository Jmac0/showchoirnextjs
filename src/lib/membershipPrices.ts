import { monthlyAmountPence } from "./gocardless";
import { FULL_PRICE_PRODUCT } from "./stripe/flexiProducts";

// The membership prices shown on the public pages (the choir pages and the
// Walton page), in pounds, from the settings (env) - so a price change is
// made once, not in each page. For getStaticProps (server only).
// flexiPrice is null when NEXT_PUBLIC_FLEXI_FULL_PRICE isn't set, and the
// Flexi card is then left out
export function membershipPrices() {
  const flexi = FULL_PRICE_PRODUCT.price;
  return {
    monthlyPrice: Number(monthlyAmountPence()) / 100,
    flexiPrice: Number.isFinite(flexi) && flexi > 0 ? flexi : null,
  };
}

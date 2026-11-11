import type { GetServerSidePropsContext } from "next";
import Head from "next/head";
import { getServerSession } from "next-auth/next";
import React, { useEffect } from "react";

import { AdminRibbon } from "@/src/components/admin/AdminRibbon";
import MemberNav from "@/src/components/Navigation/MemberNav";
import { Basket } from "@/src/components/shop/Basket";
import { MyOrders } from "@/src/components/shop/MyOrders";
import { ProductCard } from "@/src/components/shop/ProductCard";
import { useBasket } from "@/src/components/shop/useBasket";
import { getChoirVenues } from "@/src/lib/contentfulClient";
import dbConnect from "@/src/lib/dbConnect";
import { isMembershipActive } from "@/src/lib/directDebit";
import Members from "@/src/lib/models/member";
import {
  confirmReturningOrder,
  listProducts,
  memberOrders,
} from "@/src/lib/shop";
import { ShopOrderRow, ShopProductRow } from "@/src/lib/shopShared";
import { choirNames } from "@/src/lib/venues";
import { authOptions } from "@/src/pages/api/auth/[...nextauth]";

type Props = {
  products: ShopProductRow[];
  venues: string[];
  homeChoir: string;
  orders: ShopOrderRow[];
  // Just back from paying (?order=...): the order, once it's paid
  justPaid: ShopOrderRow | null;
  // Just back from Stripe without paying
  cancelled: boolean;
};

// Members' kit shop: Show Choir T-shirts, hoodies etc. Pick items (and
// sizes), choose the choir to bring them to, then pay on Stripe's checkout
// page. Products are set up by admins (Shop → Products); orders show under
// "Your orders" and on the admin Orders page.
export default function Shop({
  products,
  venues,
  homeChoir,
  orders,
  justPaid,
  cancelled,
}: Props) {
  const basket = useBasket();
  const { lines, keepOnly, clear } = basket;
  const paidId = justPaid?.id;

  // Paid - the basket's done with
  useEffect(() => {
    if (paidId) clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paidId]);

  // Drop anything taken off the shop since it was added (or a size no
  // longer offered), so the basket can still be paid for
  useEffect(() => {
    keepOnly((line) => {
      const product = products.find((p) => p.id === line.product_id);
      return (
        !!product && (!product.has_sizes || product.sizes.includes(line.size))
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines, products]);

  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <div className="m-0 flex w-full p-0">
      <Head>
        <title>Shop</title>
      </Head>
      <MemberNav />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Admins only - every admin tool */}
        <AdminRibbon />
        <div className="flex w-full flex-col items-center px-4 pb-24 pt-10 md:px-8">
          <h1>Show Choir Shop</h1>
          <p className="mt-0 max-w-xl text-center text-gray-300">
            Kit for members. Everything is made to order and brought to your
            choir, so there&apos;s no postage.
          </p>

          {justPaid && (
            <div
              role="status"
              className="mb-6 w-full max-w-2xl rounded-lg border-2 border-lightGold bg-lightBlack p-5 text-center"
            >
              <h2 className="m-0 p-0 text-2xl text-lightGold">
                Thank you - your order {justPaid.reference} is in!
              </h2>
              <p className="mb-0 text-gray-300">
                We&apos;ve emailed you a confirmation. We&apos;ll bring it to{" "}
                {justPaid.venue} when it&apos;s ready.
              </p>
            </div>
          )}
          {cancelled && (
            <p
              role="status"
              className="mb-6 w-full max-w-2xl rounded-lg border border-lightGold/60 bg-lightBlack p-4 text-center text-gray-300"
            >
              Payment cancelled - nothing has been taken. Your basket is still
              here.
            </p>
          )}

          {/* On phones: jump down to the basket */}
          {itemCount > 0 && (
            <a
              href="#basket"
              className="fixed bottom-4 right-4 z-10 rounded-full bg-lightGold px-5 py-3 font-bold text-black shadow-lg lg:hidden"
            >
              Basket ({itemCount})
            </a>
          )}

          <div className="flex w-full max-w-6xl flex-col gap-8 lg:flex-row lg:items-start">
            {/* min-w-0: lets the products share the row with the basket
                rather than pushing it off the side */}
            <div className="grid min-w-0 flex-1 grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {products.length === 0 && (
                <p className="text-gray-300">
                  Nothing in the shop yet - check back soon!
                </p>
              )}
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={basket.add}
                />
              ))}
            </div>
            <div
              id="basket"
              className="flex w-full flex-col gap-8 lg:sticky lg:top-6 lg:w-96 lg:shrink-0"
            >
              <Basket
                lines={lines}
                products={products}
                venues={venues}
                homeChoir={homeChoir}
                onQuantity={basket.setQuantity}
                onRemove={basket.remove}
              />
              <MyOrders orders={orders} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Active members only - checked on the server, same as Music & Lyrics
// (others are sent to their Account page). Photo links are made fresh per
// visit.
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) {
    return { redirect: { destination: "/auth/signin", permanent: false } };
  }
  await dbConnect();
  const member = await Members.findOne({ email: session.user?.email });
  if (!member || !isMembershipActive(member)) {
    return {
      redirect: {
        destination: "/members/dashboard?component=account",
        permanent: false,
      },
    };
  }

  const { order, cancelled } = context.query;
  // Back from paying: make sure the order's marked paid (Stripe's message
  // to the webhook can arrive a moment after the member does)
  const justPaid =
    typeof order === "string"
      ? await confirmReturningOrder(order, member._id)
      : null;

  const [products, venues, orders] = await Promise.all([
    listProducts({ visibleOnly: true, requestHost: context.req.headers.host }),
    getChoirVenues(),
    memberOrders(member._id),
  ]);

  return {
    props: {
      products,
      venues: choirNames(venues),
      homeChoir: member.home_choir || "",
      orders,
      justPaid,
      cancelled: cancelled === "1",
    },
  };
}

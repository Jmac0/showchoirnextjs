import {
  checkProduct,
  formatPence,
  orderReference,
  parsePrice,
  priceBasket,
  PricedProduct,
} from "@/src/lib/shopShared";

const hoodie: PricedProduct = {
  id: "aaaaaaaaaaaaaaaaaaaaaaaa",
  name: "Hoodie",
  price_pence: 3000,
  has_sizes: true,
  sizes: ["S", "M", "L"],
  visible: true,
};
const bottle: PricedProduct = {
  id: "bbbbbbbbbbbbbbbbbbbbbbbb",
  name: "Water bottle",
  price_pence: 850,
  has_sizes: false,
  sizes: [],
  visible: true,
};
const hidden: PricedProduct = { ...bottle, id: "c".repeat(24), visible: false };
const products = [hoodie, bottle, hidden];

describe("Shop - prices", () => {
  it("Should read prices typed in pounds", () => {
    expect(parsePrice("25")).toBe(2500);
    expect(parsePrice("25.5")).toBe(2550);
    expect(parsePrice("£25.05")).toBe(2505);
    expect(parsePrice(" 8.50 ")).toBe(850);
    expect(parsePrice("25.555")).toBeNull();
    expect(parsePrice("abc")).toBeNull();
    expect(parsePrice({ $gt: 0 })).toBeNull();
  });

  it("Should show prices without needless pence", () => {
    expect(formatPence(2500)).toBe("£25");
    expect(formatPence(2550)).toBe("£25.50");
    expect(formatPence(5)).toBe("£0.05");
  });

  it("Should make a short order reference", () => {
    expect(orderReference("65a1b2c3d4e5f60718293a4b")).toBe("293A4B");
  });
});

describe("Shop - checking a product", () => {
  const good = {
    name: " Hoodie ",
    description: "Black",
    price: "30",
    has_sizes: true,
    sizes: ["S", " M ", "m", ""],
    image_keys: [`shop/${"a".repeat(24)}-hoodie.jpg`],
  };

  it("Should tidy up a good product", () => {
    expect(checkProduct(good)).toEqual({
      name: "Hoodie",
      description: "Black",
      price_pence: 3000,
      has_sizes: true,
      sizes: ["S", "M"],
      visible: true,
      sort_order: 0,
      image_keys: [`shop/${"a".repeat(24)}-hoodie.jpg`],
    });
  });

  it("Should drop sizes when the product doesn't come in sizes", () => {
    const result = checkProduct({ ...good, has_sizes: false });
    expect(result).toMatchObject({ has_sizes: false, sizes: [] });
  });

  it("Should turn down bad products", () => {
    expect(checkProduct({ ...good, name: "" })).toHaveProperty("error");
    expect(checkProduct({ ...good, price: "0.10" })).toHaveProperty("error");
    expect(checkProduct({ ...good, price: "free" })).toHaveProperty("error");
    expect(checkProduct({ ...good, sizes: [] })).toHaveProperty("error");
    // Photo keys must be ones we made (shop/<id>-<name>)
    expect(
      checkProduct({ ...good, image_keys: ["songs/x/secret.mp3"] })
    ).toHaveProperty("error");
    expect(
      checkProduct({ ...good, image_keys: [`shop/${"a".repeat(24)}-../x`] })
    ).toHaveProperty("error");
  });
});

describe("Shop - pricing a basket", () => {
  it("Should price from the products, not the basket", () => {
    const result = priceBasket(
      [
        { product_id: hoodie.id, size: "M", quantity: 2, unit_pence: 1 },
        { product_id: bottle.id, size: "XL", quantity: 1 },
      ],
      products
    );
    expect(result).toEqual({
      items: [
        {
          product_id: hoodie.id,
          name: "Hoodie",
          size: "M",
          quantity: 2,
          unit_pence: 3000,
        },
        // No sizes - any size sent is ignored
        {
          product_id: bottle.id,
          name: "Water bottle",
          size: "",
          quantity: 1,
          unit_pence: 850,
        },
      ],
      total_pence: 6850,
    });
  });

  it("Should add the same product and size together", () => {
    const result = priceBasket(
      [
        { product_id: hoodie.id, size: "M", quantity: 2 },
        { product_id: hoodie.id, size: "M", quantity: 1 },
        { product_id: hoodie.id, size: "L", quantity: 1 },
      ],
      products
    );
    expect(result).toMatchObject({
      items: [
        { size: "M", quantity: 3 },
        { size: "L", quantity: 1 },
      ],
      total_pence: 12000,
    });
  });

  it("Should need a size offered for products with sizes", () => {
    expect(
      priceBasket([{ product_id: hoodie.id, size: "", quantity: 1 }], products)
    ).toEqual({ error: "Please choose a size for the Hoodie" });
    expect(
      priceBasket(
        [{ product_id: hoodie.id, size: "XXL", quantity: 1 }],
        products
      )
    ).toHaveProperty("error");
  });

  it("Should turn down hidden or unknown products, and silly quantities", () => {
    expect(priceBasket([], products)).toEqual({
      error: "Your basket is empty",
    });
    expect(
      priceBasket([{ product_id: hidden.id, size: "", quantity: 1 }], products)
    ).toHaveProperty("error");
    expect(
      priceBasket([{ product_id: "nope", size: "", quantity: 1 }], products)
    ).toHaveProperty("error");
    [0, -1, 1.5, 11, "2"].forEach((quantity) =>
      expect(
        priceBasket([{ product_id: bottle.id, size: "", quantity }], products)
      ).toHaveProperty("error")
    );
  });
});

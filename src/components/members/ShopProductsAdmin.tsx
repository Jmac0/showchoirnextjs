import {
  faEyeSlash,
  faPen,
  faPlus,
  faTrash,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import React, { useState } from "react";

import {
  DEFAULT_SIZES,
  formatPence,
  IMAGE_RULES,
  MAX_IMAGES,
  MAX_PRODUCT_DESCRIPTION,
  MAX_PRODUCT_NAME,
  ShopProductRow,
} from "@/src/lib/shopShared";

const BIG_BUTTON =
  "flex items-center gap-2 rounded-md bg-lightGold px-4 py-2 font-bold text-black disabled:opacity-50";
const INPUT = "w-full rounded py-2 pl-2 text-base text-black";

// The message from a failed request to our API
const errorMessage = (error: unknown, fallback: string) =>
  (axios.isAxiosError(error) && error.response?.data?.message) || fallback;

// What's being typed into the form (price as typed, e.g. "25.50")
type Draft = {
  name: string;
  description: string;
  price: string;
  has_sizes: boolean;
  sizes: string;
  visible: boolean;
  sort_order: string;
  images: { key: string; url: string }[];
};

const EMPTY: Draft = {
  name: "",
  description: "",
  price: "",
  has_sizes: false,
  sizes: DEFAULT_SIZES.join(", "),
  visible: true,
  sort_order: "0",
  images: [],
};

const draftFrom = (product: ShopProductRow): Draft => ({
  name: product.name,
  description: product.description,
  price: (product.price_pence / 100).toFixed(2),
  has_sizes: product.has_sizes,
  sizes: (product.has_sizes ? product.sizes : DEFAULT_SIZES).join(", "),
  visible: product.visible,
  sort_order: String(product.sort_order),
  images: product.images,
});

// Uploads straight to storage (R2) with the signed link
async function putFile(url: string, file: File) {
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!res.ok) throw new Error("Upload failed");
}

// The "Shop products" admin page's contents: the kit in the members' shop.
// Saving a product also creates/updates it in Stripe (lib/shop.ts).
export function ShopProductsAdmin({
  initialProducts,
}: {
  initialProducts: ShopProductRow[];
}) {
  const [products, setProducts] = useState(initialProducts);
  // null = form closed, "new" = adding, otherwise the product being edited
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const change = (fields: Partial<Draft>) => setDraft({ ...draft, ...fields });

  const open = (product?: ShopProductRow) => {
    setEditing(product ? product.id : "new");
    setDraft(product ? draftFrom(product) : EMPTY);
    setError("");
    setNotice("");
  };

  const addPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // eslint-disable-next-line no-param-reassign
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const { data } = await axios.post("/api/admin/shop/image-upload-url", {
        fileName: file.name,
        contentType: file.type,
        size: file.size,
      });
      await putFile(data.uploadUrl, file);
      setDraft((current) => ({
        ...current,
        images: [...current.images, { key: data.key, url: data.previewUrl }],
      }));
    } catch (err) {
      setError(
        errorMessage(err, "Couldn't upload the photo - please try again")
      );
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (key: string) =>
    change({ images: draft.images.filter((image) => image.key !== key) });

  // Makes a photo the first (main) one
  const makeMain = (key: string) =>
    change({
      images: [
        ...draft.images.filter((image) => image.key === key),
        ...draft.images.filter((image) => image.key !== key),
      ],
    });

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const body = {
      name: draft.name,
      description: draft.description,
      price: draft.price,
      has_sizes: draft.has_sizes,
      sizes: draft.sizes.split(","),
      visible: draft.visible,
      sort_order: Number(draft.sort_order) || 0,
      image_keys: draft.images.map((image) => image.key),
    };
    try {
      const { data } =
        editing === "new"
          ? await axios.post("/api/admin/shop/products", body)
          : await axios.patch(`/api/admin/shop/products/${editing}`, body);
      setProducts(data.products);
      setEditing(null);
    } catch (err) {
      // Saved but Stripe failed - still show the saved list
      if (axios.isAxiosError(err) && err.response?.data?.products) {
        setProducts(err.response.data.products);
      }
      setError(errorMessage(err, "Couldn't save - please try again"));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (product: ShopProductRow) => {
    if (
      // eslint-disable-next-line no-alert
      !window.confirm(`Delete "${product.name}" from the shop?`)
    ) {
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { data } = await axios.delete(
        `/api/admin/shop/products/${product.id}`
      );
      setProducts(data.products);
      if (data.message) setNotice(data.message);
      if (editing === product.id) setEditing(null);
    } catch (err) {
      setError(errorMessage(err, "Couldn't delete - please try again"));
    } finally {
      setBusy(false);
    }
  };

  const form = (
    <form
      onSubmit={save}
      className="flex flex-col gap-3 rounded-md border-2 border-lightGold bg-lightBlack/90 p-5"
    >
      <h2 className="m-0 bg-gradient-to-r from-yellow-200 to-yellow-500 bg-clip-text p-0 text-transparent">
        {editing === "new" ? "Add a product" : "Edit product"}
      </h2>
      <label className="flex flex-col gap-1" htmlFor="productName">
        Name
        <input
          id="productName"
          required
          maxLength={MAX_PRODUCT_NAME}
          placeholder="e.g. Show Choir hoodie"
          className={INPUT}
          value={draft.name}
          onChange={(e) => change({ name: e.target.value })}
        />
      </label>
      <label className="flex flex-col gap-1" htmlFor="productDescription">
        Description (optional)
        <textarea
          id="productDescription"
          rows={3}
          maxLength={MAX_PRODUCT_DESCRIPTION}
          placeholder="e.g. Black, gold logo on the front, name on the back"
          className={INPUT}
          value={draft.description}
          onChange={(e) => change({ description: e.target.value })}
        />
      </label>
      <div className="flex flex-col gap-3 md:flex-row">
        <label className="flex flex-1 flex-col gap-1" htmlFor="productPrice">
          Price (£)
          <input
            id="productPrice"
            required
            inputMode="decimal"
            placeholder="25.00"
            className={INPUT}
            value={draft.price}
            onChange={(e) => change({ price: e.target.value })}
          />
        </label>
        <label className="flex flex-1 flex-col gap-1" htmlFor="productOrder">
          Order in the shop (lower first)
          <input
            id="productOrder"
            type="number"
            className={INPUT}
            value={draft.sort_order}
            onChange={(e) => change({ sort_order: e.target.value })}
          />
        </label>
      </div>
      <label className="flex items-center gap-2" htmlFor="productHasSizes">
        <input
          id="productHasSizes"
          type="checkbox"
          checked={draft.has_sizes}
          onChange={(e) => change({ has_sizes: e.target.checked })}
        />
        Comes in sizes (members must pick one)
      </label>
      {draft.has_sizes && (
        <label className="flex flex-col gap-1" htmlFor="productSizes">
          Sizes, separated by commas
          <input
            id="productSizes"
            className={INPUT}
            value={draft.sizes}
            onChange={(e) => change({ sizes: e.target.value })}
          />
        </label>
      )}
      <label className="flex items-center gap-2" htmlFor="productVisible">
        <input
          id="productVisible"
          type="checkbox"
          checked={draft.visible}
          onChange={(e) => change({ visible: e.target.checked })}
        />
        Show in the shop
      </label>

      {/* --- Photos --- */}
      <div className="flex flex-col gap-2">
        <span>Photos (the first one is the main photo)</span>
        <div className="flex flex-wrap gap-3">
          {draft.images.map((image, i) => (
            <div key={image.key} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt=""
                className={`h-24 w-24 rounded object-cover ${
                  i === 0 ? "ring-2 ring-lightGold" : ""
                }`}
              />
              <button
                type="button"
                onClick={() => removePhoto(image.key)}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white"
                aria-label="Remove this photo"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
              {i > 0 && (
                <button
                  type="button"
                  onClick={() => makeMain(image.key)}
                  className="absolute bottom-1 left-1 rounded bg-black/70 px-1 text-xs"
                >
                  Make main
                </button>
              )}
            </div>
          ))}
        </div>
        {draft.images.length < MAX_IMAGES && (
          <label
            htmlFor="productPhoto"
            className={`${BIG_BUTTON} cursor-pointer self-start ${
              uploading ? "opacity-50" : ""
            }`}
          >
            <FontAwesomeIcon icon={faPlus} />
            {uploading ? "Uploading..." : "Add photo"}
            <input
              id="productPhoto"
              type="file"
              accept={IMAGE_RULES.extensions}
              disabled={uploading}
              className="hidden"
              onChange={addPhoto}
            />
          </label>
        )}
      </div>

      <div className="flex justify-center gap-3">
        <button
          type="submit"
          disabled={busy || uploading}
          className={BIG_BUTTON}
        >
          {busy ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => setEditing(null)}
          className="rounded-md px-4 py-2 text-gray-300 hover:bg-slate-100/10"
        >
          Cancel
        </button>
      </div>
    </form>
  );

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6 text-gray-100">
      <p className="m-0 text-center text-sm text-gray-300">
        Everything here shows in the members&apos; Shop and is set up in Stripe
        for you. Orders are under Shop &rarr; Orders.
      </p>
      {error && (
        <p role="alert" className="m-0 text-center text-sm text-red-400">
          {error}
        </p>
      )}
      {notice && <p className="m-0 text-center text-sm">{notice}</p>}

      {editing === "new" ? (
        form
      ) : (
        <button
          type="button"
          onClick={() => open()}
          className={`${BIG_BUTTON} self-center`}
        >
          <FontAwesomeIcon icon={faPlus} /> Add a product
        </button>
      )}

      <div className="flex flex-col gap-3">
        {products.length === 0 && (
          <p className="text-center text-sm italic">No products yet</p>
        )}
        {products.map((product) =>
          editing === product.id ? (
            <React.Fragment key={product.id}>{form}</React.Fragment>
          ) : (
            <div
              key={product.id}
              className={`flex items-center gap-3 rounded-md border-2 border-lightGold bg-lightBlack/90 p-4 ${
                product.visible ? "" : "opacity-60"
              }`}
            >
              {product.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.images[0].url}
                  alt=""
                  className="h-16 w-16 rounded object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded bg-black/40" />
              )}
              <div className="flex flex-1 flex-col">
                <span className="font-bold">
                  {product.name} &middot; {formatPence(product.price_pence)}
                </span>
                <span className="text-sm text-gray-300">
                  {product.has_sizes
                    ? `Sizes: ${product.sizes.join(", ")}`
                    : "No sizes"}
                  {!product.visible && (
                    <>
                      {" "}
                      &middot; <FontAwesomeIcon icon={faEyeSlash} /> Hidden
                    </>
                  )}
                </span>
                {!product.on_stripe && (
                  <span className="text-sm text-red-400">
                    Not set up in Stripe yet - save it again to retry
                  </span>
                )}
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => open(product)}
                className="rounded-md p-2 text-lightGold hover:bg-lightGold/20 disabled:opacity-50"
                aria-label={`Edit ${product.name}`}
              >
                <FontAwesomeIcon icon={faPen} />
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => remove(product)}
                className="rounded-md p-2 text-red-400 hover:bg-red-400/20 disabled:opacity-50"
                aria-label={`Delete ${product.name}`}
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}

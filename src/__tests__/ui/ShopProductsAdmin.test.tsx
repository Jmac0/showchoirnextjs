import { fireEvent, render, screen, within } from "@testing-library/react";
import axios from "axios";

import { ShopProductsAdmin } from "@/src/components/members/ShopProductsAdmin";

jest.mock("axios");

describe("Shop products admin - photos", () => {
  it("should show a failed upload next to the Add photo button", async () => {
    (axios.post as jest.Mock).mockResolvedValue({
      data: {
        uploadUrl: "https://r2.example/put",
        key: "shop/x",
        previewUrl: "",
      },
    });
    // The browser's upload straight to storage is blocked (e.g. CORS)
    global.fetch = jest
      .fn()
      .mockRejectedValue(new TypeError("Failed to fetch"));

    const { container } = render(<ShopProductsAdmin initialProducts={[]} />);
    fireEvent.click(screen.getByRole("button", { name: /add a product/i }));
    const input = container.querySelector("#productPhoto") as HTMLInputElement;
    fireEvent.change(input, {
      target: {
        files: [new File(["x"], "hoodie.jpg", { type: "image/jpeg" })],
      },
    });

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/couldn't upload the photo/i);
    // In the form's photo section, not at the top of the page
    const photos = screen.getByText(/^photos/i).parentElement as HTMLElement;
    expect(within(photos).getByRole("alert")).toBe(alert);
  });
});

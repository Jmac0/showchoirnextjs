import "@testing-library/jest-dom";

import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";

import { CartDrawer } from "../../components/shop/CartDrawer";

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <CartDrawer
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      itemCount={3}
    >
      <p>basket contents</p>
    </CartDrawer>
  );
}

describe("CartDrawer", () => {
  it("shows the item count, opens from the icon and closes with Escape", () => {
    render(<Harness />);
    const icon = screen.getByRole("button", { name: "Open basket (3 items)" });
    expect(icon).toHaveTextContent("3");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(icon);
    expect(screen.getByRole("dialog", { name: "Your basket" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Close basket" })).toHaveFocus();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes with the X", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: /open basket/i }));
    fireEvent.click(screen.getByRole("button", { name: "Close basket" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

it("Displays correct header", () => {
  cy.visit("/");
  cy.findByRole("heading", { name: /welcome to show choir/i }).should("exist");
});

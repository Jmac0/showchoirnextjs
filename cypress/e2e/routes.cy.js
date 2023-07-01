it("Displays correct header", () => {
  cy.visit("");
  cy.findByRole("heading", { name: /^Welcome to Show Choir/i }).should("exist");
});

describe("All routes render correct text content", () => {
  it("Home page displays correct text content", () => {
    cy.visit("/");
    cy.findByRole("heading", { name: /Welcome to Show Choir/i }).should(
      "exist"
    );
  });
  it("About page displays correct text content", () => {
    cy.visit("/about-show-choir-surrey");
    cy.findByRole("heading", { name: /About Show Choir/i }).should("exist");
  });
  it("Join Us page displays correct text content", () => {
    cy.visit("/show-choir-membership-options");
    cy.findByRole("heading", { name: /Join Show Choir/i }).should("exist");
  });
  it("Login page displays correct text content", () => {
    cy.visit("/show-choir-member-aera");
    cy.findByRole("heading", { name: /Login/i }).should("exist");
  });
});

describe("navigation component", () => {
  it("should display desktop navigation above 768 screen width and hamburger icon under 768 ", () => {
    // check that the desktop links are visible
    cy.visit("/");

    cy.get('[data-testid="desktop-nav"]').should("be.visible");
    cy.get('[data-testid="hamburger-icon"]').should("not.be.visible");
    cy.viewport(687, 700);
    cy.get('[data-testid="hamburger-icon"]').should("be.visible");
    cy.get('[data-testid="desktop-nav"]').should("not.be.visible");
  });
  it("should navigate to the correct page when a desktop link is clicked ", () => {
    cy.visit("/");
    cy.viewport(1024, 700);
    cy.get(".about-desktop").click();
    cy.contains("h1", /about/i).should("exist");
    cy.get(".join-desktop").click();
    cy.contains("h1", /join/i).should("exist");
    cy.get(".login-desktop").click();
    cy.contains("h1", /login/i).should("exist");
    cy.get(".home-desktop").click();
    cy.contains("h1", /welcome/i).should("exist");
  });

  it("should display and hide the mobile draw menu when the hamburger icon is clicked", () => {
    cy.visit("/");
    cy.viewport(767, 700);

    cy.get(".hamburger-overlay").should("not.be.visible");
    cy.get('[data-testid="hamburger-icon"]').click();
    cy.get(".hamburger-overlay").should("be.visible");
    cy.get('[data-testid="hamburger-icon"]').click();
    cy.get(".hamburger-overlay").should("not.be.visible");
  });

  it("should navigate to the correct page when a mobile link is clicked ", () => {
    cy.visit("/");
    cy.viewport(767, 700);
    cy.get('[data-testid="hamburger-icon"]').click();
    cy.get(".about-mobile").click();
    cy.contains("h1", /about/i).should("exist");
    cy.get('[data-testid="hamburger-icon"]').click();
    cy.get(".join-mobile").click();
    cy.contains("h1", /join/i).should("exist");
    cy.get('[data-testid="hamburger-icon"]').click();
    cy.get(".login-mobile").click();
    cy.contains("h1", /login/i).should("exist");
    cy.get('[data-testid="hamburger-icon"]').click();
    cy.get(".home-mobile").click();
    cy.contains("h1", /welcome/i).should("exist");
  });
});

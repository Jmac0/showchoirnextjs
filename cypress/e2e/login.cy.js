const mockValidMember = {
  first_name: "John",
  role: "",
  membership_type: "Flexi",
  flexi_sessions: 5,
  email: "test@test.com",
  password: "$2b$08$BAt7jPsHnh1hHkxJ6bsH4uCQN7BDAUaD9GkY.ms3ZyQLmU2N.nxR6",
};

describe("Login Page", () => {
  it("Should render the login for correctly on initial load", () => {
    cy.visit("/auth/signin");
    cy.get("h2").should("contain", "Login");
    cy.get("#email").should("contain", "");
    cy.get("#password").should("contain", "");
    cy.get("button").should("contain", "Login");
    cy.get('[role="alert"]').should("contain", "");
  });

  it("Given valid credentials it should redirect user to dashboard and display Lyrics page & member nav should work as expected", () => {
    cy.visit("/auth/signin");
    cy.task("db:seed", mockValidMember);
    cy.get("#email").type("test@test.com");
    cy.get("#password").type("test");
    cy.contains("button", "Login").click();

    cy.url().should("contain", "/members/dashboard");
    cy.get("h1").contains(/lyrics/i);

    cy.contains("button", /notifications/i).click();
    cy.get("h1").contains(/notifications/i);

    cy.contains("button", /account/i).click();
    cy.get("h1").contains(/account/i);

    cy.contains("button", /membership Card/i).click();
    cy.get("h1").contains(/membership card/i);

    cy.contains("button", /log out/i).click();
    cy.get("h2").should("contain", "Login");
    cy.task("db:reset");
  });

  it("Given invalid credentials it should display an error message", () => {
    cy.visit("/auth/signin");
    cy.task("db:seed", mockValidMember);
    cy.get("#email").type("invalid@test.com");
    cy.get("#password").type("invalidPassword");
    cy.contains("button", "Login").click();

    cy.contains("div", "Username or password incorrect").should("exist");
    cy.task("db:reset");
  });
});

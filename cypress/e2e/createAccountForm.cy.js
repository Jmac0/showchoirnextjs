const mockMemberData = {
  first_name: "John",
  last_name: "Smith",
  email: "test@test.com",
};
describe("Create Account Form", () => {
  it("should display create account form with correct heading & fields", () => {
    // visit page with hashed test@test.com email
    cy.visit(
      /* cspell:disable-next-line */
      "/register/create-account?email=U2FsdGVkX1%2FXObv70SdY54JDL46dhuwaTKzGL6WktIA%3D"
    );
    cy.get("h1").should("contain", "Create Account");
    // Select the email input field and check its value is the decrypted test email
    cy.get("#email").should("have.value", "test@test.com");

    cy.get("#password").should("exist");
    cy.get("#confirm").should("exist");
    cy.contains("button", "Create Account").should("be.enabled");
  });
  it.only("should redirect to login page on successful password creation", () => {
    cy.task("db:seed", mockMemberData);
    cy.visit(
      /* cspell:disable-next-line */
      "/register/create-account?email=U2FsdGVkX1%2FXObv70SdY54JDL46dhuwaTKzGL6WktIA%3D"
    );

    cy.get("#email").should("have.value", "test@test.com");

    cy.get("#password").type("password");
    cy.get("#confirm").type("password");
    cy.contains("button", "Create Account").click();
    cy.url().should("contain", "/auth/");
    //  cy.task("db:reset");
  });
  // test that "We cant find an account with this email" is displayed
  it("should display an error message when email in  ulr query is not in DB", () => {
    cy.visit(
      /* cspell:disable-next-line */
      "register/create-account?email=U2FsdGVkX1%2FXObv70SdY54JDL46dhuwaTKzGL6WktIA%3D"
    );

    cy.get("#email").should("have.value", "test@test.com");

    cy.get("#password").type("password");
    cy.get("#confirm").type("password");
    cy.contains("button", "Create Account").click();
    cy.contains("div", "We cant find an account with this email").should(
      "exist"
    );
  });
  it("should display an error message when the user already has a password", () => {
    //    add password field to member record
    const mockDataWithPassword = { ...mockMemberData, password: "password123" };
    cy.task("db:seed", mockDataWithPassword);
    cy.visit(
      /* cspell:disable-next-line */
      "register/create-account?email=U2FsdGVkX1%2FXObv70SdY54JDL46dhuwaTKzGL6WktIA%3D"
    );

    cy.get("#email").should("have.value", "test@test.com");

    cy.get("#password").type("password");
    cy.get("#confirm").type("password");
    cy.contains("button", "Create Account").click();
    cy.contains("div", "This account already has a password").should("exist");
    cy.task("db:reset");
  });
});

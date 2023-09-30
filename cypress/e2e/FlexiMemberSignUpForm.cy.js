describe("NewMemberSignUpForm", () => {
  it("Given the form is correctly filled, it should redirect to a GoCardless form page", () => {
    cy.task("db:reset");
    cy.visit("/flexi-membership");

    cy.get('input[name="firstName"]').type("John");
    cy.get('input[name="lastName"]').type("Smith");
    cy.get('input[name="streetAddress"]').type("1 The Street");
    cy.get('input[name="townOrCity"]').type("Home Town");
    cy.get('input[name="county"]').type("Home County");
    cy.get('input[name="postCode"]').type("RH42EX");
    cy.get('input[name="phoneNumber"]').type("12345985567");
    cy.get('input[name="email"]').type("test@example.com");
    cy.get('select[name="homeChoir"]').select("option2");
    cy.get("#ageConfirm").click();
    cy.get("#consent").click();
    cy.contains("button", "Next").click();

    // class name CheckoutPaymentForm
    cy.origin("https://checkout.stripe.com", () => {
      cy.contains("span", "Powered by");
    });
    cy.task("db:reset");
  });
});

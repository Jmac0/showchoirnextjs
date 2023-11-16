describe("Venues Page  ", () => {
  it("Should render 5 complete venue card components", () => {
    cy.visit("/show-choir-locations");
    cy.get("h2").should("have.length", 5);
    cy.get("iframe").should("have.length", 5);
    cy.get("address").should("have.length", 5);
    cy.get('button:contains("more")').should("have.length", 5);
  });
});

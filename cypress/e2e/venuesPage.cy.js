describe("Venues Page  ", () => {
  it("Should render 5 complete venue card components", () => {
    cy.visit("/show-choir-locations");
    cy.get("h2").should("have.length", 5);
    cy.get("iframe").should("have.length", 5);
    cy.get("address").should("have.length", 5);
    cy.get(".rounded-md.bg-lightGold").should("have.length", 5);
  });

  it("should navigate to the correct page, and render correct content for each venue when the link is click", () => {
    cy.visit("/show-choir-locations");
    cy.get('[href="/venues/choir-banstead-surrey"]').click();
    cy.contains(/^banstead/i).should("be.visible");
    cy.contains(/^the beacon/i).should("be.visible");
    cy.get(".choirs-desktop").click();
    cy.get('[href="/venues/choir-leatherhead-surrey"]').click();
    cy.contains(/^leatherhead/i).should("be.visible");
    cy.contains(/the leatherhead theatre/i).should("be.visible");
    cy.get(".choirs-desktop").click();
    cy.get('[href="/venues/choir-dorking-surrey"]').click();
    cy.contains(/^dorking/i).should("be.visible");
    cy.contains(/crossways baptist church/i).should("be.visible");
    cy.get(".choirs-desktop").click();
    cy.get('[href="/venues/choir-cobham-surrey"]').click();
    cy.contains(/^cobham/i).should("be.visible");
    cy.contains(/cobham urc/i).should("be.visible");
    cy.get(".choirs-desktop").click();
    cy.get('[href="/venues/choir-west-byfleet-surrey"]').click();
    cy.contains(/^west byfleet/i).should("be.visible");
    cy.contains(/west byfleet infants school/i).should("be.visible");
  });
});

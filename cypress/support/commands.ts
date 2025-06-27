// Custom commands for Email-Makers testing

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit('/auth/login')
    cy.get('[data-testid="email-input"]').type(email)
    cy.get('[data-testid="password-input"]').type(password)
    cy.get('[data-testid="login-button"]').click()
    cy.url().should('include', '/dashboard')
  })
})

Cypress.Commands.add('createTemplate', (templateData: any) => {
  cy.visit('/create')
  
  // Fill out template creation form
  if (templateData.title) {
    cy.get('[data-testid="template-title"]').type(templateData.title)
  }
  
  if (templateData.description) {
    cy.get('[data-testid="template-description"]').type(templateData.description)
  }
  
  if (templateData.content) {
    cy.get('[data-testid="content-brief"]').type(templateData.content)
  }
  
  // Submit the form
  cy.get('[data-testid="create-template-button"]').click()
  
  // Wait for template creation
  cy.get('[data-testid="template-preview"]', { timeout: 10000 }).should('be.visible')
})

Cypress.Commands.add('validateTemplate', (templateId: string) => {
  cy.request({
    method: 'POST',
    url: '/api/quality/validate',
    body: { templateId },
    headers: {
      'Content-Type': 'application/json'
    }
  }).then((response) => {
    expect(response.status).to.eq(200)
    expect(response.body).to.have.property('qualityReport')
    expect(response.body.qualityReport).to.have.property('overallScore')
  })
}) 
// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Add custom commands to the global Cypress object
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
      createTemplate(templateData: any): Chainable<void>
      validateTemplate(templateId: string): Chainable<void>
    }
  }
} 
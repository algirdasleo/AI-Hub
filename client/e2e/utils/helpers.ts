import { Page } from "@playwright/test";

export const SELECTORS = {
  emailInput: 'input[type="email"]',
  passwordInput: 'input[type="password"]',
  loginButton: 'button[type="submit"]',
  signupButton: 'button[type="submit"]',

  dashboardLink: 'a[href*="/dashboard"]',
  chatLink: 'a[href*="/chat"]',
  comparisonLink: 'a[href*="/comparison"]',
  projectsLink: 'a[href*="/projects"]',
  trackingLink: 'a[href*="/tracking"]',

  sidebarTrigger: 'button[data-sidebar="trigger"]',
  conversationItem: '[data-testid="conversation-item"]',

  chatInput: 'textarea[placeholder*="message"], input[placeholder*="message"]',
  sendButton: 'button[type="submit"]',
  messageContent: '[data-testid="message-content"]',

  modelSelector: '[data-testid="model-selector"]',
  comparisonInput: 'textarea[placeholder*="prompt"], input[placeholder*="prompt"]',
  compareButton: 'button:has-text("Compare")',
  comparisonResult: '[data-testid="comparison-result"]',
};

// Access checks are enforced per sender and recipient. Only production can send;
// missing/false configuration and preview deployments never deliver notifications.
export const deliveryEnabled = (environmentValue, deploymentEnvironment) =>
  deploymentEnvironment === 'production' && environmentValue === 'true';

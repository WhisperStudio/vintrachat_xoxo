export async function verifyActiveToken(auth, rawToken) {
  const decoded = await auth.verifyIdToken(rawToken, true);
  const user = await auth.getUser(decoded.uid);
  if (user.disabled) throw new Error('Account disabled');
  return { ...decoded, email: user.email, phone_number: user.phoneNumber,
    email_verified: decoded.email_verified === true && user.emailVerified,
    superAdmin: decoded.superAdmin === true && user.customClaims?.superAdmin === true };
}

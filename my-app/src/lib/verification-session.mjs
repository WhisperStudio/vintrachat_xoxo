// Verification changes Firebase on the server; an open browser session still
// carries the old account metadata and email_verified claim until refreshed.
export async function refreshVerificationSession(auth) {
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) return false;
  await user.reload();
  if (auth.currentUser?.uid !== user.uid || !user.emailVerified) return false;
  const token = await user.getIdTokenResult(true);
  return auth.currentUser?.uid === user.uid && token.claims.email_verified === true;
}

import type { Locale } from '#helpers/locale'

/**
 * Messages written by the server (flash messages, form errors, emails),
 * in both languages. Placeholders: {name}.
 */
const fr = {
  'auth.invalidCredentials': 'Adresse e-mail ou mot de passe incorrect.',
  'auth.tooManyAttempts': 'Trop de tentatives. Pour ta sécurité, réessaie dans {minutes} min.',
  'auth.loginRequired': 'Connecte-toi pour accéder à cette page.',
  'auth.welcome': 'Bienvenue sur Briquothèque, {username} !',
  'auth.loggedIn': 'Content de te revoir, {username} !',
  'auth.loggedOut': 'Tu es maintenant déconnecté·e.',
  'password.resetSent':
    'Si un compte existe pour cette adresse, un e-mail contenant un lien de réinitialisation vient d’être envoyé. Le lien est valable 1 heure.',
  'password.resetInvalid':
    'Ce lien de réinitialisation est invalide ou a expiré. Fais une nouvelle demande.',
  'password.resetDone': 'Ton mot de passe a été modifié. Tu peux te connecter.',
  'account.profileUpdated': 'Ton profil a été mis à jour.',
  'account.passwordUpdated': 'Ton mot de passe a été modifié.',
  'account.wrongPassword': 'Mot de passe incorrect.',
  'account.currentPasswordRequired':
    'Saisis ton mot de passe actuel pour changer d’adresse e-mail.',
  'account.deleted': 'Ton compte et ta collection ont été supprimés.',
  'mail.resetSubject': 'Réinitialisation de ton mot de passe',
  'mail.resetGreeting': 'Bonjour {username},',
  'mail.resetIntro':
    'Tu as demandé à réinitialiser le mot de passe de ton compte Briquothèque. Clique sur le bouton ci-dessous pour en choisir un nouveau :',
  'mail.resetButton': 'Choisir un nouveau mot de passe',
  'mail.resetExpiry': 'Ce lien est valable 1 heure et ne peut servir qu’une fois.',
  'mail.resetIgnore':
    'Si tu n’es pas à l’origine de cette demande, ignore cet e-mail : ton mot de passe ne changera pas.',
} as const

type MessageKey = keyof typeof fr

const en: Record<MessageKey, string> = {
  'auth.invalidCredentials': 'Incorrect email address or password.',
  'auth.tooManyAttempts': 'Too many attempts. For your security, try again in {minutes} min.',
  'auth.loginRequired': 'Please log in to access this page.',
  'auth.welcome': 'Welcome to Briquothèque, {username}!',
  'auth.loggedIn': 'Welcome back, {username}!',
  'auth.loggedOut': 'You are now logged out.',
  'password.resetSent':
    'If an account exists for this address, an email with a reset link has just been sent. The link is valid for 1 hour.',
  'password.resetInvalid': 'This reset link is invalid or has expired. Please request a new one.',
  'password.resetDone': 'Your password has been changed. You can now log in.',
  'account.profileUpdated': 'Your profile has been updated.',
  'account.passwordUpdated': 'Your password has been changed.',
  'account.wrongPassword': 'Incorrect password.',
  'account.currentPasswordRequired': 'Enter your current password to change your email address.',
  'account.deleted': 'Your account and your collection have been deleted.',
  'mail.resetSubject': 'Reset your password',
  'mail.resetGreeting': 'Hello {username},',
  'mail.resetIntro':
    'You asked to reset the password of your Briquothèque account. Click the button below to choose a new one:',
  'mail.resetButton': 'Choose a new password',
  'mail.resetExpiry': 'This link is valid for 1 hour and can only be used once.',
  'mail.resetIgnore':
    'If you did not make this request, ignore this email: your password will not change.',
}

const messages: Record<Locale, Record<MessageKey, string>> = { fr, en }

export function serverMessage(
  locale: Locale,
  key: MessageKey,
  params: Record<string, string | number> = {}
) {
  return messages[locale][key].replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match
  )
}

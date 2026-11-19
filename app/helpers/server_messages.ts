import type { Locale } from '#helpers/locale'

/**
 * Messages written by the server (flash messages, form errors, emails),
 * in both languages. Placeholders: {name}.
 */
const fr = {
  'admin.image.https': 'L’adresse doit commencer par https://.',
  'admin.image.host': 'Cette adresse n’est pas un site public.',
  'admin.image.unreachable': 'Impossible de charger cette adresse : vérifie qu’elle est correcte.',
  'admin.image.notImage': 'Cette adresse ne pointe pas vers une image.',
  'admin.image.saved': 'L’image de « {name} » est enregistrée.',
  'admin.translations.saved': 'La traduction de « {name} » est enregistrée.',
  'admin.translations.cleared':
    'La traduction de « {name} » est supprimée : la description s’affiche en anglais.',
  'admin.update.queued':
    'Mise à jour demandée : elle démarre au prochain passage de la tâche planifiée (quelques minutes au plus).',
  'admin.update.alreadyRunning': 'Une mise à jour est déjà en attente ou en cours.',
  'admin.users.confirmationSent': 'Un nouveau lien de confirmation a été envoyé à {email}.',
  'admin.users.alreadyVerified': 'Cette adresse est déjà confirmée.',
  'admin.users.adminGiven': '{username} est maintenant administrateur·rice.',
  'admin.users.adminRemoved': '{username} n’est plus administrateur·rice.',
  'admin.users.notSelf':
    'Tu ne peux pas faire cette action sur ton propre compte : passe par la page Mon compte.',
  'admin.users.wrongUsername': 'Le pseudo saisi ne correspond pas à ce compte.',
  'admin.users.deleted': 'Le compte de {username} a été supprimé.',
  'admin.catalogue.saved': 'Les corrections de « {name} » sont enregistrées.',
  'admin.health.quota':
    'Brickset : {used} appels utilisés aujourd’hui (date UTC) sur {limit}, il en reste {left}.',
  'admin.health.bricksetFailed': 'Brickset ne répond pas : {error}',
  'admin.health.mailSent': 'E-mail de test envoyé à {email}. Vérifie aussi les indésirables.',
  'admin.health.mailFailed': 'L’e-mail n’est pas parti : {error}',
  'admin.health.logCleared': 'Le journal {file} est vidé.',
  'mail.testSubject': 'Test d’envoi Bricothèque',
  'mail.testIntro':
    'Cet e-mail confirme que le site arrive à envoyer des messages. Tu peux le supprimer.',
  'admin.manual.created': '« {name} » est ajouté au catalogue.',
  'admin.manual.unknownTheme': 'Choisis un thème dans la liste.',
  'admin.manual.setExists': 'Le set {setNum} existe déjà dans le catalogue.',
  'admin.merge.notFound':
    'Aucun élément importé ne correspond : choisis un doublon ou vérifie le numéro.',
  'admin.merge.notManual': 'Seul un élément ajouté à la main peut être fusionné.',
  'admin.merge.notImported': 'L’élément choisi doit venir des imports, pas d’un ajout à la main.',
  'admin.merge.done':
    'Fusion faite : collections, wishlists, traduction, image et corrections sont reportées sur la fiche importée.',
  'admin.catalogue.released':
    'Les champs choisis de « {name} » seront de nouveau mis à jour par les imports.',
  'auth.invalidCredentials': 'Adresse e-mail ou mot de passe incorrect.',
  'auth.tooManyAttempts': 'Trop de tentatives. Pour ta sécurité, réessaie dans {minutes} min.',
  'auth.loginRequired': 'Connecte-toi pour accéder à cette page.',
  'auth.loggedIn': 'Content de te revoir, {username} !',
  'auth.loggedOut': 'Tu es maintenant déconnecté·e.',
  'password.resetSent':
    'Si un compte existe pour cette adresse, un e-mail contenant un lien de réinitialisation vient d’être envoyé. Le lien est valable 1 heure.',
  'password.resetInvalid':
    'Ce lien de réinitialisation est invalide ou a expiré. Fais une nouvelle demande.',
  'password.resetDone': 'Ton mot de passe a été modifié. Tu peux te connecter.',
  'account.usernameUpdated': 'Ton pseudo a été modifié.',
  'account.emailUpdated': 'Ton adresse e-mail a été modifiée.',
  'account.passwordUpdated': 'Ton mot de passe a été modifié.',
  'account.wrongPassword': 'Mot de passe incorrect.',
  'account.deleted': 'Ton compte et ta collection ont été supprimés.',
  'collection.addedOwned': '« {name} » est dans ta collection.',
  'collection.addedOwnedWithMinifigs':
    '« {name} » est dans ta collection, avec {count} minifig(s) du set.',
  'collection.addedWanted': '« {name} » est dans ta wishlist.',
  'collection.removedOwned': '« {name} » a été retiré de ta collection.',
  'collection.removedWanted': '« {name} » a été retiré de ta wishlist.',
  'collection.acquired': 'Bravo ! « {name} » passe de ta wishlist à ta collection.',
  'collection.minifigsAdded': '{count} minifig(s) du set ajoutée(s) à ta collection.',
  'collection.detailsSaved': 'Les informations de « {name} » sont enregistrées.',
  'collection.preferencesSaved': 'Tes préférences sont enregistrées.',
  'wishlist.shared': 'Ta wishlist est partagée : copie le lien pour l’envoyer.',
  'wishlist.unshared': 'Partage désactivé.',
  'mail.resetSubject': 'Réinitialisation de ton mot de passe',
  'mail.resetGreeting': 'Bonjour {username},',
  'mail.resetIntro':
    'Tu as demandé à réinitialiser le mot de passe de ton compte Bricothèque. Clique sur le bouton ci-dessous pour en choisir un nouveau :',
  'mail.resetButton': 'Choisir un nouveau mot de passe',
  'mail.resetExpiry': 'Ce lien est valable 1 heure et ne peut servir qu’une fois.',
  'mail.resetIgnore':
    'Si tu n’es pas à l’origine de cette demande, ignore cet e-mail : ton mot de passe ne changera pas.',
  'mail.footer': 'Une question ? Contacte-nous : {url}',
  'mail.confirmSubject': 'Active ton compte Bricothèque',
  'mail.confirmIntro':
    'Merci pour ton inscription ! Pour activer ton compte, confirme ton adresse e-mail en cliquant sur le bouton ci-dessous :',
  'mail.confirmButton': 'Activer mon compte',
  'mail.confirmExpiry': 'Ce lien est valable 24 heures.',
  'mail.confirmIgnore':
    'Si tu n’as pas créé de compte, ignore cet e-mail : aucun compte ne sera activé.',
  'mail.existsSubject': 'Tentative d’inscription avec ton adresse',
  'mail.existsIntro':
    'Quelqu’un (peut-être toi) a essayé de créer un compte Bricothèque avec cette adresse e-mail, mais tu as déjà un compte.',
  'mail.existsForgot': 'Mot de passe oublié ? Choisis-en un nouveau ici : {url}',
  'mail.existsButton': 'Me connecter',
  'mail.existsIgnore': 'Si ce n’était pas toi, ignore cet e-mail : rien n’a changé.',
  'mail.passwordChangedSubject': 'Ton mot de passe a été modifié',
  'mail.passwordChangedIntro': 'Le mot de passe de ton compte a été modifié le {date}.',
  'mail.emailChangedSubject': 'Ton adresse e-mail a été modifiée',
  'mail.emailChangedIntro': 'L’adresse e-mail de ton compte a été remplacée par {email} le {date}.',
  'mail.notYou':
    'Si ce n’est pas toi, choisis tout de suite un nouveau mot de passe ({url}) et écris-nous.',
  'auth.checkEmail':
    'Presque fini ! Un e-mail vient d’être envoyé à {email}. Clique sur le lien qu’il contient pour activer ton compte (valable 24 heures).',
  'auth.verified': 'Ton adresse est confirmée. Bienvenue sur Bricothèque, {username} !',
  'auth.verifyInvalid':
    'Ce lien d’activation est invalide ou a expiré. Saisis ton adresse pour en recevoir un nouveau.',
  'auth.notVerified':
    'Ton compte n’est pas encore activé : nous venons de renvoyer le lien d’activation à ton adresse e-mail.',
  'auth.verificationResent':
    'Si un compte en attente d’activation existe pour cette adresse, un nouveau lien vient d’être envoyé. Pense à regarder dans les indésirables.',
} as const

type MessageKey = keyof typeof fr

const en: Record<MessageKey, string> = {
  'admin.image.https': 'The address must start with https://.',
  'admin.image.host': 'This address is not a public website.',
  'admin.image.unreachable': 'This address cannot be loaded: check that it is correct.',
  'admin.image.notImage': 'This address does not point to a picture.',
  'admin.image.saved': 'The picture of “{name}” is saved.',
  'admin.translations.saved': 'The translation of “{name}” is saved.',
  'admin.translations.cleared':
    'The translation of “{name}” is removed: the description is shown in English.',
  'admin.update.queued':
    'Update requested: it starts at the next run of the scheduled task (a few minutes at most).',
  'admin.update.alreadyRunning': 'An update is already pending or running.',
  'admin.users.confirmationSent': 'A new confirmation link was sent to {email}.',
  'admin.users.alreadyVerified': 'This address is already confirmed.',
  'admin.users.adminGiven': '{username} is now an administrator.',
  'admin.users.adminRemoved': '{username} is no longer an administrator.',
  'admin.users.notSelf': 'You cannot do this on your own account: use the My account page.',
  'admin.users.wrongUsername': 'The username typed does not match this account.',
  'admin.users.deleted': 'The account of {username} was deleted.',
  'admin.catalogue.saved': 'The corrections of “{name}” are saved.',
  'admin.health.quota': 'Brickset: {used} calls used today (UTC date) out of {limit}, {left} left.',
  'admin.health.bricksetFailed': 'Brickset does not answer: {error}',
  'admin.health.mailSent': 'Test email sent to {email}. Check the spam folder too.',
  'admin.health.mailFailed': 'The email was not sent: {error}',
  'admin.health.logCleared': 'The {file} log is cleared.',
  'mail.testSubject': 'Bricothèque sending test',
  'mail.testIntro': 'This email confirms that the site can send messages. You can delete it.',
  'admin.manual.created': '“{name}” is added to the catalogue.',
  'admin.manual.unknownTheme': 'Choose a theme from the list.',
  'admin.manual.setExists': 'Set {setNum} is already in the catalogue.',
  'admin.merge.notFound': 'No imported item matches: choose a duplicate or check the number.',
  'admin.merge.notManual': 'Only an item added by hand can be merged.',
  'admin.merge.notImported':
    'The chosen item must come from the imports, not from a manual addition.',
  'admin.merge.done':
    'Merged: collections, wishlists, translation, picture and fixes are moved to the imported page.',
  'admin.catalogue.released': 'The chosen fields of “{name}” will be updated by the imports again.',
  'auth.invalidCredentials': 'Incorrect email address or password.',
  'auth.tooManyAttempts': 'Too many attempts. For your security, try again in {minutes} min.',
  'auth.loginRequired': 'Please log in to access this page.',
  'auth.loggedIn': 'Welcome back, {username}!',
  'auth.loggedOut': 'You are now logged out.',
  'password.resetSent':
    'If an account exists for this address, an email with a reset link has just been sent. The link is valid for 1 hour.',
  'password.resetInvalid': 'This reset link is invalid or has expired. Please request a new one.',
  'password.resetDone': 'Your password has been changed. You can now log in.',
  'account.usernameUpdated': 'Your username has been changed.',
  'account.emailUpdated': 'Your email address has been changed.',
  'account.passwordUpdated': 'Your password has been changed.',
  'account.wrongPassword': 'Incorrect password.',
  'account.deleted': 'Your account and your collection have been deleted.',
  'collection.addedOwned': '“{name}” is in your collection.',
  'collection.addedOwnedWithMinifigs':
    '“{name}” is in your collection, with {count} minifig(s) from the set.',
  'collection.addedWanted': '“{name}” is in your wishlist.',
  'collection.removedOwned': '“{name}” was removed from your collection.',
  'collection.removedWanted': '“{name}” was removed from your wishlist.',
  'collection.acquired': 'Well done! “{name}” moves from your wishlist to your collection.',
  'collection.minifigsAdded': '{count} minifig(s) from the set added to your collection.',
  'collection.detailsSaved': 'The details of “{name}” are saved.',
  'collection.preferencesSaved': 'Your preferences are saved.',
  'wishlist.shared': 'Your wishlist is shared: copy the link to send it.',
  'wishlist.unshared': 'Sharing turned off.',
  'mail.resetSubject': 'Reset your password',
  'mail.resetGreeting': 'Hello {username},',
  'mail.resetIntro':
    'You asked to reset the password of your Bricothèque account. Click the button below to choose a new one:',
  'mail.resetButton': 'Choose a new password',
  'mail.resetExpiry': 'This link is valid for 1 hour and can only be used once.',
  'mail.resetIgnore':
    'If you did not make this request, ignore this email: your password will not change.',
  'mail.footer': 'A question? Contact us: {url}',
  'mail.confirmSubject': 'Activate your Bricothèque account',
  'mail.confirmIntro':
    'Thanks for signing up! To activate your account, confirm your email address by clicking the button below:',
  'mail.confirmButton': 'Activate my account',
  'mail.confirmExpiry': 'This link is valid for 24 hours.',
  'mail.confirmIgnore':
    'If you did not create an account, ignore this email: no account will be activated.',
  'mail.existsSubject': 'Sign-up attempt with your address',
  'mail.existsIntro':
    'Someone (maybe you) tried to create a Bricothèque account with this email address, but you already have an account.',
  'mail.existsForgot': 'Forgot your password? Choose a new one here: {url}',
  'mail.existsButton': 'Log in',
  'mail.existsIgnore': 'If it was not you, ignore this email: nothing has changed.',
  'mail.passwordChangedSubject': 'Your password has been changed',
  'mail.passwordChangedIntro': 'The password of your account was changed on {date}.',
  'mail.emailChangedSubject': 'Your email address has been changed',
  'mail.emailChangedIntro': 'The email address of your account was changed to {email} on {date}.',
  'mail.notYou': 'If it was not you, choose a new password right away ({url}) and write to us.',
  'auth.checkEmail':
    'Almost done! An email has just been sent to {email}. Click the link inside to activate your account (valid for 24 hours).',
  'auth.verified': 'Your address is confirmed. Welcome to Bricothèque, {username}!',
  'auth.verifyInvalid':
    'This activation link is invalid or has expired. Enter your address to get a new one.',
  'auth.notVerified':
    'Your account is not activated yet: we have just sent the activation link to your email address again.',
  'auth.verificationResent':
    'If an account waiting for activation exists for this address, a new link has just been sent. Remember to check your spam folder.',
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

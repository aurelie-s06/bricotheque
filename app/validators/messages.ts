import { SimpleMessagesProvider } from '@vinejs/vine'
import type { Locale } from '#helpers/locale'
import { PASSWORD_MIN_LENGTH } from '#validators/user'

/**
 * Validation messages next to each field, in the visitor's language.
 */
const messages: Record<Locale, Record<string, string>> = {
  fr: {
    'required': 'Le champ « {{ field }} » est obligatoire.',
    'string': 'Le champ « {{ field }} » doit être un texte.',
    'email': 'Saisis une adresse e-mail valide (ex. nom@exemple.fr).',
    'minLength': 'Le champ « {{ field }} » doit contenir au moins {{ min }} caractères.',
    'maxLength': 'Le champ « {{ field }} » doit contenir au plus {{ max }} caractères.',
    'username.regex':
      'Le pseudo ne peut contenir que des lettres sans accent, des chiffres et les signes « _ », « . » et « - ».',
    'password.minLength': `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`,
    'sameAs': 'Les deux mots de passe ne sont pas identiques.',
    'username.database.unique': 'Ce pseudo est déjà pris.',
    'email.database.unique': 'Un compte existe déjà avec cette adresse e-mail.',
    'number': 'Le champ « {{ field }} » doit être un nombre.',
    'withoutDecimals': 'Le champ « {{ field }} » doit être un nombre entier.',
    'decimal': 'Le champ « {{ field }} » doit avoir au plus 2 décimales.',
    'range': 'Le champ « {{ field }} » doit être compris entre {{ min }} et {{ max }}.',
    'enum': 'Choisis une valeur dans la liste.',
    'date': 'Saisis une date valide (jj/mm/aaaa).',
    'date.beforeOrEqual': 'La date ne peut pas être dans le futur.',
    'beforeOrEqual': 'La date ne peut pas être dans le futur.',
    'boolean': 'Valeur invalide.',
  },
  en: {
    'required': 'The “{{ field }}” field is required.',
    'string': 'The “{{ field }}” field must be text.',
    'email': 'Enter a valid email address (e.g. name@example.com).',
    'minLength': 'The “{{ field }}” field must be at least {{ min }} characters long.',
    'maxLength': 'The “{{ field }}” field must be at most {{ max }} characters long.',
    'username.regex':
      'The username can only contain letters without accents, numbers and the “_”, “.” and “-” signs.',
    'password.minLength': `The password must be at least ${PASSWORD_MIN_LENGTH} characters long.`,
    'sameAs': 'The two passwords do not match.',
    'username.database.unique': 'This username is already taken.',
    'email.database.unique': 'An account already exists with this email address.',
    'number': 'The “{{ field }}” field must be a number.',
    'withoutDecimals': 'The “{{ field }}” field must be a whole number.',
    'decimal': 'The “{{ field }}” field can have at most 2 decimals.',
    'range': 'The “{{ field }}” field must be between {{ min }} and {{ max }}.',
    'enum': 'Choose a value from the list.',
    'date': 'Enter a valid date (dd/mm/yyyy).',
    'date.beforeOrEqual': 'The date cannot be in the future.',
    'beforeOrEqual': 'The date cannot be in the future.',
    'boolean': 'Invalid value.',
  },
}

const fields: Record<Locale, Record<string, string>> = {
  fr: {
    username: 'Pseudo',
    email: 'Adresse e-mail',
    password: 'Mot de passe',
    passwordConfirmation: 'Confirmation du mot de passe',
    currentPassword: 'Mot de passe actuel',
    quantity: 'Quantité',
    condition: 'État',
    purchasePrice: 'Prix d’achat',
    purchaseDate: 'Date d’achat',
    note: 'Note',
  },
  en: {
    username: 'Username',
    email: 'Email address',
    password: 'Password',
    passwordConfirmation: 'Password confirmation',
    currentPassword: 'Current password',
    quantity: 'Quantity',
    condition: 'Condition',
    purchasePrice: 'Purchase price',
    purchaseDate: 'Purchase date',
    note: 'Note',
  },
}

export function validationMessages(locale: Locale) {
  return new SimpleMessagesProvider(messages[locale], fields[locale])
}

import vine from '@vinejs/vine'

export const setDetailsValidator = vine.create({
  quantity: vine.number().withoutDecimals().range([1, 999]),
  condition: vine.enum(['built', 'in_box', 'sealed', 'partial'] as const).optional(),
})

export const minifigDetailsValidator = vine.create({
  quantity: vine.number().withoutDecimals().range([1, 999]),
})

export const preferencesValidator = vine.create({
  autoAddMinifigs: vine.boolean().optional(),
})

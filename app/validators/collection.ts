import vine from '@vinejs/vine'

export const setDetailsValidator = vine.create({
  quantity: vine.number().withoutDecimals().range([1, 999]),
  condition: vine.enum(['built', 'in_box', 'sealed', 'partial'] as const).optional(),
  purchasePrice: vine.number().decimal([0, 2]).range([0, 100_000]).optional(),
  purchaseDate: vine
    .date({ formats: ['YYYY-MM-DD'] })
    .beforeOrEqual('today')
    .optional(),
  note: vine.string().trim().maxLength(1000).optional(),
})

export const minifigDetailsValidator = vine.create({
  quantity: vine.number().withoutDecimals().range([1, 999]),
  note: vine.string().trim().maxLength(1000).optional(),
})

export const preferencesValidator = vine.create({
  autoAddMinifigs: vine.boolean().optional(),
})

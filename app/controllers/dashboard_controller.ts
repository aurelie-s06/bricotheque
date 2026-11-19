import type { HttpContext } from '@adonisjs/core/http'
import Dashboard from '#services/dashboard'
import BrickSetTransformer from '#transformers/brick_set_transformer'
import MinifigTransformer from '#transformers/minifig_transformer'

export default class DashboardController {
  /** GET /tableau-de-bord */
  async show({ auth, inertia }: HttpContext) {
    const data = await new Dashboard(auth.getUserOrFail().id).build()
    const withDate = (sets: typeof data.wishlist.retired) =>
      sets.map((set) => ({ id: set.id, until: set.dateLastAvailable?.toISODate() ?? null }))

    return inertia.render('dashboard', {
      figures: data.figures,
      byTheme: data.byTheme,
      completion: data.completion,
      byDecade: data.byDecade,
      biggest: BrickSetTransformer.transform(data.biggest),
      oldest: BrickSetTransformer.transform(data.oldest),
      retiringSoon: BrickSetTransformer.transform(data.wishlist.retiringSoon),
      retired: BrickSetTransformer.transform(data.wishlist.retired),
      doubles: { count: data.doubles.count, extraCopies: data.doubles.extraCopies },
      doublesTop: MinifigTransformer.transform(data.doubles.top.map((row) => row.minifig)),
      doublesQuantities: Object.fromEntries(
        data.doubles.top.map((row) => [row.minifig.id, row.quantity])
      ),
      missingMinifigs: data.missingMinifigs,
      wishlistDates: Object.fromEntries(
        [...withDate(data.wishlist.retiringSoon), ...withDate(data.wishlist.retired)].map(
          (entry) => [entry.id, entry.until]
        )
      ),
    })
  }
}

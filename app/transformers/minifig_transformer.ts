import type Minifig from '#models/minifig'
import { BaseTransformer } from '@adonisjs/core/transformers'
import { minifigPath, rebrickableMinifigUrl } from '#helpers/urls'
import ThemeTransformer from '#transformers/theme_transformer'
import BrickSetTransformer from '#transformers/brick_set_transformer'

export default class MinifigTransformer extends BaseTransformer<Minifig> {
  toObject() {
    const quantity = this.resource.$extras.pivot_quantity
    return {
      ...this.pick(this.resource, ['id', 'figNum', 'name', 'numParts', 'yearFirst']),
      // A picture pasted in the back office wins over the imported one
      imgUrl: this.resource.imgUrlManual ?? this.resource.imgUrl,
      url: minifigPath(this.resource),
      /** quantity in a set, when loaded through a set's minifigs */
      quantity: quantity === undefined ? null : Number(quantity),
    }
  }

  /**
   * Minifig page
   */
  forDetail() {
    const minifig = this.resource
    return {
      ...this.toObject(),
      ...this.pick(minifig, ['estimatedValueNew', 'estimatedValueUsed', 'estimatedValueCurrency']),
      estimatedValueUpdatedAt: minifig.estimatedValueUpdatedAt?.toISODate() ?? null,
      rebrickableUrl: rebrickableMinifigUrl(minifig.figNum),
      mainTheme: ThemeTransformer.transform(this.whenLoaded(minifig.mainTheme)),
      sets: BrickSetTransformer.transform(this.whenLoaded(minifig.sets))?.useVariant(
        'withQuantity'
      ),
    }
  }
}

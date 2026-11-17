import type BrickSet from '#models/brick_set'
import { BaseTransformer } from '@adonisjs/core/transformers'
import ThemeTransformer from '#transformers/theme_transformer'
import MinifigTransformer from '#transformers/minifig_transformer'
import { bricksetSetUrl, rebrickableSetUrl, setPath } from '#helpers/urls'

export default class BrickSetTransformer extends BaseTransformer<BrickSet> {
  /**
   * Card in a list (catalogue, theme page, home)
   */
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'setNum',
        'number',
        'variant',
        'name',
        'year',
        'kind',
        'numParts',
        'numMinifigs',
        'availabilityStatus',
        'rrpEur',
      ]),
      // A picture pasted in the back office wins over the imported one
      imgUrl: this.resource.imgUrlManual ?? this.resource.imgUrl,
      /** First day on sale (release date of the announced sets) */
      releaseDate: this.resource.dateFirstAvailable?.toISODate() ?? null,
      url: setPath(this.resource),
    }
  }

  /**
   * Set containing a minifig, with the number of copies of the minifig
   */
  withQuantity() {
    const quantity = this.resource.$extras.pivot_quantity
    return {
      ...this.toObject(),
      quantity: quantity === undefined ? null : Number(quantity),
    }
  }

  /**
   * Set page
   */
  forDetail() {
    const set = this.resource
    return {
      ...this.toObject(),
      ...this.pick(set, [
        'rrpUsd',
        'rrpGbp',
        'estimatedValueNew',
        'estimatedValueUsed',
        'estimatedValueCurrency',
        'subtheme',
        'description',
        'descriptionFr',
      ]),
      dateFirstAvailable: set.dateFirstAvailable?.toISODate() ?? null,
      dateLastAvailable: set.dateLastAvailable?.toISODate() ?? null,
      estimatedValueUpdatedAt: set.estimatedValueUpdatedAt?.toISODate() ?? null,
      rebrickableUrl: rebrickableSetUrl(set.setNum),
      bricksetUrl: set.bricksetId ? bricksetSetUrl(set.setNum) : null,
      theme: ThemeTransformer.transform(this.whenLoaded(set.theme)),
      minifigs: MinifigTransformer.transform(this.whenLoaded(set.minifigs)),
    }
  }
}

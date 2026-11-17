import type Minifig from '#models/minifig'
import { BaseTransformer } from '@adonisjs/core/transformers'
import { minifigPath } from '#helpers/urls'

export default class MinifigTransformer extends BaseTransformer<Minifig> {
  toObject() {
    const quantity = this.resource.$extras.pivot_quantity
    return {
      ...this.pick(this.resource, ['id', 'figNum', 'name', 'imgUrl', 'numParts']),
      url: minifigPath(this.resource),
      /** quantity in a set, when loaded through a set's minifigs */
      quantity: quantity === undefined ? null : Number(quantity),
    }
  }
}

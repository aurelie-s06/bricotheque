import { ImportRunSchema } from '#database/schema'

/**
 * Log of an import (Rebrickable, Brickset, BrickLink). The JSON `cursor`
 * lets a long import resume where it stopped.
 */
export default class ImportRun extends ImportRunSchema {}

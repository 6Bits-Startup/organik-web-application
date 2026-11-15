/**
 * Where a measurement comes from: a physical sensor, a reading typed by the staff or a simulation
 * used while the sensors are not installed.
 */
export type ReadingSource = 'simulated' | 'sensor' | 'manual';

/** Every reading source. */
export const READING_SOURCES: readonly ReadingSource[] = ['simulated', 'sensor', 'manual'];

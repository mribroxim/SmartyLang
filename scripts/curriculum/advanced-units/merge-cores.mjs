import { CORES as A } from './aligned-cores.mjs';
import { CORES_B } from './aligned-cores-b.mjs';
import { CORES_C } from './aligned-cores-c.mjs';

// aligned-cores.mjs currently exports CORES with a1–a10 only; merge here for rebuild.
export const ALL_CORES = { ...A, ...CORES_B, ...CORES_C };

// Read-only provider inspection. Never prints API keys, customers or payments.
import 'dotenv/config';
import { dodoRequest } from '../server/dodoPayments.ts';
import { priceProduct } from '../server/paymentPolicy.ts';
console.log('Billing environment:', process.env.DODO_PAYMENTS_ENVIRONMENT || 'test_mode');
let failed = false;
for (const [plan, seats] of [['smarty-max', 1], ['business', 5]] as const) {
  try {
    const product = await dodoRequest(`/products/${encodeURIComponent(priceProduct(plan, seats, 1))}`);
    const price = product.price || {};
    const expected = plan === 'smarty-max' ? 1300 : 6500;
    const valid = price.type === 'recurring_price' && price.currency === 'USD' && Number(price.price) === expected;
    console.log(JSON.stringify({ plan, priceType: price.type, recurring: price.type === 'recurring_price', currency: price.currency, priceMinorUnits: price.price, expectedMinorUnits: expected, matches: valid }));
    if (!valid) failed = true;
  } catch { failed = true; console.error(`${plan}: provider configuration could not be verified`); }
}
process.exitCode = failed ? 1 : 0;

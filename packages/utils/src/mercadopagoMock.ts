/**
 * Mock Mercado Pago preference creation for development/testing.
 * Returns a fake checkout URL.
 */
export async function createCheckoutPreference(
  bookingId: string,
  serviceId: string,
  payerEmail: string
): Promise<{ ok: boolean; checkoutUrl: string }> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));
  const checkoutUrl = `https://mock.mercadopago.com/checkout?bookingId=${bookingId}&serviceId=${serviceId}&email=${encodeURIComponent(payerEmail)}`;
  return { ok: true, checkoutUrl };
}

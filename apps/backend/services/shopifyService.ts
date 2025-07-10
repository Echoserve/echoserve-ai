import { decrypt } from '../utils/encryption';

export async function fetchLiveShopifyContext(shopUrl: string, encryptedAccessToken: string, customerEmail: string) {
  try {
    const accessToken = decrypt(encryptedAccessToken);
    // 1. Fetch customer by email
    const customerRes = await fetch(`https://${shopUrl}/admin/api/2023-10/customers/search.json?query=email:${encodeURIComponent(customerEmail)}`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    if (!customerRes.ok) throw new Error('Customer fetch failed');
    const customerData = await customerRes.json();
    const customer = customerData.customers && customerData.customers[0];
    if (!customer) {
      return { message: 'Customer and order info not found for this user.' };
    }
    // 2. Fetch last 3 orders for this customer
    const ordersRes = await fetch(`https://${shopUrl}/admin/api/2023-10/orders.json?customer_id=${customer.id}&limit=3`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    if (!ordersRes.ok) throw new Error('Orders fetch failed');
    const ordersData = await ordersRes.json();
    const orders = (ordersData.orders || []).map((order: any) => ({
      id: order.id,
      status: order.financial_status,
      total_price: order.total_price,
      created_at: order.created_at,
    }));
    return {
      name: customer.first_name + ' ' + customer.last_name,
      email: customer.email,
      orders,
    };
  } catch (e) {
    return { message: 'Customer and order info not found for this user.' };
  }
}

export function getMockShopifyContext() {
  return {
    name: "John Doe",
    email: "john@example.com",
    orders: [
      { id: "ORD-1234", status: "Shipped", total_price: "49.99", created_at: "2023-01-01T12:00:00Z" },
      { id: "ORD-5678", status: "Processing", total_price: "19.99", created_at: "2023-01-10T12:00:00Z" },
    ],
  };
} 
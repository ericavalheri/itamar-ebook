const ASAAS_ENV = process.env.ASAAS_ENV === "production" ? "production" : "sandbox";

const DEFAULT_BASE_URL =
  ASAAS_ENV === "production"
    ? "https://api.asaas.com/v3"
    : "https://sandbox.asaas.com/api/v3";

// Override only for local development/testing against a mock server.
const ASAAS_BASE_URL = process.env.ASAAS_API_BASE_URL || DEFAULT_BASE_URL;

export class AsaasError extends Error {
  constructor(message: string, public status: number, public details?: unknown) {
    super(message);
    this.name = "AsaasError";
  }
}

function getApiKey() {
  const key = process.env.ASAAS_API_KEY;
  if (!key) {
    throw new Error(
      "ASAAS_API_KEY não está definido no ambiente. Configure a chave de API do Asaas."
    );
  }
  return key;
}

async function asaasFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${ASAAS_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      access_token: getApiKey(),
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  const text = await res.text();
  const body = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message =
      body?.errors?.map((e: { description?: string }) => e.description).join("; ") ||
      `Asaas respondeu ${res.status}`;
    throw new AsaasError(message, res.status, body);
  }

  return body as T;
}

export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
}

export async function findOrCreateCustomer(input: {
  name: string;
  email: string;
  cpfCnpj: string;
  phone: string;
}): Promise<AsaasCustomer> {
  const cpfCnpj = input.cpfCnpj.replace(/\D/g, "");

  const existing = await asaasFetch<{ data: AsaasCustomer[] }>(
    `/customers?cpfCnpj=${encodeURIComponent(cpfCnpj)}`
  );
  if (existing.data.length > 0) {
    return existing.data[0];
  }

  return asaasFetch<AsaasCustomer>("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      email: input.email,
      cpfCnpj,
      mobilePhone: input.phone.replace(/\D/g, ""),
    }),
  });
}

export interface AsaasPayment {
  id: string;
  status: string;
  value: number;
  dueDate: string;
}

function tomorrowDate(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export async function createPixCharge(input: {
  customerId: string;
  valueCentavos: number;
  description: string;
  externalReference: string;
}): Promise<AsaasPayment> {
  return asaasFetch<AsaasPayment>("/payments", {
    method: "POST",
    body: JSON.stringify({
      customer: input.customerId,
      billingType: "PIX",
      value: Number((input.valueCentavos / 100).toFixed(2)),
      dueDate: tomorrowDate(),
      description: input.description,
      externalReference: input.externalReference,
    }),
  });
}

export interface AsaasPixQrCode {
  encodedImage: string;
  payload: string;
  expirationDate: string;
}

export async function getPixQrCode(paymentId: string): Promise<AsaasPixQrCode> {
  return asaasFetch<AsaasPixQrCode>(`/payments/${paymentId}/pixQrCode`);
}

export async function getPayment(paymentId: string): Promise<AsaasPayment> {
  return asaasFetch<AsaasPayment>(`/payments/${paymentId}`);
}

import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createOrder } from "@/lib/orders";
import { getProductBySlug } from "@/lib/products";
import { isValidCPF, onlyDigits } from "@/lib/cpf";
import { findOrCreateCustomer, createPixCharge, getPixQrCode, AsaasError } from "@/lib/asaas";

export const runtime = "nodejs";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const { produto, nome, email, telefone, estado, cpf } = (body ?? {}) as Record<string, unknown>;

  const product = typeof produto === "string" ? getProductBySlug(produto) : undefined;
  if (!product) {
    return NextResponse.json({ error: "E-book não encontrado." }, { status: 404 });
  }

  if (
    typeof nome !== "string" || nome.trim().length < 3 ||
    typeof email !== "string" || !isValidEmail(email) ||
    typeof telefone !== "string" || telefone.trim().length < 8 ||
    typeof estado !== "string" || estado.trim().length !== 2 ||
    typeof cpf !== "string" || !isValidCPF(cpf)
  ) {
    return NextResponse.json(
      { error: "Preencha nome, e-mail, telefone, estado e CPF válidos." },
      { status: 400 }
    );
  }

  const nomeTrim = nome.trim();
  const emailTrim = email.trim().toLowerCase();
  const telefoneTrim = telefone.trim();
  const cpfDigits = onlyDigits(cpf);

  const id = randomUUID();

  try {
    const customer = await findOrCreateCustomer({
      name: nomeTrim,
      email: emailTrim,
      cpfCnpj: cpfDigits,
      phone: telefoneTrim,
    });

    const payment = await createPixCharge({
      customerId: customer.id,
      valueCentavos: product.precoCentavos,
      description: `E-book ${product.titulo}`,
      externalReference: id,
    });

    const qrCode = await getPixQrCode(payment.id);

    const order = createOrder({
      id,
      produto: product.slug,
      nome: nomeTrim,
      email: emailTrim,
      telefone: telefoneTrim,
      estado: estado.trim().toUpperCase(),
      cpf: cpfDigits,
      valorCentavos: product.precoCentavos,
      asaasCustomerId: customer.id,
      asaasPaymentId: payment.id,
      pixQrBase64: qrCode.encodedImage,
      pixCopiaCola: qrCode.payload,
      pixExpiracao: qrCode.expirationDate,
    });

    return NextResponse.json({ id: order.id });
  } catch (err) {
    if (err instanceof AsaasError) {
      return NextResponse.json(
        { error: `Não foi possível gerar o Pix: ${err.message}` },
        { status: 502 }
      );
    }
    const message = err instanceof Error ? err.message : "Erro desconhecido.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

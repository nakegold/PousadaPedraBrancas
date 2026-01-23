require("dotenv").config();

const PDFDocument = require("pdfkit");
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const ExcelJS = require("exceljs");

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

console.log("Index.js iniciou");

/* ================== ROOT ================== */

app.get("/", (req, res) => {
  res.send("API de vouchers online");
});

/* ================== FORNECEDORES ================== */

app.get("/fornecedores", async (req, res) => {
  const { data, error } = await supabase
    .from("fornecedores")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json(error);
  res.json(data);
});

app.post("/fornecedores", async (req, res) => {
  const { data, error } = await supabase
    .from("fornecedores")
    .insert([req.body])
    .select()
    .single();

  if (error) {
    console.error("ERRO INSERT FORNECEDOR:", error);
    return res.status(500).json(error);
  }

  res.json(data);
});

app.put("/fornecedores/:id", async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("fornecedores")
    .update(req.body)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("ERRO UPDATE FORNECEDOR:", error);
    return res.status(500).json(error);
  }

  res.json(data);
});

app.delete("/fornecedores/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("fornecedores")
    .delete()
    .eq("id", id);

  if (error) return res.status(500).json(error);
  res.json({ success: true });
});

/* ================== OPERAÇÕES ================== */

app.post("/operacoes", async (req, res) => {
  const { data, error } = await supabase
    .from("fornecedores_operacao")
    .insert([req.body])
    .select()
    .single();

  if (error) {
    console.error("ERRO INSERT OPERAÇÃO:", error);
    return res.status(500).json(error);
  }

  res.json(data);
});

app.get("/operacoes", async (req, res) => {
  const { mes, ano } = req.query;

  if (!mes || !ano) {
    return res.status(400).json({ error: "mes e ano são obrigatórios" });
  }

  const inicio = new Date(ano, mes - 1, 1).toISOString().slice(0, 10);
  const fim = new Date(ano, mes, 0).toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("fornecedores_operacao")
    .select("*")
    .gte("data_inicio", inicio)
    .lte("data_fim", fim)
    .order("data_inicio");

  if (error) {
    console.error("ERRO LISTAR OPERAÇÕES:", error);
    return res.status(500).json(error);
  }

  res.json(data);
});

app.delete("/operacoes/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("fornecedores_operacao")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("ERRO DELETE OPERAÇÃO:", error);
    return res.status(500).json(error);
  }

  res.json({ success: true });
});

/* ================== VOUCHERS ================== */

app.get("/vouchers", async (req, res) => {
  const { data, error } = await supabase
    .from("voucher_PousadaPedraBranca")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json(error);
  res.json(data);
});

app.post("/vouchers", async (req, res) => {
  const { data, error } = await supabase
    .from("voucher_PousadaPedraBranca")
    .insert([req.body])
    .select()
    .single();

  if (error) {
    console.error("ERRO INSERT:", error);
    return res.status(500).json(error);
  }

  res.json(data);
});

app.put("/vouchers/:id", async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("voucher_PousadaPedraBranca")
    .update(req.body)
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(500).json(error);
  res.json(data);
});

app.delete("/vouchers/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("voucher_PousadaPedraBranca")
    .delete()
    .eq("id", id);

  if (error) return res.status(500).json(error);
  res.json({ success: true });
});

/* ================== PDF ================== */

function formatarDataBR(data) {
  if (!data) return "";
  const d = new Date(data);
  return d.toLocaleDateString("pt-BR");
}

app.get("/vouchers/:id/pdf", async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("voucher_PousadaPedraBranca")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: "Voucher não encontrado" });
  }

  const doc = new PDFDocument({ size: "A4", margin: 40 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline; filename=voucher.pdf");

  doc.pipe(res);

  const blue = "#1e6bd6";
  const gray = "#f2f4f8";
  const border = "#d6dbe3";

  /* ===== HEADER ===== */

  doc.image("logo.png", 40, 25, { width: 110 });

  doc.fontSize(16).fillColor(blue).text("Voucher de Hospedagem", 200, 35);
  doc.fontSize(9).fillColor("#555").text("Reserva Confirmada", 200, 55);

  doc.moveTo(40, 85).lineTo(555, 85).strokeColor(border).stroke();
  doc.moveDown(1.5);

  /* ===== DADOS ===== */

  const y0 = doc.y;

  doc.roundedRect(40, y0, 515, 70, 8).fillAndStroke(gray, border);

  doc.fillColor("#000").fontSize(10);

  doc.text("Empresa:", 55, y0 + 10);
  doc.font("Helvetica-Bold").text(data.empresa || "", 110, y0 + 10);
  doc.font("Helvetica");

  doc.text("Operação:", 320, y0 + 10);
  doc.font("Helvetica-Bold").text(data.operacao || "", 395, y0 + 10);
  doc.font("Helvetica");

  doc.text(`Check-in: ${formatarDataBR(data.checkin)}`, 55, y0 + 38);
  doc.text(`Check-out: ${formatarDataBR(data.checkout)}`, 320, y0 + 38);

  doc.y = y0 + 85;

  /* ===== HÓSPEDES ===== */

  doc.fillColor(blue).fontSize(12).text("Hóspedes");
  doc.moveDown(0.3);

  const hospedesTexto = (data.hospedes || [])
    .map((h, i) => `${i + 1}. ${h}`)
    .join("\n");

  const alturaHospedes = doc.heightOfString(hospedesTexto, { width: 480 });
  const yH = doc.y;

  doc.roundedRect(40, yH, 515, alturaHospedes + 24, 8).fillAndStroke(gray, border);
  doc.fillColor("#000").fontSize(10).text(hospedesTexto, 55, yH + 10, { width: 480 });

  const acom = data.acomodacoes || {};

  doc.text(
    `Acomodações: Single ${acom.single || 0} | Double ${acom.double || 0} | Triple ${acom.triple || 0}`,
    55,
    yH + alturaHospedes + 12
  );

  doc.y = yH + alturaHospedes + 35;

  /* ===== HOTEL / RESTAURANTE ===== */

  doc.fillColor(blue).fontSize(12).text("Hotel", 40);
  doc.text("Restaurante", 300, doc.y - 14);

  doc.moveDown(0.3);

  const yHR = doc.y;

  const hotelTexto =
    `${data.hotel_nome || ""}\n` +
    `Endereço: ${data.hotel_endereco || ""}\n` +
    `Café: ${data.hotel_cafe || ""}\n` +
    `Lavanderia: ${data.hotel_lavanderia || ""}`;

  const hHotel = doc.heightOfString(hotelTexto, { width: 210 });

  doc.roundedRect(40, yHR, 240, hHotel + 18, 8).fillAndStroke(gray, border);
  doc.fillColor("#000").fontSize(10).text(hotelTexto, 55, yHR + 10, { width: 210 });

  const restTexto =
    `${data.restaurante_nome || ""}\n` +
    `Horário: ${data.restaurante_horario || ""}\n` +
    `Endereço: ${data.restaurante_endereco || ""}`;

  const hRest = doc.heightOfString(restTexto, { width: 220 });

  doc.roundedRect(300, yHR, 255, hRest + 18, 8).fillAndStroke(gray, border);
  doc.fillColor("#000").fontSize(10).text(restTexto, 315, yHR + 10, { width: 220 });

  doc.y = Math.max(yHR + hHotel, yHR + hRest) + 35;

  /* ===== FATURAMENTO ===== */

  doc.fillColor(blue).fontSize(12).text("Faturamento");
  doc.moveDown(0.3);

  const yF = doc.y;

  doc.roundedRect(40, yF, 515, 35, 8).fillAndStroke(gray, border);
  doc.fillColor("#000").fontSize(10).text(
    data.faturado_empresa
      ? `Faturado para: ${data.empresa_faturada || data.empresa}`
      : "Não faturado para empresa",
    55,
    yF + 12
  );

  doc.y = yF + 45;

  /* ===== CONTATO ===== */

  doc.fillColor(blue).fontSize(12).text("Contato");
  doc.moveDown(0.3);

  const yC = doc.y;

  doc.roundedRect(40, yC, 515, 45, 8).fillAndStroke(gray, border);
  doc.fillColor("#000").fontSize(10);

  doc.text(`Reserva: ${data.responsavel_reserva || ""}`, 55, yC + 10);
  doc.text(`Operacional: ${data.responsavel_operacional || ""}`, 55, yC + 24);
  doc.text(`${data.email_contato || ""} • ${data.telefone_contato || ""}`, 320, yC + 18);

  doc.y = yC + 60;

  /* ===== OBSERVAÇÕES ===== */

  if (data.observacoes) {
    doc.fillColor(blue).fontSize(12).text("Observações");
    doc.moveDown(0.3);

    const hObs = doc.heightOfString(data.observacoes, { width: 480 });
    const yO = doc.y;

    doc.roundedRect(40, yO, 515, hObs + 18, 8).fillAndStroke(gray, border);
    doc.fillColor("#000").fontSize(10).text(data.observacoes, 55, yO + 10, { width: 480 });

    doc.y = yO + hObs + 30;
  }

  /* ===== RODAPÉ ===== */

const footerText = `Gerado em ${new Date().toLocaleString("pt-BR")}`;
const footerHeight = doc.heightOfString(footerText, { width: 515 });

// posição fixa no fim da página
const footerY =
  doc.page.height - doc.page.margins.bottom - footerHeight;

// se o conteúdo já passou do espaço do rodapé, cria nova página
if (doc.y > footerY - 10) {
  doc.addPage();
}

doc.fontSize(8).fillColor("#777").text(
  footerText,
  40,
  footerY,
  { align: "center", width: 515 }
);

doc.end();


/* ================== EXCEL ================== */

// excel fornecedores
app.get("/excel/fornecedores", async (req, res) => {
  const { data, error } = await supabase
    .from("fornecedores")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) return res.status(500).json(error);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Fornecedores");

  sheet.columns = [
    { header: "Nome", key: "nome_fornecedor", width: 30 },
    { header: "Tipo", key: "tipo_servico", width: 15 },
    { header: "Município", key: "municipio", width: 20 },
    { header: "Email", key: "email", width: 30 },
    { header: "Telefone", key: "telefone", width: 20 },
    { header: "Banco", key: "banco_nome", width: 20 },
    { header: "Agência", key: "agencia", width: 15 },
    { header: "Conta", key: "conta", width: 15 },
    { header: "Pix", key: "chave_pix", width: 25 },
    { header: "Condição Pgto", key: "condicao_pagamento", width: 25 },
  ];

  data.forEach((f) => sheet.addRow(f));

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", "attachment; filename=fornecedores.xlsx");

  await workbook.xlsx.write(res);
  res.end();
});

// excel operações
app.get("/excel/operacoes", async (req, res) => {
  const { data, error } = await supabase
    .from("fornecedores_operacao")
    .select("*")
    .order("mes", { ascending: true });

  if (error) return res.status(500).json(error);

  const workbook = new ExcelJS.Workbook();

  const meses = {
    1: "Janeiro", 2: "Fevereiro", 3: "Março", 4: "Abril",
    5: "Maio", 6: "Junho", 7: "Julho", 8: "Agosto",
    9: "Setembro", 10: "Outubro", 11: "Novembro", 12: "Dezembro"
  };

  Object.entries(meses).forEach(([num, nomeMes]) => {
    const sheet = workbook.addWorksheet(nomeMes);

    sheet.columns = [
      { header: "Nome", key: "nome", width: 30 },
      { header: "Endereço", key: "endereco", width: 35 },
      { header: "Data Início", key: "data_inicio", width: 15 },
      { header: "Data Fim", key: "data_fim", width: 15 },
      { header: "Ano", key: "ano", width: 10 },
    ];

    data
      .filter((o) => String(o.mes) === String(num))
      .forEach((o) => sheet.addRow(o));
  });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", "attachment; filename=operacoes_2026.xlsx");

  await workbook.xlsx.write(res);
  res.end();
});

/* ================== START ================== */

app.listen(process.env.PORT || 3000, () => {
  console.log("Servidor rodando na porta", process.env.PORT || 3000);
});

require("dotenv").config();

const PDFDocument = require("pdfkit");
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

console.log("Index.js iniciou");

app.get("/", (req, res) => {
  res.send("API de vouchers online");
});
//LISTAR FORNECEDORES
app.get("/fornecedores", async (req, res) => {
  const { data, error } = await supabase
    .from("fornecedores")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json(error);
  res.json(data);
});

//CRIAR FORNECEDORES
app.post("/fornecedores", async (req, res) => {
  const fornecedor = req.body;

  const { data, error } = await supabase
    .from("fornecedores")
    .insert([fornecedor])
    .select();

  if (error) {
    console.error("ERRO INSERT FORNECEDOR:", error);
    return res.status(500).json(error);
  }

  res.json(data);
});

//DELETAR FORNECEDORES
app.delete("/fornecedores/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("fornecedores")
    .delete()
    .eq("id", id);

  if (error) return res.status(500).json(error);
  res.json({ success: true });
});

// EDITAR FORNECEDOR
app.put("/fornecedores/:id", async (req, res) => {
  const { id } = req.params;
  const dados = req.body;

  const { data, error } = await supabase
    .from("fornecedores")
    .update(dados)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("ERRO UPDATE FORNECEDOR:", error);
    return res.status(500).json(error);
  }

  res.json(data);
});

// LISTAR VOUCHERS
app.get("/vouchers", async (req, res) => {
  const { data, error } = await supabase
    .from("voucher_PousadaPedraBranca")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json(error);
  res.json(data);
});

// CRIAR VOUCHER
app.post("/vouchers", async (req, res) => {
  console.log("POST RECEBIDO:", req.body);

  const voucher = req.body;

  const { data, error } = await supabase
    .from("voucher_PousadaPedraBranca")
    .insert([voucher])
    .select();

  if (error) {
    console.error("ERRO INSERT:", error);
    return res.status(500).json(error);
  }

  res.json(data);
});


// EDITAR VOUCHER
app.put("/vouchers/:id", async (req, res) => {
  const { id } = req.params;
  const dados = req.body;

  const { data, error } = await supabase
    .from("voucher_PousadaPedraBranca")
    .update(dados)
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(500).json(error);
  res.json(data);
});

// DELETAR VOUCHER
app.delete("/vouchers/:id", async (req, res) => {
  console.log("DELETE CHAMADO:", req.params.id);

  const { id } = req.params;

  const { error } = await supabase
    .from("voucher_PousadaPedraBranca")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("ERRO DELETE:", error);
    return res.status(500).json(error);
  }

  res.json({ success: true });
});

function formatarDataBR(data) {
  if (!data) return "";
  const d = new Date(data);
  return d.toLocaleDateString("pt-BR");
}

// GERAR PDF DO VOUCHER
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

  doc.image("logo.png", 40, 30, { width: 120 });

  doc
    .fontSize(18)
    .fillColor(blue)
    .text("Voucher de Hospedagem", 200, 40);

  doc
    .fontSize(10)
    .fillColor("#555")
    .text("Reserva Confirmada", 200, 65);

  doc.moveTo(40, 95).lineTo(555, 95).strokeColor(border).stroke();

  doc.moveDown(2);

  /* ===== BLOCO PRINCIPAL ===== */

  const y0 = doc.y;

  doc.roundedRect(40, y0, 515, 85, 8).fillAndStroke(gray, border);

  doc.fillColor("#000").fontSize(11);

  doc.text("Empresa", 55, y0 + 10);
  doc.font("Helvetica-Bold").text(data.empresa, 55, y0 + 24);
  doc.font("Helvetica");

  doc.text("Operação", 320, y0 + 10);
  doc.font("Helvetica-Bold").text(data.operacao, 320, y0 + 24);
  doc.font("Helvetica");

  doc.text(`Check-in: ${formatarDataBR(data.checkin)}`, 55, y0 + 50);
  doc.text(`Check-out: ${formatarDataBR(data.checkout)}`, 320, y0 + 50);

  doc.moveDown(4);

  /* ===== HÓSPEDES / ACOMODAÇÕES ===== */

  doc.fillColor(blue).fontSize(13).text("Hóspedes");
  doc.moveDown(0.5);

  const yH = doc.y;

  doc.roundedRect(40, yH, 515, 75, 8).fillAndStroke(gray, border);
  doc.fillColor("#000").fontSize(11);

  let yList = yH + 10;

  (data.hospedes || []).forEach((h, i) => {
    doc.text(`${i + 1}. ${h}`, 55, yList);
    yList += 14;
  });

  const acom = data.acomodacoes || {};
  doc.text(
    `Acomodações: Single ${acom.single || 0} | Double ${acom.double || 0} | Triple ${acom.triple || 0}`,
    55,
    yList + 4
  );

  doc.moveDown(4);

  /* ===== HOTEL / RESTAURANTE ===== */

  doc.fillColor(blue).fontSize(13).text("Hotel", 40);
  doc.text("Restaurante", 300, doc.y - 18);

  doc.moveDown(0.5);

  const yHR = doc.y;

  // HOTEL
  doc.roundedRect(40, yHR, 240, 95, 8).fillAndStroke(gray, border);
  doc.fillColor("#000").fontSize(11);

  doc.font("Helvetica-Bold").text(data.hotel_nome, 55, yHR + 10);
  doc.font("Helvetica");
  doc.text(`Endereço: ${data.hotel_endereco}`, 55, yHR + 28);
  doc.text(`Café: ${data.hotel_cafe}`, 55, yHR + 46);
  doc.text(`Lavanderia: ${data.hotel_lavanderia}`, 55, yHR + 64);

  // RESTAURANTE
  doc.roundedRect(300, yHR, 255, 95, 8).fillAndStroke(gray, border);

  doc.font("Helvetica-Bold").text(data.restaurante_nome, 315, yHR + 10);
  doc.font("Helvetica");
  doc.text(`Horário: ${data.restaurante_horario}`, 315, yHR + 28);
  doc.text(`Endereço: ${data.restaurante_endereco}`, 315, yHR + 46);

  doc.moveDown(4);

  /* ===== FATURAMENTO ===== */

  doc.fillColor(blue).fontSize(13).text("Faturamento");
  doc.moveDown(0.5);

  const yF = doc.y;

  doc.roundedRect(40, yF, 515, 40, 8).fillAndStroke(gray, border);
  doc.fillColor("#000").fontSize(11);

  doc.text(
    data.faturado_empresa
      ? `Faturado para: ${data.empresa_faturada || data.empresa}`
      : "Não faturado para empresa",
    55,
    yF + 14
  );

  doc.moveDown(3);

  /* ===== CONTATO ===== */

  doc.fillColor(blue).fontSize(13).text("Contato");
  doc.moveDown(0.5);

  const yC = doc.y;

  doc.roundedRect(40, yC, 515, 60, 8).fillAndStroke(gray, border);
  doc.fillColor("#000").fontSize(11);

  doc.text(`Reserva: ${data.responsavel_reserva}`, 55, yC + 10);
  doc.text(`Operacional: ${data.responsavel_operacional}`, 55, yC + 26);
  doc.text(`${data.email_contato} • ${data.telefone_contato}`, 55, yC + 42);

  doc.moveDown(3);

  /* ===== OBSERVAÇÕES ===== */

  if (data.observacoes) {
    doc.fillColor(blue).fontSize(13).text("Observações");
    doc.moveDown(0.5);

    const yO = doc.y;

    doc.roundedRect(40, yO, 515, 55, 8).fillAndStroke(gray, border);
    doc.fillColor("#000").fontSize(11);
    doc.text(data.observacoes, 55, yO + 12, { width: 480 });
  }

  /* ===== RODAPÉ ===== */

  doc.moveDown(3);
  doc
    .fontSize(9)
    .fillColor("#777")
    .text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, {
      align: "center",
    });

  doc.end();
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Servidor rodando na porta", process.env.PORT || 3000);
});

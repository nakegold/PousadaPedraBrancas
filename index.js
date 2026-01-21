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
  return new Date(data).toLocaleDateString("pt-BR");
}

app.get("/vouchers/:id/pdf", async (req, res) => {
  const { id } = req.params;

  const { data } = await supabase
    .from("voucher_PousadaPedraBranca")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) return res.status(404).json({ error: "Voucher não encontrado" });

  const doc = new PDFDocument({ size: "A4", margin: 40 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline; filename=voucher.pdf");
  doc.pipe(res);

  doc.fontSize(16).text("Voucher de Hospedagem", { align: "center" });
  doc.moveDown();

  doc.fontSize(11);
  doc.text(`Empresa: ${data.empresa}`);
  doc.text(`Operação: ${data.operacao}`);
  doc.text(`Check-in: ${formatarDataBR(data.checkin)}`);
  doc.text(`Check-out: ${formatarDataBR(data.checkout)}`);

  doc.moveDown();
  (data.hospedes || []).forEach((h, i) => doc.text(`${i + 1}. ${h}`));

  doc.end();
});

/* ================== START ================== */

app.listen(process.env.PORT || 3000, () => {
  console.log("Servidor rodando na porta", process.env.PORT || 3000);
});

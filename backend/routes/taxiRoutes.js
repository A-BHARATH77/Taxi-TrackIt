
import express from "express";
import { supabase } from "../config/supabaseClient.js";

const router = express.Router();

router.get("/taxis", async (req, res) => {
  const { data, error } = await supabase
    .from("taxis")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post("/taxi", async (req, res) => {
  const { name, taxi_id } = req.body;

  console.log(`📝 Adding new taxi - Name: ${name}, ID: ${taxi_id}`);

  const { data, error } = await supabase
    .from("taxis")
    .insert([{ name, taxi_id }])
    .select();

  if (error) {
    if (error.code === "23505") {
    return res.status(400).json({ error: "Taxi ID already exists" });
  }
    console.error(`❌ Error adding taxi:`, error.message);
    return res.status(500).json({ error: error.message });
  }

  console.log(`✅ Taxi added successfully:`, data[0]);
  res.json(data[0]);
});

router.put("/taxi/:id", async (req, res) => {
  const { id } = req.params;
  const { name, taxi_id } = req.body;

  const { data, error } = await supabase
    .from("taxis")
    .update({ name, taxi_id })
    .eq("id", id)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

router.delete("/taxi/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("taxis")
    .delete()
    .eq("id", id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: "Taxi deleted successfully" });
});

export default router;

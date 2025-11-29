import express from "express";
import { supabase } from "../config/supabaseClient.js";

const router = express.Router();

// CREATE zone
router.post("/zone", async (req, res) => {
  const { name, boundary } = req.body;

  console.log(`📝 Adding new zone - Name: ${name}, Boundary: ${JSON.stringify(boundary)}`);

  if (!name || !boundary) {
    return res.status(400).json({ error: "Name and boundary are required" });
  }

  try {
    const { data, error } = await supabase
      .from("zones")
      .insert([{ name, boundary: JSON.stringify(boundary) }])
      .select();

    if (error) {
      console.error(`❌ Error adding zone:`, error.message);
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Zone added successfully:`, data[0]);
    res.status(201).json(data[0]);
  } catch (err) {
    console.error("Error creating zone:", err);
    res.status(500).json({ error: "Failed to create zone" });
  }
});

// GET all zones
router.get("/zones", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("zones")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(`❌ Error fetching zones:`, error.message);
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error("Error fetching zones:", err);
    res.status(500).json({ error: "Failed to fetch zones" });
  }
});

// GET a zone by ID
router.get("/zone/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from("zones")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: "Zone not found" });
      }
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error("Error fetching zone:", err);
    res.status(500).json({ error: "Failed to fetch zone" });
  }
});

// UPDATE zone
router.put("/zone/:id", async (req, res) => {
  const { id } = req.params;
  const { name, boundary } = req.body;

  console.log(`📝 Updating zone ${id} - Name: ${name}`);

  try {
    const { data, error } = await supabase
      .from("zones")
      .update({ name, boundary: JSON.stringify(boundary) })
      .eq("id", id)
      .select();

    if (error) {
      console.error(`❌ Error updating zone:`, error.message);
      return res.status(500).json({ error: error.message });
    }

    if (data.length === 0) {
      return res.status(404).json({ error: "Zone not found" });
    }

    console.log(`✅ Zone updated successfully:`, data[0]);
    res.json(data[0]);
  } catch (err) {
    console.error("Error updating zone:", err);
    res.status(500).json({ error: "Failed to update zone" });
  }
});

// DELETE zone
router.delete("/zone/:id", async (req, res) => {
  const { id } = req.params;

  console.log(`🗑️ Deleting zone ${id}`);

  try {
    const { data, error } = await supabase
      .from("zones")
      .delete()
      .eq("id", id)
      .select();

    if (error) {
      console.error(`❌ Error deleting zone:`, error.message);
      return res.status(500).json({ error: error.message });
    }

    if (data.length === 0) {
      return res.status(404).json({ error: "Zone not found" });
    }

    console.log(`✅ Zone deleted successfully`);
    res.json({ message: "Zone deleted successfully" });
  } catch (err) {
    console.error("Error deleting zone:", err);
    res.status(500).json({ error: "Failed to delete zone" });
  }
});

export default router;

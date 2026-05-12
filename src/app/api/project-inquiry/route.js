import { supabase } from "@/services/supabaseClient";
import { sendProjectInquiryEmail } from "@/services/mailer";

export async function POST(req) {
  try {
    const { name, email, projectType, description, features, timeline, notes } =
      await req.json();

    if (!name || !email || !projectType || !description) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
      });
    }

    const { error } = await supabase
      .from("project_inquiries")
      .insert([{
        name,
        email,
        project_type: projectType,
        description,
        features: features || null,
        timeline: timeline || null,
        notes: notes || null,
      }]);

    if (error) {
      console.error("Supabase insert error:", error);
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
      });
    }

    await sendProjectInquiryEmail({
      name,
      email,
      projectType,
      description,
      features,
      timeline,
      notes,
    });

    return new Response(
      JSON.stringify({ message: "Project brief submitted successfully" }),
      { status: 200 }
    );
  } catch (err) {
    console.error("API error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}

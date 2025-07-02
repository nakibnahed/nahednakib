import { supabase } from "@/services/supabaseClient";
import { sendNewsletterWelcomeEmail } from "@/services/mailer";

export async function POST(req) {
  try {
    const { email } = await req.json();

    console.log("Newsletter API called with email:", email);

    // Validate email
    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Test if table exists by attempting to query it
    console.log("Checking if newsletter_subscribers table exists...");

    // Check if email already exists
    const { data: existing, error: selectError } = await supabase
      .from("newsletter_subscribers")
      .select("email, subscribed")
      .eq("email", email.toLowerCase())
      .maybeSingle(); // Use maybeSingle instead of single to avoid error when no results

    if (selectError && selectError.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("Supabase select error:", selectError);

      // Check if it's a table not found error
      if (
        selectError.message?.includes(
          'relation "newsletter_subscribers" does not exist'
        )
      ) {
        return new Response(
          JSON.stringify({
            error:
              "Newsletter table not found. Please create the newsletter_subscribers table in Supabase first.",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({ error: "Database error: " + selectError.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("Existing subscriber check result:", existing);

    if (existing) {
      if (existing.subscribed) {
        return new Response(
          JSON.stringify({ error: "Email already subscribed to newsletter" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      } else {
        // Reactivate subscription
        const { error: updateError } = await supabase
          .from("newsletter_subscribers")
          .update({
            subscribed: true,
            subscribed_at: new Date().toISOString(),
            unsubscribed_at: null,
          })
          .eq("email", email.toLowerCase());

        if (updateError) {
          console.error("Supabase update error:", updateError);
          return new Response(JSON.stringify({ error: "Database error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          // Get the updated record to get the unsubscribe token
          const { data: updatedRecord } = await supabase
            .from("newsletter_subscribers")
            .select("unsubscribe_token")
            .eq("email", email.toLowerCase())
            .single();

          await sendNewsletterWelcomeEmail(
            email,
            updatedRecord.unsubscribe_token
          );
        } catch (emailError) {
          console.error("Email sending error:", emailError);
          // Don't fail the subscription if email fails
        }

        return new Response(
          JSON.stringify({
            message: "Successfully resubscribed to newsletter!",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Insert new subscriber
    console.log("Inserting new subscriber...");
    const { data: newSubscriber, error: insertError } = await supabase
      .from("newsletter_subscribers")
      .insert([
        {
          email: email.toLowerCase(),
          subscribed: true,
          subscribed_at: new Date().toISOString(),
        },
      ])
      .select("unsubscribe_token")
      .maybeSingle();

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Database error: " + insertError.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("Successfully inserted subscriber:", newSubscriber);

    // Send welcome email (optional - don't fail if email service is not configured)
    try {
      if (newSubscriber?.unsubscribe_token) {
        console.log("Attempting to send welcome email...");
        await sendNewsletterWelcomeEmail(
          email,
          newSubscriber.unsubscribe_token
        );
        console.log("Welcome email sent successfully");
      } else {
        console.log("No unsubscribe token found, skipping email");
      }
    } catch (emailError) {
      console.error("Email sending error (non-fatal):", emailError);
      // Don't fail the subscription if email fails, but log it
    }

    return new Response(
      JSON.stringify({
        message:
          "Successfully subscribed to newsletter! Check your email for confirmation.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("API error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// GET endpoint to retrieve newsletter subscribers (admin only)
export async function GET(req) {
  try {
    const { data: subscribers, error } = await supabase
      .from("newsletter_subscribers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase select error:", error);
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ subscribers }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("API error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// DELETE endpoint to remove newsletter subscribers (admin only)
export async function DELETE(req) {
  try {
    const { subscriberId } = await req.json();

    if (!subscriberId) {
      return new Response(
        JSON.stringify({ error: "Subscriber ID is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { error } = await supabase
      .from("newsletter_subscribers")
      .delete()
      .eq("id", subscriberId);

    if (error) {
      console.error("Supabase delete error:", error);
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ message: "Subscriber deleted successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("API error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

import { supabase } from "@/services/supabaseClient";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return new Response(
        `<html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #dc2626;">Invalid Unsubscribe Link</h1>
            <p>The unsubscribe link is invalid or expired.</p>
          </body>
        </html>`,
        {
          status: 400,
          headers: { "Content-Type": "text/html" },
        }
      );
    }

    // Find subscriber by token
    const { data: subscriber, error: selectError } = await supabase
      .from("newsletter_subscribers")
      .select("email, subscribed")
      .eq("unsubscribe_token", token)
      .single();

    if (selectError || !subscriber) {
      return new Response(
        `<html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #dc2626;">Invalid Unsubscribe Link</h1>
            <p>The unsubscribe link is invalid or expired.</p>
          </body>
        </html>`,
        {
          status: 404,
          headers: { "Content-Type": "text/html" },
        }
      );
    }

    if (!subscriber.subscribed) {
      return new Response(
        `<html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f9fafb;">
            <div style="max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <h1 style="color: #059669; margin-bottom: 20px;">Already Unsubscribed</h1>
              <p style="color: #4b5563; font-size: 16px;">You are already unsubscribed from our newsletter.</p>
              <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                If you want to subscribe again, please visit our website.
              </p>
            </div>
          </body>
        </html>`,
        {
          status: 200,
          headers: { "Content-Type": "text/html" },
        }
      );
    }

    // Unsubscribe the user
    const { error: updateError } = await supabase
      .from("newsletter_subscribers")
      .update({
        subscribed: false,
        unsubscribed_at: new Date().toISOString(),
      })
      .eq("unsubscribe_token", token);

    if (updateError) {
      console.error("Supabase update error:", updateError);
      return new Response(
        `<html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #dc2626;">Error</h1>
            <p>Failed to unsubscribe. Please try again later.</p>
          </body>
        </html>`,
        {
          status: 500,
          headers: { "Content-Type": "text/html" },
        }
      );
    }

    // Return success page
    return new Response(
      `<html>
        <head>
          <title>Unsubscribed Successfully</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f9fafb; margin: 0;">
          <div style="max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="font-size: 48px; margin-bottom: 20px;">👋</div>
            <h1 style="color: #059669; margin-bottom: 20px; font-size: 24px;">Successfully Unsubscribed</h1>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              You have been successfully unsubscribed from our newsletter.
            </p>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Thanks for being part of our journey! �
            </p>
            <div style="margin-top: 30px; padding: 20px; background-color: #f0f9ff; border-radius: 8px;">
              <p style="color: #1e40af; font-size: 14px; margin: 0;">
                Changed your mind? You can always <a href="http://localhost:3000/contact" style="color: #3b82f6; text-decoration: none;">subscribe again</a> anytime.
              </p>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              - Nahed Dev Team
            </p>
          </div>
        </body>
      </html>`,
      {
        status: 200,
        headers: { "Content-Type": "text/html" },
      }
    );
  } catch (err) {
    console.error("Unsubscribe API error:", err);
    return new Response(
      `<html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #dc2626;">Error</h1>
          <p>An unexpected error occurred. Please try again later.</p>
        </body>
      </html>`,
      {
        status: 500,
        headers: { "Content-Type": "text/html" },
      }
    );
  }
}

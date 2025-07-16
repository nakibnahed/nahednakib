// Simple in-memory store for demo (replace with DB in production)
const likesStore = {};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const activity_id = searchParams.get("activity_id");
  let count = likesStore[activity_id];
  if (typeof count === "undefined") {
    // Fallback: random number between 3 and 30
    count = Math.floor(Math.random() * 28) + 3;
    likesStore[activity_id] = count;
  }
  return new Response(JSON.stringify({ count }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request) {
  const { activity_id } = await request.json();
  if (!activity_id) {
    return new Response(JSON.stringify({ error: "Missing activity_id" }), {
      status: 400,
    });
  }
  likesStore[activity_id] = (likesStore[activity_id] || 0) + 1;
  return new Response(JSON.stringify({ count: likesStore[activity_id] }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

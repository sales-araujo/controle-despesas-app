import { jsonResponse } from "../_utils";

export async function GET() {
  return jsonResponse(200, { ok: true });
}

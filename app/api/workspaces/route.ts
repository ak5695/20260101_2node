import type { NextRequest } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getWorkspacesByUserId, deleteWorkspaceById } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  const workspaces = await getWorkspacesByUserId(session.user.id);

  return Response.json({ workspaces });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");

  if (!id) {
    return new ChatSDKError("bad_request:api", "Missing workspace id").toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  const result = await deleteWorkspaceById({ id });

  return Response.json(result, { status: 200 });
}

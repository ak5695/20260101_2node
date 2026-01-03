
import { config } from "dotenv";
import postgres from "postgres";

config({
  path: ".env.local",
});

const run = async () => {
  if (!process.env.POSTGRES_URL) {
    console.log("⏭️  POSTGRES_URL not defined");
    process.exit(1);
  }

  const sql = postgres(process.env.POSTGRES_URL, { max: 1 });

  console.log("⏳ Creating Canvas tables...");

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS "Workspace" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "userId" uuid NOT NULL,
        "name" varchar(255) DEFAULT 'Untitled Workspace' NOT NULL,
        "settings" json,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS "CanvasNode" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "workspaceId" uuid NOT NULL,
        "type" varchar(50) NOT NULL,
        "positionX" real NOT NULL,
        "positionY" real NOT NULL,
        "summaryQuestion" text,
        "summaryAnswer" text,
        "fullQuestion" text,
        "fullAnswer" text,
        "highlights" json,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS "CanvasEdge" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "workspaceId" uuid NOT NULL,
        "sourceNodeId" uuid NOT NULL,
        "targetNodeId" uuid NOT NULL,
        "sourceHandle" varchar(50),
        "targetHandle" varchar(50),
        "createdAt" timestamp DEFAULT now() NOT NULL
      );
    `;

    // Add constraints if they don't exist (using DO block to ignore if exists)
    // Note: In Postgres, adding constraints with same name fails.
    // So we wrap in try-catch blocks or check existence.
    // For simplicity in this script, we'll try to add them and catch specific error or just use "IF NOT EXISTS" logic via DO block.

    // Workspace -> User FK
    // Need to check if constraint exists or just run it and ignore error.
    try {
        await sql`ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE no action ON UPDATE no action;`;
    } catch (e: any) {
        if (e.code !== '42710') console.error("Error adding Workspace FK:", e); // 42710 = duplicate_object
    }

    // CanvasNode -> Workspace FK
    try {
        await sql`ALTER TABLE "CanvasNode" ADD CONSTRAINT "CanvasNode_workspaceId_Workspace_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE cascade ON UPDATE no action;`;
    } catch (e: any) {
        if (e.code !== '42710') console.error("Error adding CanvasNode FK:", e);
    }

    // CanvasEdge -> Workspace FK
    try {
        await sql`ALTER TABLE "CanvasEdge" ADD CONSTRAINT "CanvasEdge_workspaceId_Workspace_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE cascade ON UPDATE no action;`;
    } catch (e: any) {
        if (e.code !== '42710') console.error("Error adding CanvasEdge FK 1:", e);
    }

    // CanvasEdge -> Source Node FK
    try {
        await sql`ALTER TABLE "CanvasEdge" ADD CONSTRAINT "CanvasEdge_sourceNodeId_CanvasNode_id_fk" FOREIGN KEY ("sourceNodeId") REFERENCES "CanvasNode"("id") ON DELETE cascade ON UPDATE no action;`;
    } catch (e: any) {
        if (e.code !== '42710') console.error("Error adding CanvasEdge FK 2:", e);
    }

    // CanvasEdge -> Target Node FK
    try {
        await sql`ALTER TABLE "CanvasEdge" ADD CONSTRAINT "CanvasEdge_targetNodeId_CanvasNode_id_fk" FOREIGN KEY ("targetNodeId") REFERENCES "CanvasNode"("id") ON DELETE cascade ON UPDATE no action;`;
    } catch (e: any) {
        if (e.code !== '42710') console.error("Error adding CanvasEdge FK 3:", e);
    }

    console.log("✅ Canvas tables created successfully");

  } catch (error) {
    console.error("❌ Failed to create tables:", error);
  } finally {
    await sql.end();
  }
};

run();

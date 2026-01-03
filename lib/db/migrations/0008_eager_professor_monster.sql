CREATE TABLE IF NOT EXISTS "CanvasEdge" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspaceId" uuid NOT NULL,
	"sourceNodeId" uuid NOT NULL,
	"targetNodeId" uuid NOT NULL,
	"sourceHandle" varchar(50),
	"targetHandle" varchar(50),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Workspace" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"name" varchar(255) DEFAULT 'Untitled Workspace' NOT NULL,
	"settings" json,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "CanvasEdge" ADD CONSTRAINT "CanvasEdge_workspaceId_Workspace_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "CanvasEdge" ADD CONSTRAINT "CanvasEdge_sourceNodeId_CanvasNode_id_fk" FOREIGN KEY ("sourceNodeId") REFERENCES "public"."CanvasNode"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "CanvasEdge" ADD CONSTRAINT "CanvasEdge_targetNodeId_CanvasNode_id_fk" FOREIGN KEY ("targetNodeId") REFERENCES "public"."CanvasNode"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "CanvasNode" ADD CONSTRAINT "CanvasNode_workspaceId_Workspace_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "Chat" DROP COLUMN IF EXISTS "lastContext";
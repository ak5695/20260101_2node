ALTER TABLE "CanvasNode" ADD COLUMN IF NOT EXISTS "chatId" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "CanvasNode" ADD CONSTRAINT "CanvasNode_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

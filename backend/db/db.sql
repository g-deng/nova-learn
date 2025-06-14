-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE "users" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "firebase_uid" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(0) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Study stacks
CREATE TABLE "study_stacks" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX ON "study_stacks" ("user_id");

-- Topics
CREATE TABLE "topics" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "stack_id" UUID NOT NULL REFERENCES "study_stacks"("id") ON DELETE CASCADE,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT
);
CREATE INDEX ON "topics" ("stack_id");

-- Flashcards
CREATE TABLE "flashcards" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "topic_id" UUID NOT NULL REFERENCES "topics"("id") ON DELETE CASCADE,
    "front" TEXT NOT NULL,
    "back" TEXT NOT NULL,
    "explanation" TEXT
);
CREATE INDEX ON "flashcards" ("topic_id");

-- Topic dependencies (directed edges in topic graph)
CREATE TABLE "topic_dependencies" (
    "from" UUID NOT NULL REFERENCES "topics"("id") ON DELETE CASCADE,
    "to" UUID NOT NULL REFERENCES "topics"("id") ON DELETE CASCADE,
    PRIMARY KEY ("from", "to")
);
CREATE INDEX ON "topic_dependencies" ("from");
CREATE INDEX ON "topic_dependencies" ("to");

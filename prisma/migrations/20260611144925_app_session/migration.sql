-- CreateTable
CREATE TABLE "AppSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "currentUserId" TEXT NOT NULL,
    CONSTRAINT "AppSession_currentUserId_fkey" FOREIGN KEY ("currentUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

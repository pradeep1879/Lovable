-- AlterTable
ALTER TABLE "WebsiteProject" ALTER COLUMN "current_version" SET DEFAULT '';

-- AlterTable
ALTER TABLE "account" ALTER COLUMN "accessToken" DROP NOT NULL,
ALTER COLUMN "refreshToken" DROP NOT NULL,
ALTER COLUMN "idToken" DROP NOT NULL,
ALTER COLUMN "accessTokenExpiresAt" DROP NOT NULL,
ALTER COLUMN "refreshTokenExpiresAt" DROP NOT NULL,
ALTER COLUMN "scope" DROP NOT NULL,
ALTER COLUMN "password" DROP NOT NULL;

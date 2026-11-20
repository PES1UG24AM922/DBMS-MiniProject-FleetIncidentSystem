import { MongoClient } from "mongodb";

const g = globalThis as unknown as { _mongo?: Promise<MongoClient> };

// Lazy connection: importing this module never touches the network.
export async function mongoDb() {
  if (!g._mongo) {
    const client = new MongoClient(process.env.MONGODB_URI!, { serverSelectionTimeoutMS: 2500 });
    g._mongo = client.connect().catch((e) => {
      g._mongo = undefined;
      throw e;
    });
  }
  return (await g._mongo).db(process.env.MONGODB_DB);
}

/** Returns null instead of throwing when MongoDB is unreachable (SQL data stays authoritative). */
export async function tryMongo<T>(fn: (db: Awaited<ReturnType<typeof mongoDb>>) => Promise<T>): Promise<T | null> {
  try {
    return await fn(await mongoDb());
  } catch (e) {
    console.error("MongoDB unavailable:", (e as Error).message);
    return null;
  }
}

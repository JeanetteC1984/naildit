import fs from "node:fs";
import path from "node:path";
import pg from "pg";

// One place for everything the store and Nail'd Ops share: Ops' saved data, the published
// product catalog, uploaded product photos and Stripe orders.
// Online (Render) it lives in Postgres via DATABASE_URL, because Render's disk is wiped on every
// restart. Without DATABASE_URL (local dev) it falls back to plain files in .data/.

export type Order = {
  id: string;
  createdAt: string;
  email: string | null;
  name: string | null;
  total: number | null;
  shipping: unknown;
  items: { name: string | null; quantity: number | null; amount: number | null }[];
  metadata: Record<string, string>;
  paid: boolean;
};

export type StoredFile = { contentType: string; data: Buffer };

export interface Store {
  getState(): Promise<Record<string, string>>;
  setState(key: string, value: string): Promise<void>;
  deleteState(key: string): Promise<void>;
  getCatalog(): Promise<unknown | null>;
  setCatalog(catalog: unknown): Promise<void>;
  getFile(filePath: string): Promise<StoredFile | null>;
  putFile(filePath: string, file: StoredFile): Promise<void>;
  saveOrder(order: Order): Promise<void>;
  listOrders(): Promise<Order[]>;
}

const CATALOG_KEY = "__storefront_catalog__";

class PgStore implements Store {
  private pool: pg.Pool;
  private ready: Promise<void>;

  constructor(url: string) {
    const local = /localhost|127\.0\.0\.1/.test(url);
    this.pool = new pg.Pool({ connectionString: url, ssl: local ? undefined : { rejectUnauthorized: false } });
    this.ready = this.pool
      .query(
        `create table if not exists ops_state (key text primary key, value text not null, updated_at timestamptz not null default now());
         create table if not exists files (path text primary key, content_type text not null, data bytea not null, updated_at timestamptz not null default now());
         create table if not exists orders (id text primary key, created_at timestamptz not null default now(), data jsonb not null);`,
      )
      .then(() => undefined);
  }

  private async q<T extends pg.QueryResultRow>(sql: string, params: unknown[] = []) {
    await this.ready;
    return this.pool.query<T>(sql, params);
  }

  async getState() {
    const { rows } = await this.q<{ key: string; value: string }>("select key, value from ops_state where key <> $1", [CATALOG_KEY]);
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }
  async setState(key: string, value: string) {
    await this.q("insert into ops_state (key, value) values ($1, $2) on conflict (key) do update set value = excluded.value, updated_at = now()", [key, value]);
  }
  async deleteState(key: string) {
    await this.q("delete from ops_state where key = $1", [key]);
  }
  async getCatalog() {
    const { rows } = await this.q<{ value: string }>("select value from ops_state where key = $1", [CATALOG_KEY]);
    return rows[0] ? JSON.parse(rows[0].value) : null;
  }
  async setCatalog(catalog: unknown) {
    await this.setState(CATALOG_KEY, JSON.stringify(catalog));
  }
  async getFile(filePath: string) {
    const { rows } = await this.q<{ content_type: string; data: Buffer }>("select content_type, data from files where path = $1", [filePath]);
    return rows[0] ? { contentType: rows[0].content_type, data: rows[0].data } : null;
  }
  async putFile(filePath: string, file: StoredFile) {
    await this.q(
      "insert into files (path, content_type, data) values ($1, $2, $3) on conflict (path) do update set content_type = excluded.content_type, data = excluded.data, updated_at = now()",
      [filePath, file.contentType, file.data],
    );
  }
  async saveOrder(order: Order) {
    await this.q("insert into orders (id, created_at, data) values ($1, $2, $3) on conflict (id) do update set data = excluded.data", [order.id, order.createdAt, order]);
  }
  async listOrders() {
    const { rows } = await this.q<{ data: Order }>("select data from orders order by created_at desc limit 500");
    return rows.map((r) => r.data);
  }
}

class FileStore implements Store {
  constructor(private dir: string) {
    fs.mkdirSync(path.join(dir, "files"), { recursive: true });
  }

  private read<T>(name: string, fallback: T): T {
    try {
      return JSON.parse(fs.readFileSync(path.join(this.dir, name), "utf-8")) as T;
    } catch {
      return fallback;
    }
  }
  private write(name: string, data: unknown) {
    fs.writeFileSync(path.join(this.dir, name), JSON.stringify(data, null, 2));
  }
  private filePath(p: string) {
    return path.join(this.dir, "files", encodeURIComponent(p));
  }

  async getState() {
    return this.read<Record<string, string>>("ops-state.json", {});
  }
  async setState(key: string, value: string) {
    this.write("ops-state.json", { ...(await this.getState()), [key]: value });
  }
  async deleteState(key: string) {
    const state = await this.getState();
    delete state[key];
    this.write("ops-state.json", state);
  }
  async getCatalog() {
    return this.read<unknown | null>("catalog.json", null);
  }
  async setCatalog(catalog: unknown) {
    this.write("catalog.json", catalog);
  }
  async getFile(p: string) {
    try {
      const meta = this.read<{ contentType: string }>(`files/${encodeURIComponent(p)}.json`, { contentType: "application/octet-stream" });
      return { contentType: meta.contentType, data: fs.readFileSync(this.filePath(p)) };
    } catch {
      return null;
    }
  }
  async putFile(p: string, file: StoredFile) {
    fs.writeFileSync(this.filePath(p), file.data);
    this.write(`files/${encodeURIComponent(p)}.json`, { contentType: file.contentType });
  }
  async saveOrder(order: Order) {
    const orders = (await this.listOrders()).filter((o) => o.id !== order.id);
    this.write("orders.json", [order, ...orders]);
  }
  async listOrders() {
    return this.read<Order[]>("orders.json", []);
  }
}

let store: Store | null = null;

export function getStore(): Store {
  if (!store) {
    const url = process.env.DATABASE_URL?.trim();
    store = url ? new PgStore(url) : new FileStore(path.resolve(process.cwd(), ".data"));
  }
  return store;
}

// The catalog the store shows: what Ops last published online, else the ops-products.json shipped with the site.
export async function loadCatalog(staticCatalogPath: string): Promise<{ products?: { name?: string; price?: string }[] } | null> {
  try {
    const published = await getStore().getCatalog();
    if (published) return published as { products?: { name?: string; price?: string }[] };
  } catch (err) {
    console.error("[store] couldn't read the published catalog", err);
  }
  try {
    return JSON.parse(fs.readFileSync(staticCatalogPath, "utf-8"));
  } catch {
    return null;
  }
}

import express from "express";
import bodyParser from "body-parser";
import hash from "object-hash";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const app = express();
const port = 8191;

const targetHost = "api.anthropic.com";

const queryClient = postgres(
  "postgresql://postgres:password@localhost/llm_cache",
);
const db = drizzle(queryClient, { schema });

app.use(bodyParser.json(), async (req, res) => {
  let headers = req.headers;
  // some stupid bs
  if ("content-length" in headers) delete headers["content-length"];
  const options = {
    method: req.method,
    headers,
    body: JSON.stringify(req.body),
  };

  // const key = hash({ body: req.body, url: req.originalUrl });
  const key = hash(options);

  const resp = await db.query.request.findFirst({
    where: ({ id }, { eq }) => eq(id, key),
  });

  if (resp) {
    console.log("FOUND");
    res.send(resp.resp);
    return;
  }

  console.log("NOT FOUND");

  const data = await fetch(`https://${targetHost}/${req.originalUrl}`, options);
  const resJson = await data.json();
  await db.insert(schema.request).values({ id: key, resp: resJson });
  res.send(resJson);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

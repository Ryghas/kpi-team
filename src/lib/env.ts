import 'server-only'
import { z } from 'zod'

const schema = z.object({
  JIRA_BASE_URL: z.url(),
  JIRA_EMAIL: z.email(),
  JIRA_API_TOKEN: z.string().min(1),
  JIRA_REVALIDATE_SECONDS: z.coerce.number().int().positive().default(3600),
})

export type Env = z.infer<typeof schema>

let cached: Env | undefined
/** Lazy — supaya `next build` tidak gagal di CI yang tidak punya secret Jira. */
export function env(): Env {
  cached ??= schema.parse(process.env)
  return cached
}

import type { Route } from "next"
import { redirect } from "next/navigation"

export default function Home() {
  redirect("/champions/mara/draft" as Route)
}

import { redirect } from "next/navigation"

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  redirect("/")
}

import { Suspense } from "react"

import { WorkbenchDemo } from "@/features/workspace/workbench-demo"

export default function WorkbenchDemoPage() {
  return (
    <Suspense>
      <WorkbenchDemo />
    </Suspense>
  )
}

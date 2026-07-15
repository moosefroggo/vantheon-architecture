import { Fragment } from "react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"

export type WorkspaceHeaderBreadcrumb = {
  label: string
  onSelect?: () => void
}

export function WorkspaceHeaderBreadcrumbs({
  items,
}: {
  items: readonly WorkspaceHeaderBreadcrumb[]
}) {
  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        {items.map((item, index) => {
          const current = index === items.length - 1

          return (
            <Fragment key={`${index}-${item.label}`}>
              {index ? <BreadcrumbSeparator /> : null}
              <BreadcrumbItem>
                {current ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="max-w-40 px-1.5 text-muted-foreground"
                    onClick={item.onSelect}
                  >
                    <span className="truncate">{item.label}</span>
                  </Button>
                )}
              </BreadcrumbItem>
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

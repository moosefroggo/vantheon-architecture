import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type AsyncStateProps =
  | {
      state: "loading";
      label: string;
    }
  | {
      state: "empty";
      title: string;
      description: string;
      action?: ReactNode;
    }
  | {
      state: "failed";
      title: string;
      description: string;
      onRetry?: () => void;
    };

export function AsyncState(props: AsyncStateProps) {
  if (props.state === "loading") {
    return (
      <div aria-busy="true" aria-label={props.label} className="space-y-3">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <p>{props.description}</p>
        {props.state === "empty" ? props.action : null}
        {props.state === "failed" && props.onRetry ? (
          <Button variant="outline" onClick={props.onRetry}>
            Try again
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

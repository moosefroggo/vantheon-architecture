"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";

import { createBrowserWorkspaceRepository } from "./dexie-repository";
import type { WorkspaceDemoRepository } from "./ports";
import type { WorkspaceScenario } from "./types";

export const workspaceDemoQueryKeys = {
  repository: ["workspace-demo", "repository"] as const,
  scenario: ["workspace-demo", "scenario"] as const,
};

let browserRepository: Promise<WorkspaceDemoRepository> | undefined;

function getBrowserWorkspaceRepository() {
  browserRepository ??= createBrowserWorkspaceRepository();
  return browserRepository;
}

/**
 * Browser-only access to the versioned demo authority. The repository object is
 * stable for the life of the tab; confirmed domain state lives in IndexedDB.
 */
export function useWorkspaceDemoRepository(enabled = true) {
  return useQuery({
    queryKey: workspaceDemoQueryKeys.repository,
    queryFn: getBrowserWorkspaceRepository,
    enabled: enabled && typeof window !== "undefined",
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

/** All workspace reads flow through TanStack Query and the repository query port. */
export function useWorkspaceDemoScenario(enabled = true) {
  const repository = useWorkspaceDemoRepository(enabled);
  const scenario = useQuery({
    queryKey: workspaceDemoQueryKeys.scenario,
    queryFn: () => repository.data!.readSnapshot(),
    enabled: enabled && repository.isSuccess,
  });

  return {
    repository: repository.data,
    scenario: scenario.data,
    isPending: repository.isPending || scenario.isPending,
    error: repository.error ?? scenario.error,
  };
}

/**
 * Runs one authority command and refreshes the normalized projection only after
 * the repository has durably recorded its receipt.
 */
export function useWorkspaceDemoCommand<TResult, TVariables>(
  command: (
    repository: WorkspaceDemoRepository,
    variables: TVariables,
  ) => Promise<TResult>,
  options: Omit<
    UseMutationOptions<TResult, Error, TVariables>,
    "mutationFn" | "onSuccess"
  > & {
    onSuccess?: (
      data: TResult,
      variables: TVariables,
      context: unknown,
    ) => Promise<unknown> | unknown;
  } = {},
  enabled = true,
) {
  const queryClient = useQueryClient();
  const repository = useWorkspaceDemoRepository(enabled);
  const { onSuccess, ...mutationOptions } = options;

  return useMutation({
    ...mutationOptions,
    mutationFn: async (variables: TVariables) => {
      if (!enabled) throw new Error("The guided workspace is read-only.");
      const authority = repository.data ?? (await getBrowserWorkspaceRepository());
      return command(authority, variables);
    },
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({
        queryKey: workspaceDemoQueryKeys.scenario,
      });
      await onSuccess?.(data, variables, context);
    },
  });
}

export function useResetWorkspaceDemo(enabled = true) {
  return useWorkspaceDemoCommand<WorkspaceScenario, void>(
    async (repository) => {
      await repository.resetDemo();
      return repository.readSnapshot();
    },
    {},
    enabled,
  );
}

export function clearWorkspaceDemoRepositoryForTests() {
  browserRepository = undefined;
}

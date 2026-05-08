export interface CloudErrorPlan {
  shouldStopSyncing: boolean;
  shouldRenderStatus: boolean;
  shouldNotify: boolean;
  message: string;
}

export interface CloudErrorInput {
  message?: string;
}

export function planCloudError({ message = "" }: CloudErrorInput = {}): CloudErrorPlan {
  return {
    shouldStopSyncing: true,
    shouldRenderStatus: true,
    shouldNotify: true,
    message: String(message || "").trim(),
  };
}

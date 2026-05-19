import { transport } from './transport';

export type UploadFilePayload = {
  fileBytes: number[];
  fileName: string;
  mime: string;
};

export const readFileForUpload = async (file: File): Promise<UploadFilePayload> => {
  const buffer = await file.arrayBuffer();
  return {
    fileBytes: Array.from(new Uint8Array(buffer)),
    fileName: file.name,
    mime: file.type || 'application/octet-stream',
  };
};

export const uploadFileViaTransport = async <TResponse>(
  command: string,
  file: File,
  extra: Record<string, unknown> = {},
): Promise<TResponse> => {
  const filePayload = await readFileForUpload(file);
  return transport.request<TResponse>({
    tauri: {
      command,
      args: {
        input: {
          ...filePayload,
          ...extra,
        },
      },
    },
  });
};

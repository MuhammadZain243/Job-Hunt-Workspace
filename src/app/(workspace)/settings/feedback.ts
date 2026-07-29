export function readSearchParam(
  params: Record<string, string | string[] | undefined> | undefined,
  key: string,
) {
  const value = params?.[key];
  return Array.isArray(value) ? value[0] : value;
}

export function getStorageSettingsFeedback(
  params: Record<string, string | string[] | undefined> | undefined,
): { success?: string; error?: string } {
  const storageSuccess = readSearchParam(params, "storageSuccess");
  const storageError = readSearchParam(params, "storageError");
  const cloudinarySuccess = readSearchParam(params, "cloudinarySuccess");
  const cloudinaryError = readSearchParam(params, "cloudinaryError");
  const s3Success = readSearchParam(params, "s3Success");
  const s3Error = readSearchParam(params, "s3Error");
  const localStatus = readSearchParam(params, "localStatus");
  const disconnectSuccess = readSearchParam(params, "disconnectSuccess");
  const disconnectError = readSearchParam(params, "disconnectError");

  if (storageSuccess) {
    return { success: `Active provider saved: ${storageSuccess}.` };
  }
  if (storageError === "local-production") {
    return { error: "Local storage cannot be used in production." };
  }
  if (storageError === "not-connected") {
    return { error: "Connect the provider before setting it as active." };
  }
  if (storageError === "invalid-provider") {
    return { error: "Choose a valid storage provider." };
  }
  if (cloudinarySuccess) {
    return {
      success: "Cloudinary connected and set as the active storage provider.",
    };
  }
  if (cloudinaryError === "invalid-credentials") {
    return { error: "Cloudinary credentials are incomplete." };
  }
  if (cloudinaryError === "connection-failed") {
    return {
      error:
        "Cloudinary connection failed. Check the credentials and try again.",
    };
  }
  if (s3Success) {
    return {
      success: "S3 connected and set as the active storage provider.",
    };
  }
  if (s3Error === "invalid-credentials") {
    return { error: "S3 credentials are incomplete." };
  }
  if (s3Error === "connection-failed") {
    return {
      error: "S3 connection failed. Check the credentials and try again.",
    };
  }
  if (localStatus) {
    return { success: localStatus };
  }
  if (disconnectSuccess === "cloudinary") {
    return {
      success:
        "Cloudinary disconnected. Configuration deleted from the database.",
    };
  }
  if (disconnectSuccess === "s3") {
    return {
      success: "S3 disconnected. Configuration deleted from the database.",
    };
  }
  if (disconnectError === "cloudinary") {
    return { error: "Could not disconnect Cloudinary. Try again." };
  }
  if (disconnectError === "s3") {
    return { error: "Could not disconnect S3. Try again." };
  }

  return {};
}

export function getOpenAiSettingsFeedback(
  params: Record<string, string | string[] | undefined> | undefined,
): { success?: string; error?: string } {
  const openaiSuccess = readSearchParam(params, "openaiSuccess");
  const openaiError = readSearchParam(params, "openaiError");
  const disconnectSuccess = readSearchParam(params, "disconnectSuccess");
  const disconnectError = readSearchParam(params, "disconnectError");

  if (openaiSuccess === "connected") {
    return { success: "OpenAI connected. Draft generation is available." };
  }
  if (openaiError === "invalid-key") {
    return { error: "OpenAI API key was rejected." };
  }
  if (openaiError === "connection-failed") {
    return {
      error: "OpenAI connection failed. Check the API key and try again.",
    };
  }
  if (disconnectSuccess === "openai") {
    return {
      success: "OpenAI disconnected. API key deleted from the database.",
    };
  }
  if (disconnectError === "openai") {
    return { error: "Could not disconnect OpenAI. Try again." };
  }

  return {};
}

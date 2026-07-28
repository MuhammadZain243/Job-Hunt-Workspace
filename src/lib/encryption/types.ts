export type EncryptedPayload = {
  ciphertext: string; // base64
  iv: string; // base64
  authTag: string; // base64
  keyVersion: number;
  algorithm: "aes-256-gcm";
};

export type EncryptionAad = {
  userId: string;
  provider: string;
  credentialId: string;
};

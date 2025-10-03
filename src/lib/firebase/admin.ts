import { App, cert, getApps, initializeApp } from 'firebase-admin/app';

let adminApp: App | null = null;

interface ServiceAccountShape {
  project_id?: string;
  client_email?: string;
  private_key?: string;
}

const getServiceAccount = (): ServiceAccountShape => {
  if (process.env.FIREBASE_ADMIN_CREDENTIALS) {
    try {
      return JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);
    } catch (error) {
      console.error('Failed to parse FIREBASE_ADMIN_CREDENTIALS');
      throw error;
    }
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase admin credentials are not configured.');
  }

  return {
    project_id: projectId,
    client_email: clientEmail,
    private_key: privateKey,
  };
};

export const initAdmin = () => {

  if (adminApp) {
    return adminApp;
  }

  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    return adminApp;
  }

  const serviceAccount = getServiceAccount();

  if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
    throw new Error('Incomplete Firebase admin credentials.');
  }

  const formattedKey = serviceAccount.private_key.replace(/\\n/g, '\n');

  adminApp = initializeApp({
    credential: cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: formattedKey,
    }),
  }, serviceAccount.project_id);

  return adminApp;
};

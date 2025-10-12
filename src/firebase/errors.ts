// See: https://firebase.google.com/docs/reference/rules/rules.testing.Request
export type SecurityRuleRequest = {
  // User authentication information.
  auth: {
    // The user's uid.
    uid: string;
    // The user's token from firebase.auth.Auth.currentUser.getIdToken().
    token: {
      email?: string;
      email_verified?: boolean;
      phone_number?: string;
      name?: string;
      picture?: string;
      firebase?: {
        sign_in_provider?: string;
        identities: {
          [key: string]: any;
        };
      };
      [key: string]: any;
    };
  };
  // The method being called. One of get, list, create, update, or delete.
  method: 'get' | 'list' | 'create' | 'update' | 'delete';
  // The resource path being accessed.
  path: string;
  // The new resource being written. Only present for create, update, and delete methods.
  resource?: any;
  // The time the request is being made.
  time?: Date;
};

export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
  public context: SecurityRuleContext;
  constructor(context: SecurityRuleContext) {
    super(
      `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:\n${JSON.stringify(
        {
          method: context.operation,
          path: context.path,
          ...(context.requestResourceData && {
            resource: context.requestResourceData,
          }),
        },
        null,
        2
      )}`
    );
    this.context = context;
    this.name = 'FirestorePermissionError';
  }
}

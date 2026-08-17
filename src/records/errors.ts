export class ValidationError extends Error {
  readonly fields: { date?: string; trackingId?: string };

  constructor(fields: { date?: string; trackingId?: string }) {
    super("Record is missing required fields");
    this.name = "ValidationError";
    this.fields = fields;
  }
}

export class StorageFullError extends Error {
  constructor() {
    super("Browser storage is full");
    this.name = "StorageFullError";
  }
}

export class UnreadableImportError extends Error {
  constructor() {
    super(
      "File is not a readable sheet with Date, Tracking ID, Order Number, Packed, and Fulfilled columns",
    );
    this.name = "UnreadableImportError";
  }
}



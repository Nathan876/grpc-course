import * as jspb from 'google-protobuf'



export class ChatMessage extends jspb.Message {
  constructor();
  constructor(opt_data?: ChatMessage.AsObject);
  getUser(): string;
  setUser(value: string): ChatMessage;

  getText(): string;
  setText(value: string): ChatMessage;

  getTimestamp(): string;
  setTimestamp(value: string): ChatMessage;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ChatMessage.AsObject;
  static toObject(includeInstance: boolean, msg: ChatMessage): ChatMessage.AsObject;
  static serializeBinaryToWriter(message: ChatMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ChatMessage;
  static deserializeBinaryFromReader(message: ChatMessage, reader: jspb.BinaryReader): ChatMessage;
}

export namespace ChatMessage {
  export type AsObject = {
    user: string;
    text: string;
    timestamp: string;
  };
}

export class SubscribeRequest extends jspb.Message {
  constructor();
  constructor(opt_data?: SubscribeRequest.AsObject);
  getUser(): string;
  setUser(value: string): SubscribeRequest;

  getMessagesList(): Array<ChatMessage>;
  setMessagesList(value: Array<ChatMessage>): SubscribeRequest;
  clearMessagesList(): SubscribeRequest;
  addMessages(value?: ChatMessage, index?: number): ChatMessage;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SubscribeRequest.AsObject;
  static toObject(includeInstance: boolean, msg: SubscribeRequest): SubscribeRequest.AsObject;
  static serializeBinaryToWriter(message: SubscribeRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SubscribeRequest;
  static deserializeBinaryFromReader(message: SubscribeRequest, reader: jspb.BinaryReader): SubscribeRequest;
}

export namespace SubscribeRequest {
  export type AsObject = {
    user: string;
    messagesList: Array<ChatMessage.AsObject>;
  };
}

export class UploadSummary extends jspb.Message {
  constructor();
  constructor(opt_data?: UploadSummary.AsObject);
  getCount(): number;
  setCount(value: number): UploadSummary;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UploadSummary.AsObject;
  static toObject(includeInstance: boolean, msg: UploadSummary): UploadSummary.AsObject;
  static serializeBinaryToWriter(message: UploadSummary, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UploadSummary;
  static deserializeBinaryFromReader(message: UploadSummary, reader: jspb.BinaryReader): UploadSummary;
}

export namespace UploadSummary {
  export type AsObject = {
    count: number;
  };
}


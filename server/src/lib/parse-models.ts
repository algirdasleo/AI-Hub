import { z } from "zod";
import { UIMessageSchema } from "@shared/types/chat/message.js";
import { SelectedModel, SelectedModelSchema } from "@shared/config/model-schemas.js";
import { convertToModelMessages, ModelMessage, UIMessage } from "ai";
import { ModelSchema } from "@shared/types/chat/chat-request.js";

export type Model = z.infer<typeof ModelSchema>;

export type StreamModelDetails = {
  selectedModel: SelectedModel;
  modelMessages: ModelMessage[];
};

export function parseModel(modelDetail: Model): StreamModelDetails {
  const uiMessages = z.array(UIMessageSchema).parse(modelDetail.messages) as UIMessage[];
  const selectedModel = SelectedModelSchema.parse({
    provider: modelDetail.provider,
    modelId: modelDetail.modelId,
    settings: modelDetail.settings,
  });
  const modelMessages = convertToModelMessages(uiMessages);
  return { selectedModel, modelMessages };
}

export function parseModels(models: Model[]): StreamModelDetails[] {
  return models.map(parseModel);
}

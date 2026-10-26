import "server-only";
import { getSiteSettings } from "@/lib/settings";
import { ruleAnswer, type BotReply } from "./engine";
import { askOpenAI, type ChatTurn } from "./openai";

/**
 * BıcırıklarBot yanıtı: OpenAI açık ve erişilebilirse yapay zekâ (mağaza verisine bağlı), değilse ya da
 * hata/zaman aşımında kural tabanlı motor. Kullanıcı her durumda yanıt alır.
 */
export async function respond(message: string, history: ChatTurn[] = []): Promise<BotReply> {
  const s = await getSiteSettings();
  const ai = await askOpenAI(message, history, s);
  return ai ?? ruleAnswer(message);
}

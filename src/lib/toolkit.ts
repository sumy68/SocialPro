type Msg = { role: "user"|"assistant"|"system"; content: Array<{type:"text",text:string}|{type:"image",image:string}> };
type ChatInput = { messages: Msg[] };

export async function generateText(input: string | ChatInput) {
  if (typeof input === "string") {
    return `Mock result for: ${input}`;
  }
  const text = input.messages?.map(m =>
    m.content?.map(c => (c as any).text ?? "").join(" ")
  ).join(" ").trim();
  return `Mock AI (concat): ${text}`;
}

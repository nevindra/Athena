I got this as the result from Gemini:
Gemini result: {
  text: "```json\n{\n  \"meter_reading\": {\n    \"value\": 898572.3,\n    \"unit\": \"m³\"\n  },\n  \"meter_details\": {\n    \"brand\": \"Elster Instromet\",\n    \"model\": \"Quantometer QA65 50 Z I\",\n    \"serial_number\": \"69338010/2019\",\n    \"q_min\": \"5 m³/h\",\n    \"q_max\": \"100 m³/h\",\n    \"p_max\": \"16 bar\",\n    \"temperature_range\": \"-10 °C / 60 °C\",\n    \"ce_mark\": \"CE 0085\",\n    \"explosion_protection\": \"Ex II 2 G c IIC T4\"\n  }\n}\n```",
  reasoning: [
    {
      type: "reasoning",
      text: "**Decoding the Meter and Crafting a JSON Response**\n\nOkay, so the task is to pinpoint the number in the middle of this image and structure it as JSON. Let's break it down:\n\nFirst, I need to zero in on the relevant section. The main image seems to be a gas meter display. There's a set of black numbers on a white background, which are most likely the primary reading. Then, there's a smaller red number also on a white background, and it's accompanied by the unit \"m³,\" so that number is definitely the decimal value.\n\nAnalyzing the image, I see the numbers are \"8985723.\" The \"3\" stands out because of the red background. That strong visual cue along with the unit \"m³\" confirms that the reading is `898572.3 m³`.\n\nWhile I'm at it, I can enhance the JSON by including some other helpful context from the meter. It's an Elster Instromet Quantometer QA65, serial number 69338010/2019, with a flow rate range of 5-100 m³/h, pressure limit of 16 bar, and a temperature range of -10 to 60 °C, and CE marking \"CE 0085\" for explosion protection.\n\nTo structure this, I'll go with a top-level object \"meter_reading\" for the core value and unit, and a \"meter_details\" object for those extra specifications.\n\nThe finished JSON should look like this:\n\n```json\n{\n  \"meter_reading\": {\n    \"value\": 898572.3,\n    \"unit\": \"m³\"\n  },\n  \"meter_details\": {\n    \"brand\": \"Elster Instromet\",\n    \"model\": \"Quantometer QA65 50 Z I\",\n    \"serial_number\": \"69338010/2019\",\n    \"q_min\": \"5 m³/h\",\n    \"q_max\": \"100 m³/h\",\n    \"p_max\": \"16 bar\",\n    \"temperature_range\": \"-10 °C / 60 °C\",\n    \"ce_mark\": \"CE 0085\",\n    \"explosion_protection\": \"Ex II 2 G c IIC T4\"\n  }\n}\n```\n\nThis way, I'm providing exactly the required number as JSON and providing useful context.\n",
      providerMetadata: undefined,
    }
  ],
  finishReason: "stop",
  usage: {
    inputTokens: 283,
    outputTokens: 197,
    totalTokens: 1495,
    reasoningTokens: 1015,
    cachedInputTokens: undefined,
  },
}
=== HANDLE ADD MESSAGE DEBUG ===
sessionId: bjsot0gzn6tn160mexn16fws
role: assistant
content: ```json
{
  "meter_reading": {
    "value": 898572.3,
    "unit": "m³"
  },
  "meter_details": {
    "brand": "Elster Instromet",
    "model": "Quantometer QA65 50 Z I",
    "serial_number": "69338010/2019",
    "q_min": "5 m³/h",
    "q_max": "100 m³/h",
    "p_max": "16 bar",
    "temperature_range": "-10 °C / 60 °C",
    "ce_mark": "CE 0085",
    "explosion_protection": "Ex II 2 G c IIC T4"
  }
}
```
files: no files
file details: undefined
Final attachments to save: undefined
Saved message: {
  id: "jjw8s49hni6js1zxa0hjv9a8",
  sessionId: "bjsot0gzn6tn160mexn16fws",
  role: "assistant",
  content: "```json\n{\n  \"meter_reading\": {\n    \"value\": 898572.3,\n    \"unit\": \"m³\"\n  },\n  \"meter_details\": {\n    \"brand\": \"Elster Instromet\",\n    \"model\": \"Quantometer QA65 50 Z I\",\n    \"serial_number\": \"69338010/2019\",\n    \"q_min\": \"5 m³/h\",\n    \"q_max\": \"100 m³/h\",\n    \"p_max\": \"16 bar\",\n    \"temperature_range\": \"-10 °C / 60 °C\",\n    \"ce_mark\": \"CE 0085\",\n    \"explosion_protection\": \"Ex II 2 G c IIC T4\"\n  }\n}\n```",
  attachments: null,
  embedding: null,
  metadata: null,
  createdAt: 2025-09-02T15:10:59.494Z,
}
the log:
```
=== MESSAGE UPLOAD DEBUG ===
Body type: object
Is FormData: false
Body: {
  role: "user",
  content: "read the number in the middle and return structured json.",
  files: File (88.0 KB) {
    name: "test.jpeg",
    type: "image/jpeg"
  },
}
JSON body received: {
  role: "user",
  content: "read the number in the middle and return structured json.",
}
Files from JSON: 1
=== HANDLE ADD MESSAGE DEBUG ===
sessionId: bjsot0gzn6tn160mexn16fws
role: user
content: read the number in the middle and return structured json.
files: 1 files
file details: [
  {
    name: "test.jpeg",
    type: "image/jpeg",
    size: 88019,
  }
]
Final attachments to save: [
  {
    id: "01K45FP3GV7JPAVZAXZ58XTJCV",
    filename: "test.jpeg",
    mimeType: "image/jpeg",
    size: 88019,
  }
]
Saved message: {
  id: "uo6g16dc3y89jywqvb7o9rhg",
  sessionId: "bjsot0gzn6tn160mexn16fws",
  role: "user",
  content: "read the number in the middle and return structured json.",
  attachments: [
    {
      id: "01K45FP3GV7JPAVZAXZ58XTJCV",
      filename: "test.jpeg",
      mimeType: "image/jpeg",
      size: 88019,
    }
  ],
  embedding: null,
  metadata: null,
  createdAt: 2025-09-02T15:10:49.336Z,
}
```

But I already select the system prompt in /home/nevindra/Athena/apps/frontend/app/routes/chat.$id.tsx to follow the structured output.

from the backend, my structured output should be like this:
json schema:
[{"id":"3kpci5jcn","name":"code","type":"string","description":"","required":true}]
content:
You are a structured output generator that creates JSON responses following a specific schema.

Task: Read the number in the middle and return the value

Required JSON Structure:
- code (string) *required*

Instructions:
1. Always respond with valid JSON that matches the exact schema above
2. Include all required fields marked with *required*
3. Use appropriate data types for each field
4. Ensure nested objects and arrays follow the specified structure
5. Do not include any additional fields not defined in the schema
6. Do not include any text outside the JSON response

Generate responses that are accurate, complete, and follow the schema precisely.
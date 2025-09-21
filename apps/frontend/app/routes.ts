import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("models", "routes/models.tsx"),
  route("models/add", "routes/models.add.tsx"),
  route("system-prompts", "routes/system-prompts.tsx"),
  route("chat/:id", "routes/chat.$id.tsx"),
  route("knowledge-base", "routes/knowledge-base.tsx"),
  route("image-generator", "routes/image-generator.tsx"),
  route("ocr-reader", "routes/ocr-reader.tsx"),
  route("management-api/monitor", "routes/api-management.monitor.tsx"),
  route("management-api/history", "routes/api-management.history.tsx"),
  route("automation/workflows", "routes/automation.workflows.tsx"),
  route("automation/templates", "routes/automation.templates.tsx"),
] satisfies RouteConfig;

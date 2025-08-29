import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("models", "routes/models.tsx"),
  route("models/add", "routes/models.add.tsx"),
  route("chat/:id", "routes/chat.$id.tsx"),
] satisfies RouteConfig;

import { onRequest as __api_import_check_js_onRequest } from "C:\\Users\\admin\\my-billbook\\functions\\api\\import\\check.js"
import { onRequest as __api_import_confirm_js_onRequest } from "C:\\Users\\admin\\my-billbook\\functions\\api\\import\\confirm.js"
import { onRequest as __api_learning_recommend_js_onRequest } from "C:\\Users\\admin\\my-billbook\\functions\\api\\learning\\recommend.js"
import { onRequest as __api_learning_record_js_onRequest } from "C:\\Users\\admin\\my-billbook\\functions\\api\\learning\\record.js"
import { onRequest as __api_transactions__id__js_onRequest } from "C:\\Users\\admin\\my-billbook\\functions\\api\\transactions\\[id].js"
import { onRequest as __api_export_js_onRequest } from "C:\\Users\\admin\\my-billbook\\functions\\api\\export.js"
import { onRequest as __api_login_js_onRequest } from "C:\\Users\\admin\\my-billbook\\functions\\api\\login.js"
import { onRequest as __api_stats_js_onRequest } from "C:\\Users\\admin\\my-billbook\\functions\\api\\stats.js"
import { onRequest as __api_transactions_js_onRequest } from "C:\\Users\\admin\\my-billbook\\functions\\api\\transactions.js"

export const routes = [
    {
      routePath: "/api/import/check",
      mountPath: "/api/import",
      method: "",
      middlewares: [],
      modules: [__api_import_check_js_onRequest],
    },
  {
      routePath: "/api/import/confirm",
      mountPath: "/api/import",
      method: "",
      middlewares: [],
      modules: [__api_import_confirm_js_onRequest],
    },
  {
      routePath: "/api/learning/recommend",
      mountPath: "/api/learning",
      method: "",
      middlewares: [],
      modules: [__api_learning_recommend_js_onRequest],
    },
  {
      routePath: "/api/learning/record",
      mountPath: "/api/learning",
      method: "",
      middlewares: [],
      modules: [__api_learning_record_js_onRequest],
    },
  {
      routePath: "/api/transactions/:id",
      mountPath: "/api/transactions",
      method: "",
      middlewares: [],
      modules: [__api_transactions__id__js_onRequest],
    },
  {
      routePath: "/api/export",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_export_js_onRequest],
    },
  {
      routePath: "/api/login",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_login_js_onRequest],
    },
  {
      routePath: "/api/stats",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_stats_js_onRequest],
    },
  {
      routePath: "/api/transactions",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_transactions_js_onRequest],
    },
  ]
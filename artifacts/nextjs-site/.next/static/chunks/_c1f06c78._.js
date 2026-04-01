(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/artifacts/nextjs-site/app/admin/data:3e1f97 [app-client] (ecmascript) <text/javascript>", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"400509833d06ea8233c49b0c6cb21db9d61a7dda88":"addQuestion"},"artifacts/nextjs-site/app/admin/actions.ts",""] */ __turbopack_context__.s([
    "addQuestion",
    ()=>addQuestion
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.14_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-client-wrapper.js [app-client] (ecmascript)");
"use turbopack no side effects";
;
var addQuestion = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createServerReference"])("400509833d06ea8233c49b0c6cb21db9d61a7dda88", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["callServer"], void 0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findSourceMapURL"], "addQuestion"); //# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4vYWN0aW9ucy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzZXJ2ZXJcIjtcblxuaW1wb3J0IHsgcmVkaXJlY3QgfSBmcm9tIFwibmV4dC9uYXZpZ2F0aW9uXCI7XG5pbXBvcnQgeyBxdWVzdGlvbnMgfSBmcm9tIFwiQC9saWIvZGJcIjtcblxuLyoqIENhbGxlZCBieSB0aGUgZm9ybSDigJQgc2F2ZXMgYW5kIHJlZGlyZWN0cyAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGFkZFF1ZXN0aW9uKGZvcm1EYXRhOiBGb3JtRGF0YSkge1xuICBjb25zdCB0aXRsZSA9IChmb3JtRGF0YS5nZXQoXCJ0aXRsZVwiKSBhcyBzdHJpbmcgfCBudWxsKT8udHJpbSgpID8/IFwiXCI7XG4gIGNvbnN0IHNsdWcgPSAoZm9ybURhdGEuZ2V0KFwic2x1Z1wiKSBhcyBzdHJpbmcgfCBudWxsKT8udHJpbSgpID8/IFwiXCI7XG4gIGNvbnN0IHRvcGljID0gKGZvcm1EYXRhLmdldChcInRvcGljXCIpIGFzIHN0cmluZyB8IG51bGwpPy50cmltKCkgPz8gXCJcIjtcbiAgY29uc3Qgc2hvcnRBbnN3ZXIgPSAoZm9ybURhdGEuZ2V0KFwic2hvcnRBbnN3ZXJcIikgYXMgc3RyaW5nIHwgbnVsbCk/LnRyaW0oKSA/PyBcIlwiO1xuICBjb25zdCBjb250ZW50ID0gKGZvcm1EYXRhLmdldChcImNvbnRlbnRcIikgYXMgc3RyaW5nIHwgbnVsbCk/LnRyaW0oKSA/PyBcIlwiO1xuXG4gIGlmICghdGl0bGUgfHwgIXNsdWcpIHtcbiAgICByZWRpcmVjdChcIi9hZG1pbj9lcnJvcj1UaXRsZSthbmQrc2x1ZythcmUrcmVxdWlyZWRcIik7XG4gIH1cblxuICBpZiAoIS9eW2EtejAtOV0rKD86LVthLXowLTldKykqJC8udGVzdChzbHVnKSkge1xuICAgIHJlZGlyZWN0KFwiL2FkbWluP2Vycm9yPVNsdWcrbXVzdCtiZStsb3dlcmNhc2UrbGV0dGVycyUyQytudW1iZXJzJTJDK2FuZCtoeXBoZW5zK29ubHlcIik7XG4gIH1cblxuICBpZiAocXVlc3Rpb25zLmZpbmRCeVNsdWcoc2x1ZykpIHtcbiAgICByZWRpcmVjdChgL2FkbWluP2Vycm9yPUErcXVlc3Rpb24rd2l0aCtzbHVnKyUyMiR7ZW5jb2RlVVJJQ29tcG9uZW50KHNsdWcpfSUyMithbHJlYWR5K2V4aXN0c2ApO1xuICB9XG5cbiAgcXVlc3Rpb25zLmNyZWF0ZSh7IHRpdGxlLCBzbHVnLCB0b3BpYywgc2hvcnRBbnN3ZXIsIGNvbnRlbnQgfSk7XG4gIHJlZGlyZWN0KGAvcXVlc3Rpb25zLyR7c2x1Z30/Y3JlYXRlZD0xYCk7XG59XG5cbi8qKiBSZWFsLXRpbWUgc2x1ZyBhdmFpbGFiaWxpdHkgY2hlY2sg4oCUIGNhbGxhYmxlIGZyb20gY2xpZW50IGNvbXBvbmVudHMgKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjaGVja1NsdWdBdmFpbGFibGUoc2x1Zzogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gIGlmICghc2x1ZyB8fCAhL15bYS16MC05XSsoPzotW2EtejAtOV0rKSokLy50ZXN0KHNsdWcpKSByZXR1cm4gZmFsc2U7XG4gIHJldHVybiAhcXVlc3Rpb25zLmZpbmRCeVNsdWcoc2x1Zyk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IitTQU1zQiJ9
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/artifacts/nextjs-site/app/admin/data:70826e [app-client] (ecmascript) <text/javascript>", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"4008e18f9c8a94310f657f274af137b44f1c4f3544":"checkSlugAvailable"},"artifacts/nextjs-site/app/admin/actions.ts",""] */ __turbopack_context__.s([
    "checkSlugAvailable",
    ()=>checkSlugAvailable
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.14_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-client-wrapper.js [app-client] (ecmascript)");
"use turbopack no side effects";
;
var checkSlugAvailable = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createServerReference"])("4008e18f9c8a94310f657f274af137b44f1c4f3544", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["callServer"], void 0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findSourceMapURL"], "checkSlugAvailable"); //# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4vYWN0aW9ucy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzZXJ2ZXJcIjtcblxuaW1wb3J0IHsgcmVkaXJlY3QgfSBmcm9tIFwibmV4dC9uYXZpZ2F0aW9uXCI7XG5pbXBvcnQgeyBxdWVzdGlvbnMgfSBmcm9tIFwiQC9saWIvZGJcIjtcblxuLyoqIENhbGxlZCBieSB0aGUgZm9ybSDigJQgc2F2ZXMgYW5kIHJlZGlyZWN0cyAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGFkZFF1ZXN0aW9uKGZvcm1EYXRhOiBGb3JtRGF0YSkge1xuICBjb25zdCB0aXRsZSA9IChmb3JtRGF0YS5nZXQoXCJ0aXRsZVwiKSBhcyBzdHJpbmcgfCBudWxsKT8udHJpbSgpID8/IFwiXCI7XG4gIGNvbnN0IHNsdWcgPSAoZm9ybURhdGEuZ2V0KFwic2x1Z1wiKSBhcyBzdHJpbmcgfCBudWxsKT8udHJpbSgpID8/IFwiXCI7XG4gIGNvbnN0IHRvcGljID0gKGZvcm1EYXRhLmdldChcInRvcGljXCIpIGFzIHN0cmluZyB8IG51bGwpPy50cmltKCkgPz8gXCJcIjtcbiAgY29uc3Qgc2hvcnRBbnN3ZXIgPSAoZm9ybURhdGEuZ2V0KFwic2hvcnRBbnN3ZXJcIikgYXMgc3RyaW5nIHwgbnVsbCk/LnRyaW0oKSA/PyBcIlwiO1xuICBjb25zdCBjb250ZW50ID0gKGZvcm1EYXRhLmdldChcImNvbnRlbnRcIikgYXMgc3RyaW5nIHwgbnVsbCk/LnRyaW0oKSA/PyBcIlwiO1xuXG4gIGlmICghdGl0bGUgfHwgIXNsdWcpIHtcbiAgICByZWRpcmVjdChcIi9hZG1pbj9lcnJvcj1UaXRsZSthbmQrc2x1ZythcmUrcmVxdWlyZWRcIik7XG4gIH1cblxuICBpZiAoIS9eW2EtejAtOV0rKD86LVthLXowLTldKykqJC8udGVzdChzbHVnKSkge1xuICAgIHJlZGlyZWN0KFwiL2FkbWluP2Vycm9yPVNsdWcrbXVzdCtiZStsb3dlcmNhc2UrbGV0dGVycyUyQytudW1iZXJzJTJDK2FuZCtoeXBoZW5zK29ubHlcIik7XG4gIH1cblxuICBpZiAocXVlc3Rpb25zLmZpbmRCeVNsdWcoc2x1ZykpIHtcbiAgICByZWRpcmVjdChgL2FkbWluP2Vycm9yPUErcXVlc3Rpb24rd2l0aCtzbHVnKyUyMiR7ZW5jb2RlVVJJQ29tcG9uZW50KHNsdWcpfSUyMithbHJlYWR5K2V4aXN0c2ApO1xuICB9XG5cbiAgcXVlc3Rpb25zLmNyZWF0ZSh7IHRpdGxlLCBzbHVnLCB0b3BpYywgc2hvcnRBbnN3ZXIsIGNvbnRlbnQgfSk7XG4gIHJlZGlyZWN0KGAvcXVlc3Rpb25zLyR7c2x1Z30/Y3JlYXRlZD0xYCk7XG59XG5cbi8qKiBSZWFsLXRpbWUgc2x1ZyBhdmFpbGFiaWxpdHkgY2hlY2sg4oCUIGNhbGxhYmxlIGZyb20gY2xpZW50IGNvbXBvbmVudHMgKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjaGVja1NsdWdBdmFpbGFibGUoc2x1Zzogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gIGlmICghc2x1ZyB8fCAhL15bYS16MC05XSsoPzotW2EtejAtOV0rKSokLy50ZXN0KHNsdWcpKSByZXR1cm4gZmFsc2U7XG4gIHJldHVybiAhcXVlc3Rpb25zLmZpbmRCeVNsdWcoc2x1Zyk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6InNUQThCc0IifQ==
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/artifacts/nextjs-site/app/admin/AdminForm.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AdminForm
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.14_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.14_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$artifacts$2f$nextjs$2d$site$2f$app$2f$admin$2f$data$3a$3e1f97__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__ = __turbopack_context__.i("[project]/artifacts/nextjs-site/app/admin/data:3e1f97 [app-client] (ecmascript) <text/javascript>");
var __TURBOPACK__imported__module__$5b$project$5d2f$artifacts$2f$nextjs$2d$site$2f$app$2f$admin$2f$data$3a$70826e__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__ = __turbopack_context__.i("[project]/artifacts/nextjs-site/app/admin/data:70826e [app-client] (ecmascript) <text/javascript>");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
/** Convert a title string into a URL-safe slug */ function slugify(title) {
    return title.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9\s-]/g, "") // keep only alphanum, spaces, hyphens
    .replace(/\s+/g, "-") // spaces → hyphens
    .replace(/-+/g, "-") // collapse multiple hyphens
    .replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens
}
function AdminForm(param) {
    let { existingTopics, error } = param;
    _s();
    const [title, setTitle] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [slug, setSlug] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [slugStatus, setSlugStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("idle");
    // Track whether user has manually edited the slug
    const slugManualRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    const debounceRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [isPending, startTransition] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTransition"])();
    // Auto-generate slug from title (only when not manually edited)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AdminForm.useEffect": ()=>{
            if (!slugManualRef.current) {
                setSlug(slugify(title));
            }
        }
    }["AdminForm.useEffect"], [
        title
    ]);
    // Debounced slug availability check
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AdminForm.useEffect": ()=>{
            if (debounceRef.current) clearTimeout(debounceRef.current);
            if (!slug) {
                setSlugStatus("idle");
                return;
            }
            if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
                setSlugStatus("invalid");
                return;
            }
            setSlugStatus("checking");
            debounceRef.current = setTimeout({
                "AdminForm.useEffect": ()=>{
                    startTransition({
                        "AdminForm.useEffect": async ()=>{
                            const available = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$artifacts$2f$nextjs$2d$site$2f$app$2f$admin$2f$data$3a$70826e__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__["checkSlugAvailable"])(slug);
                            setSlugStatus(available ? "available" : "taken");
                        }
                    }["AdminForm.useEffect"]);
                }
            }["AdminForm.useEffect"], 400);
            return ({
                "AdminForm.useEffect": ()=>{
                    if (debounceRef.current) clearTimeout(debounceRef.current);
                }
            })["AdminForm.useEffect"];
        }
    }["AdminForm.useEffect"], [
        slug
    ]);
    function handleSlugChange(e) {
        slugManualRef.current = true;
        setSlug(e.target.value);
    }
    // If the user clears the slug field entirely, re-enable auto-generation
    function handleSlugBlur() {
        if (!slug) {
            slugManualRef.current = false;
            setSlug(slugify(title));
        }
    }
    const slugIndicator = {
        idle: {
            icon: "",
            text: "",
            color: ""
        },
        checking: {
            icon: "⋯",
            text: "Checking…",
            color: "text-gray-400"
        },
        available: {
            icon: "✓",
            text: "Available",
            color: "text-green-600"
        },
        taken: {
            icon: "✕",
            text: "Already exists",
            color: "text-red-600"
        },
        invalid: {
            icon: "!",
            text: "Invalid format",
            color: "text-amber-600"
        }
    };
    const { icon, text, color } = slugIndicator[slugStatus];
    const canSubmit = title.trim() !== "" && slug.trim() !== "" && slugStatus === "available" && !isPending;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
        action: __TURBOPACK__imported__module__$5b$project$5d2f$artifacts$2f$nextjs$2d$site$2f$app$2f$admin$2f$data$3a$3e1f97__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__["addQuestion"],
        className: "space-y-5",
        children: [
            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700",
                children: error
            }, void 0, false, {
                fileName: "[project]/artifacts/nextjs-site/app/admin/AdminForm.tsx",
                lineNumber: 101,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        htmlFor: "title",
                        className: "block text-sm font-medium text-gray-700 mb-1",
                        children: [
                            "Title ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-red-500",
                                children: "*"
                            }, void 0, false, {
                                fileName: "[project]/artifacts/nextjs-site/app/admin/AdminForm.tsx",
                                lineNumber: 109,
                                columnNumber: 17
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/artifacts/nextjs-site/app/admin/AdminForm.tsx",
                        lineNumber: 108,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        id: "title",
                        name: "title",
                        type: "text",
                        required: true,
                        value: title,
                        onChange: (e)=>setTitle(e.target.value),
                        placeholder: "e.g. What is grace?",
                        className: "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    }, void 0, false, {
                        fileName: "[project]/artifacts/nextjs-site/app/admin/AdminForm.tsx",
                        lineNumber: 111,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/artifacts/nextjs-site/app/admin/AdminForm.tsx",
                lineNumber: 107,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        htmlFor: "slug",
                        className: "block text-sm font-medium text-gray-700 mb-1",
                        children: [
                            "Slug ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-red-500",
                                children: "*"
                            }, void 0, false, {
                                fileName: "[project]/artifacts/nextjs-site/app/admin/AdminForm.tsx",
                                lineNumber: 126,
                                columnNumber: 16
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/artifacts/nextjs-site/app/admin/AdminForm.tsx",
                        lineNumber: 125,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                id: "slug",
                                name: "slug",
                                type: "text",
                                required: true,
                                value: slug,
                                onChange: handleSlugChange,
                                onBlur: handleSlugBlur,
                                placeholder: "auto-generated from title",
                                className: "w-full rounded-lg border px-3 py-2 pr-28 text-sm font-mono text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 transition-colors ".concat(slugStatus === "available" ? "border-green-400 focus:border-green-500 focus:ring-green-500" : slugStatus === "taken" || slugStatus === "invalid" ? "border-red-300 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-blue-500 focus:ring-blue-500")
                            }, void 0, false, {
                                fileName: "[project]/artifacts/nextjs-site/app/admin/AdminForm.tsx",
                                lineNumber: 129,
                                columnNumber: 11
                            }, this),
                            slugStatus !== "idle" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium ".concat(color, " flex items-center gap-1 pointer-events-none"),
                                children: [
                                    icon,
                                    " ",
                                    text
                                ]
                            }, void 0, true, {
                                fileName: "[project]/artifacts/nextjs-site/app/admin/AdminForm.tsx",
                                lineNumber: 147,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/artifacts/nextjs-site/app/admin/AdminForm.tsx",
                        lineNumber: 128,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mt-1 text-xs text-gray-400",
                        children: [
                            "Auto-generated from title. Edit to override. Used as: /questions/",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("em", {
                                children: "slug"
                            }, void 0, false, {
                                fileName: "[project]/artifacts/nextjs-site/app/admin/AdminForm.tsx",
                                lineNumber: 153,
                                columnNumber: 76
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/artifacts/nextjs-site/app/admin/AdminForm.tsx",
                        lineNumber: 152,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/artifacts/nextjs-site/app/admin/AdminForm.tsx",
                lineNumber: 124,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        htmlFor: "topic",
                        className: "block text-sm font-medium text-gray-700 mb-1",
                        children: "Topic"
                    }, void 0, false, {
                        fileName: "[project]/artifacts/nextjs-site/app/admin/AdminForm.tsx",
                        lineNumber: 159,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        id: "topic",
                        name: "topic",
                        type: "text",
                        list: "topics-list",
                        placeholder: "e.g. Salvation",
                        className: "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    }, void 0, false, {
                        fileName: "[project]/artifacts/nextjs-site/app/admin/AdminForm.tsx",
                        lineNumber: 162,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("datalist", {
                        id: "topics-list",
                        children: existingTopics.map((name)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: name
                            }, name, false, {
                                fileName: "[project]/artifacts/nextjs-site/app/admin/AdminForm.tsx",
                                lineNumber: 172,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/artifacts/nextjs-site/app/admin/AdminForm.tsx",
                        lineNumber: 170,
                        columnNumber: 9
                    }, this),
                    existingTopics.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mt-1 text-xs text-gray-400",
                        children: [
                            "Existing: ",
                            existingTopics.join(", ")
                        ]
                    }, void 0, true, {
                        fileName: "[project]/artifacts/nextjs-site/app/admin/AdminForm.tsx",
                        lineNumber: 176,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/artifacts/nextjs-site/app/admin/AdminForm.tsx",
                lineNumber: 158,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        htmlFor: "shortAnswer",
                        className: "block text-sm font-medium text-gray-700 mb-1",
                        children: "Short Answer"
                    }, void 0, false, {
                        fileName: "[project]/artifacts/nextjs-site/app/admin/AdminForm.tsx",
                        lineNumber: 184,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        id: "shortAnswer",
                        name: "shortAnswer",
                        type: "text",
                        placeholder: "A one-sentence answer shown as a summary",
                        className: "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    }, void 0, false, {
                        fileName: "[project]/artifacts/nextjs-site/app/admin/AdminForm.tsx",
                        lineNumber: 187,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/artifacts/nextjs-site/app/admin/AdminForm.tsx",
                lineNumber: 183,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        htmlFor: "content",
                        className: "block text-sm font-medium text-gray-700 mb-1",
                        children: "Content"
                    }, void 0, false, {
                        fileName: "[project]/artifacts/nextjs-site/app/admin/AdminForm.tsx",
                        lineNumber: 198,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                        id: "content",
                        name: "content",
                        rows: 10,
                        placeholder: "Full question content. HTML is supported (e.g. <p>, <h2>, <strong>).",
                        className: "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y font-mono leading-relaxed"
                    }, void 0, false, {
                        fileName: "[project]/artifacts/nextjs-site/app/admin/AdminForm.tsx",
                        lineNumber: 201,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mt-1 text-xs text-gray-400",
                        children: "HTML is rendered as-is on the question page."
                    }, void 0, false, {
                        fileName: "[project]/artifacts/nextjs-site/app/admin/AdminForm.tsx",
                        lineNumber: 208,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/artifacts/nextjs-site/app/admin/AdminForm.tsx",
                lineNumber: 197,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "pt-2 flex items-center gap-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "submit",
                        disabled: !canSubmit,
                        className: "rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 active:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed",
                        children: isPending ? "Saving…" : "Save Question"
                    }, void 0, false, {
                        fileName: "[project]/artifacts/nextjs-site/app/admin/AdminForm.tsx",
                        lineNumber: 212,
                        columnNumber: 9
                    }, this),
                    slugStatus === "taken" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs text-red-600",
                        children: "Change the slug — a question with this URL already exists."
                    }, void 0, false, {
                        fileName: "[project]/artifacts/nextjs-site/app/admin/AdminForm.tsx",
                        lineNumber: 220,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/artifacts/nextjs-site/app/admin/AdminForm.tsx",
                lineNumber: 211,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/artifacts/nextjs-site/app/admin/AdminForm.tsx",
        lineNumber: 99,
        columnNumber: 5
    }, this);
}
_s(AdminForm, "7A+yvrOJAa5z5wD6p10qzUYHk+Y=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTransition"]
    ];
});
_c = AdminForm;
var _c;
__turbopack_context__.k.register(_c, "AdminForm");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/node_modules/.pnpm/next@15.5.14_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-client-wrapper.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

// This file must be bundled in the app's client layer, it shouldn't be directly
// imported by the server.
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    callServer: null,
    createServerReference: null,
    findSourceMapURL: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    callServer: function() {
        return _appcallserver.callServer;
    },
    createServerReference: function() {
        return _client.createServerReference;
    },
    findSourceMapURL: function() {
        return _appfindsourcemapurl.findSourceMapURL;
    }
});
const _appcallserver = __turbopack_context__.r("[project]/node_modules/.pnpm/next@15.5.14_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/client/app-call-server.js [app-client] (ecmascript)");
const _appfindsourcemapurl = __turbopack_context__.r("[project]/node_modules/.pnpm/next@15.5.14_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/client/app-find-source-map-url.js [app-client] (ecmascript)");
const _client = __turbopack_context__.r("[project]/node_modules/.pnpm/next@15.5.14_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/compiled/react-server-dom-turbopack/client.js [app-client] (ecmascript)"); //# sourceMappingURL=action-client-wrapper.js.map
}),
]);

//# sourceMappingURL=_c1f06c78._.js.map
module.exports = [
"[project]/artifacts/nextjs-site/lib/bible-references.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "parseBibleReferences",
    ()=>parseBibleReferences
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.14_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.14_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
;
;
const BOOKS = [
    {
        name: "Song of Solomon",
        slug: "song-of-solomon"
    },
    {
        name: "1 Thessalonians",
        slug: "1-thessalonians"
    },
    {
        name: "2 Thessalonians",
        slug: "2-thessalonians"
    },
    {
        name: "1 Corinthians",
        slug: "1-corinthians"
    },
    {
        name: "2 Corinthians",
        slug: "2-corinthians"
    },
    {
        name: "1 Chronicles",
        slug: "1-chronicles"
    },
    {
        name: "2 Chronicles",
        slug: "2-chronicles"
    },
    {
        name: "Lamentations",
        slug: "lamentations"
    },
    {
        name: "Deuteronomy",
        slug: "deuteronomy"
    },
    {
        name: "Ecclesiastes",
        slug: "ecclesiastes"
    },
    {
        name: "Philippians",
        slug: "philippians"
    },
    {
        name: "Revelation",
        slug: "revelation"
    },
    {
        name: "Habakkuk",
        slug: "habakkuk"
    },
    {
        name: "Zephaniah",
        slug: "zephaniah"
    },
    {
        name: "Colossians",
        slug: "colossians"
    },
    {
        name: "Galatians",
        slug: "galatians"
    },
    {
        name: "Ephesians",
        slug: "ephesians"
    },
    {
        name: "Nehemiah",
        slug: "nehemiah"
    },
    {
        name: "Zechariah",
        slug: "zechariah"
    },
    {
        name: "Philippians",
        slug: "philippians"
    },
    {
        name: "1 Timothy",
        slug: "1-timothy"
    },
    {
        name: "2 Timothy",
        slug: "2-timothy"
    },
    {
        name: "1 Samuel",
        slug: "1-samuel"
    },
    {
        name: "2 Samuel",
        slug: "2-samuel"
    },
    {
        name: "1 Kings",
        slug: "1-kings"
    },
    {
        name: "2 Kings",
        slug: "2-kings"
    },
    {
        name: "1 Peter",
        slug: "1-peter"
    },
    {
        name: "2 Peter",
        slug: "2-peter"
    },
    {
        name: "1 John",
        slug: "1-john"
    },
    {
        name: "2 John",
        slug: "2-john"
    },
    {
        name: "3 John",
        slug: "3-john"
    },
    {
        name: "Leviticus",
        slug: "leviticus"
    },
    {
        name: "Proverbs",
        slug: "proverbs"
    },
    {
        name: "Obadiah",
        slug: "obadiah"
    },
    {
        name: "Hebrews",
        slug: "hebrews"
    },
    {
        name: "Philemon",
        slug: "philemon"
    },
    {
        name: "Matthew",
        slug: "matthew"
    },
    {
        name: "Malachi",
        slug: "malachi"
    },
    {
        name: "Haggai",
        slug: "haggai"
    },
    {
        name: "Genesis",
        slug: "genesis"
    },
    {
        name: "Numbers",
        slug: "numbers"
    },
    {
        name: "Joshua",
        slug: "joshua"
    },
    {
        name: "Judges",
        slug: "judges"
    },
    {
        name: "Psalms",
        slug: "psalms"
    },
    {
        name: "Psalm",
        slug: "psalms"
    },
    {
        name: "Isaiah",
        slug: "isaiah"
    },
    {
        name: "Ezekiel",
        slug: "ezekiel"
    },
    {
        name: "Ezra",
        slug: "ezra"
    },
    {
        name: "Daniel",
        slug: "daniel"
    },
    {
        name: "Hosea",
        slug: "hosea"
    },
    {
        name: "Nahum",
        slug: "nahum"
    },
    {
        name: "Micah",
        slug: "micah"
    },
    {
        name: "Jonah",
        slug: "jonah"
    },
    {
        name: "Titus",
        slug: "titus"
    },
    {
        name: "James",
        slug: "james"
    },
    {
        name: "Esther",
        slug: "esther"
    },
    {
        name: "Romans",
        slug: "romans"
    },
    {
        name: "Exodus",
        slug: "exodus"
    },
    {
        name: "Amos",
        slug: "amos"
    },
    {
        name: "Joel",
        slug: "joel"
    },
    {
        name: "Jude",
        slug: "jude"
    },
    {
        name: "Ruth",
        slug: "ruth"
    },
    {
        name: "Acts",
        slug: "acts"
    },
    {
        name: "Mark",
        slug: "mark"
    },
    {
        name: "Luke",
        slug: "luke"
    },
    {
        name: "John",
        slug: "john"
    },
    {
        name: "Job",
        slug: "job"
    }
];
const escapedNames = BOOKS.map(({ name })=>name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
const REFERENCE_RE = new RegExp(`(${escapedNames.join("|")})\\s+(\\d+)(?::(\\d+)(?:-\\d+)?)?`, "g");
function bookSlug(name) {
    return BOOKS.find((b)=>b.name.toLowerCase() === name.toLowerCase())?.slug ?? name.toLowerCase().replace(/\s+/g, "-");
}
function parseBibleReferences(text) {
    const parts = [];
    let lastIndex = 0;
    REFERENCE_RE.lastIndex = 0;
    for (const match of text.matchAll(REFERENCE_RE)){
        const [fullMatch, bookName, chapter] = match;
        const start = match.index ?? 0;
        if (start > lastIndex) {
            parts.push(text.slice(lastIndex, start));
        }
        const slug = bookSlug(bookName);
        parts.push(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
            href: `/bible/${slug}/${chapter}`,
            className: "text-blue-600 hover:underline font-medium",
            children: fullMatch
        }, start, false, {
            fileName: "[project]/artifacts/nextjs-site/lib/bible-references.tsx",
            lineNumber: 104,
            columnNumber: 7
        }, this));
        lastIndex = start + fullMatch.length;
    }
    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }
    return parts;
}
}),
"[project]/artifacts/nextjs-site/app/bible/[book]/[chapter]/ExplanationTabs.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ExplanationTabs
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.14_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.14_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$artifacts$2f$nextjs$2d$site$2f$lib$2f$bible$2d$references$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/artifacts/nextjs-site/lib/bible-references.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
const tabs = [
    {
        key: "overview",
        label: "Overview"
    },
    {
        key: "context",
        label: "Context"
    },
    {
        key: "application",
        label: "Application"
    }
];
function ExplanationTabs({ explanation }) {
    const [active, setActive] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("overview");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col h-full",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex border-b border-gray-200",
                children: tabs.map((tab)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setActive(tab.key),
                        className: `px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${active === tab.key ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"}`,
                        children: tab.label
                    }, tab.key, false, {
                        fileName: "[project]/artifacts/nextjs-site/app/bible/[book]/[chapter]/ExplanationTabs.tsx",
                        lineNumber: 29,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/artifacts/nextjs-site/app/bible/[book]/[chapter]/ExplanationTabs.tsx",
                lineNumber: 27,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "pt-5 flex-1",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$14_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-gray-700 leading-relaxed text-sm",
                    children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$artifacts$2f$nextjs$2d$site$2f$lib$2f$bible$2d$references$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["parseBibleReferences"])(explanation[active])
                }, void 0, false, {
                    fileName: "[project]/artifacts/nextjs-site/app/bible/[book]/[chapter]/ExplanationTabs.tsx",
                    lineNumber: 44,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/artifacts/nextjs-site/app/bible/[book]/[chapter]/ExplanationTabs.tsx",
                lineNumber: 43,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/artifacts/nextjs-site/app/bible/[book]/[chapter]/ExplanationTabs.tsx",
        lineNumber: 26,
        columnNumber: 5
    }, this);
}
}),
"[project]/node_modules/.pnpm/next@15.5.14_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = __turbopack_context__.r("[project]/node_modules/.pnpm/next@15.5.14_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].ReactJsxDevRuntime; //# sourceMappingURL=react-jsx-dev-runtime.js.map
}),
];

//# sourceMappingURL=_f5a29aa7._.js.map
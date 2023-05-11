---
'schema-openapi': patch
---

Filter `undefined` from union. The expectation is `UndefinedKeyword` occurs
when using the `Schema.optionFromNullable` for which the `undefined` case can
never happen.

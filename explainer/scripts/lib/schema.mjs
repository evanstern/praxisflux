// A small, built-ins-only JSON Schema interpreter (no npm deps, so no
// ajv). It supports only the subset of the vocabulary contents.schema.json
// actually uses: type, const, enum, pattern, minLength, minItems, properties,
// required, additionalProperties, items, oneOf. Every error is path-qualified
// (e.g. "pages[2].group") so callers can report many issues from one pass.

function formatPath(path) {
  if (path.length === 0) return "(root)";
  let out = "";
  for (const segment of path) {
    if (typeof segment === "number") {
      out += `[${segment}]`;
    } else if (out === "") {
      out = segment;
    } else {
      out += `.${segment}`;
    }
  }
  return out;
}

function actualType(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function typeMatches(value, type) {
  switch (type) {
    case "object":
      return value !== null && typeof value === "object" && !Array.isArray(value);
    case "array":
      return Array.isArray(value);
    case "string":
      return typeof value === "string";
    case "boolean":
      return typeof value === "boolean";
    case "null":
      return value === null;
    case "integer":
      return typeof value === "number" && Number.isInteger(value);
    case "number":
      return typeof value === "number";
    default:
      return false;
  }
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  if (a && b && typeof a === "object") {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((k) => deepEqual(a[k], b[k]));
  }
  return false;
}

/**
 * Validates `value` against `schema`, returning an array of path-qualified
 * error strings (empty when valid).
 */
export function validate(value, schema, path = []) {
  const errors = [];
  const p = formatPath(path);

  if (schema.const !== undefined) {
    if (!deepEqual(value, schema.const)) {
      errors.push(`${p}: must equal ${JSON.stringify(schema.const)}, got ${JSON.stringify(value)}`);
    }
    return errors;
  }

  if (schema.enum) {
    if (!schema.enum.some((v) => deepEqual(v, value))) {
      errors.push(`${p}: must be one of ${JSON.stringify(schema.enum)}, got ${JSON.stringify(value)}`);
    }
    return errors;
  }

  if (schema.oneOf) {
    const results = schema.oneOf.map((sub) => validate(value, sub, path));
    const passing = results.filter((r) => r.length === 0);
    if (passing.length !== 1) {
      const detail = results.map((r, i) => `  option ${i}: ${r.join("; ") || "ok"}`).join("\n");
      errors.push(`${p}: must match exactly one schema (matched ${passing.length})\n${detail}`);
    }
    return errors;
  }

  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((t) => typeMatches(value, t))) {
      errors.push(`${p}: expected type ${types.join("|")}, got ${actualType(value)}`);
      return errors;
    }
  }

  if (schema.pattern !== undefined && typeof value === "string") {
    if (!new RegExp(schema.pattern).test(value)) {
      errors.push(`${p}: does not match pattern ${schema.pattern}`);
    }
  }

  if (schema.minLength !== undefined && typeof value === "string") {
    if (value.length < schema.minLength) {
      errors.push(`${p}: must have length >= ${schema.minLength}`);
    }
  }

  if (schema.minItems !== undefined && Array.isArray(value)) {
    if (value.length < schema.minItems) {
      errors.push(`${p}: must have at least ${schema.minItems} item(s)`);
    }
  }

  const isObjectSchema =
    schema.type === "object" || (Array.isArray(schema.type) && schema.type.includes("object"));
  if (isObjectSchema && value !== null && typeof value === "object" && !Array.isArray(value)) {
    const props = schema.properties || {};
    for (const key of schema.required || []) {
      if (!(key in value)) {
        errors.push(`${formatPath([...path, key])}: required property missing`);
      }
    }
    for (const [key, val] of Object.entries(value)) {
      if (props[key]) {
        errors.push(...validate(val, props[key], [...path, key]));
      } else if (schema.additionalProperties === false) {
        errors.push(`${formatPath([...path, key])}: unknown property`);
      } else if (schema.additionalProperties && typeof schema.additionalProperties === "object") {
        errors.push(...validate(val, schema.additionalProperties, [...path, key]));
      }
    }
  }

  const isArraySchema =
    schema.type === "array" || (Array.isArray(schema.type) && schema.type.includes("array"));
  if (isArraySchema && Array.isArray(value) && schema.items) {
    value.forEach((item, i) => {
      errors.push(...validate(item, schema.items, [...path, i]));
    });
  }

  return errors;
}

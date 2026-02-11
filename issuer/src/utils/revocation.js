/**
 * Create an empty revocation list
 * @returns {object} Empty revocation list with proper structure
 */
export function createEmptyRevocationList() {
  return {
    updated_at: new Date().toISOString(),
    revoked_jti: [],
    revoked_sub: [],
  };
}

/**
 * Create a revocation entry descriptor
 * @param {string} id - ID to revoke (token jti or member sub)
 * @param {'jti'|'sub'} type - Entry type
 * @returns {{id: string, type: 'jti'|'sub', timestamp: string}}
 */
export function createRevocationEntry(id, type) {
  if (!id || typeof id !== 'string') {
    throw new Error('Revocation entry id is required');
  }
  const normalizedId = id.trim();
  if (!normalizedId) {
    throw new Error('Revocation entry id is required');
  }
  if (type !== 'jti' && type !== 'sub') {
    throw new Error('Revocation entry type must be "jti" or "sub"');
  }

  return {
    id: normalizedId,
    type,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Validate that a revocation list has the correct structure
 * @param {object} list - The revocation list to validate
 * @returns {boolean} true if valid
 * @throws {Error} if invalid
 */
export function validateRevocationList(list) {
  if (!list || typeof list !== 'object') {
    throw new Error('Revocation list must be an object');
  }
  if (typeof list.updated_at !== 'string') {
    throw new Error('Revocation list must have an updated_at string');
  }
  if (!Array.isArray(list.revoked_jti)) {
    throw new Error('Revocation list must have a revoked_jti array');
  }
  if (!Array.isArray(list.revoked_sub)) {
    throw new Error('Revocation list must have a revoked_sub array');
  }
  return true;
}

/**
 * Add an ID to the revocation list (deduplicates)
 * @param {object} list - Current revocation list
 * @param {string} id - The ID to revoke
 * @param {'jti'|'sub'} type - Whether to revoke by token ID or member ID
 * @returns {object} Updated revocation list (new object)
 */
export function addToRevocationList(list, id, type) {
  validateRevocationList(list);
  const entry = createRevocationEntry(id, type);
  const key = entry.type === 'sub' ? 'revoked_sub' : 'revoked_jti';
  const arr = list[key];

  if (arr.includes(entry.id)) {
    return list;
  }

  return {
    ...list,
    updated_at: entry.timestamp,
    [key]: [...arr, entry.id],
  };
}

/**
 * Remove an ID from the revocation list
 * @param {object} list - Current revocation list
 * @param {string} id - The ID to remove
 * @param {'jti'|'sub'} type - Whether to remove from token IDs or member IDs
 * @returns {object} Updated revocation list (new object)
 */
export function removeFromRevocationList(list, id, type) {
  validateRevocationList(list);
  const entry = createRevocationEntry(id, type);
  const key = entry.type === 'sub' ? 'revoked_sub' : 'revoked_jti';
  const arr = list[key];

  if (!arr.includes(entry.id)) {
    return list;
  }

  return {
    ...list,
    updated_at: entry.timestamp,
    [key]: arr.filter(item => item !== entry.id),
  };
}

/**
 * Merge two revocation lists without losing existing entries.
 * New IDs are appended only if not already present.
 * @param {object} baseList - Current revocation list
 * @param {object} incomingList - Loaded revocation list to merge in
 * @returns {object} Merged revocation list (or baseList if no changes)
 */
export function mergeRevocationLists(baseList, incomingList) {
  validateRevocationList(baseList);
  validateRevocationList(incomingList);

  const mergedJti = [...baseList.revoked_jti];
  const mergedSub = [...baseList.revoked_sub];

  let changed = false;

  for (const id of incomingList.revoked_jti) {
    if (!mergedJti.includes(id)) {
      mergedJti.push(id);
      changed = true;
    }
  }

  for (const id of incomingList.revoked_sub) {
    if (!mergedSub.includes(id)) {
      mergedSub.push(id);
      changed = true;
    }
  }

  if (!changed) {
    return baseList;
  }

  return {
    ...baseList,
    updated_at: new Date().toISOString(),
    revoked_jti: mergedJti,
    revoked_sub: mergedSub,
  };
}

/**
 * Export revocation list as formatted JSON string
 * @param {object} list - The revocation list
 * @returns {string} Pretty-printed JSON
 */
export function exportRevocationJSON(list) {
  return JSON.stringify(list, null, 2);
}

/**
 * Import and validate a revocation list from JSON string
 * @param {string} jsonString - JSON string to parse
 * @returns {object} Parsed and validated revocation list
 * @throws {Error} if JSON is invalid or structure is wrong
 */
export function importRevocationJSON(jsonString) {
  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('Invalid JSON format');
  }

  validateRevocationList(parsed);
  return parsed;
}

// Backwards-compatible aliases
export const addRevocation = addToRevocationList;
export const removeRevocation = removeFromRevocationList;

const fs = require('fs');
let c = fs.readFileSync('src/services/gdsService.js', 'utf8');

// ─── Fix 1: Add targetLabel / targetProperties to signature ───────────────
c = c.replace(
  'export const createGdsProjection = async (jobId, nodes, relationships) => {',
  'export const createGdsProjection = async (jobId, nodes, relationships, targetLabel = null, targetProperties = []) => {'
);

// ─── Fix 2: Replace the projection body to use targetLabel when provided ──
// Find the block between "activeProjections.set" and "export const projectionExists"
const OLD_BLOCK = `  const nodeLabels = [...new Set(nodes.flatMap(n => n.labels || []))].filter(Boolean);
  const relTypes   = [...new Set(relationships.map(r => r.type))].filter(Boolean);

  const driver = initDriver();
  const session = driver.session({ database: NEO4J_DATABASE });
  try {
    // Drop stale projection if present (failIfMissing = false)
    try {
      await session.run('CALL gds.graph.drop($name, false) YIELD graphName', { name: projectionName });
    } catch (_) { /* not present — fine */ }

    // Star wildcard must be a Cypher literal, not a parameter
    let result;
    if (nodeLabels.length === 0 && relTypes.length === 0) {
      result = await session.run(
        "CALL gds.graph.project($name, '*', '*') YIELD graphName, nodeCount, relationshipCount",
        { name: projectionName }
      );
    } else if (nodeLabels.length === 0) {
      result = await session.run(
        "CALL gds.graph.project($name, '*', $relTypes) YIELD graphName, nodeCount, relationshipCount",
        { name: projectionName, relTypes }
      );
    } else if (relTypes.length === 0) {
      result = await session.run(
        "CALL gds.graph.project($name, $nodeLabels, '*') YIELD graphName, nodeCount, relationshipCount",
        { name: projectionName, nodeLabels }
      );
    } else {
      result = await session.run(
        'CALL gds.graph.project($name, $nodeLabels, $relTypes) YIELD graphName, nodeCount, relationshipCount',
        { name: projectionName, nodeLabels, relTypes }
      );
    }`;

const NEW_BLOCK = `  const relTypes = [...new Set(relationships.map(r => r.type))].filter(Boolean);

  const driver = initDriver();
  const session = driver.session({ database: NEO4J_DATABASE });
  try {
    // Drop stale projection if present (failIfMissing = false)
    try {
      await session.run('CALL gds.graph.drop($name, false) YIELD graphName', { name: projectionName });
    } catch (_) { /* not present — fine */ }

    let result;

    if (targetLabel) {
      // Scoped projection: only the user-selected label, with optional property embeddings.
      // Map syntax: { "LabelName": { properties: [...] } } scopes GDS to exactly what the user chose.
      const nodeProjection = targetProperties.length > 0
        ? { [targetLabel]: { properties: targetProperties } }
        : { [targetLabel]: {} };

      if (relTypes.length === 0) {
        result = await session.run(
          "CALL gds.graph.project($name, $nodeProjection, '*') YIELD graphName, nodeCount, relationshipCount",
          { name: projectionName, nodeProjection }
        );
      } else {
        result = await session.run(
          'CALL gds.graph.project($name, $nodeProjection, $relTypes) YIELD graphName, nodeCount, relationshipCount',
          { name: projectionName, nodeProjection, relTypes }
        );
      }
    } else {
      // No label filter: derive labels from the visible graphData nodes
      const nodeLabels = [...new Set(nodes.flatMap(n => n.labels || []))].filter(Boolean);

      // Star wildcard must be a Cypher literal, not a parameter
      if (nodeLabels.length === 0 && relTypes.length === 0) {
        result = await session.run(
          "CALL gds.graph.project($name, '*', '*') YIELD graphName, nodeCount, relationshipCount",
          { name: projectionName }
        );
      } else if (nodeLabels.length === 0) {
        result = await session.run(
          "CALL gds.graph.project($name, '*', $relTypes) YIELD graphName, nodeCount, relationshipCount",
          { name: projectionName, relTypes }
        );
      } else if (relTypes.length === 0) {
        result = await session.run(
          "CALL gds.graph.project($name, $nodeLabels, '*') YIELD graphName, nodeCount, relationshipCount",
          { name: projectionName, nodeLabels }
        );
      } else {
        result = await session.run(
          'CALL gds.graph.project($name, $nodeLabels, $relTypes) YIELD graphName, nodeCount, relationshipCount',
          { name: projectionName, nodeLabels, relTypes }
        );
      }
    }`;

const oldIdx = c.indexOf('  const nodeLabels = [...new Set(nodes.flatMap');
console.log('Old block found at index:', oldIdx);
const endOfOldBlock = c.indexOf("    }\n\n    const rec = result.records[0];");
console.log('End of old block at index:', endOfOldBlock);

if (oldIdx === -1) {
  console.error('ERROR: Could not find old block');
  process.exit(1);
}

// Instead of full string replacement, splice by index
const before = c.slice(0, oldIdx);
const after = c.slice(endOfOldBlock + '    }\n\n    const rec = result.records[0];'.length);

// Rebuild: before + NEW_BLOCK + "\n\n    const rec = result.records[0];" + after
const result = before + NEW_BLOCK + '\n\n    const rec = result.records[0];' + after;

console.log('New length:', result.length);

// ─── Fix 3: Add graphNodeIds filter in runNodeSimilarity ──────────────────
// After the targetNodeLabel filter, add a filter that keeps only pairs visible in graphData
const AFTER_LABEL_FILTER = `    // If a specific label was selected, keep only pairs where both nodes carry that label
    if (targetNodeLabel) {
      results = results.filter(r =>
        r.node1Data.labels?.includes(targetNodeLabel) &&
        r.node2Data.labels?.includes(targetNodeLabel)
      );
    }`;

const AFTER_LABEL_FILTER_NEW = `    // If a specific label was selected, keep only pairs where both nodes carry that label
    if (targetNodeLabel) {
      results = results.filter(r =>
        r.node1Data.labels?.includes(targetNodeLabel) &&
        r.node2Data.labels?.includes(targetNodeLabel)
      );
    }

    // Keep only pairs where BOTH nodes are currently visible in the filtered graph.
    // GDS projects all Neo4j nodes with matching labels, but graphData is a filtered
    // subset — results referencing invisible nodes cannot be highlighted on the graph.
    const graphNodeIds = new Set(nodes.map(n => n.id));
    results = results.filter(r => graphNodeIds.has(r.node1) && graphNodeIds.has(r.node2));`;

const finalResult = result.replace(AFTER_LABEL_FILTER, AFTER_LABEL_FILTER_NEW);
console.log('Fix 3 applied:', finalResult.includes('graphNodeIds'));

fs.writeFileSync('src/services/gdsService.js', finalResult, 'utf8');
console.log('All fixes written successfully.');

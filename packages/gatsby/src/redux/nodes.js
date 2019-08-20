/* @flow */

const { store } = require(`./index`)

/**
 * Get all nodes from redux store.
 *
 * @returns {Array}
 */
const getNodes = () => {
  const nodes = store.getState().nodes
  if (nodes) {
    return Array.from(nodes.values())
  } else {
    return []
  }
}

exports.getNodes = getNodes

/** Get node by id from store.
 *
 * @param {string} id
 * @returns {Object}
 */
const getNode = id => store.getState().nodes.get(id)

exports.getNode = getNode

/**
 * Get all nodes of type from redux store.
 *
 * @param {string} type
 * @returns {Array}
 */
const getNodesByType = type => {
  const nodes = store.getState().nodesByType.get(type)
  if (nodes) {
    return Array.from(nodes.values())
  } else {
    return []
  }
}

exports.getNodesByType = getNodesByType

/**
 * Get all type names from redux store.
 *
 * @returns {Array}
 */
const getTypes = () => Array.from(store.getState().nodesByType.keys())

exports.getTypes = getTypes

/**
 * Determine if node has changed.
 *
 * @param {string} id
 * @param {string} digest
 * @returns {boolean}
 */
exports.hasNodeChanged = (id, digest) => {
  const node = store.getState().nodes.get(id)
  if (!node) {
    return true
  } else {
    return node.internal.contentDigest !== digest
  }
}

/**
 * Get node and save path dependency.
 *
 * @param {string} id
 * @param {string} path
 * @returns {Object} node
 */
exports.getNodeAndSavePathDependency = (id, path) => {
  const createPageDependency = require(`./actions/add-page-dependency`)
  const node = getNode(id)
  createPageDependency({ path, nodeId: id })
  return node
}

exports.updateNodesByType = async (typeName, updater) => {
  const nodes = store.getState().nodesByType.get(typeName)
  const processedNodes = new Map()
  if (nodes) {
    for (const node of nodes.values()) {
      const processedNode = await updater(node)
      if (processedNode && processedNode._$resolved) {
        processedNodes.set(node.id, processedNode._$resolved)
      }
    }
    store.dispatch({
      type: `SET_RESOLVED_NODES`,
      payload: {
        key: typeName,
        nodes: processedNodes,
      },
    })
  }
}

const getNodesAndResolvedNodes = typeName => {
  const { nodesByType, resolvedNodesCache } = store.getState()
  const nodes = nodesByType.get(typeName)
  if (nodes) {
    const resolvedNodes = resolvedNodesCache.get(typeName)
    if (resolvedNodes) {
      return Array.from(resolvedNodesIterator(nodes, resolvedNodes))
    } else {
      return Array.from(nodes.values())
    }
  } else {
    return []
  }
}

function* resolvedNodesIterator(nodes, resolvedNodes) {
  for (const node of nodes.values()) {
    node._$resolved = resolvedNodes.get(node.id)
    yield node
  }
}

exports.getNodesAndResolvedNodes = getNodesAndResolvedNodes

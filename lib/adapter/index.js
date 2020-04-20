const MongoClient = require('mongodb').MongoClient
const connect = require('./connect')
const send = require('./send')

const filterOptions = ({ db, collection }) => ({
  ...(db && { db }),
  ...(collection && { collection })
})

module.exports = {
  authentication: undefined,

  /**
   * Prepare endpoint options for later use by the adapter.
   * The endpoint options are only used by the adapter.
   * Might also be given source options, which are also adapter specific.
   *
   * @param {Object} endpointOptions - The endpoint options to prepare
   * @param {Object} sourceOptions - Source options
   * @returns {Object} The prepared endpoint
   */
  prepareEndpoint (endpointOptions, sourceOptions) {
    return {
      ...filterOptions(sourceOptions || {}),
      ...endpointOptions
    }
  },

  /**
   * Connect to the source in any way relevant for this adapter, and return
   * an object or a value that the adapter may later use when sending requests
   * to the source and when disconnecting.
   *
   * The MongoDb adapter will connect to the database and return the client
   * object.
   *
   * @param {Object} options - Options object with sourceOptions and auth
   * @param {Object} auth - Authorization object from service
   * @param {Object} connection - A connection previously returned from this method or null
   * @returns {Object} Anything that this adapter will need for sending requests to the source
   */
  async connect (options, _auth, connection) {
    return connect(MongoClient, options, connection)
  },

  /**
   * Disconnect from the source if relevant. The method is given the return
   * value from the connect method.
   *
   * @param {Object} connection - A connection previously return from connect()
   * @returns {void}
   */
  async disconnect (connection) {
    if (connection && connection.status === 'ok' && connection.client && connection.client.close) {
      connection.client.close()
    }
  },

  /**
   * Send the given data to the url, and return status and data.
   * This is used for both retrieving and sending data, and Integreat will
   * handle the preparation of the sent and the retrieved data.
   *
   * If an auth strategy is provided, authorization is attempted if not already
   * authenticated, and a successfull authentication is required before sending
   * the data with auth headers from the auth strategy.
   *
   * @param {Object} request - Request with endpoint, data, auth, and headers
   * @returns {Object} Object with status and data
   */
  async send (request, connection) {
    return send(request, connection)
  },

  /**
   * Serialize data before sending to the source.
   * The mongodb implementation simply returns the data, as the database accepts
   * javascript objects.
   * @param {Object} request - The request to serialize
   * @returns {Object} Serialized data
   */
  async serialize (request) {
    return request
  },

  /**
   * Normalize data from the source.
   * The mongodb implementation simply returns the data, as it comes normalized
   * from the database.
   * @param {Object} response - The response to normalize
   * @param {Object} request - The request
   * @returns {Object} Normalized data
   */
  async normalize (response, _request) {
    return response
  }
}

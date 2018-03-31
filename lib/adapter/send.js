const dotprop = require('dot-prop')

const prepareFilter = ({type, id}, {query}, params) => {
  if (query) {
    return query.reduce((filter, prop) => {
      const value = (prop.param) ? params[prop.param] : prop.value
      return dotprop.set(filter, prop.path, value)
    }, {})
  } else {
    return (id) ? {_id: `${type}:${id}`} : {type}
  }
}

const createItemResponse = ({id, type}, status = 'ok', error = null) => {
  const response = {type, id, status}
  if (error) {
    response.error = error
  }
  return response
}

const returnOkOrError = (data, actionName) => {
  const hasError = data.some(item => item.status !== 'ok')
  return (!hasError)
    ? {status: 'ok', data}
    : {status: 'error', error: `Error ${actionName} item(s) in mongodb`, data}
}

const performOnObjectOrArray = async (data, fn, action) => {
  const actionName = (action === 'SET') ? 'updating' : 'deleting'
  if (Array.isArray(data)) {
    const responses = await Promise.all(data.map(fn))
    return returnOkOrError(responses, actionName)
  } else {
    const response = await fn(data)
    return returnOkOrError([response], actionName)
  }
}

const setOrDeleteData = async (getCollection, {endpoint, data, params}, action) => {
  const collection = getCollection()

  const performOne = async (item) => {
    const filter = prepareFilter(item, endpoint, params)
    const _id = `${item.type}:${item.id}`
    try {
      if (action === 'SET') {
        await collection.updateOne(filter, {$set: {...item, _id}}, {upsert: true})
      } else {
        await collection.deleteOne(filter)
      }
    } catch (error) {
      return createItemResponse(item, 'error', error.message)
    }
    return createItemResponse(item)
  }

  return performOnObjectOrArray(data, performOne, action)
}

const getData = async (getCollection, {endpoint, params}) => {
  const collection = getCollection()

  const filter = prepareFilter(params, endpoint, params)
  let cursor = await collection.find(filter)
  if (params.pageSize) {
    cursor = cursor.limit(params.pageSize)
  }
  const data = await cursor.toArray()

  if (data.length === 0 && params.id) {
    return {
      status: 'notfound',
      error: `Could not find '${params.id}' of type '${params.type}'`
    }
  }

  return {status: 'ok', data}
}

async function send (request, connection) {
  const getCollection = () => {
    const {endpoint} = request
    const db = connection.db(endpoint.db)
    return db.collection(endpoint.collection)
  }

  switch (request.action) {
    case 'GET':
      return getData(getCollection, request)
    case 'SET':
    case 'DELETE':
      return setOrDeleteData(getCollection, request, request.action)
  }

  return {status: 'noaction'}
}

module.exports = send

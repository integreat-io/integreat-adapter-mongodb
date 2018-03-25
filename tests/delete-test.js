import test from 'ava'
import {
  dbUri,
  openMongoWithCollection,
  closeMongo,
  insertDocuments,
  getDocuments,
  deleteDocuments
} from './helpers/mongo'

import adapter from '..'

// Helpers

const sourceOptions = {dbUri}

// Tests

test('should delete one document', async (t) => {
  const {client, collection, collectionName} = await openMongoWithCollection('test')
  await insertDocuments(collection, [
    {id: 'ent1', type: 'entry'},
    {id: 'ent2', type: 'entry'}
  ])
  const request = {
    action: 'DELETE',
    data: {
      type: 'entry',
      id: 'ent1'
    },
    endpoint: {
      collection: collectionName,
      db: 'test'
    }
  }

  const connection = await adapter.connect({sourceOptions})
  const response = await adapter.send(request, connection)
  await adapter.disconnect(connection)

  t.truthy(response)
  t.is(response.status, 'ok')
  const docs = await getDocuments(collection, {type: 'entry'})
  t.is(docs.length, 1)
  t.is(docs[0].id, 'ent2')

  deleteDocuments(collection, {type: 'entry'})
  closeMongo(client)
})

test('should delete array of documents', async (t) => {
  const {client, collection, collectionName} = await openMongoWithCollection('test')
  const request = {
    action: 'DELETE',
    data: [
      {type: 'entry', id: 'ent1'},
      {type: 'entry', id: 'ent2'}
    ],
    endpoint: {
      collection: collectionName,
      db: 'test'
    }
  }

  const connection = await adapter.connect({sourceOptions})
  const response = await adapter.send(request, connection)
  await adapter.disconnect(connection)

  t.truthy(response)
  t.is(response.status, 'ok')
  const docs = await getDocuments(collection, {type: 'entry'})
  t.is(docs.length, 0)

  deleteDocuments(collection, {type: 'entry'})
  closeMongo(client)
})

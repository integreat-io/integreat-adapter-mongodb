import test from 'ava'
import { AggregationObject } from '.'

import prepareAggregation from './prepareAggregation'

// Tests

test('should return mongo aggregation pipeline', (t) => {
  const aggregation = [
    { type: 'sort' as const, sortBy: { updatedAt: -1 as const } },
    {
      type: 'group' as const,
      id: ['account', 'id'],
      groupBy: { updatedAt: 'first' as const, status: 'first' as const },
    },
    {
      type: 'query' as const,
      query: [
        { path: 'type', param: 'type' },
        { path: 'personalia\\.age', op: 'gt', value: 18 },
      ],
    },
  ]
  const expected = [
    { $sort: { updatedAt: -1 } },
    {
      $group: {
        _id: { account: '$account', id: '$id' },
        updatedAt: { $first: '$updatedAt' },
        status: { $first: '$status' },
      },
    },
    {
      $match: {
        '\\$type': 'entry',
        'personalia\\_age': { $gt: 18 },
      },
    },
  ]

  const ret = prepareAggregation(aggregation, { type: 'entry' })

  t.deepEqual(ret, expected)
})

test('should skip empty sort and query', (t) => {
  const aggregation = [
    { type: 'sort' as const, sortBy: {} },
    {
      type: 'group' as const,
      id: ['account', 'id'],
      groupBy: { updatedAt: 'first' as const, status: 'first' as const },
    },
    {
      type: 'query' as const,
      query: [],
    },
  ]
  const expected = [
    {
      $group: {
        _id: { account: '$account', id: '$id' },
        updatedAt: { $first: '$updatedAt' },
        status: { $first: '$status' },
      },
    },
  ]

  const ret = prepareAggregation(aggregation, { type: 'entry' })

  t.deepEqual(ret, expected)
})

test('should skip aggregation objects with missing properties', (t) => {
  const aggregation = [
    {
      type: 'query' as const,
      query: [{ path: 'something', value: 'otherthing' }],
    },
    { type: 'sort' as const },
    {
      type: 'group' as const,
    },
    {
      type: 'query' as const,
    },
  ] as AggregationObject[]
  const expected = [
    {
      $match: {
        something: 'otherthing',
      },
    },
  ]

  const ret = prepareAggregation(aggregation, { type: 'entry' })

  t.deepEqual(ret, expected)
})

test('should return undefined when entire pipeline is skipped', (t) => {
  const aggregation = [
    { type: 'sort' as const },
    {
      type: 'group' as const,
    },
    {
      type: 'query' as const,
    },
  ] as AggregationObject[]

  const ret = prepareAggregation(aggregation, { type: 'entry' })

  t.is(ret, undefined)
})

test('should return undefined when no aggregation', (t) => {
  const aggregation = undefined
  const expected = undefined

  const ret = prepareAggregation(aggregation)

  t.is(ret, expected)
})
